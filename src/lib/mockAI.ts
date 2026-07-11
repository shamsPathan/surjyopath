import type { Thought, ThoughtAnalysis } from "../types/thought";

/**
 * Mock AI analysis engine.
 *
 * Simulates what Fireworks AI would return:
 *  - Summarises the thought
 *  - Scores whether the user's stance was right
 *  - Suggests improvements
 *  - Uncovers hidden questions
 *  - Notes misleading reasoning if any
 *  - Recommends further reading
 *  - Gives actionable suggestions
 *
 * In production, this is replaced by a call to the Go/Fireworks backend.
 */

const READINGS_POOL = [
  "Atomic Habits by James Clear",
  "The Power of Habit by Charles Duhigg",
  "Deep Work by Cal Newport",
  "Thinking, Fast and Slow by Daniel Kahneman",
  "Daring Greatly by Brené Brown",
  "Man's Search for Meaning by Viktor Frankl",
  "The Art of Thinking Clearly by Rolf Dobelli",
  "Ikigai by Héctor García and Francesc Miralles",
  "The 7 Habits of Highly Effective People by Stephen Covey",
  "Start with Why by Simon Sinek",
];

function pick<T>(arr: T[], n = 1): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function buildSummary(thought: Thought): string {
  const words = thought.content.split(/\s+/).length;
  if (words < 10) {
    return `A short reflection — "${thought.title}". The core idea is clear but could benefit from deeper exploration.`;
  }
  return `This thought reflects on "${thought.title}". ` +
    `There's a genuine attempt to process an experience here, and the self-awareness shown is meaningful. ` +
    `With a bit more structure, this insight could become a valuable lesson.`;
}

function decideWasRight(content: string): boolean | null {
  const uncertain = ["?", "maybe", "perhaps", "not sure", "wondering"];
  const lower = content.toLowerCase();
  if (uncertain.some((w) => lower.includes(w))) return null; // neutral
  return !lower.includes("bad") && !lower.includes("wrong") && !lower.includes("regret");
}

function extractImprovements(content: string): string[] {
  const suggestions: string[] = [];
  if (content.length > 100) {
    suggestions.push("Summarise the key takeaway in one sentence for clarity");
  }
  if (!content.includes("?")) {
    suggestions.push("Ask yourself a probing question about this thought to go deeper");
  }
  suggestions.push("Consider writing a short follow-up tomorrow to see how this evolves");
  return suggestions;
}

function extractHiddenQuestions(content: string) {
  const questions: { question: string; answer: string }[] = [];

  if (content.toLowerCase().includes("should") || content.toLowerCase().includes("need")) {
    questions.push({
      question: "What makes this a 'should' rather than a genuine want?",
      answer:
        "Words like 'should' and 'need' often signal external pressure. Ask yourself if this really aligns with your values or if it's coming from someone else's expectation.",
    });
  }

  if (content.toLowerCase().includes("feel") || content.toLowerCase().includes("felt")) {
    questions.push({
      question: "What specific emotion is underneath this thought?",
      answer:
        "Naming the exact emotion (e.g. 'frustration' vs 'anger', 'anxiety' vs 'excitement') helps you understand what you really need in this moment.",
    });
  }

  if (content.toLowerCase().includes("someone") || content.toLowerCase().includes("they")) {
    questions.push({
      question: "How much of this is within your control?",
      answer:
        "If the thought centres on someone else's actions, remember that you can only control your own response. Shift the focus back to what you can do.",
    });
  }

  if (questions.length === 0) {
    questions.push({
      question: "What would change if you acted on this thought today?",
      answer:
        "Sometimes the gap between insight and action is the only thing holding you back. What's the smallest step you could take right now?",
    });
  }

  return questions;
}

function detectMisleading(content: string): { isMisleading: boolean; reason: string | null } {
  const lower = content.toLowerCase();
  const absolutes = ["always", "never", "everyone", "no one", "nobody"];
  const hasAbsolutes = absolutes.some((w) => lower.includes(w));

  if (hasAbsolutes) {
    return {
      isMisleading: true,
      reason:
        "Using absolute language ('always', 'never') can distort reality. Very few things in life are truly universal — consider softening your language to reflect nuance.",
    };
  }

  return { isMisleading: false, reason: null };
}

export async function runMockAI(thought: Thought): Promise<ThoughtAnalysis> {
  /* Simulate network latency (800ms-2s) */
  await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200));

  const { isMisleading, reason } = detectMisleading(thought.content);

  return {
    summary: buildSummary(thought),
    wasRight: decideWasRight(thought.content),
    improvements: extractImprovements(thought.content),
    hiddenQuestions: extractHiddenQuestions(thought.content),
    isMisleading,
    misleadingReason: reason,
    suggestedReading: pick(READINGS_POOL, 2).map((r) => r),
    suggestions: [
      "Write a short follow-up tomorrow to build on this insight",
      "Share this thought with a friend or mentor for an outside perspective",
      "Turn this into a small experiment — test the idea and see what happens",
    ],
  };
}
