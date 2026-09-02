const { ChatGroq } = require("@langchain/groq");
const { retryWithBackoff } = require("./tools");
const { emitAgentEvent } = require("../socket/agentEvents");
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
  emitAgentEvent('postMortemGenerator', 'started', 'Writing incident post-mortem report...');

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
  This report will be read by both engineers AND non-technical management.
  Write in a very clear, professional, and human-readable style. 
  Avoid dense technical jargon when explaining the business impact.

  INCIDENT INFORMATION:
  - Severity: ${severity}
  - AI Root Cause Confidence: ${confidence}%
  - Detected Error Symptoms:
  ${errorList}

  AI ROOT CAUSE ANALYSIS:
  ${rootCause}

  RECOMMENDED RESOLUTION:
  ${runbookSolution}

  Generate the post-mortem based ONLY on this context. 
  Respond ONLY with valid JSON in this exact format (no extra text, no markdown block):
  {
    "summary": "1-2 paragraphs summarizing the impact and timeline in simple human terms",
    "rootCause": "Clear explanation of the technical failure, written so a manager can understand it",
    "resolution": "Step-by-step resolution steps taken (or proposed)",
    "actionItems": ["List of 3 actionable steps to prevent this forever"]
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
    { upsert: true, returnDocument: 'after' }
  );

  // Also update the Incident status and AI root cause for quick reference
  await Incident.findByIdAndUpdate(incidentId, {
    aiRootCause: aiResult.rootCause,
    status: "Investigating",
  });

  console.log(`📝 [Post-Mortem Generator] Done! Post-mortem saved with ID: ${savedPostMortem._id}`);

  emitAgentEvent('postMortemGenerator', 'done', 'Post-mortem report saved successfully!', {
    postMortemId: savedPostMortem._id.toString()
  });

  return {
    postMortemId: savedPostMortem._id.toString(),
  };
};

module.exports = { postMortemGenerator };
