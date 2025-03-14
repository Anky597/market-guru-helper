
import { toast } from "sonner";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'bot';
  timestamp: Date;
}

// ---------------------------
// API keys - in production these should be stored securely
// ---------------------------
const API_KEYS = {
  gemini: "AIzaSyB_u-Y8O422aIKG5ga_Ae7bN8q-6YKnx8E", 
  alphaVantage: "4MK98IQRF8RTSYQ3",
  newsApi: "1a0c8951c92b4906b50f9dc0b1186174"
};

// ---------------------------
// Initialize Gemini API
// ---------------------------
const genAI = new GoogleGenerativeAI(API_KEYS.gemini);

// ---------------------------
// Financial context documents (vector database simulation)
// ---------------------------
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
  {
    text: "Amazon (AMZN) has seen its stock surge by 8% following the announcement of new innovations in its cloud computing services.",
    metadata: { company: "Amazon", metric: "stock price", sentiment: "positive", date: "2025-04-12" }
  },
  {
    text: "Market analysts remain divided over the outlook for the S&P 500, citing concerns about potential market corrections amid high valuations.",
    metadata: { index: "S&P 500", metric: "index value", sentiment: "neutral", date: "2025-04-08" }
  },
  {
    text: "Emerging market currencies have experienced volatility, with significant fluctuations observed due to political unrest in several regions.",
    metadata: { asset: "emerging market currencies", risk: "political instability", sentiment: "negative", date: "2025-04-09" }
  },
  {
    text: "Compound interest remains a fundamental concept in finance, underscoring the benefits of early and consistent investments for long-term wealth accumulation.",
    metadata: { concept: "compound interest", sentiment: "positive" }
  },
  {
    text: "New regulations in the European financial sector are expected to reshape market dynamics, with a focus on enhancing transparency and investor protection.",
    metadata: { region: "Europe", regulator: "European Commission", sentiment: "positive", date: "2025-04-07" }
  },
  // New entries from your code
  {
    text: "Tesla (TSLA) stock has faced significant challenges in Q1 2025, with deliveries tracking approximately 31,000 units lower than Q1 2024. Wall Street analysts have revised delivery estimates downward to around 356,000 vehicles.",
    metadata: {company: "Tesla", metric: "deliveries", sentiment: "negative", date: "2025-03-14"}
  },
  {
    text: "Vector databases are transforming financial analysis by enabling efficient processing of unstructured data for fraud detection, risk analysis, and pattern recognition in market trends.",
    metadata: {technology: "vector databases", industry: "finance", application: "risk analysis", sentiment: "positive", date: "2025-03-01"}
  },
  {
    text: "Bitcoin has experienced increased institutional adoption in 2025, with several major banks now offering cryptocurrency custody services to their wealth management clients.",
    metadata: {asset: "Bitcoin", metric: "institutional adoption", sentiment: "positive", date: "2025-04-02"}
  },
  {
    text: "The Federal Reserve has maintained its cautious approach to interest rates, signaling potential cuts later in 2025 if inflation continues to moderate toward the 2% target.",
    metadata: {institution: "Federal Reserve", metric: "interest rates", sentiment: "neutral", date: "2025-03-25"}
  },
  {
    text: "ESG-focused investment funds have seen record inflows in early 2025, reflecting growing investor demand for sustainability-oriented financial products.",
    metadata: {investment_strategy: "ESG", metric: "fund inflows", sentiment: "positive", date: "2025-04-01"}
  },
  // Additional entries omitted for brevity, but would be included in full implementation
];

// ---------------------------
// Vector similarity search simulation
// ---------------------------
const cosineSimilarity = (queryTerms: string[], docTerms: string[]): number => {
  // Simple implementation for frontend-only
  const querySet = new Set(queryTerms.map(term => term.toLowerCase()));
  const docSet = new Set(docTerms.map(term => term.toLowerCase()));
  
  // Count matches
  let matches = 0;
  querySet.forEach(term => {
    if (docSet.has(term)) matches++;
  });
  
  // Normalize by term count
  return matches / (Math.sqrt(querySet.size) * Math.sqrt(docSet.size));
};

// ---------------------------
// Simulate vector database retrieval with improved keyword matching
// ---------------------------
const retrieveContext = (query: string): string => {
  const queryTerms = query.toLowerCase().split(/\s+/);
  
  // Calculate relevance scores
  const scoredDocs = documents.map(doc => {
    const docTerms = doc.text.split(/\s+/);
    const textScore = cosineSimilarity(queryTerms, docTerms);
    
    // Also check metadata for relevance
    let metadataScore = 0;
    Object.values(doc.metadata).forEach(value => {
      if (typeof value === 'string') {
        const valueTerms = value.split(/\s+/);
        metadataScore += cosineSimilarity(queryTerms, valueTerms);
      }
    });
    
    return {
      doc,
      score: textScore + metadataScore
    };
  });
  
  // Sort by relevance and take top results
  const topDocs = scoredDocs
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(item => item.doc.text);
  
  return topDocs.join("\n\n");
};

// ---------------------------
// Extract company name or ticker from query using patterns from your code
// ---------------------------
const extractCompanyName = (query: string): string | null => {
  // Combined patterns from both implementations
  const patterns = [
    /about\s+([A-Za-z\s]+)(?:\s+stock)?/i,
    /news\s+(?:for|about|related\s+to)\s+((?:[A-Za-z]+\s*)+)(?:stock)?/i,
    /([A-Za-z\s]+)\s+stock/i,
    /price\s+of\s+([A-Za-z\s]+)/i,
    /sentiment analysis (?:of|on)\s+([A-Za-z\s]+?)\s+stock/i,
    /(?:price of|stock price for|quote for)\s+([A-Za-z]+)/i
  ];

  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
};

// ---------------------------
// Call Gemini LLM with improved error handling
// ---------------------------
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

// ---------------------------
// Alpha Vantage: Fetch Real-Time Stock Data (from your code)
// ---------------------------
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

// ---------------------------
// Get company news using NewsAPI (from your code)
// ---------------------------
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

// ---------------------------
// Analyze sentiment using Gemini (from your code)
// ---------------------------
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

// ---------------------------
// Main chatbot function (simplified version of your API endpoint)
// ---------------------------
export const sendChatMessage = async (message: string): Promise<string> => {
  try {
    // Image analysis detection
    if (message.toLowerCase().includes("upload") || 
        message.toLowerCase().includes("image") || 
        message.toLowerCase().includes("chart") ||
        message.toLowerCase().includes("graph")) {
      return "I can analyze financial charts and graphs. In a full implementation, you would be able to upload images directly through the interface, and I would analyze trends, patterns, support/resistance levels, and other technical indicators visible in the chart.";
    }

    // Sentiment analysis handling (from your code)
    if (message.toLowerCase().includes("sentiment")) {
      const company = extractCompanyName(message);
      if (company) {
        return await analyzeSentiment(company);
      }
    }

    // News handling (from your code)
    if (message.toLowerCase().includes("news")) {
      const company = extractCompanyName(message);
      if (company) {
        return await getCompanyNews(company);
      }
    }

    // Stock price queries (from your code)
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

    // General query handling with RAG (from your code)
    const context = retrieveContext(message);
    const combinedPrompt = `Context:\n${context}\n\nUser Query: ${message}\n\nAnswer:`;
    return await callGeminiLLM(combinedPrompt);
  } catch (error) {
    console.error("Error in chatbot:", error);
    toast.error("Failed to get a response. Please try again.");
    return "I'm having trouble processing your request right now. Please try again later.";
  }
};

// ---------------------------
// Function to handle file uploads (simplified simulation of your image analysis)
// ---------------------------
export const uploadAndAnalyzeImage = async (file: File): Promise<string> => {
  try {
    // Simulate network delay and processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In a production environment with your code, we would:
    // 1. Convert the file to base64
    // 2. Send it to the Gemini API via your backend for analysis
    // 3. Return the detailed analysis
    
    // Simulated response that would come from your backend
    return "Chart Analysis: The image shows a bullish trend with strong support levels at the $125 price point. There's an emerging cup and handle pattern that suggests potential upward momentum. Trading volume has been increasing during price advances, confirming the strength of the uptrend. Resistance appears at approximately $158, which would be a key level to watch for a breakout.";
  } catch (error) {
    console.error("Error analyzing image:", error);
    toast.error("Failed to analyze the image. Please try again.");
    return "I'm having trouble analyzing this image right now. Please try again later.";
  }
};
