const Runbook = require('../models/Runbook.model');
const { generateEmbedding } = require('../services/embedding.service');

// ==========================================
// CREATE RUNBOOK
// ==========================================
// When an admin uploads a runbook:
// 1. We take the title + content text
// 2. Combine them and generate an embedding (vector)
// 3. Save the text AND the vector to MongoDB
//
// The vector is what makes semantic search possible later.
// Analogy: Like adding a GPS coordinate to every recipe card
// so you can later find cards by "what tastes similar" not just by title keyword.
// ==========================================
exports.createRunbook = async (req, res) => {
  try {
    const { title, content, tags } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Title and content are required'
      });
    }

    // Combine title + content for embedding
    // Including the title gives the embedding more context about what the runbook is about
    const textToEmbed = `${title}\n\n${content}`;

    console.log(`📖 [Runbook Controller] Generating embedding for: "${title}"`);

    // Generate the 384-dimension vector for this runbook
    const embedding = await generateEmbedding(textToEmbed);

    // Save runbook with its embedding to MongoDB
    const runbook = await Runbook.create({
      title,
      content,
      embedding,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Runbook created and indexed for vector search',
      data: {
        _id: runbook._id,
        title: runbook.title,
        tags: runbook.tags,
        createdAt: runbook.createdAt,
        // Don't return the full embedding array — it's 384 numbers, too noisy
        embeddingDimensions: embedding.length,
      }
    });
  } catch (error) {
    console.error('❌ [Runbook Controller] Create failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==========================================
// GET ALL RUNBOOKS
// ==========================================
// Returns a list of all runbooks (without the embedding arrays — too large)
// ==========================================
exports.getRunbooks = async (req, res) => {
  try {
    // '-embedding' means "exclude the embedding field from results"
    // The embedding is 384 numbers — we don't need to send that to the frontend
    const runbooks = await Runbook.find()
      .select('-embedding')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: runbooks.length,
      data: runbooks
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==========================================
// GET SINGLE RUNBOOK
// ==========================================
exports.getRunbookById = async (req, res) => {
  try {
    const runbook = await Runbook.findById(req.params.id)
      .select('-embedding')
      .populate('createdBy', 'name email');

    if (!runbook) {
      return res.status(404).json({ success: false, error: 'Runbook not found' });
    }

    res.status(200).json({ success: true, data: runbook });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==========================================
// DELETE RUNBOOK
// ==========================================
exports.deleteRunbook = async (req, res) => {
  try {
    const runbook = await Runbook.findByIdAndDelete(req.params.id);

    if (!runbook) {
      return res.status(404).json({ success: false, error: 'Runbook not found' });
    }

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==========================================
// SEMANTIC SEARCH RUNBOOKS (for testing)
// ==========================================
// This endpoint lets you test the vector search manually via Postman.
// Agent 3 uses the same logic internally during the pipeline.
// ==========================================
exports.searchRunbooks = async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ success: false, error: 'Query is required' });
    }

    // Convert the search query into a vector
    const queryEmbedding = await generateEmbedding(query);

    // Run MongoDB Atlas Vector Search
    const results = await Runbook.aggregate([
      {
        $vectorSearch: {
          index: 'runbook_vector_index',  // Name of the Atlas Search index we create
          path: 'embedding',              // The field that holds our vectors
          queryVector: queryEmbedding,    // The query converted to a vector
          numCandidates: 20,              // Check 20 candidates, return top N
          limit: 3,                       // Return top 3 most similar runbooks
        }
      },
      {
        $project: {
          title: 1,
          content: 1,
          tags: 1,
          score: { $meta: 'vectorSearchScore' },
        }
      }
    ]);

    res.status(200).json({
      success: true,
      query,
      count: results.length,
      data: results
    });
  } catch (error) {
    console.error('❌ [Runbook Controller] Search failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
