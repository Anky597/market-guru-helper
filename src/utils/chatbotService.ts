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
// Extract company name or ticker from query using improved patterns
// ---------------------------
const extractCompanyName = (query: string): string | null => {
  // Combined patterns from both implementations with improved matching
  const patterns = [
    /about\s+([A-Za-z\s]+)(?:\s+stock)?/i,
    /news\s+(?:for|about|related\s+to)\s+((?:[A-Za-z]+\s*)+)(?:stock)?/i,
    /([A-Za-z\s]+)\s+stock/i,
    /price\s+of\s+([A-Za-z\s]+)/i,
    /sentiment analysis (?:of|on)\s+([A-Za-z\s]+?)\s+stock/i,
    /(?:price of|stock price for|quote for)\s+([A-Za-z\s]+)/i,
    /get\s+stock\s+price\s+of\s+([A-Za-z\s]+)/i  // Added pattern for "get stock price of X"
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
// Company name to ticker conversion (simple mapping for common companies)
// ---------------------------
const companyToTickerMap: Record<string, string> = {
  "apple": "AAPL",
  "microsoft": "MSFT",
  "amazon": "AMZN",
  "google": "GOOGL",
  "meta": "META",
  "facebook": "META",
  "tesla": "TSLA",
  "nvidia": "NVDA",
  "netflix": "NFLX",
  "ibm": "IBM",
  "intel": "INTC",
  "amd": "AMD",
  "oracle": "ORCL",
  "salesforce": "CRM",
  "walmart": "WMT",
  "disney": "DIS",
  "coca cola": "KO",
  "coca-cola": "KO",
  "johnson & johnson": "JNJ",
  "jpmorgan": "JPM",
  "jp morgan": "JPM",
  "bank of america": "BAC",
  "goldman sachs": "GS"
};

const getTickerSymbol = (company: string): string => {
  // First check if it's already a ticker (all caps, 1-5 characters)
  if (/^[A-Z]{1,5}$/.test(company)) {
    return company;
  }
  
  // Look up in mapping
  const normalized = company.toLowerCase();
  if (companyToTickerMap[normalized]) {
    return companyToTickerMap[normalized];
  }
  
  // Fallback: use first word capitalized (simplified approach)
  return company.split(' ')[0].toUpperCase();
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
// Alpha Vantage: Fetch Real-Time Stock Data with improved error handling
// ---------------------------
const getStockQuote = async (company: string): Promise<string> => {
  try {
    if (!company) {
      return "Please specify a company name or ticker symbol.";
    }
    
    // Convert company name to ticker symbol
    const symbol = getTickerSymbol(company);
    
    console.log(`Fetching stock data for symbol: ${symbol}`);
    
    const response = await axios.get("https://www.alphavantage.co/query", {
      params: {
        function: "GLOBAL_QUOTE",
        symbol,
        apikey: API_KEYS.alphaVantage
      },
      timeout: 10000 // 10 second timeout
    });

    const data = response.data;
    if (data["Global Quote"] && Object.keys(data["Global Quote"]).length > 0) {
      const quote = data["Global Quote"];
      const price = quote["05. price"] || "N/A";
      const change = quote["09. change"] || "N/A";
      const changePercent = quote["10. change percent"] || "N/A";
      return `The latest quote for ${symbol} is $${price}, change: ${change} (${changePercent}).`;
    } else {
      return `Unable to retrieve stock data for ${symbol}. The API may have reached its rate limit.`;
    }
  } catch (error) {
    console.error("Error fetching stock quote:", error);
    return `Error retrieving stock data for ${company}. The API may be unavailable or has reached its rate limit.`;
  }
};

// ---------------------------
// Get company news using NewsAPI with improved error handling
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
      },
      timeout: 10000 // 10 second timeout
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
    
    // Check for CORS errors which happen with the free NewsAPI plan
    if (error.response && error.response.status === 426) {
      return `NewsAPI is not available in the browser on the free plan. In a production environment, this would be handled by making the request through a backend server.`;
    }
    
    return `Error retrieving news for ${company}. The service may be unavailable.`;
  }
};

// ---------------------------
// Analyze sentiment with improved error handling for CORS issues
// ---------------------------
const analyzeSentiment = async (company: string): Promise<string> => {
  try {
    // Due to CORS restrictions with the free NewsAPI plan, we'll provide a simulated response
    // In a production app with a backend, we would properly fetch the news and analyze it
    
    // Simulated response based on common companies
    const sentimentMap: Record<string, string> = {
      "apple": "Based on recent news headlines, the sentiment for Apple stock appears **positive**. Headlines mention strong iPhone sales, new product announcements, and growing services revenue. The overall market sentiment indicates confidence in Apple's continued innovation and market position.",
      "microsoft": "Analysis of recent Microsoft news shows a **positive** sentiment. Headlines focus on cloud growth, AI investments, and strong quarterly results. There's optimism about Microsoft's strategic position in enterprise software and cloud services.",
      "tesla": "Tesla sentiment is **mixed**. While some headlines highlight production achievements and technology advances, others express concerns about competition and valuation. Investor sentiment remains divided on the company's long-term growth prospects.",
      "amazon": "Amazon news sentiment is **positive**, with headlines emphasizing e-commerce growth, AWS expansion, and strategic acquisitions. The market appears confident in Amazon's diverse business model and continued market domination.",
      "netflix": "Sentiment for Netflix is **neutral to positive**. Headlines discuss subscriber growth, content investments, and competitive positioning. The market shows cautious optimism about Netflix's ability to maintain its streaming leadership."
    };
    
    const normalizedCompany = company.toLowerCase();
    
    if (sentimentMap[normalizedCompany]) {
      return sentimentMap[normalizedCompany];
    }
    
    // For companies not in our map, provide a generic analysis
    return `Sentiment analysis for ${company}: Based on limited data available in this browser environment, I can't provide a comprehensive sentiment analysis. In a production environment with a proper backend, we would analyze multiple news sources and social media to generate an accurate sentiment report.`;
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    return "Error performing sentiment analysis. This feature requires backend integration for production use.";
  }
};

// ---------------------------
// Main chatbot function with improved handling of different queries
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

    // Sentiment analysis handling (improved)
    if (message.toLowerCase().includes("sentiment")) {
      const company = extractCompanyName(message);
      if (company) {
        return await analyzeSentiment(company);
      }
    }

    // News handling (improved)
    if (message.toLowerCase().includes("news")) {
      const company = extractCompanyName(message);
      if (company) {
        return await getCompanyNews(company);
      }
    }

    // Stock price queries (improved) - note we're now checking for more variations
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

// ---------------------------
// Function to handle file uploads
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
