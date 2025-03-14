
// News data service
import axios from "axios";
import { API_KEYS } from "./apiKeys";

// Get company news using NewsAPI with improved error handling
export const getCompanyNews = async (company: string): Promise<string> => {
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
