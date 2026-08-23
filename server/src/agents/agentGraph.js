const { StateGraph, END, START, Annotation } = require('@langchain/langgraph');

// ==========================================
// 1. DEFINE THE STATE (The Clipboard)
// This is the shared memory of our assembly line.
// Every agent reads from this and writes their findings back to it.
// ==========================================
const GraphState = Annotation.Root({
  incidentId: Annotation(),      // MongoDB incident ID — passed in when pipeline starts
  logs: Annotation(),            // Array of Cloudinary log URLs from the incident
  extractedErrors: Annotation(), // Agent 1 writes: list of clean error strings
  severity: Annotation(),        // Agent 1 writes: Low / Medium / High / Critical
  rootCause: Annotation(),       // Agent 2 writes: the single root cause sentence
  confidence: Annotation(),      // Agent 2 writes: confidence score 0-100
  runbookSolution: Annotation(), // Agent 3 writes: the recommended fix steps
  postMortemId: Annotation(),    // Agent 4 writes: MongoDB ID of the saved post-mortem
});

// ==========================================
// 2. IMPORT THE REAL AGENTS
// Now that all four agents are built, we replace the placeholders
// with the actual worker functions.
// ==========================================
const { logAnalyzer } = require('./logAnalyzer');
const { rootCauseAnalyzer } = require('./rootCauseAnalyzer');
const { runbookMatcher } = require('./runbookMatcher');
const { postMortemGenerator } = require('./postMortemGenerator');

// ==========================================
// 3. BUILD THE GRAPH (The Assembly Line)
// ==========================================
const workflow = new StateGraph(GraphState)
  // Step A: Add the nodes (stations on the assembly line)
  .addNode('logAnalyzer', logAnalyzer)
  .addNode('rootCauseAnalyzer', rootCauseAnalyzer)
  .addNode('runbookMatcher', runbookMatcher)
  .addNode('postMortemGenerator', postMortemGenerator)

  // Step B: Connect them with edges (the conveyor belt)
  // START is a special LangGraph variable indicating where the flow begins
  .addEdge(START, 'logAnalyzer')
  .addEdge('logAnalyzer', 'rootCauseAnalyzer')
  .addEdge('rootCauseAnalyzer', 'runbookMatcher')
  .addEdge('runbookMatcher', 'postMortemGenerator')
  .addEdge('postMortemGenerator', END); // END is where the flow stops

// ==========================================
// 4. COMPILE THE GRAPH
// This turns our blueprint into an executable function we can call from our controllers
// ==========================================
const app = workflow.compile();

module.exports = { app };
