require("dotenv").config();
const axios = require("axios");

const VENICE_API_KEY = process.env.VENICE_API_KEY;
const VENICE_BASE_URL = "https://api.venice.ai/api/v1";
const DEFAULT_MODEL = "llama-3.2-3b";

async function callAI(messages, model = null) {
  const response = await axios.post(
    `${VENICE_BASE_URL}/chat/completions`,
    {
      model: model || DEFAULT_MODEL,
      messages: messages,
      max_tokens: 4096,
      temperature: 0.6,
      top_p: 0.95,
    },
    {
      headers: {
        Authorization: `Bearer ${VENICE_API_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 60000,
    }
  );

  const usage = response.data.usage;
  if (usage) {
    console.log(`📊 Tokens: ${usage.prompt_tokens} in / ${usage.completion_tokens} out (${usage.total_tokens} total)`);
  }

  return response.data;
}

module.exports = { callAI };
