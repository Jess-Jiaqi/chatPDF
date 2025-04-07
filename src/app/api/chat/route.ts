import { streamText } from "ai";
import { openai } from '@ai-sdk/openai';

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();
    const stream = await streamText({
      model: openai('gpt-3.5-turbo'),
      messages,
    });
    return stream.toDataStreamResponse();

  } catch (error) {
    console.error("cannot complete chat", error);
    return new Response(
      JSON.stringify({ error: "handling chat request error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
