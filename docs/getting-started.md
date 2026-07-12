---
layout: default
title: Getting Started — SurjyoPath
---

# 🚀 Getting Started with SurjyoPath

Set up your own personal knowledge universe in minutes.

---

## Prerequisites

- **Node.js** 20 or later
- **npm** 10 or later
- A **Supabase** account (optional — mock mode works without it)

## Installation

```bash
# Clone the repository
git clone https://github.com/surjyopath/surjyopath.git
cd surjyopath

# Install dependencies
npm install

# Start the development server
npm run dev
```

Your universe will be waiting at **http://localhost:5173** 🪐

---

## Configuration

### Minimal Setup (No Supabase)

SurjyoPath works **out of the box** with a browser-based mock AI layer. Just run `npm install && npm run dev`.

### Full Setup (With Supabase)

1. Create a project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Create a `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

4. Enable **Email Auth** in your Supabase dashboard:
   - Go to **Authentication → Providers → Email**
   - Make sure it's enabled

### Setting Up the Knock AI Edge Function

The AI engine runs as a Supabase Edge Function. To deploy it:

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy knock-ai
```

Set the required secrets:

```bash
supabase secrets set FIREWORKS_API_KEY=your-fireworks-api-key
```

---

## First Steps

1. **Explore the Galaxy** — The home screen shows your solar system. Hover over planets to discover each module.
2. **Write a Journal Entry** — Click the Journal planet. Write your first thought and let Knock AI analyze it.
3. **Set a Goal** — Navigate to Goals. Type something you want to learn, and Pathway AI will build a curriculum.
4. **Publish Something** — Write a draft, use Polish AI to refine it, and share it with the community.
5. **Connect with Friends** — Find others on their journey and share insights.

---

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build |

---

## Next Steps

- [Explore all features](features.md)
- [Understand the architecture](architecture.md)
- [Dive into the AI engines](ai-engines.md)