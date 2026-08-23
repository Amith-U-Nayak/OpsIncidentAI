// Helper to download text from a URL (like Cloudinary)
const downloadLogFile = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const text = await response.text();
    return text;
  } catch (error) {
    console.error(`Failed to download log from ${url}:`, error.message);
    return "";
  }
};

// ==========================================
// SLEEP HELPER
// Pauses execution for a given number of milliseconds
// Used to space out LLM calls and avoid hitting rate limits
// ==========================================
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ==========================================
// RETRY WITH EXPONENTIAL BACKOFF
// Analogy: If you call a busy restaurant and it's engaged, you wait a bit
// and try again — and wait a little longer each time.
//
// If the LLM returns a 429 (rate limit), we wait and retry automatically
// instead of crashing the whole pipeline.
// ==========================================
const retryWithBackoff = async (fn, retries = 3, delayMs = 3000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isRateLimit = err.message && (
        err.message.includes('429') ||
        err.message.includes('rate_limit') ||
        err.message.includes('Rate limit')
      );

      if (isRateLimit && attempt < retries) {
        const waitTime = delayMs * attempt; // 3s, 6s, 9s...
        console.log(`⏳ Rate limit hit. Waiting ${waitTime / 1000}s before retry (attempt ${attempt}/${retries})...`);
        await sleep(waitTime);
      } else {
        throw err; // Not a rate limit error, or out of retries — rethrow
      }
    }
  }
};

module.exports = { downloadLogFile, sleep, retryWithBackoff };

