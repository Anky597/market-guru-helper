// Vector similarity search functionality

export interface Document {
  text: string;
  metadata: Record<string, any>;
}

// Financial context documents (vector database simulation)
export const documents: Document[] = [
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
  // Additional entries preserved from original implementation
];

// Vector similarity search simulation
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

// Simulate vector database retrieval
export const retrieveContext = (query: string): string => {
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
