const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');

// Initialize the SDK with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Define the exact JSON structure we want the AI to return
const expenseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    description: { type: SchemaType.STRING, description: "A short 1-3 word description of the expense" },
    totalAmount: { type: SchemaType.NUMBER, description: "The total numeric amount of the bill" },
    category: { 
      type: SchemaType.STRING, 
      description: "Must be exactly one of: Food & Drink, Travel, Utilities, Entertainment, Shopping, Others" 
    },
    splits: {
      type: SchemaType.ARRAY,
      description: "The list of friends involved and how much they owe. Exclude the person who paid from this list.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          userId: { type: SchemaType.STRING, description: "The exact _id of the matched friend" },
          amountOwed: { type: SchemaType.NUMBER, description: "The calculated numeric amount this person owes" }
        },
        required: ["userId", "amountOwed"]
      }
    }
  },
  required: ["description", "totalAmount", "category", "splits"]
};

// The main function we will call from our controller
const extractExpenseData = async (naturalText, friendsList) => {
  // Use the fast and efficient Flash model
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: expenseSchema,
    }
  });

  // Create a context block so the AI knows who the user's friends are
  const friendsContext = friendsList.map(f => `Name: ${f.name}, ID: ${f._id}`).join(' | ');

  const prompt = `
    You are a smart financial assistant. Extract the expense details from the following text.
    Assume the user who wrote the text is the one who paid the total bill, unless explicitly stated otherwise.
    Split the bill equally among everyone mentioned (including the payer) unless specific amounts are given.
    
    Here is the user's raw text: "${naturalText}"
    
    Here is the user's list of valid friends to match against: [${friendsContext}]
    (Only include splits for friends found in this list. Use their exact ID).
  `;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
};
//  Generate financial insights based on category spending
const generateFinancialInsights = async (categoryTotals) => {
  // We can use 2.5-flash here because it's incredibly fast at reading data and writing text
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    You are a friendly, highly intelligent personal financial advisor. 
    Here is a breakdown of your client's spending by category for this month:
    ${JSON.stringify(categoryTotals)}

    Write a 2-sentence financial insight for them. 
    - Sentence 1 should analyze their highest spending category.
    - Sentence 2 should offer a brief, encouraging tip on how to save money or balance their budget.
    Keep the tone professional, modern, and concise. Do not use robotic greetings like "Hello client."
  `;

  const result = await model.generateContent(prompt);
  return result.response.text();
};


module.exports = { extractExpenseData, generateFinancialInsights };

