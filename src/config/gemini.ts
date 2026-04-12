import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import env from '../../env.js'

export const geminiModel = new ChatGoogleGenerativeAI({
  model: 'gemini-2.5-flash',
  apiKey: env.GEMINI_API_KEY,
  temperature: 0.7,
})
