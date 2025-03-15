
import { toast } from "sonner";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs/promises";
import formidable from 'formidable';
import path from 'path';

// ---------------------------
// API keys – in production these should be stored securely as environment variables
// ---------------------------
const API_KEYS = {
    gemini: process.env.GEMINI_API_KEY || "AIzaSyB_u-Y8O422aIKG5ga_Ae7bN8q-6YKnx8E", // Replace with your actual key in environment variables
  alphaVantage: process.env.ALPHA_VANTAGE_API_KEY || "4MK98IQRF8RTSYQ3", // Replace with your actual key
  newsApi: process.env.NEWS_API_KEY || "1a0c8951c92b4906b50f9dc0b1186174", // Replace with your actual key
};

// Ensure API keys are set
if (API_KEYS.gemini === "AIzaSyB_u-Y8O422aIKG5ga_Ae7bN8q-6YKnx8E" || API_KEYS.alphaVantage === "4MK98IQRF8RTSYQ3" || API_KEYS.newsApi === "1a0c8951c92b4906b50f9dc0b1186174") {
    console.warn("Warning: Please set your Gemini, Alpha Vantage, and NewsAPI API keys in your environment variables.");
}

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
// Initialize Gemini API
// ---------------------------
const genAI = new GoogleGenerativeAI(API_KEYS.gemini);

// ---------------------------
// Improved financial context documents (vector database simulation)
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
];

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
    if (querySet.size === 0 || docSet.size === 0) return 0;
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
    } catch (error: any) {
        console.error("Error calling Gemini API:", error);
        return `I'm having trouble accessing my AI capabilities right now. Please try again later. Error: ${error.message}`;
    }
};

// ---------------------------
// Conversion: Company Name to Ticker Symbol using Gemini LLM
// ---------------------------
const convertCompanyToTicker = async (companyName: string): Promise<string | null> => {
    const conversionPrompt = `Convert the following company name into its stock ticker symbol. Only output the ticker symbol without any additional text.\n\nCompany Name: ${companyName}`;
    try {
        const ticker = await callGeminiLLM(conversionPrompt);
        return ticker.trim().toUpperCase();
    } catch (error: any) {
        console.error(`Error converting company name to ticker for ${companyName}:`, error);
        return null;
    }
};

const extractStockSymbol = async (query: string): Promise<string | null> => {
    const pattern = /(?:price of|stock price of|stock price for|quote for)\s+([A-Za-z\s]+)/;
    const match = query.match(pattern);
    if (match && match[1]) {
        const companyName = match[1].trim();
        return await convertCompanyToTicker(companyName);
    }
    return null;
};

// ---------------------------
// Alpha Vantage: Fetch Real-Time Stock Data
// ---------------------------
const getStockQuoteAlphaVantage = async (symbol: string): Promise<string> => {
    try {
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
            return `Unable to retrieve stock data for ${symbol} - API limit reached. Please try again later.`;
        } else {
            return `Unable to retrieve stock data for ${symbol}.`;
        }
    } catch (error: any) {
        console.error("Error fetching stock quote:", error);
        return `Error retrieving stock data for ${symbol}: ${error.message}`;
    }
};

// ---------------------------
// NewsAPI Integration: Fetch Company News Headlines
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
    } catch (error: any) {
        console.error("Error fetching news:", error);
        return [];
    }
};

const extractCompanyNameForSentiment = (query: string): string | null => {
    const pattern = /sentiment analysis (?:of|on)\s+([A-Za-z\s]+?)\s+stock/;
    const match = query.match(pattern);
    if (match && match[1]) {
        return match[1].trim();
    }
    return null;
};

const extractCompanyNameForNews = (query: string): string | null => {
    const pattern = /news\s+(?:related\s+to|about|for)\s+([\w\s&]+?)(?:\s+(?:stock|stocks))?$/;
    const match = query.match(pattern);
    if (match && match[1]) {
        return match[1].trim();
    }
    return null;
};

const performSentimentAnalysis = async (company: string): Promise<string> => {
    try {
        const headlines = await fetchCompanyNews(company, 5);
        if (!headlines || headlines.length === 0) {
            return `No news headlines found for ${company} for sentiment analysis.`;
        }
        let prompt = `Analyze the sentiment of the following news headlines about ${company}:\n`;
        headlines.forEach((headline) => {
            prompt += `- ${headline}\n`;
        });
        prompt += `\nProvide a summary sentiment analysis (positive, negative, or neutral) along with reasons.`;
        const analysis = await callGeminiLLM(prompt, "gemini-2.0-flash");
        return analysis;
    } catch (error: any) {
        console.error("Error performing sentiment analysis:", error);
        return `Error performing sentiment analysis: ${error.message}`;
    }
};

const getStockNews = async (company: string): Promise<string> => {
    try {
        const headlines = await fetchCompanyNews(company, 5);
        if (!headlines || headlines.length === 0) {
            return `No news headlines found for ${company}.`;
        }
        let result = `News headlines for ${company}:\n`;
        headlines.forEach((headline) => {
            result += `- ${headline}\n`;
        });
        return result;
    } catch (error: any) {
        console.error("Error fetching news:", error);
        return `Error fetching news for ${company}: ${error.message}`;
    }
};

// ---------------------------
// Analyze Uploaded Image/Graph Functionality
// ---------------------------
const analyzeImage = async (base64Image: string): Promise<string> => {
    try {
        const prompt = `You are a financial analyst with expertise in stock market trends and financial charts. The following image (provided as a base64-encoded string) represents a financial graph—such as an S&P 500 growth chart. Please analyze the chart and provide detailed insights on trends, key performance metrics, and any notable fluctuations related to the market.\nImage (base64): ${base64Image}`;
        const analysis = await callGeminiLLM(prompt, "gemini-2.0-flash");
        return analysis;
    } catch (error: any) {
        console.error("Error processing image:", error);
        return `Error processing image: ${error.message}`;
    }
};

// ---------------------------
// EXPORT THE FUNCTIONS NEEDED BY ChatInterface.tsx
// ---------------------------
export const sendChatMessage = async (message: string): Promise<string> => {
    try {
        const lowerMessage = message.toLowerCase();

        // Branch: Sentiment Analysis
        if (lowerMessage.includes("sentiment analysis")) {
            const company = extractCompanyNameForSentiment(message);
            if (company) {
                return await performSentimentAnalysis(company);
            } else {
                return "Unable to extract company name for sentiment analysis. Please include the company name clearly.";
            }
        }

        // Branch: News Headlines
        if (lowerMessage.includes("news")) {
            const company = extractCompanyNameForNews(message);
            if (company) {
                return await getStockNews(company);
            } else {
                return "Please specify the company name to fetch news.";
            }
        }

        // Branch: Stock Price / Quote
        if (lowerMessage.includes("price") || lowerMessage.includes("stock") || lowerMessage.includes("quote")) {
            const ticker = await extractStockSymbol(message);
            if (ticker) {
                const stockInfo = await getStockQuoteAlphaVantage(ticker);
                const context = retrieveContext(message, 2);
                return `${context}\n${stockInfo}`;
            } else {
                return "I couldn't determine which company's stock price you're looking for. Please specify a company name.";
            }
        }

        // Default: General financial query
        const context = retrieveContext(message, 3);
        const prompt = `You are a helpful financial assistant. Use the following relevant context to answer the user's query.\n\nContext: ${context}\n\nUser query: ${message}`;
        return await callGeminiLLM(prompt);
    } catch (error: any) {
        console.error("Error processing message:", error);
        return `Sorry, I encountered an error while processing your request: ${error.message}`;
    }
};

export const uploadAndAnalyzeImage = async (file: File): Promise<string> => {
    try {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    if (!event.target?.result) {
                        reject("Failed to read file");
                        return;
                    }
                    
                    // Get the base64 string (remove the data URL prefix)
                    const base64String = (event.target.result as string).split(',')[1];
                    const analysis = await analyzeImage(base64String);
                    resolve(analysis);
                } catch (error: any) {
                    console.error("Error analyzing image:", error);
                    reject(error.message || "Error analyzing image");
                }
            };
            
            reader.onerror = () => {
                reject("Error reading file");
            };
            
            reader.readAsDataURL(file);
        });
    } catch (error: any) {
        console.error("Error with image upload:", error);
        return `Error processing uploaded image: ${error.message}`;
    }
};

// Export the handler for Next.js API routes if needed
export default async function handler(req: any, res: any) {
    if (req.method === 'POST') {
        const { query, imageBase64 } = req.body;

        if (imageBase64) {
            try {
                const analysisResult = await analyzeImage(imageBase64);
                res.status(200).json({ result: analysisResult });
            } catch (error: any) {
                res.status(500).json({ error: error.message || 'Error analyzing image' });
            }
            return;
        }

        if (query) {
            try {
                const result = await sendChatMessage(query);
                res.status(200).json({ result });
            } catch (error: any) {
                res.status(500).json({ error: error.message || 'Error processing your request' });
            }
            return;
        }

        res.status(400).json({ error: 'No query or image provided' });
    } else if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.status(200).end();
    } else {
        res.status(405).json({ error: 'Method Not Allowed' });
    }
}

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb', // Adjust as needed for image uploads
        },
    },
};
