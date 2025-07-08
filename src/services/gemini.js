import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.isInitialized = false;
  }

  initialize(apiKey) {
    if (!apiKey) throw new Error('Google Gemini API key is required');
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    this.isInitialized = true;
  }

  async generateSection(prompt) {
    if (!this.isInitialized || !this.model) throw new Error('Gemini service not initialized.');
    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }
}

export default new GeminiService(); 