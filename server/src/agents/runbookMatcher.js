const { ChatGroq } = require("@langchain/groq");
const { z } = require("zod");
const PostMortem = require("../models/PostMortem.model");
const { generateEmbedding } = require("../services/embedding.service");
const { retryWithBackoff } = require("./tools");
const { emitAgentEvent } = require("../socket/agentEvents");

// ==========================================
// 1. AI MODEL SETUP
// ==========================================
const llm = new ChatGroq({
  model: "openai/gpt-oss-20b",
  temperature: 0,
});

// ==========================================
// 2. STRUCTURED OUTPUT SCHEMA
// ==========================================
const RunbookSchema = z.object({
  solution: z.string().describe("Clear, actionable steps an engineer should take to resolve this incident"),
  solutionSource: z.enum(["Runbook", "Historical Incident", "Web Search", "AI Knowledge"])
    .describe("Where the solution was found"),
  isNovelIncident: z.boolean()
    .describe("True if this incident has never been seen before and a new runbook should be created"),
});

// ==========================================
// TIER 1: SEARCH COMPANY RUNBOOKS — NOW ACTIVE (Module 4)
// Uses MongoDB Atlas Vector Search to find semantically similar runbooks.
//
// Analogy: Like a librarian who doesn't search by exact title,
// but finds books by MEANING — "connection refused" and "port blocked"
// would both match a runbook about "network connectivity issues".
// ==========================================
const searchRunbooks = async (rootCause) => {
  try {
    const Runbook = require("../models/Runbook.model");

    // Step 1: Convert the root cause text into a vector (array of 384 numbers)
    console.log("📗 [Runbook Matcher] TIER 1: Generating query embedding...");
    const queryEmbedding = await generateEmbedding(rootCause);

    // Step 2: Run MongoDB Atlas Vector Search
    // This finds runbooks whose embeddings are closest to the query embedding
    // "Closest" means most similar in meaning (cosine similarity)
    const results = await Runbook.aggregate([
      {
        $vectorSearch: {
          index: "runbook_vector_index", // The index we create in Atlas UI
          path: "embedding",             // The field storing our 384-number vectors
          queryVector: queryEmbedding,   // The query converted to 384 numbers
          numCandidates: 20,             // Search through 20 candidates
          limit: 1,                      // Return only the best match
        }
      },
      {
        $project: {
          title: 1,
          content: 1,
          tags: 1,
          score: { $meta: "vectorSearchScore" },
        }
      }
    ]);

    // Only use the result if the similarity score is above 0.7 (70% similar)
    // Below that, the match isn't reliable enough to use
    if (results.length > 0 && results[0].score >= 0.7) {
      console.log(`📗 [Runbook Matcher] TIER 1: Found matching runbook! Score: ${results[0].score.toFixed(2)} — "${results[0].title}"`);
      return results[0].content;
    }

    console.log("📗 [Runbook Matcher] TIER 1: No sufficiently similar runbook found. Falling to Tier 2.");
    return null;
  } catch (err) {
    console.log("📗 [Runbook Matcher] TIER 1: Vector search error:", err.message, "— Falling to Tier 2.");
    return null;
  }
};

// ==========================================
// TIER 2: SEARCH HISTORICAL INCIDENTS (MongoDB PostMortem collection)
// Looks for past resolved incidents with a similar root cause
// ==========================================
const searchHistoricalIncidents = async (rootCause, extractedErrors) => {
  try {
    // Build search keywords from the root cause text
    // e.g., "Memory leak in db-worker pod" → ["Memory", "leak", "db-worker", "pod"]
    const keywords = rootCause.split(" ").filter(w => w.length > 4); // ignore tiny words like "in", "the"

    // Search PostMortems where the rootCause field contains similar words
    // $regex gives us a case-insensitive partial match
    const results = await PostMortem.find({
      rootCause: { $regex: keywords.slice(0, 3).join("|"), $options: "i" }
    }).limit(1);

    if (results.length > 0) {
      console.log("📗 [Runbook Matcher] TIER 2: Found similar historical incident!");
      // Return the resolution from the past post-mortem
      return results[0].resolution;
    }
    return null; // No similar past incident found
  } catch (err) {
    console.log("📗 [Runbook Matcher] TIER 2 error:", err.message);
    return null;
  }
};

// ==========================================
// TIER 3a: TAVILY WEB SEARCH
// Searches the internet (StackOverflow, GitHub, official docs)
// ==========================================
const searchWeb = async (rootCause, extractedErrors) => {
  try {
    const { TavilySearch } = require("@langchain/tavily");
    const tavilyTool = new TavilySearch({ maxResults: 3 });

    // Build a focused search query using the root cause + top errors
    const searchQuery = `${rootCause} ${extractedErrors.slice(0, 2).join(" ")} fix solution`;
    console.log("📗 [Runbook Matcher] TIER 3a: Searching web for:", searchQuery);

    const results = await tavilyTool.invoke(searchQuery);

    // results is a JSON string — parse it to get the actual content
    const parsed = typeof results === "string" ? JSON.parse(results) : results;

    if (parsed && parsed.length > 0) {
      // Combine the top 3 results into one text block for the LLM
      const combinedContent = parsed
        .map((r, i) => `Source ${i + 1} (${r.url}):\n${r.content}`)
        .join("\n\n");
      return combinedContent;
    }
    return null; // Empty results
  } catch (err) {
    console.log("📗 [Runbook Matcher] TIER 3a: Tavily failed or credits exhausted:", err.message);
    return null; // Fall through to Tier 3b
  }
};

// ==========================================
// TIER 3b: DIRECT LLM KNOWLEDGE FALLBACK
// Uses the LLM's own training knowledge to suggest a fix
// This ALWAYS returns something — the final safety net
// ==========================================
const askLLMDirectly = async (rootCause, extractedErrors, severity) => {
  console.log("📗 [Runbook Matcher] TIER 3b: Using LLM training knowledge as final fallback.");

  const errorList = extractedErrors.map((e, i) => `${i + 1}. ${e}`).join("\n");

  const prompt = `
  You are a Principal SRE with 15 years of experience handling production incidents.
  No runbook or historical data is available for this incident.
  Use your expert knowledge to provide actionable mitigation steps.

  INCIDENT DETAILS:
  - Severity: ${severity}
  - Root Cause: ${rootCause}
  - Error Symptoms:
  ${errorList}

  Provide clear, numbered, step-by-step mitigation instructions an on-call engineer can execute right now.
  `;

  // For this fallback, we use a plain (non-structured) LLM call
  // because we just want the text — no JSON schema needed here
  const result = await llm.invoke(prompt);
  return result.content;
};

// ==========================================
// 4. THE MAIN AGENT FUNCTION
// ==========================================
const runbookMatcher = async (state) => {
  console.log("📗 [Runbook Matcher] Agent started...");
  emitAgentEvent('runbookMatcher', 'started', 'Searching runbooks, history, and web for a solution...');

  const { rootCause, extractedErrors, severity } = state;

  // GUARD: If no root cause was found by Agent 2, skip
  if (!rootCause || rootCause.startsWith("Could not determine")) {
    console.log("📗 [Runbook Matcher] No valid root cause to search for. Skipping.");
    return {
      runbookSolution: "No solution found — insufficient incident data.",
    };
  }

  let solution = null;
  let solutionSource = null;

  // ── TIER 1 ──
  solution = await searchRunbooks(rootCause);
  if (solution) solutionSource = "Runbook";

  // ── TIER 2 ──
  if (!solution) {
    solution = await searchHistoricalIncidents(rootCause, extractedErrors);
    if (solution) solutionSource = "Historical Incident";
  }

  // ── TIER 3a ──
  if (!solution) {
    solution = await searchWeb(rootCause, extractedErrors);
    if (solution) solutionSource = "Web Search";
  }

  // ── TIER 3b ──
  if (!solution) {
    solution = await askLLMDirectly(rootCause, extractedErrors, severity);
    solutionSource = "AI Knowledge";
  }

  console.log(`📗 [Runbook Matcher] Solution found via: ${solutionSource}`);

  // Ask the LLM to format the final solution into clean structured steps
  const prompt = `
  You are formatting an incident resolution report.

  Root Cause: ${rootCause}
  Solution Source: ${solutionSource}
  Raw Solution Content:
  ${solution}

  Format this into clear, actionable resolution steps.
  isNovelIncident should be true if the source was "Web Search" or "AI Knowledge"
  (meaning the company has no runbook for this yet).

  Respond ONLY with valid JSON in this exact format (no extra text, no markdown):
  {
    "solution": "clear numbered resolution steps here",
    "solutionSource": "${solutionSource}",
    "isNovelIncident": ${solutionSource === 'Web Search' || solutionSource === 'AI Knowledge'}
  }
  `;

  const response = await retryWithBackoff(() => llm.invoke(prompt));
  let finalResult;
  try {
    const cleaned = response.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    finalResult = JSON.parse(cleaned);
  } catch (e) {
    // If JSON parse fails, use the raw solution text as fallback
    finalResult = {
      solution: solution,
      solutionSource: solutionSource,
      isNovelIncident: solutionSource === 'Web Search' || solutionSource === 'AI Knowledge'
    };
  }

  emitAgentEvent('runbookMatcher', 'done', `Solution found via: ${solutionSource}`, {
    solutionSource,
    isNovelIncident: finalResult.isNovelIncident
  });

  // Write the final result to the State for Agent 4
  return {
    runbookSolution: finalResult.solution,
  };
};

module.exports = { runbookMatcher };
