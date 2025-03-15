import { toast } from "sonner";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";

// ---------------------------
// API keys – in production these should be stored securely
// ---------------------------
const API_KEYS = {
  gemini: "AIzaSyB_u-Y8O422aIKG5ga_Ae7bN8q-6YKnx8E",
  alphaVantage: "4MK98IQRF8RTSYQ3",
  newsApi: "1a0c8951c92b4906b50f9dc0b1186174",
};

// ---------------------------
// Types
// ---------------------------
export type Message = {
  id: string;
  role: "user" | "bot";
  content: string;
  timestamp: Date;
};

// ---------------------------
// Company to Ticker mapping for common companies
// ---------------------------
const COMPANY_TO_TICKER: Record<string, string> = {
  "apple": "AAPL",
  "google": "GOOGL",
  "microsoft": "MSFT",
  "amazon": "AMZN",
  "tesla": "TSLA",
  "facebook": "META",
  "meta": "META",
  "netflix": "NFLX",
  "uber": "UBER",
  "airbnb": "ABNB",
  "nvidia": "NVDA",
  "amd": "AMD",
  "intel": "INTC",
  "ibm": "IBM"
};

// ---------------------------
// Initialize Gemini API
// ---------------------------
const genAI = new GoogleGenerativeAI(API_KEYS.gemini);

// ---------------------------
// Financial context documents (vector database simulation)
// ---------------------------
const documents = [
    {
        "text": "Tesla (TSLA) saw a 12% increase in Q1 2025 after beating revenue expectations. Investor optimism has grown with rising production numbers.",
        "metadata": {"company": "Tesla", "metric": "stock price", "sentiment": "positive", "date": "2025-04-15"}
    },
    {
        "text": "Apple (AAPL) reported a slight dip in its share price following mixed quarterly results, sparking a cautious outlook among analysts.",
        "metadata": {"company": "Apple", "metric": "stock price", "sentiment": "negative", "date": "2025-03-30"}
    },
    {
        "text": "The NASDAQ Composite hit a milestone, reaching 15000 points driven by strong performances in the technology sector.",
        "metadata": {"index": "NASDAQ Composite", "metric": "index value", "sentiment": "positive", "date": "2025-04-10"}
    },
    {
        "text": "Inflation concerns continue as consumer prices rose by 3.2% in March 2025, leading to uncertainty in the bond markets.",
        "metadata": {"metric": "inflation rate", "sentiment": "negative", "date": "2025-03-31"}
    },
    {
        "text": "Gold has maintained its status as a safe-haven asset, with prices stabilizing amidst ongoing global economic uncertainties.",
        "metadata": {"asset": "Gold", "metric": "price", "sentiment": "neutral", "date": "2025-04-05"}
    },
    {
        "text": "Amazon (AMZN) has seen its stock surge by 8% following the announcement of new innovations in its cloud computing services.",
        "metadata": {"company": "Amazon", "metric": "stock price", "sentiment": "positive", "date": "2025-04-12"}
    },
    {
        "text": "Market analysts remain divided over the outlook for the S&P 500, citing concerns about potential market corrections amid high valuations.",
        "metadata": {"index": "S&P 500", "metric": "index value", "sentiment": "neutral", "date": "2025-04-08"}
    },
    {
        "text": "Emerging market currencies have experienced volatility, with significant fluctuations observed due to political unrest in several regions.",
        "metadata": {"asset": "emerging market currencies", "risk": "political instability", "sentiment": "negative", "date": "2025-04-09"}
    },
    {
        "text": "Compound interest remains a fundamental concept in finance, underscoring the benefits of early and consistent investments for long-term wealth accumulation.",
        "metadata": {"concept": "compound interest", "sentiment": "positive"}
    },
    {
        "text": "New regulations in the European financial sector are expected to reshape market dynamics, with a focus on enhancing transparency and investor protection.",
        "metadata": {"region": "Europe", "regulator": "European Commission", "sentiment": "positive", "date": "2025-04-07"}
    },
    
    {
        "text": "Tesla (TSLA) stock has faced significant challenges in Q1 2025, with deliveries tracking approximately 31,000 units lower than Q1 2024. Wall Street analysts have revised delivery estimates downward to around 356,000 vehicles.",
        "metadata": {"company": "Tesla", "metric": "deliveries", "sentiment": "negative", "date": "2025-03-14"}
    },
    {
        "text": "Vector databases are transforming financial analysis by enabling efficient processing of unstructured data for fraud detection, risk analysis, and pattern recognition in market trends.",
        "metadata": {"technology": "vector databases", "industry": "finance", "application": "risk analysis", "sentiment": "positive", "date": "2025-03-01"}
    },
    {
        "text": "Bitcoin has experienced increased institutional adoption in 2025, with several major banks now offering cryptocurrency custody services to their wealth management clients.",
        "metadata": {"asset": "Bitcoin", "metric": "institutional adoption", "sentiment": "positive", "date": "2025-04-02"}
    },
    {
        "text": "The Federal Reserve has maintained its cautious approach to interest rates, signaling potential cuts later in 2025 if inflation continues to moderate toward the 2% target.",
        "metadata": {"institution": "Federal Reserve", "metric": "interest rates", "sentiment": "neutral", "date": "2025-03-25"}
    },
    {
        "text": "ESG-focused investment funds have seen record inflows in early 2025, reflecting growing investor demand for sustainability-oriented financial products.",
        "metadata": {"investment_strategy": "ESG", "metric": "fund inflows", "sentiment": "positive", "date": "2025-04-01"}
    },
    {
        "text": "Commercial real estate continues to face headwinds in 2025, with office vacancies remaining elevated as companies maintain flexible work arrangements post-pandemic.",
        "metadata": {"asset": "commercial real estate", "metric": "vacancies", "sentiment": "negative", "date": "2025-03-20"}
    },
    {
        "text": "Small-cap stocks have outperformed larger indices in Q1 2025, suggesting investors are finding value in smaller companies amid high valuations in tech giants.",
        "metadata": {"asset_class": "small-cap stocks", "metric": "performance", "sentiment": "positive", "date": "2025-04-03"}
    },
    {
        "text": "Venture capital investments in AI startups have reached $45 billion in Q1 2025, representing a 30% increase year-over-year as the technology's commercial applications expand.",
        "metadata": {"sector": "artificial intelligence", "metric": "venture capital", "sentiment": "positive", "date": "2025-04-10"}
    },
    {
        "text": "Global supply chain disruptions have eased in early 2025, though regional conflicts continue to create bottlenecks in certain industries and trade routes.",
        "metadata": {"economic_factor": "supply chain", "metric": "disruptions", "sentiment": "mixed", "date": "2025-03-28"}
    },
    {
        "text": "Financial advisors are increasingly recommending dynamic withdrawal strategies for retirement planning, moving away from the traditional 4% rule due to changing market conditions.",
        "metadata": {"financial_planning": "retirement", "concept": "withdrawal strategies", "sentiment": "neutral", "date": "2025-02-15"}
    },
    {
        "text": "Private equity firms have accumulated record levels of dry powder in 2025, with over $2.3 trillion available for investments as they wait for more favorable valuation environments.",
        "metadata": {"investment_type": "private equity", "metric": "dry powder", "sentiment": "neutral", "date": "2025-03-15"}
    },
    {
        "text": "Lithium prices have stabilized after a volatile 2024, as new mining capacity comes online to meet the growing demand from electric vehicle manufacturers.",
        "metadata": {"commodity": "lithium", "metric": "price", "sentiment": "positive", "date": "2025-04-05"}
    },
    {
        "text": "Embedded finance solutions are gaining traction across industries, with non-financial companies increasingly integrating payment and lending services into their customer experiences.",
        "metadata": {"industry": "fintech", "innovation": "embedded finance", "sentiment": "positive", "date": "2025-03-22"}
    },
    {
        "text": "Dividend-yielding stocks have seen renewed interest in Q1 2025 as investors seek income amid persistent inflation and relatively high interest rates.",
        "metadata": {"investment_strategy": "dividend investing", "metric": "investor interest", "sentiment": "positive", "date": "2025-03-31"}
    },
    {
        "text": "The VIX index, a key measure of market volatility, has averaged 18 points in Q1 2025, indicating relatively calm market conditions despite ongoing economic uncertainties.",
        "metadata": {"indicator": "VIX", "metric": "volatility", "sentiment": "positive", "date": "2025-04-01"}
    },
    {
        "text": "New trade agreements between ASEAN nations and the European Union are expected to boost economic activity in both regions, with implementation planned for late 2025.",
        "metadata": {"economic_policy": "trade agreements", "regions": ["ASEAN", "European Union"], "sentiment": "positive", "date": "2025-03-18"}
    },
    {
        "text": "Q1 2025 earnings season has begun with mixed results, as 65% of S&P 500 companies reporting so far have exceeded analyst expectations despite challenging economic conditions.",
        "metadata": {"financial_reporting": "earnings", "index": "S&P 500", "sentiment": "mixed", "date": "2025-04-14"}
    },
    {
        "text": "Art and collectibles have shown strong performance as alternative investments in early 2025, with auction records broken across several categories as investors seek diversification.",
        "metadata": {"investment_type": "alternative", "asset": "art and collectibles", "sentiment": "positive", "date": "2025-03-10"}
    },
    {
        "text": "New AI-powered risk management tools are allowing financial institutions to better predict and mitigate potential market disruptions through enhanced scenario modeling.",
        "metadata": {"financial_practice": "risk management", "technology": "AI", "sentiment": "positive", "date": "2025-02-28"}
    },
    {
        "text": "Regional banks have shown improved performance in Q1 2025 after implementing cost-cutting measures and digital transformation initiatives to enhance operational efficiency.",
        "metadata": {"industry": "banking", "segment": "regional banks", "metric": "performance", "sentiment": "positive", "date": "2025-04-08"}
    },
    {
        "text": "Microsoft (MSFT) has increased its dividend by 12% for 2025, reflecting strong cash flow generation and commitment to shareholder returns.",
        "metadata": {"company": "Microsoft", "metric": "dividend", "sentiment": "positive", "date": "2025-03-19"}
    },
    {
        "text": "Oil prices have fluctuated between $70-$85 per barrel in Q1 2025 as OPEC+ production adjustments attempt to balance global supply and demand dynamics.",
        "metadata": {"commodity": "oil", "metric": "price", "sentiment": "neutral", "date": "2025-04-05"}
    },
    {
        "text": "The healthcare sector has underperformed broader market indices in early 2025 amid concerns about potential regulatory changes affecting drug pricing.",
        "metadata": {"sector": "healthcare", "metric": "performance", "sentiment": "negative", "date": "2025-03-29"}
    },
    {
        "text": "Corporate bond yields have declined by 25 basis points on average during Q1 2025, reflecting improved credit conditions and strong investor demand for fixed income.",
        "metadata": {"asset": "corporate bonds", "metric": "yields", "sentiment": "positive", "date": "2025-04-01"}
    },
    {
        "text": "The Japanese yen has strengthened against major currencies following the Bank of Japan's decision to gradually normalize its monetary policy stance.",
        "metadata": {"currency": "Japanese yen", "metric": "exchange rate", "sentiment": "positive", "date": "2025-03-26"}
    }
]

// ---------------------------
// Cosine similarity function for vector retrieval simulation
// ---------------------------
const cosineSimilarity = (queryTerms: string[], docTerms: string[]): number => {
  const querySet = new Set(queryTerms.map(term => term.toLowerCase()));
  const docSet = new Set(docTerms.map(term => term.toLowerCase()));
  let matches = 0;
  querySet.forEach(term => {
    if (docSet.has(term)) matches++;
  });
  return matches / (Math.sqrt(querySet.size) * Math.sqrt(docSet.size));
};

// ---------------------------
// Retrieve context from documents (simulate vector search)
// ---------------------------
const retrieveContext = (query: string, topK: number = 2): string => {
  const queryTerms = query.toLowerCase().split(/\s+/);
  const scoredDocs = documents.map(doc => {
    const docTerms = doc.text.toLowerCase().split(/\s+/);
    const textScore = cosineSimilarity(queryTerms, docTerms);
    let metadataScore = 0;
    Object.values(doc.metadata).forEach(value => {
      if (typeof value === "string") {
        const valueTerms = value.toLowerCase().split(/\s+/);
        metadataScore += cosineSimilarity(queryTerms, valueTerms);
      }
    });
    return { doc, score: textScore + metadataScore };
  });
  const topDocs = scoredDocs
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(item => item.doc.text);
  return topDocs.join("\n\n");
};

// ---------------------------
// Call Gemini LLM
// ---------------------------
const callGeminiLLM = async (prompt: string, model: string = "gemini-2.0-flash"): Promise<string> => {
  try {
    const modelInstance = genAI.getGenerativeModel({ model });
    const result = await modelInstance.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "I'm having trouble accessing my AI capabilities right now. Please try again later.";
  }
};

// ---------------------------
// Extract stock symbol from query - FIXED FUNCTION
// ---------------------------
const extractStockSymbol = (query: string): string | null => {
  // Try to extract using known patterns
  const patterns = [
    /(?:price of|stock price for|quote for|get stock price of)\s+([A-Za-z\s]+)/i,
    /([A-Za-z\s]+)\s+stock price/i,
    /([A-Za-z\s]+)\s+share price/i,
    /([A-Za-z\s]+)\s+stock/i,
  ];
  
  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match && match[1]) {
      const companyName = match[1].trim().toLowerCase();
      
      // Direct lookup in our mapping dictionary
      if (COMPANY_TO_TICKER[companyName]) {
        return COMPANY_TO_TICKER[companyName];
      }
      
      // Handle partial matches
      for (const [company, ticker] of Object.entries(COMPANY_TO_TICKER)) {
        if (companyName.includes(company) || company.includes(companyName)) {
          return ticker;
        }
      }
      
      // Try to infer ticker from company name if not found
      if (companyName.length >= 2) {
        return companyName.substring(0, Math.min(4, companyName.length)).toUpperCase();
      }
    }
  }
  
  // If no extraction patterns worked, check if the query itself is a ticker
  const potentialTicker = query.trim().toUpperCase();
  if (/^[A-Z]{1,5}$/.test(potentialTicker)) {
    return potentialTicker;
  }
  
  return null;
};

// ---------------------------
// Fetch real-time stock data from Alpha Vantage
// ---------------------------
const getStockQuote = async (symbol: string): Promise<string> => {
  try {
    console.log(`Fetching stock quote for: ${symbol}`);
    const response = await axios.get("https://www.alphavantage.co/query", {
      params: {
        function: "GLOBAL_QUOTE",
        symbol,
        apikey: API_KEYS.alphaVantage,
      },
      timeout: 10000,
    });
    const data = response.data;
    if (data["Global Quote"] && Object.keys(data["Global Quote"]).length > 0) {
      const quote = data["Global Quote"];
      const price = quote["05. price"] || "N/A";
      const change = quote["09. change"] || "N/A";
      const changePercent = quote["10. change percent"] || "N/A";
      return `Alpha Vantage: The latest quote for ${symbol} is $${price}, change: ${change} (${changePercent}).`;
    } else if (data["Information"]) {
      console.error("Alpha Vantage API limit reached:", data["Information"]);
      // Provide simulated fallback data for common stocks during API limits
      if (symbol === "AAPL") {
        return `Simulated data (API limit reached): The latest quote for AAPL is $180.75, change: +1.25 (+0.70%).`;
      } else if (symbol === "MSFT") {
        return `Simulated data (API limit reached): The latest quote for MSFT is $402.35, change: -0.45 (-0.11%).`;
      } else if (symbol === "GOOGL") {
        return `Simulated data (API limit reached): The latest quote for GOOGL is $165.20, change: +2.35 (+1.44%).`;
      } else if (symbol === "AMZN") {
        return `Simulated data (API limit reached): The latest quote for AMZN is $178.25, change: +0.85 (+0.48%).`;
      } else if (symbol === "TSLA") {
        return `Simulated data (API limit reached): The latest quote for TSLA is $250.50, change: -3.25 (-1.28%).`;
      } else {
        return `Unable to retrieve stock data for ${symbol} - API limit reached. Please try again later.`;
      }
    } else {
      return `Unable to retrieve stock data for ${symbol}.`;
    }
  } catch (error) {
    console.error("Error fetching stock quote:", error);
    
    // Fallback for common stocks in case of error
    if (symbol === "AAPL") {
      return `Simulated data (API error): The latest quote for AAPL is $180.75, change: +1.25 (+0.70%).`;
    } else if (symbol === "MSFT") {
      return `Simulated data (API error): The latest quote for MSFT is $402.35, change: -0.45 (-0.11%).`;
    } else if (symbol === "GOOGL") {
      return `Simulated data (API error): The latest quote for GOOGL is $165.20, change: +2.35 (+1.44%).`;
    } else if (symbol === "AMZN") {
      return `Simulated data (API error): The latest quote for AMZN is $178.25, change: +0.85 (+0.48%).`;
    } else if (symbol === "TSLA") {
      return `Simulated data (API error): The latest quote for TSLA is $250.50, change: -3.25 (-1.28%).`;
    }
    
    return `Error retrieving stock data for ${symbol}.`;
  }
};

// ---------------------------
// Fetch company news using NewsAPI
// ---------------------------
const fetchCompanyNews = async (company: string, count: number = 5): Promise<string[]> => {
  try {
    const response = await axios.get("https://newsapi.org/v2/everything", {
      params: {
        q: company,
        sortBy: "publishedAt",
        pageSize: count,
        language: "en",
        apiKey: API_KEYS.newsApi,
      },
      timeout: 10000,
    });
    const data = response.data;
    if (data.articles && data.articles.length > 0) {
      return data.articles.map((article: any) => article.title);
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error fetching news:", error);
    return [];
  }
};

// ---------------------------
// Perform sentiment analysis using news headlines and Gemini LLM
// ---------------------------
const performSentimentAnalysis = async (company: string): Promise<string> => {
  try {
    const headlines = await fetchCompanyNews(company, 5);
    
    if (headlines.length === 0) {
      // Fallback simulated sentiment for common companies
      if (company.toLowerCase() === "apple" || company.toLowerCase() === "aapl") {
        return `Simulated sentiment analysis for Apple (due to NewsAPI limits):
        
Overall sentiment: Positive
        
Recent headlines indicate positive market sentiment toward Apple, driven by strong iPhone 15 sales and anticipation of new AI features in iOS 18. Analysts remain bullish on the company's hardware ecosystem and services growth, though there are some concerns about competition in China.`;
      } else if (company.toLowerCase() === "tesla" || company.toLowerCase() === "tsla") {
        return `Simulated sentiment analysis for Tesla (due to NewsAPI limits):
        
Overall sentiment: Mixed to Negative
        
Recent headlines show mixed sentiment toward Tesla, with concerns about declining delivery numbers and increasing competition in the EV market. However, some positive sentiment exists around the company's energy business and upcoming product announcements.`;
      } else if (company.toLowerCase() === "amazon" || company.toLowerCase() === "amzn") {
        return `Simulated sentiment analysis for Amazon (due to NewsAPI limits):
        
Overall sentiment: Positive
        
Recent headlines suggest positive sentiment toward Amazon, highlighting strong AWS growth and expanded retail market share. Analysts praise the company's cost-cutting measures and strategic investments in AI, though there are some regulatory concerns in European markets.`;
      }
      
      return `No news headlines found for ${company} for sentiment analysis.`;
    }
    
    let prompt = `Analyze the sentiment of the following news headlines about ${company}:\n`;
    headlines.forEach((headline) => {
      prompt += `- ${headline}\n`;
    });
    prompt += `\nProvide a summary sentiment analysis (positive, negative, or neutral) along with reasons.`;
    
    const analysis = await callGeminiLLM(prompt, "gemini-2.0-flash");
    return analysis;
  } catch (error) {
    console.error("Error performing sentiment analysis:", error);
    
    // Fallback for common companies
    if (company.toLowerCase() === "apple" || company.toLowerCase() === "aapl") {
      return `Simulated sentiment analysis for Apple (due to error):
      
Overall sentiment: Positive
      
Recent headlines indicate positive market sentiment toward Apple, driven by strong iPhone 15 sales and anticipation of new AI features in iOS 18. Analysts remain bullish on the company's hardware ecosystem and services growth, though there are some concerns about competition in China.`;
    } else if (company.toLowerCase() === "tesla" || company.toLowerCase() === "tsla") {
      return `Simulated sentiment analysis for Tesla (due to error):
      
Overall sentiment: Mixed to Negative
      
Recent headlines show mixed sentiment toward Tesla, with concerns about declining delivery numbers and increasing competition in the EV market. However, some positive sentiment exists around the company's energy business and upcoming product announcements.`;
    } else if (company.toLowerCase() === "amazon" || company.toLowerCase() === "amzn") {
      return `Simulated sentiment analysis for Amazon (due to error):
      
Overall sentiment: Positive
      
Recent headlines suggest positive sentiment toward Amazon, highlighting strong AWS growth and expanded retail market share. Analysts praise the company's cost-cutting measures and strategic investments in AI, though there are some regulatory concerns in European markets.`;
    }
    
    return `Error performing sentiment analysis. Please try again later.`;
  }
};

// ---------------------------
// Extract company name for sentiment analysis and news queries using improved patterns
// ---------------------------
const extractCompanyName = (query: string): string | null => {
  const patterns = [
    /about\s+([A-Za-z\s]+)(?:\s+stock)?/i,
    /news\s+(?:for|about|related to)\s+((?:[A-Za-z]+\s*)+)(?:stock)?/i,
    /([A-Za-z\s]+)\s+stock/i,
    /price\s+of\s+([A-Za-z\s]+)/i,
    /sentiment analysis (?:of|on)\s+([A-Za-z\s]+?)\s+stock/i,
    /(?:price of|stock price for|quote for)\s+([A-Za-z\s]+)/i,
    /get\s+stock\s+price\s+of\s+([A-Za-z\s]+)/i,
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
// Get stock news headlines for a company
// ---------------------------
const getStockNews = async (company: string): Promise<string> => {
  try {
    const headlines = await fetchCompanyNews(company, 5);
    
    if (headlines.length === 0) {
      // Fallback simulated news for common companies
      if (company.toLowerCase() === "apple" || company.toLowerCase() === "aapl") {
        return `Simulated news headlines for Apple (due to NewsAPI limits):
        
- Apple Unveils New MacBook Pro with M3 Pro and M3 Max Chips
- iOS 18 to Feature Major AI Upgrades, Sources Say
- Apple Services Revenue Hits All-Time High in Q1 2025
- Apple Expands Manufacturing in India Amid China Diversification
- Analysts Bullish on Apple Stock Ahead of WWDC 2025 Announcements`;
      } else if (company.toLowerCase() === "tesla" || company.toLowerCase() === "tsla") {
        return `Simulated news headlines for Tesla (due to NewsAPI limits):
        
- Tesla Q1 2025 Deliveries Miss Analyst Expectations
- Cybertruck Production Ramps Up as Tesla Addresses Early Issues
- Tesla Energy Division Shows Strong Growth with Powerwall Installations
- Musk Hints at New Tesla Roadster Release Date at Shareholder Meeting
- Competition Intensifies as Legacy Automakers Release New EVs`;
      } else if (company.toLowerCase() === "amazon" || company.toLowerCase() === "amzn") {
        return `Simulated news headlines for Amazon (due to NewsAPI limits):
        
- Amazon AWS Revenue Grows 35% Year-Over-Year in Latest Quarter
- Amazon's AI Shopping Assistant Launches to Prime Members
- Amazon Expands Healthcare Initiatives with New Pharmacy Features
- EU Regulators Scrutinize Amazon's Data Practices in New Investigation
- Amazon Announces Plans for 25 New Fulfillment Centers Worldwide`;
      }
      
      return `No news headlines found for ${company}.`;
    }
    
    let result = `News headlines for ${company}:\n`;
    headlines.forEach((headline) => {
      result += `- ${headline}\n`;
    });
    return result;
  } catch (error) {
    console.error("Error fetching news:", error);
    
    // Fallback for common companies
    if (company.toLowerCase() === "apple" || company.toLowerCase() === "aapl") {
      return `Simulated news headlines for Apple (due to error):
      
- Apple Unveils New MacBook Pro with M3 Pro and M3 Max Chips
- iOS 18 to Feature Major AI Upgrades, Sources Say
- Apple Services Revenue Hits All-Time High in Q1 2025
- Apple Expands Manufacturing in India Amid China Diversification
- Analysts Bullish on Apple Stock Ahead of WWDC 2025 Announcements`;
    } else if (company.toLowerCase() === "tesla" || company.toLowerCase() === "tsla") {
      return `Simulated news headlines for Tesla (due to error):
      
- Tesla Q1 2025 Deliveries Miss Analyst Expectations
- Cybertruck Production Ramps Up as Tesla Addresses Early Issues
- Tesla Energy Division Shows Strong Growth with Powerwall Installations
- Musk Hints at New Tesla Roadster Release Date at Shareholder Meeting
- Competition Intensifies as Legacy Automakers Release New EVs`;
    } else if (company.toLowerCase() === "amazon" || company.toLowerCase() === "amzn") {
      return `Simulated news headlines for Amazon (due to error):
      
- Amazon AWS Revenue Grows 35% Year-Over-Year in Latest Quarter
- Amazon's AI Shopping Assistant Launches to Prime Members
- Amazon Expands Healthcare Initiatives with New Pharmacy Features
- EU Regulators Scrutinize Amazon's Data Practices in New Investigation
- Amazon Announces Plans for 25 New Fulfillment Centers Worldwide`;
    }
    
    return `Error fetching news for ${company}. Please try again later.`;
  }
};

// ---------------------------
// Analyze an image/graph by reading the file, encoding to base64, and sending to Gemini LLM
// ---------------------------
const analyzeImage = async (filePath: string): Promise<string> => {
  try {
    const fileData = fs.readFileSync(filePath);
    const base64Image = fileData.toString("base64");
    const prompt = `You are a financial analyst with expertise in stock market trends and financial charts. The following image (provided as a base64-encoded string) represents a financial graph—such as an S&P 500 growth chart. Please analyze the chart and provide detailed insights on trends, key performance metrics, and any notable fluctuations related to the market.\nImage (base64): ${base64Image}`;
    const analysis = await callGeminiLLM(prompt, "gemini-2.0-flash");
    return analysis;
  } catch (error) {
    console.error("Error processing image:", error);
    return `Error processing image: ${error}`;
  }
};

// ---------------------------
// Main chatbot function – routes queries to the appropriate functionality
// ---------------------------
export const sendChatMessage = async (message: string): Promise<string> => {
  try {
    const lowerMessage = message.toLowerCase();

    // Branch: Image/Graph Analysis (expecting file path input later)
    if (
      lowerMessage.includes("upload") ||
      lowerMessage.includes("analyze image") ||
      lowerMessage.includes("upload graph") ||
      lowerMessage.includes("analyze graph") ||
      lowerMessage.includes("upload chart") ||
      lowerMessage.includes("analyze chart")
    ) {
      return "Please provide the file path of the image/graph to analyze.";
    }

    // Branch: Sentiment Analysis
    if (lowerMessage.includes("sentiment analysis")) {
      const company = extractCompanyName(message);
      if (company) {
        return await performSentimentAnalysis(company);
      } else {
        return "Unable to extract company name for sentiment analysis.";
      }
    }

    // Branch: News Headlines
    if (lowerMessage.includes("news")) {
      const company = extractCompanyName(message);
      if (company) {
        return await getStockNews(company);
      } else {
        return "Please specify the company name to fetch news.";
      }
    }

    // Branch: Stock Price / Quote
    if (lowerMessage.includes("price") || lowerMessage.includes("stock") || lowerMessage.includes("quote")) {
      console.log("Detected stock price request");
      const ticker = extractStockSymbol(message);
      console.log("Extracted ticker:", ticker);
      
      if (ticker) {
        const stockInfo = await getStockQuote(ticker);
        // Retrieve additional context using simulated vector search
        const context = retrieveContext(message, 2);
        return `${context}\n${stockInfo}`;
      } else {
        return "I couldn't determine which company's stock price you're looking for
