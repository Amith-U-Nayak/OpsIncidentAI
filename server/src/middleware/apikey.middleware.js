const authorizeApiKey = (req, res, next) => {
  // 1. Get the API key from the request headers
  // Companies like Datadog will put their secret key here
  const apiKey = req.headers['x-api-key'];

  // 2. Check if it exists
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'Missing x-api-key header. Unauthorized.'
    });
  }

  // 3. Verify it matches our server's secret key
  if (apiKey !== process.env.INGESTION_API_KEY) {
    return res.status(403).json({
      success: false,
      error: 'Invalid API Key. Forbidden.'
    });
  }

  // 4. If valid, allow the request to proceed to the controller
  next();
};

module.exports = authorizeApiKey;
