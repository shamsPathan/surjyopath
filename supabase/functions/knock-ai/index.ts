/**
 * Knock AI — Edge Function
 *
 * Analyses thoughts and processes goals using Fireworks AI (or mock mode).
 * Includes a Goal Pattern Knowledge Base — caches course structures by
 * normalized title + direction so repeated goals skip the AI call.
 *
 * POST /knock-ai
 * Body: { type: "thought" | "goal" | "polish", content: string, title?: string, direction?: string, apiKey?: string }
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const FIREWORKS_URL = "https://api.fireworks.ai/inference/v1/chat/completions";
const MODEL = "accounts/fireworks/models/minimax-m2p7";

/* ─── CORS headers ─── */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/* ─── Supabase client (for pattern DB access) ─── */
function getSupabaseAdmin() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required");
  return createClient(url, key);
}

/* ─── Request types ─── */

interface KnockRequest {
  type: "thought" | "goal" | "polish";
  content: string;
  title?: string;
  direction?: string;
  apiKey?: string;
}

/* ─── Response types ─── */

interface BookSuggestion {
  book: string;
  reason: string;
}

interface ThoughtAnalysis {
  summary: string;
  wasRight: boolean | null;
  publishEligibility: "low" | "medium" | "high";
  clickMoment: string | null;
  improvements: string[];
  hiddenQuestions: { question: string; answer: string }[];
  isMisleading: boolean;
  misleadingReason: string | null;
  bookSuggestions: BookSuggestion[];
  knownUnknowns: string[];
  suggestedReading: string[];
  suggestions: string[];
}

interface GoalCourseModule {
  title: string;
  description: string;
  books: {
    title: string;
    author: string;
    description: string;
    chapters: { title: string; content: string }[];
  }[];
  topicTest: {
    title: string;
    questions: { question: string; options: string[]; correctIndex: number }[];
  };
}

interface GoalCourseResponse {
  goalId: string;
  modules: GoalCourseModule[];
  fromCache: boolean;
  tags?: string[];
}

/* ─── Title normalisation ─── */

const PREFIXES_TO_STRIP = [
  "i want to", "i need to", "i'd like to", "i would like to",
  "help me", "how to", "how do i", "how can i",
  "what is the best way to", "what's the best way to",
  "i wish to", "i aim to", "i plan to", "i'm trying to",
];

function normalizeTitle(title: string): string {
  let t = title.trim().toLowerCase();
  // Strip common prefixes
  for (const p of PREFIXES_TO_STRIP) {
    if (t.startsWith(p)) {
      t = t.slice(p.length).trim();
      break;
    }
  }
  // Remove punctuation
  t = t.replace(/[^\w\s]/g, "").trim();
  // Collapse whitespace
  t = t.replace(/\s+/g, " ");
  return t;
}

/* ─── Prompt templates ─── */

function buildThoughtPrompt(content: string, title?: string): string {
  return `You are a thoughtful AI companion called "Knock AI". Your role is to help someone reflect on their thoughts with wisdom and clarity.

A user has written a personal thought. Analyse it carefully and respond in valid JSON only, with no markdown formatting.

Thought${title ? `: "${title}"` : ""}
Content: "${content}"

Return a JSON object with these exact fields:
{
  "summary": "A short, warm 1-2 sentence summary of their thought",
  "wasRight": true/false/null (null if the thought is questioning/uncertain, true if the reasoning seems sound, false if there's a clear logical flaw),
  "publishEligibility": "low" | "medium" | "high" (how ready is this thought to be shared? low = needs more reflection, medium = has good bones, high = ready to publish),
  "clickMoment": null or a short, story-like reframe (2-4 sentences) tailored to the specific flaw detected — a metaphor, anecdote, or analogy that creates an "aha" realisation for the user about what they're missing. Make it memorable and human. Use null if eligibility is "high" since the thought is already strong.
  "improvements": ["array of 2-4 actionable suggestions to deepen or clarify this thought"],
  "hiddenQuestions": [
    {"question": "A probing question the thought raises but doesn't answer", "answer": "A thoughtful, compassionate exploration of that question"}
  ],
  "isMisleading": true/false (true if the thought contains absolute language like 'always'/'never', cognitive distortions, or factual errors),
  "misleadingReason": null or a brief explanation of what's misleading,
  "bookSuggestions": [
    {"book": "Book Title by Author", "reason": "Why this specific book helps with the specific flaw or gap detected in this thought — be personal and concrete, not generic"}
  ],
  "knownUnknowns": ["array of 2-4 things the thought leaves out — missing context, causality, personal perspective, or unasked questions"],
  "suggestedReading": ["2-3 book or article recommendations that relate to the themes in this thought"],
  "suggestions": ["2-3 practical next steps they could take based on this insight"]
}

Be warm but honest. If the thought shows growth, acknowledge it. If there's a blind spot, name it gently.`;
}

function buildGoalPrompt(title: string, description: string): string {
  return `You are an expert curriculum designer called "Knock AI". Create a complete learning course based on a user's goal.

Goal: "${title}"
Description: "${description}"

Return valid JSON only, with no markdown formatting. Generate a 3-module course structure with search tags:

{
  "modules": [
    {
      "title": "Module title",
      "description": "What this module covers",
      "books": [
        {
          "title": "Book title (make up a relevant, realistic-sounding title)",
          "author": "Author name (make up a realistic name)",
          "description": "Brief book description",
          "chapters": [
            {
              "title": "Chapter title",
              "content": "200-300 word chapter content with practical advice, exercises, and insights. Write in an encouraging, knowledgeable tone. Include specific examples and actionable steps."
            }
          ]
        }
      ],
      "topicTest": {
        "title": "Test title",
        "questions": [
          {
            "question": "Multiple choice question testing module concepts",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctIndex": 0
          }
        ]
      }
    }
  ],
  "tags": ["tag1", "tag2", "tag3"]
}

Requirements:
- Module 1: Foundation/basics
- Module 2: Deepening/practice
- Module 3: Mastery/sharing
- Each module: 1 book with 2 chapters, 1 topic test with 2-3 questions
- Chapters should be substantive, not generic filler
- Tests should genuinely test understanding
- Tags: generate 3-6 single-word or short-phrase tags that describe this goal (e.g. ["quitting", "smoking", "addiction", "health", "habit"]). These help future users find this pattern.`;
}

function buildPolishPrompt(content: string): string {
  return `You are an eloquent writing companion called "Knock AI". Your role is to help refine and polish someone's writing.

A user has written something they want to publish. Improve the writing while preserving their voice and meaning.

Content: "${content}"

Return valid JSON only, with no markdown formatting. Return this exact structure:
{
  "polished": "A refined, clearer version of the content. Improve grammar, flow, and impact without changing the core message or personality.",
  "summary": "One sentence describing what this piece is about",
  "improvements": ["2-3 specific writing improvements made, e.g. 'Tightened sentence structure', 'Improved word choice for impact'"]
}

Rules:
- Keep the author's authentic voice — don't make it sound corporate or robotic
- Fix grammar, punctuation, and awkward phrasing
- Improve clarity and flow
- Strengthen the opening and closing
- Suggest improvements honestly — if it's already good, say so`;
}

/* ─── Pattern Knowledge Base ─── */

/**
 * Try to find a cached goal pattern from the database.
 * Matches on normalized_title + direction (strict).
 */
async function findPattern(
  normalizedTitle: string,
  direction: string | undefined,
): Promise<{ course_data: GoalCourseModule[]; tags: string[] } | null> {
  try {
    const supabase = getSupabaseAdmin();
    const targetDir = direction || "unknown";

    const { data, error } = await supabase
      .from("goal_patterns")
      .select("course_data, tags, id, use_count")
      .eq("normalized_title", normalizedTitle)
      .eq("direction", targetDir)
      .maybeSingle();

    if (error || !data) return null;

    // Increment use_count asynchronously (fire-and-forget — don't block the response)
    supabase
      .from("goal_patterns")
      .update({ use_count: (data.use_count || 0) + 1, updated_at: new Date().toISOString() })
      .eq("id", data.id)
      .then().catch(() => {});

    return {
      course_data: data.course_data as GoalCourseModule[],
      tags: (data.tags as string[]) || [],
    };
  } catch (err) {
    console.warn("Pattern lookup failed, proceeding with AI:", err);
    return null;
  }
}

/**
 * Save a newly generated course as a goal pattern for future reuse.
 */
async function savePattern(
  normalizedTitle: string,
  direction: string | undefined,
  tags: string[],
  courseData: GoalCourseModule[],
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const targetDir = direction || "unknown";

    await supabase.from("goal_patterns").upsert(
      {
        normalized_title: normalizedTitle,
        direction: targetDir,
        tags,
        course_data: courseData,
        use_count: 1,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "normalized_title, direction" },
    );
  } catch (err) {
    console.warn("Failed to save goal pattern:", err);
  }
}

/* ─── Fireworks API call ─── */

async function callFireworks(
  prompt: string,
  apiKey: string,
): Promise<string> {
  const response = await fetch(FIREWORKS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are Knock AI, a thoughtful companion that helps people reflect and grow. Always respond with valid JSON only, no markdown formatting.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Fireworks API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new Error("Empty response from Fireworks API");

  // Strip markdown code fences if present
  return raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
}

/* ─── Mock fallback ─── */

const MOCK_TAGS_BY_KEYWORD: Record<string, string[]> = {
  smoke: ["quitting", "smoking", "addiction", "health", "habit"],
  quit: ["quitting", "addiction", "change", "habit"],
  fitness: ["fitness", "health", "exercise", "wellness"],
  health: ["health", "wellness", "lifestyle"],
  learn: ["learning", "education", "skills", "growth"],
  read: ["reading", "books", "learning", "knowledge"],
  code: ["coding", "programming", "technology", "skills"],
  write: ["writing", "creativity", "expression"],
};

function guessMockTags(title: string): string[] {
  const lower = title.toLowerCase();
  const found = new Set<string>();
  for (const [keyword, tags] of Object.entries(MOCK_TAGS_BY_KEYWORD)) {
    if (lower.includes(keyword)) tags.forEach((t) => found.add(t));
  }
  if (found.size === 0) found.add("general");
  return Array.from(found);
}

function mockAnalyseThought(content: string, title?: string): ThoughtAnalysis {
  const lower = content.toLowerCase();
  const hasAbsolutes = ["always", "never", "everyone", "no one", "nobody"].some((w) => lower.includes(w));
  const hasDepth = ["because", "realise", "realize", "i feel", "i learned", "i notice",
    "i wonder", "in my experience", "what if", "i realised", "i realized"].some((m) => lower.includes(m));
  const wordCount = content.split(/\s+/).length;

  const eligibility: ThoughtAnalysis["publishEligibility"] =
    hasDepth && wordCount >= 25 && !hasAbsolutes
      ? "high"
      : hasDepth && wordCount >= 15
        ? "medium"
        : "low";

  const knownUnknowns: string[] = [];
  if (!lower.includes("because") && !lower.includes("why")) {
    knownUnknowns.push("What caused this moment or feeling? The 'why' is missing.");
  }
  if (!content.includes("?")) {
    knownUnknowns.push("No question is asked — what would you want to understand better about this?");
  }
  if (!lower.includes("i") && !lower.includes("my") && !lower.includes("me")) {
    knownUnknowns.push("This reads impersonally — where are *you* in this thought?");
  }
  if (wordCount < 12) {
    knownUnknowns.push("The thought is too brief to know what context surrounds it.");
  }
  if (knownUnknowns.length === 0) {
    knownUnknowns.push("The personal context is clear, but would someone else follow your chain of thought?");
  }

  return {
    summary: title
      ? `A thoughtful reflection on "${title}". There's genuine self-awareness here worth building upon.`
      : "A sincere personal reflection that shows introspection and a desire for clarity.",
    wasRight: lower.includes("?") || lower.includes("maybe") ? null : !lower.includes("bad") && !lower.includes("wrong"),
    publishEligibility: eligibility,
    clickMoment: eligibility === "low"
      ? "Imagine a photographer who declares 'this forest has no beauty' after visiting on a single foggy morning. A week later, she returns at golden hour and sees light streaming through the leaves. The forest didn't change — her moment of seeing did. Your thought needs a different light. Try writing it again from a moment when you felt differently."
      : eligibility === "medium"
        ? "A gardener doesn't pull a sprout to make it grow faster — they water it, give it light, and wait. Your thought is that sprout. It doesn't need a rewrite, just one more sentence that feeds it. What happened right before this thought came to you?"
        : null,
    improvements: [
      "Try distilling the core insight into one sentence",
      "Consider what you'd tell a friend in this situation",
      "Write a follow-up tomorrow to see how this evolves",
    ],
    hiddenQuestions: [
      {
        question: "What would change if you fully committed to this insight?",
        answer: "Sometimes the gap between knowing and doing is where growth happens. What's the smallest step you could take right now?",
      },
    ],
    isMisleading: hasAbsolutes,
    misleadingReason: hasAbsolutes
      ? "Using absolute language like 'always' or 'never' can oversimplify complex situations."
      : null,
    bookSuggestions: [
      {
        book: "Atomic Habits by James Clear",
        reason: "Building a consistent reflection practice starts with small daily habits — Clear's framework helps you make this stick.",
      },
    ],
    knownUnknowns,
    suggestedReading: [
      "Atomic Habits by James Clear",
      "The Art of Thinking Clearly by Rolf Dobelli",
    ],
    suggestions: [
      "Share this thought with someone you trust",
      "Turn this into a small personal experiment",
      "Set a 5-minute timer and free-write any new angles",
    ],
  };
}

function mockProcessGoal(title: string, _description: string): { course: GoalCourseResponse; tags: string[] } {
  const tags = guessMockTags(title);
  return {
    tags,
    course: {
      goalId: "mock",
      fromCache: false,
      modules: [
        {
          title: "Understanding the Foundation",
          description: "Build a solid understanding of the fundamentals before diving deeper.",
          books: [{
            title: "The Beginner's Guide to " + title,
            author: "Sarah Mitchell",
            description: "A comprehensive introduction covering all foundational concepts.",
            chapters: [
              {
                title: "Getting Started",
                content: "Everything begins with understanding where you are right now. Take a moment to reflect on your current knowledge and experience. This is your starting point, and every expert was once here too.\n\nThe key is consistency — showing up every day, even when progress feels slow. Small steps compound into remarkable results over time.\n\nTry this: Write down three things you already know about your goal, and three things you want to learn.",
              },
              {
                title: "Building Your First Practice",
                content: "Now that you've identified where you are, it's time to build a practice. Start with 10 minutes daily. The goal isn't perfection — it's showing up.\n\nCreate a simple routine:\n1. Set a fixed time each day\n2. Prepare your materials in advance\n3. Remove distractions\n4. Focus for 10 minutes\n5. Reflect for 2 minutes after\n\nConsistency beats intensity every time.",
              },
            ],
          }],
          topicTest: {
            title: "Foundation Check",
            questions: [
              {
                question: "What is the most important factor for making progress?",
                options: ["Natural talent", "Consistency and showing up daily", "Having expensive tools", "Waiting for motivation"],
                correctIndex: 1,
              },
              {
                question: "How long should your initial practice session be?",
                options: ["2 hours", "30 minutes", "10 minutes", "As long as you can"],
                correctIndex: 2,
              },
            ],
          },
        },
        {
          title: "Deepening Your Understanding",
          description: "Go beyond the basics and start building real competence.",
          books: [{
            title: "Mastery Through Practice",
            author: "David Chen",
            description: "Advanced techniques for deepening your understanding and skill.",
            chapters: [
              {
                title: "The Art of Deliberate Practice",
                content: "Deliberate practice is the gold standard for skill development. Unlike casual repetition, deliberate practice involves:\n\n1. Clear specific goals\n2. Full concentration\n3. Immediate feedback\n4. Pushing just beyond your current ability\n\nIdentify one aspect of your goal that challenges you. Focus on just that aspect for your next practice session.",
              },
              {
                title: "Learning from Feedback",
                content: "Feedback is the breakfast of champions. Every mistake is data — information about what to adjust.\n\nCreate a feedback loop:\n- Practice → Get feedback → Adjust → Practice again\n\nSeek feedback from:\n- Your own reflection (journals)\n- Peers and mentors\n- Results and outcomes",
              },
            ],
          }],
          topicTest: {
            title: "Deepening Check",
            questions: [
              {
                question: "What is deliberate practice?",
                options: ["Repeating the same thing", "Practicing with clear goals, focus, and feedback", "Practicing only when inspired", "Getting someone else to do the work"],
                correctIndex: 1,
              },
            ],
          },
        },
        {
          title: "Sharing and Teaching Others",
          description: "The final stage — sharing what you've learned solidifies understanding.",
          books: [{
            title: "The Teacher's Path",
            author: "Maria Gonzalez",
            description: "How teaching others accelerates your own learning journey.",
            chapters: [
              {
                title: "Teaching as Learning",
                content: "The best way to truly learn something is to teach it. When you explain a concept to someone else, you:\n\n- Identify gaps in your own understanding\n- Organize knowledge into clear structures\n- Discover new perspectives through questions\n\nTry explaining your goal area to a friend or writing a short guide.",
              },
            ],
          }],
          topicTest: {
            title: "Mastery Check",
            questions: [
              {
                question: "Why is teaching others considered the best way to learn?",
                options: ["It makes you look smart", "It reveals gaps in your understanding", "It takes less time", "You don't need to practice anymore"],
                correctIndex: 1,
              },
            ],
          },
        },
      ],
    },
  };
}

function mockPolishContent(content: string): { polished: string; summary: string; improvements: string[] } {
  const trimmed = content.trim();
  return {
    polished: trimmed.endsWith(".") ? trimmed : trimmed + ".",
    summary: "A piece of writing that has been polished for clarity and impact.",
    improvements: [
      "Added proper punctuation and sentence endings",
      "Improved overall flow and readability",
      "Strengthened the concluding thought",
    ],
  };
}

/* ─── Main handler ─── */

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Verify JWT in production
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Missing or invalid authorization header" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const body: KnockRequest = await req.json();
    const { type, content, title, direction, apiKey } = body;

    if (!content || !type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: type and content" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Try real API key first (from request body or env secret)
    const effectiveKey = apiKey || Deno.env.get("FIREWORKS_API_KEY") || "";

    if (type === "thought") {
      let analysis: ThoughtAnalysis;

      if (effectiveKey) {
        try {
          const prompt = buildThoughtPrompt(content, title);
          const responseText = await callFireworks(prompt, effectiveKey);
          analysis = JSON.parse(responseText) as ThoughtAnalysis;
        } catch (err) {
          console.warn("Fireworks AI call failed, using mock:", err);
          analysis = mockAnalyseThought(content, title);
        }
      } else {
        analysis = mockAnalyseThought(content, title);
      }

      return new Response(
        JSON.stringify({ type: "thought", analysis }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (type === "goal") {
      const goalTitle = title || content;
      const normalizedTitle = normalizeTitle(goalTitle);
      let course: GoalCourseResponse;
      let tags: string[] = [];

      // STEP 1: Check the Goal Pattern Knowledge Base first (strict match)
      const cached = await findPattern(normalizedTitle, direction);

      if (cached) {
        // 🎯 CACHE HIT — return instantly, no AI cost
        course = {
          goalId: "new",
          modules: cached.course_data,
          fromCache: true,
          tags: cached.tags,
        };
        console.log(`Pattern cache HIT: "${normalizedTitle}" (${direction || "no direction"})`);
      } else {
        // 🚀 CACHE MISS — generate with AI
        console.log(`Pattern cache MISS: "${normalizedTitle}" — generating with AI...`);
        let generated: { modules: GoalCourseModule[]; tags?: string[] };

        if (effectiveKey) {
          try {
            const prompt = buildGoalPrompt(goalTitle, content);
            const responseText = await callFireworks(prompt, effectiveKey);
            generated = JSON.parse(responseText) as { modules: GoalCourseModule[]; tags?: string[] };
          } catch (err) {
            console.warn("Fireworks AI call failed, using mock:", err);
            const mockResult = mockProcessGoal(goalTitle, content);
            generated = { modules: mockResult.course.modules, tags: mockResult.tags };
          }
        } else {
          const mockResult = mockProcessGoal(goalTitle, content);
          generated = { modules: mockResult.course.modules, tags: mockResult.tags };
        }

        tags = generated.tags || guessMockTags(goalTitle);

        course = {
          goalId: "new",
          modules: generated.modules,
          fromCache: false,
          tags,
        };

        // STEP 2: Save to the pattern knowledge base for future reuse
        await savePattern(normalizedTitle, direction, tags, generated.modules);
        console.log(`New pattern saved: "${normalizedTitle}" with tags [${tags.join(", ")}]`);
      }

      return new Response(
        JSON.stringify({ type: "goal", course }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (type === "polish") {
      let result: { polished: string; summary: string; improvements: string[] };
      const inputContent = title ? `${title}\n\n${content}` : content;

      if (effectiveKey) {
        try {
          const prompt = buildPolishPrompt(inputContent);
          const responseText = await callFireworks(prompt, effectiveKey);
          result = JSON.parse(responseText) as { polished: string; summary: string; improvements: string[] };
        } catch (err) {
          console.warn("Fireworks AI call failed (polish), using mock:", err);
          result = mockPolishContent(content);
        }
      } else {
        result = mockPolishContent(content);
      }

      return new Response(
        JSON.stringify({ type: "polish", result }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid type. Must be 'thought', 'goal', or 'polish'." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Knock AI error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});