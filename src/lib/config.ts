export const CONFIG = {
  supabase: {
    url: "https://lywxozzcjncbmwcskdoq.supabase.co",
    anonKey:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5d3hvenpjam5jYm13Y3NrZG9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyNjUzMzAsImV4cCI6MjA5ODg0MTMzMH0.IyKBKLUQhFqXy_xKpNczasb1clqLy25NNRKVbEUtdSw",
  },
  goBackend: {
    url: import.meta.env.VITE_GO_BACKEND_URL || "http://localhost:8080",
  },
  app: {
    name: "SurjyoPath",
    tagline: "The Sun's Way",
    version: "1.0.0",
  },
  knock: {
    rateLimitDelay: 5000, // 5 seconds between manual knocks
    goalBatchInterval: 5 * 60 * 1000, // 5 minutes for goal batch processing (in ms)
    maxThoughtKnocksPerDay: 20,
  },
} as const;