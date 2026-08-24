// webhook.service.js
// This file acts as our "Delivery Driver" dispatcher.
// Instead of writing complex email/Slack logic here, we just send a simple JSON payload
// to an external automation tool (like n8n or Zapier) via a Webhook URL.

// We use the built-in Node.js fetch API to send the HTTP request
const sendWebhook = async (webhookUrl, payload) => {
  if (!webhookUrl) {
    console.log('⚠️ No webhook URL provided, skipping automation.');
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log(`✅ Webhook successfully sent to: ${webhookUrl}`);
    } else {
      console.error(`❌ Webhook failed with status: ${response.status}`);
    }
  } catch (error) {
    // We use a try/catch so that if n8n is offline, it DOES NOT crash our main server.
    // The incident will still be saved to the database safely.
    console.error('❌ Failed to connect to Webhook server:', error.message);
  }
};

module.exports = { sendWebhook };
