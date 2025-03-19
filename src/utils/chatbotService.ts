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

// Alpha Vantage NEWS_SENTIMENT response types
interface AlphaVantageFeed {
    title: string;
    url: string;
    time_published: string;
    authors: string[];
    summary: string;
    banner_image: string;
    source: string;
    category_within_source: string;
    source_domain: string;
    topics: {
        topic: string;
        relevance_score: string;
    }[];
    overall_sentiment_score: number;
    overall_sentiment_label: string;
    ticker_sentiment: {
        ticker: string;
        relevance_score: string;
        ticker_sentiment_score: string;
        ticker_sentiment_label: string;
    }[];
}

interface AlphaVantageSentimentResponse {
    items: string;
    sentiment_score_definition: string;
    relevance_score_definition: string;
    feed: AlphaVantageFeed[];
    information?: string; // Add optional information property for API limit reached messages
}

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
    },
    {
        "text": "Tesla (TSLA) stock has faced significant challenges in Q1 2025, with deliveries tracking approximately 31,000 units lower than Q1 2024. Wall Street analysts have revised delivery estimates downward to around 356,000 vehicles.",
        "metadata": { "company": "Tesla", "metric": "deliveries", "sentiment": "negative", "date": "2025-03-14" }
    },
    {
        "text": "Vector databases are transforming financial analysis by enabling efficient processing of unstructured data for fraud detection, risk analysis, and pattern recognition in market trends.",
        "metadata": { "technology": "vector databases", "industry": "finance", "application": "risk analysis", "sentiment": "positive", "date": "2025-03-01" }
    },
    {
        "text": "Bitcoin has experienced increased institutional adoption in 2025, with several major banks now offering cryptocurrency custody services to their wealth management clients.",
        "metadata": { "asset": "Bitcoin", "metric": "institutional adoption", "sentiment": "positive", "date": "2025-04-02" }
    },
    {
        "text": "The Federal Reserve has maintained its cautious approach to interest rates, signaling potential cuts later in 2025 if inflation continues to moderate toward the 2% target.",
        "metadata": { "institution": "Federal Reserve", "metric": "interest rates", "sentiment": "neutral", "date": "2025-03-25" }
    },
    {
        "text": "ESG-focused investment funds have seen record inflows in early 2025, reflecting growing investor demand for sustainability-oriented financial products.",
        "metadata": { "investment_strategy": "ESG", "metric": "fund inflows", "sentiment": "positive", "date": "2025-04-01" }
    },
    {
        "text": "Commercial real estate continues to face headwinds in 2025, with office vacancies remaining elevated as companies maintain flexible work arrangements post-pandemic.",
        "metadata": { "asset": "commercial real estate", "metric": "vacancies", "sentiment": "negative", "date": "2025-03-20" }
    },
    {
        "text": "Small-cap stocks have outperformed larger indices in Q1 2025, suggesting investors are finding value in smaller companies amid high valuations in tech giants.",
        "metadata": { "asset_class": "small-cap stocks", "metric": "performance", "sentiment": "positive", "date": "2025-04-03" }
    },
    {
        "text": "Venture capital investments in AI startups have reached $45 billion in Q1 2025, representing a 30% increase year-over-year as the technology's commercial applications expand.",
        "metadata": { "sector": "artificial intelligence", "metric": "venture capital", "sentiment": "positive", "date": "2025-04-10" }
    },
    {
        "text": "Global supply chain disruptions have eased in early 2025, though regional conflicts continue to create bottlenecks in certain industries and trade routes.",
        "metadata": { "economic_factor": "supply chain", "metric": "disruptions", "sentiment": "mixed", "date": "2025-03-28" }
    },
    {
        "text": "Financial advisors are increasingly recommending dynamic withdrawal strategies for retirement planning, moving away from the traditional 4% rule due to changing market conditions.",
        "metadata": { "financial_planning": "retirement", "concept": "withdrawal strategies", "sentiment": "neutral", "date": "2025-02-15" }
    },
    {
        "text": "Private equity firms have accumulated record levels of dry powder in 2025, with over $2.3 trillion available for investments as they wait for more favorable valuation environments.",
        "metadata": { "investment_type": "private equity", "metric": "dry powder", "sentiment": "neutral", "date": "2025-03-15" }
    },
    {
        "text": "Lithium prices have stabilized after a volatile 2024, as new mining capacity comes online to meet the growing demand from electric vehicle manufacturers.",
        "metadata": { "commodity": "lithium", "metric": "price", "sentiment": "positive", "date": "2025-04-05" }
    },
    {
        "text": "Embedded finance solutions are gaining traction across industries, with non-financial companies increasingly integrating payment and lending services into their customer experiences.",
        "metadata": { "industry": "fintech", "innovation": "embedded finance", "sentiment": "positive", "date": "2025-03-22" }
    },
    {
        "text": "Dividend-yielding stocks have seen renewed interest in Q1 2025 as investors seek income amid persistent inflation and relatively high interest rates.",
        "metadata": { "investment_strategy": "dividend investing", "metric": "investor interest", "sentiment": "positive", "date": "2025-03-31" }
    },
    {
        "text": "The VIX index, a key measure of market volatility, has averaged 18 points in Q1 2025, indicating relatively calm market conditions despite ongoing economic uncertainties.",
        "metadata": { "indicator": "VIX", "metric": "volatility", "sentiment": "positive", "date": "2025-04-01" }
    },
    {
        "text": "New trade agreements between ASEAN nations and the European Union are expected to boost economic activity in both regions, with implementation planned for late 2025.",
        "metadata": { "economic_policy": "trade agreements", "regions": ["ASEAN", "European Union"], "sentiment": "positive", "date": "2025-03-18" }
    },
    {
        "text": "Q1 2025 earnings season has begun with mixed results, as 65% of S&P 500 companies reporting so far have exceeded analyst expectations despite challenging economic conditions.",
        "metadata": { "financial_reporting": "earnings", "index": "S&P 500", "sentiment": "mixed", "date": "2025-04-14" }
    },
    {
        "text": "Art and collectibles have shown strong performance as alternative investments in early 2025, with auction records broken across several categories as investors seek diversification.",
        "metadata": { "investment_type": "alternative", "asset": "art and collectibles", "sentiment": "positive", "date": "2025-03-10" }
    },
    {
        "text": "New AI-powered risk management tools are allowing financial institutions to better predict and mitigate potential market disruptions through enhanced scenario modeling.",
        "metadata": { "financial_practice": "risk management", "technology": "AI", "sentiment": "positive", "date": "2025-02-28" }
    },
    {
        "text": "Regional banks have shown improved performance in Q1 2025 after implementing cost-cutting measures and digital transformation initiatives to enhance operational efficiency.",
        "metadata": { "industry": "banking", "segment": "regional banks", "metric": "performance", "sentiment": "positive", "date": "2025-04-08" }
    },
    {
        "text": "Microsoft (MSFT) has increased its dividend by 12% for 2025, reflecting strong cash flow generation and commitment to shareholder returns.",
        "metadata": { "company": "Microsoft", "metric": "dividend", "sentiment": "positive", "date": "2025-03-19" }
    },
    {
        "text": "Oil prices have fluctuated between $70-$85 per barrel in Q1 2025 as OPEC+ production adjustments attempt to balance global supply and demand dynamics.",
        "metadata": { "commodity": "oil", "metric": "price", "sentiment": "neutral", "date": "2025-04-05" }
    },
    {
        "text": "The healthcare sector has underperformed broader market indices in early 2025 amid concerns about potential regulatory changes affecting drug pricing.",
        "metadata": { "sector": "healthcare", "metric": "performance", "sentiment": "negative", "date": "2025-03-29" }
    },
    {
        "text": "Corporate bond yields have declined by 25 basis points on average during Q1 2025, reflecting improved credit conditions and strong investor demand for fixed income.",
        "metadata": { "asset": "corporate bonds", "metric": "yields", "sentiment": "positive", "date": "2025-04-01" }
    },
    {
        "text": "The Japanese yen has strengthened against major currencies following the Bank of Japan's decision to gradually normalize its monetary policy stance.",
        "metadata": { "currency": "Japanese yen", "metric": "exchange rate", "sentiment": "positive", "date": "2025-03-26" }
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
// Alpha Vantage - Fetch Company News Headlines (Replacing NewsAPI)
// ---------------------------
const fetchCompanyNewsAlphaVantage = async (company: string, count: number = 5): Promise<string[]> => {
    try {
        // First convert company name to ticker
        const ticker = await convertCompanyToTicker(company);
        if (!ticker) {
            return [];
        }

        const response = await axios.get("https://www.alphavantage.co/query", {
            params: {
                function: "NEWS_SENTIMENT",
                tickers: ticker,
                limit: count,
                apikey: API_KEYS.alphaVantage,
            },
            timeout: 10000,
        });
        
        const data = response.data as AlphaVantageSentimentResponse;
        
        if (data.feed && data.feed.length > 0) {
            // Extract headlines from feed
            return data.feed.slice(0, count).map(article => article.title);
        } else if (data.information) {
            console.error("Alpha Vantage API limit reached:", data.information);
            return [];
        } else {
            return [];
        }
    } catch (error: any) {
        console.error("Error fetching news from Alpha Vantage:", error);
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
    // Updated pattern to better match news queries
    const pattern = /news\s+(?:about|for|related\s+to)?\s+([A-Za-z\s&]+?)(?:\s+(?:stock|stocks))?$/i;
    const match = query.match(pattern);
    if (match && match[1]) {
        return match[1].trim();
    }
    return null;
};

// ---------------------------
// Alpha Vantage: Fetch News Sentiment Data
// ---------------------------
const getNewsSentimentAlphaVantage = async (ticker: string): Promise<string> => {
    try {
        const response = await axios.get("https://www.alphavantage.co/query", {
            params: {
                function: "NEWS_SENTIMENT",
                tickers: ticker,
                limit: 10,
                apikey: API_KEYS.alphaVantage,
            },
            timeout: 10000,
        });
        
        const data = response.data as AlphaVantageSentimentResponse;
        
        if (data.feed && data.feed.length > 0) {
            // Extract the sentiment data and format
            let overallSentiment = 0;
            let sentimentCounts = {
                positive: 0,
                neutral: 0,
                negative: 0
            };
            
            const relevantArticles = data.feed.slice(0, 5); // Limit to 5 most recent articles
            
            // Calculate overall sentiment from articles and ticker-specific sentiment
            relevantArticles.forEach(article => {
                const tickerSentiments = article.ticker_sentiment.filter(ts => 
                    ts.ticker.toUpperCase() === ticker.toUpperCase()
                );
                
                if (tickerSentiments.length > 0) {
                    const score = parseFloat(tickerSentiments[0].ticker_sentiment_score);
                    overallSentiment += score;
                    
                    // Count sentiment labels
                    const label = tickerSentiments[0].ticker_sentiment_label.toLowerCase();
                    if (label.includes('positive')) {
                        sentimentCounts.positive++;
                    } else if (label.includes('negative')) {
                        sentimentCounts.negative++;
                    } else {
                        sentimentCounts.neutral++;
                    }
                }
            });
            
            // Calculate average sentiment
            const avgSentiment = overallSentiment / relevantArticles.length;
            
            // Determine overall sentiment label
            let sentimentLabel = "neutral";
            if (avgSentiment > 0.25) sentimentLabel = "bullish";
            else if (avgSentiment < -0.25) sentimentLabel = "bearish";
            
            // Format the response
            let result = `## Sentiment Analysis for ${ticker}\n\n`;
            result += `Overall Market Sentiment: **${sentimentLabel.toUpperCase()}**\n\n`;
            result += `Based on analysis of ${relevantArticles.length} recent news articles:\n`;
            result += `- Positive mentions: ${sentimentCounts.positive}\n`;
            result += `- Neutral mentions: ${sentimentCounts.neutral}\n`;
            result += `- Negative mentions: ${sentimentCounts.negative}\n\n`;
            
            // Add recent headlines
            result += `### Recent Headlines:\n`;
            relevantArticles.forEach(article => {
                const tickerSentiment = article.ticker_sentiment.find(ts => 
                    ts.ticker.toUpperCase() === ticker.toUpperCase()
                );
                
                const sentimentEmoji = tickerSentiment ? 
                    (tickerSentiment.ticker_sentiment_label.includes('Bullish') ? '📈' : 
                     tickerSentiment.ticker_sentiment_label.includes('Bearish') ? '📉' : '➖') : '➖';
                
                result += `- ${sentimentEmoji} **${article.title}**\n`;
                result += `  _${new Date(article.time_published).toLocaleDateString()}_\n`;
            });
            
            return result;
        } else if (data.information) {
            console.error("Alpha Vantage API limit reached:", data.information);
            return `Unable to retrieve sentiment data for ${ticker} - API limit reached. Please try again later.`;
        } else {
            return `No sentiment data found for ${ticker}.`;
        }
    } catch (error: any) {
        console.error("Error fetching news sentiment:", error);
        return `Error retrieving sentiment data for ${ticker}: ${error.message}`;
    }
};

// ---------------------------
// Perform Sentiment Analysis
// ---------------------------
const performSentimentAnalysis = async (company: string): Promise<string> => {
    try {
        // First convert company name to ticker
        const ticker = await convertCompanyToTicker(company);
        if (!ticker) {
            return `Unable to find ticker symbol for ${company}. Please try another company name.`;
        }
        
        // Get sentiment analysis from Alpha Vantage
        return await getNewsSentimentAlphaVantage(ticker);
    } catch (error: any) {
        console.error("Error performing sentiment analysis:", error);
        return `Error performing sentiment analysis: ${error.message}`;
    }
};

// ---------------------------
// Get Stock News (Updated to use Alpha Vantage)
// ---------------------------
const getStockNews = async (company: string): Promise<string> => {
    try {
        const headlines = await fetchCompanyNewsAlphaVantage(company, 5);
        if (!headlines || headlines.length === 0) {
            return `No news headlines found for ${company}. Alpha Vantage may have limited data for this company or the API limit has been reached.`;
        }
        let result = `## News headlines for ${company}:\n\n`;
        headlines.forEach((headline, index) => {
            result += `${index + 1}. ${headline}\n`;
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
// Helper function to convert File to base64
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
};

// Function to analyze an uploaded image using Gemini's vision capability
export const uploadAndAnalyzeImage = async (file: File): Promise<string> => {
    try {
        // Convert the image to base64
        const base64Image = await fileToBase64(file);
        
        // Create prompt for image analysis
        const imageAnalysisPrompt = `
        Analyze this financial chart or image. 
        - If it's a chart: describe the trend, key patterns, potential support/resistance levels if visible.
        - If it's a financial document: summarize the key financial information.
        - If it's something else: provide a brief description and any financial relevance.
        
        Keep your analysis focused on finance-related insights.
        `;
        
        // Call Gemini with the image
        const modelInstance = genAI.getGenerativeModel({ model: "gemini-2.0-pro" });
        
        // Prepare image content
        const imageContent = {
            inlineData: {
                data: base64Image.split(",")[1], // Remove the data URL prefix
                mimeType: file.type
            }
        };
        
        // Call Gemini with the image and prompt
        const result = await modelInstance.generateContent([imageAnalysisPrompt, imageContent]);
        const response = await result.response;
        return response.text();
    } catch (error: any) {
        console.error("Error analyzing image:", error);
        return `I couldn't analyze the image: ${error.message}. Please try uploading a different image.`;
    }
};

// Main chat function to process user messages
export const sendChatMessage = async (message: string): Promise<string> => {
    try {
        // Extract potential company name from query for stock price
        const stockSymbol = await extractStockSymbol(message.toLowerCase());
        if (stockSymbol) {
            return await getStockQuoteAlphaVantage(stockSymbol);
        }

        // Check if request is for sentiment analysis
        const companyForSentiment = extractCompanyNameForSentiment(message.toLowerCase());
        if (companyForSentiment) {
            return await performSentimentAnalysis(companyForSentiment);
        }
        
        // Check if request is for news
        const companyForNews = extractCompanyNameForNews(message.toLowerCase());
        if (companyForNews) {
            return await getStockNews(companyForNews);
        }

        // Get relevant context for the query
        const context = retrieveContext(message);
        
        // Construct the prompt with context
        const prompt = `
        You are a helpful financial assistant. Answer the following query based on the context and your knowledge.
        
        CONTEXT:
        ${context}
        
        USER QUERY:
        ${message}
        
        If the query is about a specific stock, market data, or financial term that might be in the context, focus on those details.
        If you're unsure or the question is outside the scope of a financial assistant, politely say so.
        Keep your responses concise and focused on financial topics.
        `;

        // Call the LLM
        return await callGeminiLLM(prompt);
    } catch (error: any) {
        console.error("Error processing message:", error);
        return `I encountered an error processing your request: ${error.message}. Please try again.`;
    }
};
