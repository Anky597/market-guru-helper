
// Stock data service
import axios from "axios";
import { toast } from "sonner";
import { API_KEYS } from "./apiKeys";
import { getTickerSymbol } from "./entityExtraction";

// Alpha Vantage: Fetch Real-Time Stock Data with improved error handling
export const getStockQuote = async (company: string): Promise<string> => {
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
