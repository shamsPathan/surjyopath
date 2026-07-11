export const CONFIG = {
  supabase: {
    url: "https://lywxozzcjncbmwcskdoq.supabase.co",
    anonKey:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5d3hvenpjam5jYm13Y3NrZG9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyNjUzMzAsImV4cCI6MjA5ODg0MTMzMH0.IyKBKLUQhFqXy_xKpNczasb1clqLy25NNRKVbEUtdSw",
  },
  goBackend: {
    url: import.meta.env.VITE_GO_BACKEND_URL || "http://localhost:8080",
  },
  fireworks: {
    apiKey: import.meta.env.VITE_FIREWORKS_API_KEY || "",
    baseUrl: "https://api.fireworks.ai/inference/v1/chat/completions",
    model: "accounts/fireworks/models/llama-v3p3-70b-instruct",
  },
  app: {
    name: "SurjyoPath",
    tagline: "The Sun's Way",
    version: "1.0.0",
  },
  knock: {
    rateLimitDelay: 5000, // 5 seconds between manual knocks
    goalBatchInterval: 12 * 60 * 60 * 1000, // 12 hours for goal batch processing (in ms)
    maxThoughtKnocksPerDay: 20,
  },
} as const;