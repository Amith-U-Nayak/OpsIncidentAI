const { ChatGroq } = require("@langchain/groq");
const { downloadLogFile, retryWithBackoff } = require("./tools");

// ==========================================
// 1. THE AI MODEL SETUP
// ==========================================
const llm = new ChatGroq({
  model: "openai/gpt-oss-20b",
  temperature: 0,
});

// ==========================================
// HELPER: PARSE JSON FROM LLM RESPONSE
// Instead of withStructuredOutput() (which needs tool-calling support),
// we ask the model to return raw JSON and parse it ourselves.
// This works with ANY model, making our code more portable.
// ==========================================
const parseJsonResponse = (text, fallback) => {
  try {
    // Some models wrap JSON in markdown code blocks like ```json ... ```
    // We strip those out before parsing
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.warn("⚠️ JSON parse failed, using fallback values.", e.message);
    return fallback;
  }
};

// ==========================================
// HELPER: PRE-FILTER LOG LINES
// ==========================================
const ERROR_KEYWORDS = [
  'error', 'fatal', 'exception', 'traceback', 'critical',
  'warn', 'failed', 'failure', 'refused', 'timeout',
  'out of memory', 'oom', 'segfault', 'panic', 'unhandled',
  'stack trace', 'null pointer', 'undefined', 'crash', 'abort'
];

const preFilterLogLines = (rawText) => {
  const lines = rawText.split('\n');
  const errorLines = lines.filter(line => {
    const lowerLine = line.toLowerCase();
    return ERROR_KEYWORDS.some(keyword => lowerLine.includes(keyword));
  });

  if (errorLines.length === 0) {
    console.log('🕵️‍♂️ [Log Analyzer] No keyword matches found. Using last 200 lines as fallback.');
    return lines.slice(-200).join('\n');
  }

  console.log(`🕵️‍♂️ [Log Analyzer] Pre-filter: kept ${errorLines.length} of ${lines.length} lines.`);
  return errorLines.join('\n');
};

// ==========================================
// 2. THE AGENT FUNCTION
// ==========================================
const logAnalyzer = async (state) => {
  console.log("🕵️‍♂️ [Log Analyzer] Agent started...");

  const logUrls = state.logs || [];

  if (logUrls.length === 0) {
    console.log("🕵️‍♂️ [Log Analyzer] No logs provided. Skipping analysis.");
    return { extractedErrors: ["No logs provided"], severity: "Low" };
  }

  let allLogText = "";
  for (const url of logUrls) {
    const text = await downloadLogFile(url);
    allLogText += text + "\n---\n";
  }

  if (!allLogText.trim()) {
    console.log("🕵️‍♂️ [Log Analyzer] Downloaded log files were all empty or failed. Skipping AI call.");
    return { extractedErrors: ["Log files could not be downloaded or were empty"], severity: "Medium" };
  }

  console.log("🕵️‍♂️ [Log Analyzer] Pre-filtering logs for error signals...");
  const filteredLog = preFilterLogLines(allLogText);

  // We now ask the model to return raw JSON — no tool calling needed
  const prompt = `
  You are a senior Site Reliability Engineer (SRE) analyzing a server incident.
  Extract error signals from the pre-filtered log lines below.

  RULES:
  - Group duplicate or related errors into one concise description.
  - Each extracted error must be one clear sentence.
  - Severity Guide:
      Low      → Minor warnings, no service impact
      Medium   → Errors present but service is degraded, not down
      High     → Core service is failing, users are affected
      Critical → Complete outage, data loss risk, or cascading failures

  PRE-FILTERED LOG LINES:
  ${filteredLog}

  Respond ONLY with valid JSON in this exact format (no extra text, no markdown):
  {
    "extractedErrors": ["error 1", "error 2"],
    "severity": "High"
  }
  `;

  console.log("🕵️‍♂️ [Log Analyzer] Calling Groq LLM...");
  const response = await retryWithBackoff(() => llm.invoke(prompt));
  const aiResult = parseJsonResponse(response.content, {
    extractedErrors: ["Could not parse log analysis"],
    severity: "Medium"
  });

  console.log("🕵️‍♂️ [Log Analyzer] Analysis complete!", aiResult);

  return {
    extractedErrors: aiResult.extractedErrors,
    severity: aiResult.severity
  };
};

module.exports = { logAnalyzer };
