import { Pinecone } from '@pinecone-database/pinecone'

/**
 * Shared Pinecone client singleton
 */
export const getPineconeClient = () => {
  return new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
  })
}

export const PINECONE_INDEX_NAME = 'reframe-chatbot'
// Correct model name for Pinecone's inference if that was the intent. 
// "llama-text-embed-v2" is a known Pinecone inference API model. 
export const EMISSION_MODEL = 'llama-text-embed-v2' 
