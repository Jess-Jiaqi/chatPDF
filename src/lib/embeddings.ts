import { OpenAIApi, Configuration } from "openai-edge";

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(config);

export async function getEmbeddings(text: string) {
  try {
    // For development purposes, you can use fake vectors
    if (process.env.NODE_ENV === "development") {
      console.log("DEV mode - using fake vectors）");
      return Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
    }
    
    const response = await openai.createEmbedding({
      model: "text-embedding-ada-002",
      input: text.replace(/\n/g, " "),
    });
    const result = await response.json();
    
    if (!result.data || !result.data[0] || !result.data[0].embedding) {
      console.log("Unexpected API response structure:", result);
      throw new Error("API response structure is unexpected");
    }
    
    return result.data[0].embedding as number[];
  } catch (error) {
    console.log("error calling openai embedding api", error);
    throw error;
  }
}
