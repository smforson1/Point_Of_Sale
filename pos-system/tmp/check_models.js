const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: 'c:/Users/drmid/Desktop/Projects/Point_Of_Sale/pos-system/.env.local' });

async function run() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    console.error("API Key not found");
    return;
  }
  
  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    console.log("Listing models...");
    // Direct fetch to list models
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    console.log("Available models:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
