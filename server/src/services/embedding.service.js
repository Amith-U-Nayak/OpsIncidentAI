// ==========================================
// EMBEDDING SERVICE
// ==========================================
// This service converts text into a vector (array of numbers).
// These numbers represent the MEANING of the text.
//
// Analogy: Imagine every sentence in the English language placed on a giant map.
// Sentences with similar meanings are placed CLOSE to each other on the map.
// An "embedding" is like the GPS coordinates (numbers) of a sentence on that map.
// When two sentences are about the same topic, their coordinates are close.
//
// We use HuggingFace's free 'sentence-transformers/all-MiniLM-L6-v2' model.
// It produces 384 numbers for any piece of text.
//
// WHY THIS MODEL?
// - Completely free, no usage limits that affect us
// - Fast and lightweight (runs on HuggingFace's servers, not ours)
// - Produces high quality 384-dimension embeddings
// - Industry standard for semantic search tasks
// ==========================================

const { HfInference } = require('@huggingface/inference');

// Initialize the HuggingFace client with our API key from .env
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// The specific model we use for embeddings
// all-MiniLM-L6-v2 is a lightweight but powerful sentence transformer
const EMBEDDING_MODEL = 'sentence-transformers/all-MiniLM-L6-v2';

// ==========================================
// GENERATE EMBEDDING
// Takes any text and returns an array of 384 numbers
// ==========================================
const generateEmbedding = async (text) => {
  try {
    // Clean the text - remove extra whitespace, limit length
    // HuggingFace models have a token limit (512 tokens ≈ 380 words)
    const cleanedText = text.trim().slice(0, 2000);

    console.log(`🔢 [Embedding Service] Generating embedding for text (${cleanedText.length} chars)...`);

    // Call HuggingFace Inference API
    // featureExtraction = convert text to numbers (this is what embedding models do)
    const embedding = await hf.featureExtraction({
      model: EMBEDDING_MODEL,
      inputs: cleanedText,
    });

    // The result is an array of 384 numbers
    // Convert to a plain JS array (it comes back as a typed array)
    const embeddingArray = Array.from(embedding);

    console.log(`✅ [Embedding Service] Generated ${embeddingArray.length}-dimension embedding`);

    return embeddingArray;
  } catch (error) {
    console.error('❌ [Embedding Service] Failed to generate embedding:', error.message);
    throw new Error(`Embedding generation failed: ${error.message}`);
  }
};

module.exports = { generateEmbedding };
