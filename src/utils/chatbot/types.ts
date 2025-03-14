
// Common types used across chatbot services

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'bot';
  timestamp: Date;
}
