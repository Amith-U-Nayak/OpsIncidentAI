const { ChatGroq } = require("@langchain/groq");
const { retryWithBackoff } = require("./tools");
const PostMortem = require("../models/PostMortem.model");
const Incident = require("../models/Incident.model");

// ==========================================
// 1. AI MODEL SETUP
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
const postMortemGenerator = async (state) => {
  console.log("📝 [Post-Mortem Generator] Agent started...");

  const { incidentId, extractedErrors, severity, rootCause, confidence, runbookSolution } = state;

  // GUARD: If we have no meaningful data from previous agents, skip
  if (!rootCause || !runbookSolution) {
    console.log("📝 [Post-Mortem Generator] Insufficient data for post-mortem. Skipping.");
    return { postMortemId: null };
  }

  const errorList = (extractedErrors || [])
    .map((e, i) => `${i + 1}. ${e}`)
    .join("\n");

  const prompt = `
  You are a senior SRE writing an official incident post-mortem report.
  This report will be read by both engineers AND management.

  INCIDENT INFORMATION:
  - Severity: ${severity}
  - AI Root Cause Confidence: ${confidence}%
  - Detected Error Symptoms:
  ${errorList}

  AI ROOT CAUSE ANALYSIS:
  ${rootCause}

  RECOMMENDED RESOLUTION:
  ${runbookSolution}

  INSTRUCTIONS:
  1. Write a summary in plain English (no jargon) for a non-technical manager (2-3 sentences).
  2. State the root cause clearly for the engineering team.
  3. List the resolution steps concisely.
  4. Provide 3-5 specific action items to PREVENT this from happening again.

  Respond ONLY with valid JSON in this exact format (no extra text, no markdown):
  {
    "summary": "plain english summary here",
    "rootCause": "technical root cause here",
    "resolution": "step by step resolution here",
    "actionItems": ["action 1", "action 2", "action 3"]
  }
  `;

  console.log("📝 [Post-Mortem Generator] Calling Groq LLM to generate post-mortem...");
  const response = await retryWithBackoff(() => llm.invoke(prompt));
  const aiResult = parseJsonResponse(response.content, {
    summary: "Incident occurred and was investigated by the AI pipeline.",
    rootCause: rootCause,
    resolution: runbookSolution,
    actionItems: ["Review logs manually", "Set up monitoring alerts"]
  });

  console.log("📝 [Post-Mortem Generator] Post-mortem generated! Saving to MongoDB...");

  // Save the Post-Mortem to MongoDB using upsert (no duplicates if pipeline reruns)
  const savedPostMortem = await PostMortem.findOneAndUpdate(
    { incident: incidentId },
    {
      incident: incidentId,
      summary: aiResult.summary,
      rootCause: aiResult.rootCause,
      resolution: aiResult.resolution,
      actionItems: aiResult.actionItems,
      generatedBy: "System/AI",
    },
    { upsert: true, new: true }
  );

  // Also update the Incident status and AI root cause for quick reference
  await Incident.findByIdAndUpdate(incidentId, {
    aiRootCause: aiResult.rootCause,
    status: "Investigating",
  });

  console.log(`📝 [Post-Mortem Generator] Done! Post-mortem saved with ID: ${savedPostMortem._id}`);

  return {
    postMortemId: savedPostMortem._id.toString(),
  };
};

module.exports = { postMortemGenerator };
