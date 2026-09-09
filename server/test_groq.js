// Quick raw test — bypasses LangChain completely
// Run this from the server folder: node test_groq.js
require('dotenv').config();

const key = process.env.GROQ_API_KEY;
console.log('Key found:', !!key);
console.log('Key length:', key ? key.trim().length : 0);
console.log('Key starts with gsk_:', key ? key.trim().startsWith('gsk_') : false);

fetch('https://api.groq.com/openai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${key.trim()}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'openai/gpt-oss-20b',
    messages: [{ role: 'user', content: 'Say hello in one word.' }],
    max_tokens: 10
  })
})
.then(r => r.json())
.then(data => {
  if (data.error) {
    console.log('❌ Groq Error:', data.error.message);
  } else {
    console.log('✅ Groq works! Response:', data.choices[0].message.content);
  }
})
.catch(err => console.log('❌ Network error:', err.message));
