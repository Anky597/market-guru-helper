import { toast } from "sonner";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ---------------------------
// API keys – in production these should be stored securely as environment variables
// ---------------------------
const API_KEYS = {
    gemini: import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyB_u-Y8O422aIKG5ga_Ae7bN8q-6YKnx8E", // Replace with your actual key in environment variables
    alphaVantage: import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || "4MK98IQRF8RTSYQ3", // Replace with your actual key
    newsApi: import.meta.env.VITE_NEWS_API_KEY || "1a0c8951c92b4906b50f9dc0b1186174", // Replace with your actual key
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
        id: "doc1",
        text: "The S&P 500 is a stock market index tracking the stock performance of 500 large companies listed on stock exchanges in the United States. It is one of the most commonly followed equity indices, and many consider it to be one of the best representations of the U.S. stock market.",
        metadata: {
            category: "market_indices",
            source: "financial_encyclopedia",
            relevance: "high"
        }
    },
    {
        id: "doc2",
        text: "A bull market is a financial market of a group of securities in which prices are rising or are expected to rise. The term 'bull market' is most often used to refer to the stock market but can be applied to anything that is traded, such as bonds, real estate, currencies, and commodities.",
        metadata: {
            category: "market_terminology",
            source: "financial_encyclopedia",
            relevance: "high"
        }
    },
    {
        id: "doc3",
        text: "A bear market is a general decline in the stock market over a period of time. It includes a transition from high investor optimism to widespread investor fear and pessimism. One commonly accepted definition of a bear market is a situation in which stock prices fall 20% or more from recent highs.",
        metadata: {
            category: "market_terminology",
            source: "financial_encyclopedia",
            relevance: "high"
        }
    },
    {
        id: "doc4",
        text: "Market capitalization, commonly called market cap, is the market value of a publicly traded company's outstanding shares. Market capitalization is equal to the share price multiplied by the number of shares outstanding.",
        metadata: {
            category: "fundamental_analysis",
            source: "financial_encyclopedia",
            relevance: "medium"
        }
    },
    {
        id: "doc5",
        text: "The price-to-earnings ratio (P/E ratio) is the ratio for valuing a company that measures its current share price relative to its per-share earnings. The price-to-earnings ratio is also sometimes known as the price multiple or the earnings multiple.",
        metadata: {
            category: "fundamental_analysis",
            source: "financial_encyclopedia",
            relevance: "medium"
        }
    },
    {
        id: "doc6",
        text: "Dividend yield is a financial ratio that shows how much a company pays out in dividends each year relative to its stock price. Dividend yield is represented as a percentage and can be calculated by dividing the dollar value of dividends paid in a given year per share of stock by the dollar value of one share of stock.",
        metadata: {
            category: "fundamental_analysis",
            source: "financial_encyclopedia",
            relevance: "medium"
        }
    },
    {
        id: "doc7",
        text: "Technical analysis is a trading discipline employed to evaluate investments and identify trading opportunities by analyzing statistical trends gathered from trading activity, such as price movement and volume.",
        metadata: {
            category: "technical_analysis",
            source: "financial_encyclopedia",
            relevance: "medium"
        }
    },
    {
        id: "doc8",
        text: "The Relative Strength Index (RSI) is a momentum indicator that measures the magnitude of recent price changes to evaluate overbought or oversold conditions in the price of a stock or other asset. The RSI is displayed as an oscillator (a line graph that moves between two extremes) and can have a reading from 0 to 100.",
        metadata: {
            category: "technical_analysis",
            source: "financial_encyclopedia",
            relevance: "medium"
        }
    },
    {
        id: "doc9",
        text: "Moving averages are a simple technical analysis tool that smooth out price data by creating a constantly updated average price. The average is taken over a specific period of time, like 10 days, 20 minutes, 30 weeks, or any time period the trader chooses.",
        metadata: {
            category: "technical_analysis",
            source: "financial_encyclopedia",
            relevance: "medium"
        }
    },
    {
        id: "doc10",
        text: "Diversification is a risk management strategy that mixes a wide variety of investments within a portfolio. The rationale behind this technique is that a portfolio constructed of different kinds of assets will, on average, yield higher long-term returns and lower the risk of any individual holding or security.",
        metadata: {
            category: "investment_strategy",
            source: "financial_encyclopedia",
            relevance: "high"
        }
    },
    {
        id: "doc11",
        text: "Dollar-cost averaging (DCA) is an investment strategy in which an investor divides up the total amount to be invested across periodic purchases of a target asset in an effort to reduce the impact of volatility on the overall purchase. The purchases occur regardless of the asset's price and at regular intervals.",
        metadata: {
            category: "investment_strategy",
            source: "financial_encyclopedia",
            relevance: "high"
        }
    },
    {
        id: "doc12",
        text: "Value investing is an investment strategy that involves picking stocks that appear to be trading for less than their intrinsic or book value. Value investors actively ferret out stocks they think the stock market is underestimating.",
        metadata: {
            category: "investment_strategy",
            source: "financial_encyclopedia",
            relevance: "high"
        }
    },
    {
        id: "doc13",
        text: "Growth investing is a stock-buying strategy that aims to profit from firms that grow at above-average rates compared to their industry or the market. Growth investors typically look for companies with high growth potential, strong earnings growth, and strong momentum.",
        metadata: {
            category: "investment_strategy",
            source: "financial_encyclopedia",
            relevance: "high"
        }
    },
    {
        id: "doc14",
        text: "An Exchange-Traded Fund (ETF) is a type of investment fund and exchange-traded product, i.e., they are traded on stock exchanges. ETFs are similar in many ways to mutual funds, except that ETFs are bought and sold throughout the day on stock exchanges.",
        metadata: {
            category: "investment_vehicles",
            source: "financial_encyclopedia",
            relevance: "high"
        }
    },
    {
        id: "doc15",
        text: "A mutual fund is a type of financial vehicle made up of a pool of money collected from many investors to invest in securities like stocks, bonds, money market instruments, and other assets. Mutual funds are operated by professional money managers, who allocate the fund's assets and attempt to produce capital gains or income for the fund's investors.",
        metadata: {
            category: "investment_vehicles",
            source: "financial_encyclopedia",
            relevance: "high"
        }
    },
    {
        id: "doc16",
        text: "A bond is a fixed-income instrument that represents a loan made by an investor to a borrower (typically corporate or governmental). A bond could be thought of as an I.O.U. between the lender and borrower that includes the details of the loan and its payments.",
        metadata: {
            category: "investment_vehicles",
            source: "financial_encyclopedia",
            relevance: "high"
        }
    },
    {
        id: "doc17",
        text: "A stock (also known as equity) is a security that represents the ownership of a fraction of a corporation. This entitles the owner of the stock to a proportion of the corporation's assets and profits equal to how much stock they own. Units of stock are called 'shares.'",
        metadata: {
            category: "investment_vehicles",
            source: "financial_encyclopedia",
            relevance: "high"
        }
    },
    {
        id: "doc18",
        text: "Inflation is the rate at which the general level of prices for goods and services is rising and, consequently, the purchasing power of currency is falling. Central banks attempt to limit inflation — and avoid deflation — in order to keep the economy running smoothly.",
        metadata: {
            category: "economic_indicators",
            source: "financial_encyclopedia",
            relevance: "high"
        }
    },
    {
        id: "doc19",
        text: "Gross Domestic Product (GDP) is the total monetary or market value of all the finished goods and services produced within a country's borders in a specific time period. As a broad measure of overall domestic production, it functions as a comprehensive scorecard of a given country's economic health.",
        metadata: {
            category: "economic_indicators",
            source: "financial_encyclopedia",
            relevance: "high"
        }
    },
    {
        id: "doc20",
        text: "The unemployment rate represents the number of unemployed as a percentage of the labor force. Labor force data are restricted to people 16 years of age and older, who currently reside in 1 of the 50 states or the District of Columbia, who do not reside in institutions (e.g., penal and mental facilities, homes for the aged), and who are not on active duty in the Armed Forces.",
        metadata: {
            category: "economic_indicators",
            source: "financial_encyclopedia",
            relevance: "high"
        }
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
// Export client-side service functions
// ---------------------------
export const sendChatMessage = async (query: string): Promise<string> => {
    try {
        const lowerQuery = query.toLowerCase();

        if (lowerQuery.includes("sentiment analysis")) {
            const company = extractCompanyNameForSentiment(query);
            if (company) {
                return await performSentimentAnalysis(company);
            } else {
                return "Unable to extract company name for sentiment analysis. Please include the company name clearly.";
            }
        } else if (lowerQuery.includes("news")) {
            const company = extractCompanyNameForNews(query);
            if (company) {
                return await getStockNews(company);
            } else {
                return "Please specify the company name to fetch news.";
            }
        } else if (lowerQuery.includes("price") || lowerQuery.includes("stock") || lowerQuery.includes("quote")) {
            const ticker = await extractStockSymbol(query);
            if (ticker) {
                const stockInfo = await getStockQuoteAlphaVantage(ticker);
                const context = retrieveContext(query, 2);
                return `${context}\n${stockInfo}`;
            } else {
                return "I couldn't determine which company's stock price you're looking for. Please specify a company name.";
            }
        } else {
            const context = retrieveContext(query, 3);
            const prompt = `You are a helpful financial assistant. Use the following relevant context to answer the user's query.\n\nContext: ${context}\n\nUser query: ${query}`;
            return await callGeminiLLM(prompt);
        }
    } catch (error: any) {
        console.error("Chatbot error:", error);
        return `Error processing your request: ${error.message}`;
    }
};

export const uploadAndAnalyzeImage = async (imageBase64: string): Promise<string> => {
    try {
        return await analyzeImage(imageBase64);
    } catch (error: any) {
        console.error("Error analyzing image:", error);
        return `Error analyzing image: ${error.message}`;
    }
};

// Keep a default export for backward compatibility
export default {
    sendChatMessage,
    uploadAndAnalyzeImage
};
