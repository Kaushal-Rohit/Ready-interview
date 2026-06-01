import Groq from "groq-sdk";

const groqClient = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function chatCompletion(
  messages: Groq.Chat.ChatCompletionMessageParam[],
  options?: {
    temperature?: number;
    max_tokens?: number;
    response_format?: { type: "json_object" } | { type: "text" };
  }
) {
  const response = await groqClient.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.max_tokens ?? 2048,
    ...(options?.response_format && { response_format: options.response_format }),
  });

  return response.choices[0]?.message?.content ?? "";
}

export default groqClient;
