import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY ?? "";

export const openai = new OpenAI({ apiKey });

export function isOpenAIConfigured(): boolean {
  return apiKey.length > 0 && !apiKey.includes("placeholder");
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}
