import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

export async function getEmbeddings(text: string) {
  try {
    const modelName = "sentence-transformers/all-MiniLM-L6-v2";
    const response = await hf.featureExtraction({
      model: modelName,
      inputs: text.replace(/\n/g, " "),
    });
    
    if (!response || !Array.isArray(response)) {
      console.log("Unexpected API response structure:", response);
      throw new Error("API response structure is unexpected");
    }
    
    return response as number[];
  } catch (error) {
    console.log("error calling openai embedding api", error);
    throw error;
  }
}
