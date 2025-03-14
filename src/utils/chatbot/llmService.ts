
// LLM service using Gemini API
import { GoogleGenerativeAI } from "@google/generative-ai";
import { API_KEYS } from "./apiKeys";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(API_KEYS.gemini);

// Call Gemini LLM with improved error handling
export const callGeminiLLM = async (prompt: string): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "I'm having trouble accessing my AI capabilities right now. Please try again later.";
  }
};
