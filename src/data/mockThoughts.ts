import type { Thought } from "../types/thought";

function mockThought(
  id: string,
  title: string,
  content: string,
  tags: string[],
  minsAgo: number,
  status: "pending" | "ready" = "ready",
  analysis?: Thought["analysis"],
): Thought {
  return {
    id,
    title,
    content,
    tags,
    user_id: "mock-user-1",
    status,
    analysis: analysis ?? null,
    ai_feedback: null,
    goal_id: null,
    is_published: false,
    publication_id: null,
    is_new: false,
    processed_at: status === "ready" ? new Date(Date.now() - 1000 * 60 * minsAgo).toISOString() : null,
    created_at: new Date(Date.now() - 1000 * 60 * minsAgo).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * minsAgo).toISOString(),
  };
}

/* ─── Mock analysis to attach to some thoughts ─── */

const analysisForMorning: Thought["analysis"] = {
  summary:
    "This reflection shows a healthy appreciation for stillness and routine. The insight about setting a calm tone for the day is grounded in well-established mindfulness practices.",
  wasRight: true,
  improvements: [
    "Consider framing this as a recurring commitment rather than a one-off observation",
    "Add a specific trigger (e.g. 'after I pour my coffee') to solidify the habit",
  ],
  hiddenQuestions: [
    {
      question: "What prevents me from doing this every day?",
      answer: "You haven't committed to a specific time yet. Attaching it to an existing habit (like making coffee) makes it automatic rather than optional.",
    },
  ],
  isMisleading: false,
  misleadingReason: null,
  suggestedReading: [
    "Atomic Habits by James Clear — habit stacking and environment design",
    "The Power of Habit by Charles Duhigg — the cue-routine-reward loop",
  ],
  suggestions: [
    "Set a recurring 10-minute 'sunrise pause' on your calendar",
    "Pair journaling with this quiet moment for double the benefit",
  ],
};

const analysisForPatience: Thought["analysis"] = {
  summary:
    "This is a moment of honest self-reflection that recognizes a gap between your values and your reactions. That awareness is the critical first step toward change.",
  wasRight: true,
  improvements: [
    "Practice the '6-second rule' — take six seconds before responding in a tense moment",
    "Prepare a script for when you feel frustration rising ('I need a moment to think about that')",
  ],
  hiddenQuestions: [
    {
      question: "Was there something else behind the frustration?",
      answer: "Often the surface trigger isn't the real cause. Were you feeling tired, hungry, or stressed about something else before the interaction?",
    },
    {
      question: "How can I make amends?",
      answer: "A brief, sincere apology to your colleague — without over-explaining — can rebuild trust. 'I'm sorry I snapped earlier. That wasn't fair to you.'",
    },
  ],
  isMisleading: false,
  misleadingReason: null,
  suggestedReading: [
    "Emotional Intelligence by Daniel Goleman — understanding and managing triggers",
    "Nonviolent Communication by Marshall Rosenberg — speaking with empathy",
  ],
  suggestions: [
    "Set a phone notification at midday: 'Breathe. Respond, don't react.'",
    "Write a quick 'emotional temperature' check in your journal before meetings",
  ],
};

/* ─── Mock data ─── */

export const mockThoughts: Thought[] = [
  mockThought(
    "1",
    "Morning clarity",
    "Woke up early today and sat with my coffee watching the sunrise. There's something profoundly grounding about the quiet hours before the world wakes up. I should do this more often — it sets a calm tone for the whole day ahead.",
    ["mindfulness", "routine", "wellness"],
    30,
    "ready",
    analysisForMorning,
  ),
  mockThought(
    "2",
    "Book thoughts — Atomic Habits",
    "Finished the chapter on habit stacking today. The idea of pairing a new habit with an existing one is so simple yet powerful. Already thinking about how I can attach '5 minutes of journaling' to my morning coffee ritual. Small changes compound.",
    ["reading", "growth", "habits"],
    180,
  ),
  mockThought(
    "3",
    "Project idea brewing",
    "Been toying with the concept of a personal growth dashboard that visualises your habits, mood, and journal entries over time. Like a fitness tracker but for your inner world. Need to sketch out the wireframes this weekend.",
    ["creative", "projects", "tech"],
    1440,
  ),
  mockThought(
    "4",
    "Gratitude list",
    "Things I'm grateful for today:\n1) My health — been feeling strong and energised.\n2) Deep conversations with friends — we talked about dreams and fears until midnight.\n3) This journal — having a space to process thoughts has been genuinely therapeutic.",
    ["gratitude", "reflection", "friends"],
    2880,
  ),
  mockThought(
    "5",
    "Struggling with patience",
    "Had a frustrating moment at work today where I snapped at a colleague. Not proud of it. Need to remember that everyone is moving at their own pace. Taking a deep breath before responding is a skill I need to practise daily.",
    ["emotions", "growth", "work"],
    4320,
    "ready",
    analysisForPatience,
  ),
  mockThought(
    "6",
    "Weekend hike plans",
    "Planning a hike up Mount Sutro this Saturday. The trail through the eucalyptus forest is supposed to be gorgeous this time of year. Bringing a thermos of tea, a good playlist, and maybe a notebook in case inspiration strikes at the summit.",
    ["nature", "adventure", "weekend"],
    5760,
  ),
];