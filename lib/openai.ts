import OpenAI from "openai";

// Detect all available provider keys in environment variables
export const isUsingOpenRouter = !!(
  process.env.OPENROUTER_API_KEY ||
  process.env.GEMINI_API_KEY ||
  process.env.OPEN_AI_KEY ||
  process.env.GROQ_API_KEY ||
  process.env.SAMBANOVA_API_KEY
);

// Cooldown state tracking (in-memory per warm function instance)
const cooldowns: Record<string, number> = {};

// Remaining request rate limits metrics tracking
const providerMetrics: Record<
  string,
  { remainingRequests: number; lastChecked: number }
> = {};

// Helper model mapper for different providers
const mapModel = (requestedModel: string, providerName: string): string => {
  if (!requestedModel) return "gemini-1.5-flash";

  // Strip prefixes if necessary
  const baseModel = requestedModel.split("/").pop() || requestedModel;

  if (providerName === "Google AI Studio") {
    // Google AI Studio expects models like gemini-1.5-flash or gemini-2.5-flash
    if (
      baseModel.includes("deepseek") ||
      baseModel.includes("gpt-4") ||
      baseModel.includes("lfm") ||
      baseModel.includes("llama")
    ) {
      return "gemini-1.5-flash";
    }
    return "gemini-1.5-flash";
  }

  if (providerName === "Groq") {
    return "llama-3.3-70b-versatile";
  }

  if (providerName === "SambaNova") {
    return "Meta-Llama-3.1-8B-Instruct";
  }

  if (providerName === "OpenAI") {
    return "gpt-4o-mini";
  }

  if (providerName === "OpenRouter") {
    // OpenRouter handles any requested model format
    return requestedModel;
  }

  return requestedModel;
};

// Failover execution logic
async function failoverChatCompletion(params: any, options?: any) {
  const providers: any[] = [];

  if (process.env.OPENROUTER_API_KEY) {
    providers.push({
      name: "OpenRouter",
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://localhost:3000",
        "X-Title": "Phaze AI Content Engine",
      },
    });
  }

  if (process.env.GEMINI_API_KEY) {
    providers.push({
      name: "Google AI Studio",
      apiKey: process.env.GEMINI_API_KEY,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    });
  }

  if (process.env.GROQ_API_KEY) {
    providers.push({
      name: "Groq",
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });
  }

  if (process.env.SAMBANOVA_API_KEY) {
    providers.push({
      name: "SambaNova",
      apiKey: process.env.SAMBANOVA_API_KEY,
      baseURL: "https://api.sambanova.ai/v1",
    });
  }

  if (process.env.OPEN_AI_KEY) {
    providers.push({
      name: "OpenAI",
      apiKey: process.env.OPEN_AI_KEY,
      baseURL: undefined,
    });
  }

  if (providers.length === 0) {
    throw new Error(
      "No AI provider API keys configured in environment variables (.env)."
    );
  }

  const now = Date.now();

  // Sort providers:
  // 1. Providers whose cooldown has expired (or was never activated) go first
  // 2. Among active providers, sort by remaining requests (descending) to choose the one with most limits left
  // 3. Fall back to priority order in the list (OpenRouter -> Gemini -> Groq -> SambaNova -> OpenAI)
  const sortedProviders = [...providers].sort((a, b) => {
    const cooldownA = cooldowns[a.name] || 0;
    const cooldownB = cooldowns[b.name] || 0;
    const isAExpired = cooldownA < now;
    const isBExpired = cooldownB < now;

    if (isAExpired && !isBExpired) return -1;
    if (!isAExpired && isBExpired) return 1;
    if (!isAExpired && !isBExpired) {
      // Both in cooldown, sort by when cooldown expires (earliest first)
      return cooldownA - cooldownB;
    }

    // Both are active, sort by remaining rate limit requests if known
    const remainingA = providerMetrics[a.name]?.remainingRequests ?? 1000;
    const remainingB = providerMetrics[b.name]?.remainingRequests ?? 1000;
    if (remainingA !== remainingB) {
      return remainingB - remainingA; // Descending
    }

    // Default list priority
    return providers.indexOf(a) - providers.indexOf(b);
  });

  let lastError: any = null;

  for (const provider of sortedProviders) {
    const modelToUse = mapModel(params.model, provider.name);
    console.log(
      `[AI ROUTER] Routing request to ${provider.name} using model ${modelToUse}...`
    );

    try {
      const client = new OpenAI({
        apiKey: provider.apiKey,
        baseURL: provider.baseURL,
        defaultHeaders: (provider as any).defaultHeaders,
        timeout: 20000, // 20s timeout per attempt
      });

      const requestParams = {
        ...params,
        model: modelToUse,
      };

      const completion = await client.chat.completions.create(
        requestParams,
        options
      );

      // Parse remaining rate limits if headers are returned
      const headers = (completion as any)._response?.headers;
      if (headers) {
        const remainingRequests =
          headers.get("x-ratelimit-remaining-requests") ||
          headers.get("ratelimit-remaining");
        if (remainingRequests) {
          providerMetrics[provider.name] = {
            remainingRequests: parseInt(remainingRequests, 10),
            lastChecked: Date.now(),
          };
        }
      }

      // Success, reset cooldown
      cooldowns[provider.name] = 0;
      console.log(`[AI ROUTER] Request succeeded with provider: ${provider.name}`);
      return completion;
    } catch (err: any) {
      console.error(
        `[AI ROUTER] Error with provider ${provider.name}:`,
        err.message || err
      );

      const status = err.status || (err.response && err.response.status);
      const isRateLimit =
        status === 429 ||
        err.message?.includes("rate limit") ||
        err.message?.includes("429");
      const isQuota =
        status === 403 ||
        err.message?.includes("quota") ||
        err.message?.includes("insufficient_quota");

      if (isRateLimit || isQuota) {
        // Cooldown for 60 seconds
        cooldowns[provider.name] = Date.now() + 60000;
        console.warn(
          `[AI ROUTER] Provider ${provider.name} rate limits reached. Cooling down for 60s.`
        );
      } else {
        // General error (e.g., config error), cooldown for 10s
        cooldowns[provider.name] = Date.now() + 10000;
      }
      lastError = err;
    }
  }

  throw new Error(
    `All configured AI providers failed. Last error: ${lastError?.message || lastError}`
  );
}

// Default standard client instance configured for default settings
const defaultClient = new OpenAI({
  apiKey:
    process.env.OPENROUTER_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.OPEN_AI_KEY ||
    "dummy",
  baseURL: process.env.OPENROUTER_API_KEY
    ? "https://openrouter.ai/api/v1"
    : process.env.GEMINI_API_KEY
      ? "https://generativelanguage.googleapis.com/v1beta/openai/"
      : undefined,
});

// Export client wrapper proxy mimicking standard OpenAI SDK instance
export const openai = new Proxy(defaultClient, {
  get(target, prop, receiver) {
    if (prop === "chat") {
      return {
        completions: {
          create: async (params: any, options?: any) => {
            return await failoverChatCompletion(params, options);
          },
        },
      };
    }
    return Reflect.get(target, prop, receiver);
  },
}) as unknown as OpenAI;

export const getModelName = () => {
  if (process.env.OPENROUTER_API_KEY) {
    return "deepseek/deepseek-chat";
  }
  if (process.env.GEMINI_API_KEY) {
    return "gemini-1.5-flash";
  }
  return "gpt-4o-mini";
};
