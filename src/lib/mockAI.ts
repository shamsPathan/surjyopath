import type { Thought, ThoughtAnalysis, BookSuggestion, PublishEligibility } from "../types/thought";

/**
 * Mock AI analysis engine.
 *
 * Simulates what Fireworks AI would return:
 *  - Summarises the thought
 *  - Scores publish eligibility (low / medium / high)
 *  - Detects specific flaws and maps them to targeted book recommendations
 *  - Suggests improvements
 *  - Uncovers hidden questions
 *  - Notes misleading reasoning if any
 *
 * In production, this is replaced by a call to the Fireworks AI backend.
 */

/* ─── Book catalogue: each book targets a specific thought flaw ─── */

interface FlawBook {
  flaw: string;
  detect: (content: string) => boolean;
  book: string;
  reason: string;
  clickMoment: string;
}

const FLAW_BOOKS: FlawBook[] = [
  {
    flaw: "too-brief",
    detect: (c) => c.split(/\s+/).length < 12,
    book: "The War of Art by Steven Pressfield",
    reason:
      "Your thought is brief — sometimes the hardest part is showing up. Pressfield's book is about recognising the resistance that keeps us from doing meaningful work and pushing through it.",
    clickMoment:
      "There is a story about a sculptor who stared at a block of marble for three weeks before making a single cut. When asked why, he said: 'I was waiting for the stone to tell me what it wanted to be.' Your thought is that block — it already holds something. You don't need the whole statue today, just the first true chisel mark. Write one sentence that feels honest, even if it's imperfect.",
  },
  {
    flaw: "absolute-language",
    detect: (c) => {
      const absolutes = ["always", "never", "everyone", "no one", "nobody"];
      return absolutes.some((w) => c.toLowerCase().includes(w));
    },
    book: "Thinking, Fast and Slow by Daniel Kahneman",
    reason:
      "Words like 'always' and 'never' hint at a cognitive shortcut your mind took. Kahneman's work reveals how our brain jumps to conclusions — understanding that helps you see the nuance you might be missing.",
    clickMoment:
      "Imagine a photographer who declares 'this forest has no beauty' after visiting on a single foggy morning. A week later, she returns at golden hour and sees light streaming through the leaves. The forest didn't change — her moment of seeing did. 'Always' and 'never' are foggy mornings. The truth is rarely absolute — it just waits for a different light.",
  },
  {
    flaw: "regret-without-nuance",
    detect: (c) => {
      const lower = c.toLowerCase();
      return lower.includes("regret") && !lower.includes("but") && !lower.includes("however") && !lower.includes("though");
    },
    book: "Daring Greatly by Brené Brown",
    reason:
      "When regret appears without any counterpoint, it can feel like a verdict. Brené Brown shows how vulnerability isn't weakness — it's the path to owning your story and finding what's underneath the regret.",
    clickMoment:
      "There is a Japanese art form called kintsugi where broken pottery is repaired with gold lacquer — the crack becomes the most beautiful part. Your regret is a crack, not a flaw. The question isn't 'how do I undo this?' but 'what gold can fill this seam?' Write down one thing that regret taught you — that's your gold.",
  },
  {
    flaw: "raw-emotion-no-reflection",
    detect: (c) => {
      const lower = c.toLowerCase();
      const rawWords = ["hate", "stupid", "useless", "terrible", "awful"];
      return rawWords.some((w) => lower.includes(w)) && !lower.includes("because") && !lower.includes("realise") && !lower.includes("realize") && !lower.includes("i feel like");
    },
    book: "Man's Search for Meaning by Viktor Frankl",
    reason:
      "Strong emotions without reflection can leave us stuck. Frankl's timeless insight is that between stimulus and response there is a space — and in that space lies our power to choose meaning, even in difficult feelings.",
    clickMoment:
      "A man once shouted at the sea during a storm, furious that the waves kept crashing over his boat. The sea did not answer. But when the storm passed, he realised the waves had carried him to a shore he never knew existed. Your emotion is that storm — it feels like chaos now, but if you sit with it a moment longer, it might be carrying you somewhere you need to go. Ask: 'What is this feeling trying to show me?'",
  },
  {
    flaw: "complaint-without-action",
    detect: (c) => {
      const lower = c.toLowerCase();
      const complaintWords = ["bad", "wrong", "unfair", "frustrating", "annoying"];
      return complaintWords.some((w) => lower.includes(w)) && !lower.includes("what if") && !lower.includes("maybe") && !lower.includes("perhaps") && !lower.includes("i can");
    },
    book: "The Obstacle Is the Way by Ryan Holiday",
    reason:
      "There's frustration here but no sense of what to do with it. Holiday's book reframes obstacles as raw material for growth — exactly the shift that turns a complaint into a breakthrough.",
    clickMoment:
      "There is a story of a farmer whose horse ran away. His neighbour said, 'What bad luck.' The farmer replied, 'Maybe.' The next day the horse returned with seven wild horses. The neighbour said, 'What good luck.' The farmer said, 'Maybe.' The day after, the farmer's son broke his leg trying to tame one. 'What bad luck.' 'Maybe.' The army came to conscript young men, but passed over the son because of his leg. Your frustration is that 'maybe' — you don't yet know what it's making space for. What small action could you take that treats this as raw material, not a dead end?",
  },
  {
    flaw: "surface-observation",
    detect: (c) => {
      const lower = c.toLowerCase();
      const depthMarkers = ["because", "realise", "realize", "i feel", "i learned", "i notice",
        "i wonder", "in my experience", "what if"];
      const hasDepth = depthMarkers.some((m) => lower.includes(m));
      return !hasDepth;
    },
    book: "Bird by Bird by Anne Lamott",
    reason:
      "Your observation sits on the surface — there's more underneath waiting. Lamott's honest, warm approach to writing shows how to find the real story by looking just a little closer at what you noticed.",
    clickMoment:
      "A child once asked a painter why he spent an entire day painting the same apple. The painter said: 'Because this apple contains the whole orchard — the rain that fell on it, the hands that picked it, the journey it took to reach my table. One apple is never just one apple.' Your observation is that apple. What orchard does it come from? Write one sentence about the story behind it.",
  },
];

/* ─── Medium-eligibility books ─── */

const MEDIUM_BOOKS: { detect: (content: string) => boolean; book: string; reason: string; clickMoment: string }[] = [
  {
    detect: (c) => {
      const lower = c.toLowerCase();
      return lower.includes("i think") || lower.includes("maybe") || lower.includes("perhaps");
    },
    book: "The Gifts of Imperfection by Brené Brown",
    reason:
      "You're in the realm of 'maybe' — a thoughtful place, but the real insight lives one layer deeper. Brown's work on wholehearted living helps turn tentative thoughts into grounded knowing.",
    clickMoment:
      "A musician once said the note you don't play is as important as the one you do. Your 'maybe' is that silent note — it holds the melody you haven't dared to play yet. What would you say if you removed the word 'maybe' and trusted your voice for just one sentence?",
  },
  {
    detect: (c) => {
      const words = c.split(/\s+/).length;
      return words >= 12 && words < 30;
    },
    book: "Atomic Habits by James Clear",
    reason:
      "Your thought has the seeds of something real but needs more room to grow. Clear's framework for small, consistent improvements applies as much to thinking as to habits — give this idea a few sentences to breathe.",
    clickMoment:
      "A gardener doesn't pull a sprout to make it grow faster — they water it, give it light, and wait. Your thought is that sprout. It doesn't need a rewrite, just one more sentence that feeds it. What happened right before this thought came to you? Start there.",
  },
  {
    detect: () => true, // fallback
    book: "On Writing Well by William Zinsser",
    reason:
      "There's something here worth developing. Zinsser's classic is about clarity and warmth on the page — exactly what turns a decent reflection into one that truly connects.",
    clickMoment:
      "A potter once said the hardest part of making a bowl isn't the shaping — it's knowing when to stop adding clay and start hollowing out the centre. Your thought has enough clay. Now hollow it — what's the one thing at the heart of this that you haven't said yet?",
  },
];

/* ─── High-eligibility book ─── */

const HIGH_BOOKS: BookSuggestion[] = [
  {
    book: "The Daily Stoic by Ryan Holiday & Stephen Hanselman",
    reason:
      "Your thought shows real depth and self-awareness. This collection of daily meditations is a perfect companion to keep the practice alive — each entry is a mirror for the next insight.",
  },
];

/* ─── Helper: detect all flaws in content ─── */

function detectFlaws(content: string): { flaw: string; suggestion: BookSuggestion }[] {
  const results: { flaw: string; suggestion: BookSuggestion }[] = [];
  for (const fb of FLAW_BOOKS) {
    if (fb.detect(content)) {
      results.push({
        flaw: fb.flaw,
        suggestion: { book: fb.book, reason: fb.reason },
      });
    }
  }
  return results;
}

/* ─── Eligibility decision ─── */

function decideEligibility(content: string): {
  eligibility: PublishEligibility;
  flaws: { flaw: string; suggestion: BookSuggestion }[];
  message: string;
} {
  const words = content.split(/\s+/).length;
  const lower = content.toLowerCase();
  const flaws = detectFlaws(content);

  const depthMarkers = ["because", "realise", "realize", "i feel", "i learned", "i notice",
    "i wonder", "in my experience", "what if", "i realised", "i realized"];
  const hasDepth = depthMarkers.some((m) => lower.includes(m));

  // High eligibility: genuine depth, enough length, no significant flaws
  if (hasDepth && words >= 25 && flaws.length === 0) {
    return {
      eligibility: "high",
      flaws: [],
      message: "This thought has real depth — it reads well and could resonate with others.",
    };
  }

  // High eligibility: very thoughtful, even with a minor flaw
  if (hasDepth && words >= 30 && flaws.length <= 1) {
    return {
      eligibility: "high",
      flaws,
      message: "There's genuine insight here. With a small polish, this could shine.",
    };
  }

  // Medium eligibility: some depth but needs work
  if (hasDepth && words >= 15) {
    return {
      eligibility: "medium",
      flaws,
      message: "You're onto something — this reflection has good bones. A bit more personal context or a sharper takeaway could lift it.",
    };
  }

  if (words >= 20 && flaws.length <= 1) {
    return {
      eligibility: "medium",
      flaws,
      message: "There's a real observation here. Try digging into what specifically sparked it — the detail makes all the difference.",
    };
  }

  // Low eligibility: too brief, or multiple flaws, or surface-level
  return {
    eligibility: "low",
    flaws,
    message: "This entry could become something meaningful with a bit more reflection. Try capturing what sparked this feeling or what you'd like to take away from it.",
  };
}

/* ─── Pick book suggestions for a given eligibility & flaws ─── */

function pickBookSuggestions(
  eligibility: PublishEligibility,
  flaws: { flaw: string; suggestion: BookSuggestion }[],
  content: string,
): BookSuggestion[] {
  // For low eligibility: return books for every detected flaw
  if (eligibility === "low" && flaws.length > 0) {
    return flaws.map((f) => f.suggestion);
  }

  // For medium eligibility: pick one flaw-based book if any, otherwise a medium book
  if (eligibility === "medium") {
    if (flaws.length > 0) {
      return flaws.slice(0, 2).map((f) => f.suggestion);
    }
    const matched = MEDIUM_BOOKS.find((mb) => mb.detect(content));
    return [{ book: matched?.book || MEDIUM_BOOKS[MEDIUM_BOOKS.length - 1].book, reason: matched?.reason || MEDIUM_BOOKS[MEDIUM_BOOKS.length - 1].reason }];
  }

  // For high eligibility: the daily stoic
  return HIGH_BOOKS;
}

/* ─── Build summary ─── */

function buildSummary(content: string, eligibility: PublishEligibility): string {
  const words = content.split(/\s+/).length;
  if (words < 12) {
    return `A very brief note. There isn't enough here to evaluate meaningfully right now, but every insight starts somewhere.`;
  }
  if (eligibility === "low") {
    return `This thought touches on something, but it stays at the surface level. There's a seed here — try giving it space to grow by asking yourself what specifically led to this moment.`;
  }
  if (eligibility === "medium") {
    return `This reflection has the beginnings of a real insight. You're noticing something worth exploring — the next step is to connect it to your own experience or ask a deeper question of it.`;
  }
  return `There's genuine self-awareness in this thought. You've connected an observation to something personal, and that kind of clarity is worth sharing.`;
}

/* ─── Extract improvements ─── */

function extractImprovements(content: string, eligibility: PublishEligibility): string[] {
  const suggestions: string[] = [];
  if (eligibility === "low" && content.split(/\s+/).length < 12) {
    suggestions.push("Write one more sentence capturing what prompted this feeling — even a small detail changes everything");
  }
  if (!content.includes("?")) {
    suggestions.push("Ask yourself a probing question about this thought to go deeper");
  }
  if (eligibility === "medium") {
    suggestions.push("Add a concrete example from your day — it turns a good thought into a memorable one");
    suggestions.push("Try writing a short follow-up tomorrow to see how this evolves");
  }
  if (eligibility === "high") {
    suggestions.push("Consider expanding this into a short essay — the clarity is there");
    suggestions.push("Share this with someone who might benefit from your perspective");
  }
  if (suggestions.length === 0) {
    suggestions.push("Consider writing a short follow-up tomorrow to see how this evolves");
  }
  return suggestions;
}

/* ─── Hidden questions (unchanged from before) ─── */

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

/* ─── Misleading detection (unchanged) ─── */

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

/* ─── Generate the click moment ─── */

function generateClickMoment(
  eligibility: PublishEligibility,
  flaws: { flaw: string; suggestion: BookSuggestion }[],
  content: string,
): string | null {
  // Low eligibility: pick the click moment from the first detected flaw
  if (eligibility === "low" && flaws.length > 0) {
    const flawEntry = FLAW_BOOKS.find((fb) => fb.flaw === flaws[0].flaw);
    if (flawEntry?.clickMoment) return flawEntry.clickMoment;
  }

  // Medium eligibility: find a matching medium book
  if (eligibility === "medium") {
    // If there are flaws, use the first flaw's click moment
    if (flaws.length > 0) {
      const flawEntry = FLAW_BOOKS.find((fb) => fb.flaw === flaws[0].flaw);
      if (flawEntry?.clickMoment) return flawEntry.clickMoment;
    }
    // Otherwise, pick a medium book
    const matched = MEDIUM_BOOKS.find((mb) => mb.detect(content));
    if (matched?.clickMoment) return matched.clickMoment;
  }

  // High eligibility: no click moment needed — it's already ready
  return null;
}

/* ─── Known unknowns — what the thought leaves out ─── */

function extractKnownUnknowns(content: string, eligibility: PublishEligibility): string[] {
  const unknowns: string[] = [];
  const lower = content.toLowerCase();

  if (!lower.includes("because") && !lower.includes("why")) {
    unknowns.push("What caused this moment or feeling? The 'why' is missing.");
  }
  if (!content.includes("?")) {
    unknowns.push("No question is asked — what would you want to understand better about this?");
  }
  if (!lower.includes("i") && !lower.includes("my") && !lower.includes("me")) {
    unknowns.push("This reads impersonally — where are *you* in this thought?");
  }
  if (content.split(/\s+/).length < 12) {
    unknowns.push("The thought is too brief to know what context surrounds it.");
  }
  if (unknowns.length === 0) {
    unknowns.push("The personal context is clear, but would someone else follow your chain of thought?");
  }

  return unknowns;
}

/* ─── Main mock AI entry point ─── */

export async function runMockAI(thought: Thought): Promise<ThoughtAnalysis> {
  /* Simulate network latency (800ms-2s) */
  await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200));

  const content = thought.content;
  const { isMisleading, reason } = detectMisleading(content);

  // Determine eligibility and flaws
  const { eligibility, flaws, message } = decideEligibility(content);

  // Map wasRight from eligibility for backwards compatibility
  const wasRight = eligibility === "high" ? true : eligibility === "low" ? false : null;

  // Book suggestions — tailored to the detected flaws
  const bookSuggestions = pickBookSuggestions(eligibility, flaws, content);

  return {
    summary: buildSummary(content, eligibility),
    wasRight,
    publishEligibility: eligibility,
    clickMoment: generateClickMoment(eligibility, flaws, content),
    improvements: extractImprovements(content, eligibility),
    hiddenQuestions: extractHiddenQuestions(content),
    isMisleading,
    misleadingReason: reason,
    suggestedReading: bookSuggestions.map((b) => b.book),
    bookSuggestions,
    knownUnknowns: extractKnownUnknowns(content, eligibility),
    suggestions: [
      "Write a short follow-up tomorrow to build on this insight",
      "Share this thought with a friend or mentor for an outside perspective",
      "Turn this into a small experiment — test the idea and see what happens",
    ],
  };
}