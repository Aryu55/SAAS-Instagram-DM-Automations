import OpenAi from "openai";

export const isUsingOpenRouter = !!process.env.OPENROUTER_API_KEY;

export const openai = isUsingOpenRouter
  ? new OpenAi({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        "HTTP-Referer": "https://localhost:3000",
        "X-Title": "Phaze AI Content Engine",
      },
    })
  : new OpenAi({
      apiKey: process.env.OPEN_AI_KEY || "",
    });

export const getModelName = () => {
  return isUsingOpenRouter ? "deepseek/deepseek-chat" : "gpt-4o-mini";
};

