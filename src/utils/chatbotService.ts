import { toast } from "sonner";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'bot';
  timestamp: Date;
}

// Sample financial context documents (vector database simulation)
const documents = [
  // Existing entries
  {
    text: "Tesla (TSLA) saw a 12% increase in Q1 2025 after beating revenue expectations. Investor optimism has grown with rising production numbers.",
    metadata: { company: "Tesla", metric: "stock price", sentiment: "positive", date: "2025-04-15" }
  },
  {
    text: "Apple (AAPL) reported a slight dip in its share price following mixed quarterly results, sparking a cautious outlook among analysts.",
    metadata: { company: "Apple", metric: "stock price", sentiment: "negative", date: "2025-03-30" }
  },
  {
    text: "The NASDAQ Composite hit a milestone, reaching 15000 points driven by strong performances in the technology sector.",
    metadata: { index: "NASDAQ Composite", metric: "index value", sentiment: "positive", date: "2025-04-10" }
  },
  {
    text: "Inflation concerns continue as consumer prices rose by 3.2% in March 2025, leading to uncertainty in the bond markets.",
    metadata: { metric: "inflation rate", sentiment: "negative", date: "2025-03-31" }
  },
  {
    text: "Gold has maintained its status as a safe-haven asset, with prices stabilizing amidst ongoing global economic uncertainties.",
    metadata: { asset: "Gold", metric: "price", sentiment: "neutral", date: "2025-04-05" }
  },
  // More entries would be here...
];

// API keys - in production these should be stored securely
const API_KEYS = {
  gemini: "AIzaSyB_u-Y8O422aIKG5ga_Ae7bN8q-6YKnx8E", 
  alphaVantage: "4MK98IQRF8RTSYQ3",
  newsApi: "1a0c8951c92b4906b50f9dc0b1186174"
};

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(API_KEYS.gemini);

// Simulate vector database retrieval with basic keyword matching
const retrieveContext = (query: string): string => {
  // In a real implementation, this would use embeddings and vector similarity
  const lowerQuery = query.toLowerCase();
  const relevantDocs = documents.filter(doc => {
    return Object.values(doc.metadata).some(value => 
      typeof value === 'string' && value.toLowerCase().includes(lowerQuery)
    ) || doc.text.toLowerCase().includes(lowerQuery);
  });

  // Sort by relevance (simplified)
  const retrievedTexts = relevantDocs.slice(0, 2).map(doc => doc.text);
  return retrievedTexts.join("\n\n");
};

// Extract company name or ticker from query
const extractCompanyName = (query: string): string | null => {
  // Simple regex pattern for company extraction
  const patterns = [
    /about\s+([A-Za-z\s]+)(?:\s+stock)?/i,
    /news\s+(?:for|about)\s+([A-Za-z\s]+)/i,
    /([A-Za-z\s]+)\s+stock/i,
    /price\s+of\s+([A-Za-z\s]+)/i
  ];

  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
};

// Call Gemini LLM
const callGeminiLLM = async (prompt: string): Promise<string> => {
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

// Alpha Vantage: Fetch Real-Time Stock Data
const getStockQuote = async (symbol: string): Promise<string> => {
  try {
    const response = await axios.get("https://www.alphavantage.co/query", {
      params: {
        function: "GLOBAL_QUOTE",
        symbol,
        apikey: API_KEYS.alphaVantage
      }
    });

    const data = response.data;
    if (data["Global Quote"] && Object.keys(data["Global Quote"]).length > 0) {
      const quote = data["Global Quote"];
      const price = quote["05. price"] || "N/A";
      const change = quote["09. change"] || "N/A";
      const changePercent = quote["10. change percent"] || "N/A";
      return `The latest quote for ${symbol} is $${price}, change: ${change} (${changePercent}).`;
    } else {
      return `Unable to retrieve stock data for ${symbol}.`;
    }
  } catch (error) {
    console.error("Error fetching stock quote:", error);
    return `Error retrieving stock data for ${symbol}.`;
  }
};

// Get company news
const getCompanyNews = async (company: string): Promise<string> => {
  try {
    const response = await axios.get("https://newsapi.org/v2/everything", {
      params: {
        q: company,
        sortBy: "publishedAt",
        pageSize: 5,
        language: "en",
        apiKey: API_KEYS.newsApi
      }
    });

    const data = response.data;
    if (data.articles && data.articles.length > 0) {
      const headlines = data.articles.map((article: any) => article.title);
      return `News headlines for ${company}:\n${headlines.map((h: string) => `- ${h}`).join('\n')}`;
    } else {
      return `No news headlines found for ${company}.`;
    }
  } catch (error) {
    console.error("Error fetching news:", error);
    return `Error retrieving news for ${company}.`;
  }
};

// Analyze sentiment
const analyzeSentiment = async (company: string): Promise<string> => {
  try {
    // First get news headlines
    const response = await axios.get("https://newsapi.org/v2/everything", {
      params: {
        q: company,
        sortBy: "publishedAt",
        pageSize: 5,
        language: "en",
        apiKey: API_KEYS.newsApi
      }
    });

    const data = response.data;
    if (data.articles && data.articles.length > 0) {
      const headlines = data.articles.map((article: any) => article.title);
      const prompt = `Analyze the sentiment of the following news headlines about ${company}:\n${headlines.map((h: string) => `- ${h}`).join('\n')}\n\nProvide a summary sentiment analysis (positive, negative, or neutral) along with reasons.`;
      return await callGeminiLLM(prompt);
    } else {
      return `No news headlines found for ${company} for sentiment analysis.`;
    }
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    return "Error performing sentiment analysis. Please try again later.";
  }
};

// Main chatbot function
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
        // In a full implementation, we would convert company name to ticker
        // For now, we'll use a simplified approach
        const ticker = company.toUpperCase().trim().split(' ')[0];
        return await getStockQuote(ticker);
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

// Function to handle file uploads - would be implemented to call the backend API
export const uploadAndAnalyzeImage = async (file: File): Promise<string> => {
  try {
    // Simulate network delay and processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In a production environment, we would:
    // 1. Convert the file to base64
    // 2. Send it to the Gemini API for analysis
    // 3. Return the detailed analysis
    
    return "Chart Analysis: The image shows a bullish trend with strong support levels at the $125 price point. There's an emerging cup and handle pattern that suggests potential upward momentum. Trading volume has been increasing during price advances, confirming the strength of the uptrend. Resistance appears at approximately $158, which would be a key level to watch for a breakout.";
  } catch (error) {
    console.error("Error analyzing image:", error);
    toast.error("Failed to analyze the image. Please try again.");
    return "I'm having trouble analyzing this image right now. Please try again later.";
  }
};
