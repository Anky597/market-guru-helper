
// Entity extraction utilities

// Company name to ticker conversion (simple mapping for common companies)
export const companyToTickerMap: Record<string, string> = {
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

// Extract company name or ticker from query
export const extractCompanyName = (query: string): string | null => {
  // Combined patterns with improved matching
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

// Convert company name to ticker symbol
export const getTickerSymbol = (company: string): string => {
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
