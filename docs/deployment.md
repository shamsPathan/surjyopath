---
layout: default
title: Deployment — SurjyoPath
---

# 🚢 Deployment Guide

Deploy SurjyoPath to production with Supabase.

---

## Prerequisites

- A [Supabase](https://supabase.com) account
- [Fireworks AI](https://fireworks.ai) API key (for AI features)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (for edge function deployment)

---

## 1. Deploy the Frontend

Build the static assets:

```bash
npm run build
```

The output will be in `dist/`. Deploy this folder to any static hosting:

| Platform | Instructions |
|----------|-------------|
| **Vercel** | Connect your repo, set build command to `npm run build`, output dir to `dist` |
| **Netlify** | Connect your repo, set build command to `npm run build`, publish dir to `dist` |
| **Cloudflare Pages** | Connect your repo, set build command to `npm run build`, output dir to `dist` |
| **GitHub Pages** | Deploy the `dist/` folder to the `gh-pages` branch |

### Environment Variables

Set these in your hosting platform:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `VITE_GO_BACKEND_URL` | (Optional) Go backend URL |

---

## 2. Set Up Supabase

### Authentication

1. Go to **Authentication → Providers → Email**
2. Enable email/password sign-in
3. Configure Site URL to your production domain

### Database

The database schema includes tables for:
- Users (managed by Supabase Auth)
- Thoughts (journal entries)
- Goals and courses
- Library items
- Publications and comments
- Friends and connections

---

## 3. Deploy the Edge Function

The AI engine runs as a Supabase Edge Function:

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy knock-ai --no-verify-jwt
```

### Set Secrets

```bash
supabase secrets set FIREWORKS_API_KEY=your-fireworks-api-key
```

---

## 4. Configure Auth Redirect URLs

For the NativelyAI preview environment, ensure these redirect URL patterns are set in your Supabase Auth configuration:

- `https://*.nativelyai.app/**`
- `https://**.webcontainer-api.io/**`

---

## 5. Verify Deployment

1. Visit your production URL
2. Sign up for a new account
3. Write a journal entry and try the Knock AI
4. Create a goal and verify Pathway generates a course
5. Test the full flow end-to-end

---

## 🔧 Troubleshooting

### AI Features Not Working

- Check that `FIREWORKS_API_KEY` secret is set
- Verify the edge function is deployed: `supabase functions list`
- Check edge function logs: `supabase functions logs knock-ai`
- The app falls back to mock AI if the edge function is unavailable

### Authentication Issues

- Verify Site URL in Supabase Auth settings
- Check redirect URL patterns include your domain
- Ensure email/password provider is enabled

### Build Errors

- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Ensure Node.js 20+ is being used
- Check for TypeScript errors: `npx tsc --noEmit`

---

- [Back to Documentation Home](index.md)