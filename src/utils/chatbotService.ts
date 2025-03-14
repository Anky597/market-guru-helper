
import { toast } from "sonner";

// Import from our new modular structure
import { Message } from "./chatbot/types";
import { retrieveContext } from "./chatbot/vectorSearch";
import { callGeminiLLM } from "./chatbot/llmService";
import { extractCompanyName } from "./chatbot/entityExtraction";
import { getStockQuote } from "./chatbot/stockService";
import { getCompanyNews } from "./chatbot/newsService";
import { analyzeSentiment } from "./chatbot/sentimentService";
import { uploadAndAnalyzeImage } from "./chatbot/imageService";

export { Message, uploadAndAnalyzeImage };

// Main chatbot function with improved handling of different queries
export const sendChatMessage = async (message: string): Promise<string> => {
  try {
    // Image analysis detection
    if (message.toLowerCase().includes("upload") || 
        message.toLowerCase().includes("image") || 
        message.toLowerCase().includes("chart") ||
        message.toLowerCase().includes("graph")) {
      return "I can analyze financial charts and graphs. In a full implementation, you would be able to upload images directly through the interface, and I would analyze trends, patterns, support/resistance levels, and other technical indicators visible in the chart.";
    }

    // Sentiment analysis handling
    if (message.toLowerCase().includes("sentiment")) {
      const company = extractCompanyName(message);
      if (company) {
        return await analyzeSentiment(company);
      }
    }

    // News handling
    if (message.toLowerCase().includes("news")) {
      const company = extractCompanyName(message);
      if (company) {
        return await getCompanyNews(company);
      }
    }

    // Stock price queries
    if (message.toLowerCase().includes("price") || 
        message.toLowerCase().includes("stock") || 
        message.toLowerCase().includes("quote")) {
      const company = extractCompanyName(message);
      if (company) {
        return await getStockQuote(company);
      }
    }

    // General query handling with RAG
    const context = retrieveContext(message);
    const combinedPrompt = `Context:\n${context}\n\nUser Query: ${message}\n\nAnswer:`;
    return await callGeminiLLM(combinedPrompt);
  } catch (error) {
    console.error("Error in chatbot:", error);
    toast.error("Failed to get a response. Please try again.");
    return "I'm having trouble processing your request right now. Please try again later.";
  }
};
