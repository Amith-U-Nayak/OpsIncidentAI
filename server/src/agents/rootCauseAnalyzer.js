const { ChatGroq } = require("@langchain/groq");
const { retryWithBackoff } = require("./tools");

// ==========================================
// 1. THE AI MODEL SETUP
// ==========================================
const llm = new ChatGroq({
  model: "openai/gpt-oss-20b",
  temperature: 0,
});

// ==========================================
// HELPER: PARSE JSON FROM LLM RESPONSE
// ==========================================
const parseJsonResponse = (text, fallback) => {
  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.warn("⚠️ JSON parse failed, using fallback values.", e.message);
    return fallback;
  }
};

// ==========================================
// 2. THE AGENT FUNCTION
// ==========================================
const rootCauseAnalyzer = async (state) => {
  console.log("🔬 [Root Cause Analyzer] Agent started...");

  const { extractedErrors, severity } = state;

  // GUARD: If the previous agent found no real errors, skip
  if (
    !extractedErrors ||
    extractedErrors.length === 0 ||
    extractedErrors[0] === "No logs provided" ||
    extractedErrors[0] === "Log files could not be downloaded or were empty"
  ) {
    console.log("🔬 [Root Cause Analyzer] No valid errors to analyze. Skipping.");
    return {
      rootCause: "Could not determine root cause — no valid log data was provided.",
      confidence: 0,
    };
  }

  const errorList = extractedErrors
    .map((err, i) => `${i + 1}. ${err}`)
    .join("\n");

  const prompt = `
  You are a Principal Engineer conducting a post-incident root cause analysis.
  Identify the ONE underlying root cause that explains all (or most) of the error symptoms.

  RULES:
  - Do NOT list multiple causes. Find the single most likely root cause.
  - Think in terms of cause-and-effect chains (what broke first that caused everything else?)
  - Confidence score guide:
      90-100 → All symptoms point clearly to one cause
      70-89  → Most symptoms fit, minor ambiguity
      50-69  → Plausible cause but multiple explanations possible
      0-49   → Insufficient data
  - Incident Severity: ${severity}

  DETECTED ERROR SYMPTOMS:
  ${errorList}

  Respond ONLY with valid JSON in this exact format (no extra text, no markdown):
  {
    "rootCause": "one clear sentence explaining the root cause",
    "confidence": 85
  }
  `;

  console.log("🔬 [Root Cause Analyzer] Calling Groq LLM for root cause...");
  const response = await retryWithBackoff(() => llm.invoke(prompt));
  const aiResult = parseJsonResponse(response.content, {
    rootCause: "Unable to determine root cause from the provided data.",
    confidence: 0
  });

  console.log("🔬 [Root Cause Analyzer] Analysis complete!", aiResult);

  return {
    rootCause: aiResult.rootCause,
    confidence: aiResult.confidence,
  };
};

module.exports = { rootCauseAnalyzer };
