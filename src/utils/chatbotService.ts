
import { toast } from "sonner";

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'bot';
  timestamp: Date;
}

// Mock API call for the chatbot
export const sendChatMessage = async (message: string): Promise<string> => {
  try {
    // This would be replaced with an actual API call in production
    // e.g. const response = await fetch('/api/chat', { method: 'POST', body: JSON.stringify({ message }) })
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock replies based on keywords
    let response = "";
    
    if (message.toLowerCase().includes("stock price") || message.toLowerCase().includes("quote")) {
      response = "Based on the latest market data, the stock is trading at $156.78, showing a 2.3% increase from yesterday's close.";
    } 
    else if (message.toLowerCase().includes("news")) {
      response = "Recent headlines:\n- Company announces new product line expansion\n- Quarterly earnings exceeded analyst expectations\n- Industry analyst upgrades stock to 'buy' rating\n- CEO interview discussing future growth strategy\n- Partnership announcement with tech giant";
    }
    else if (message.toLowerCase().includes("sentiment") || message.toLowerCase().includes("analysis")) {
      response = "Sentiment analysis of recent news indicates a positive outlook. The company has been receiving favorable coverage following their latest product announcement and better-than-expected quarterly results.";
    }
    else if (message.toLowerCase().includes("upload") || message.toLowerCase().includes("image") || message.toLowerCase().includes("chart")) {
      response = "I can analyze financial charts and graphs. In a full implementation, you would be able to upload images directly through the interface, and I would analyze trends, patterns, support/resistance levels, and other technical indicators visible in the chart.";
    }
    else if (message.toLowerCase().includes("help") || message.toLowerCase().includes("capabilities")) {
      response = "I can help with various financial queries:\n- Get stock quotes (e.g., 'What's the price of AAPL?')\n- Retrieve company news (e.g., 'Show me news about Tesla')\n- Perform sentiment analysis (e.g., 'Sentiment analysis of Amazon stock')\n- Analyze financial charts (e.g., 'Analyze this chart' + image upload)";
    }
    else {
      response = "I've retrieved information from my financial knowledge base. The market has shown mixed trends recently, with technology stocks generally outperforming other sectors. Inflation concerns remain moderate, and central bank policy continues to be closely monitored by investors.";
    }
    
    return response;
  } catch (error) {
    console.error("Error sending chat message:", error);
    toast.error("Failed to get a response. Please try again.");
    return "I'm having trouble processing your request right now. Please try again later.";
  }
};

// Function to handle file uploads - would be implemented to call the backend API
export const uploadAndAnalyzeImage = async (file: File): Promise<string> => {
  try {
    // Simulate network delay and processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In the real implementation, you would send the file to your backend
    // const formData = new FormData();
    // formData.append('image', file);
    // const response = await fetch('/api/analyze-image', { method: 'POST', body: formData });
    
    return "Chart Analysis: The image shows a bullish trend with strong support levels at the $125 price point. There's an emerging cup and handle pattern that suggests potential upward momentum. Trading volume has been increasing during price advances, confirming the strength of the uptrend. Resistance appears at approximately $158, which would be a key level to watch for a breakout.";
  } catch (error) {
    console.error("Error analyzing image:", error);
    toast.error("Failed to analyze the image. Please try again.");
    return "I'm having trouble analyzing this image right now. Please try again later.";
  }
};
