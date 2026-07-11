/**
 * AI-Powered Publication Categorizer
 *
 * Maps publications into thematic categories based on their AI-generated tags.
 * Tags themselves are AI-chosen during thought analysis, so the categories
 * are effectively AI-curated without needing an extra edge function call.
 */

/* ─── Category Definition ─── */

export interface CategoryDef {
  id: string;
  label: string;
  description: string;
  icon: string; // emoji icon — used as a visual signifier in category tabs
  tagPatterns: string[]; // lowercased keywords to match against publication tags
}

export const CATEGORIES: CategoryDef[] = [
  {
    id: "mindful-living",
    label: "Mindful Living",
    description: "Presence, gratitude, and quiet reflection",
    icon: "🧘",
    tagPatterns: ["mindfulness", "reflection", "gratitude", "meditation", "present", "awareness", "stillness"],
  },
  {
    id: "daily-pulse",
    label: "Daily Pulse",
    description: "Everyday moments, routines, and simple joys",
    icon: "☀️",
    tagPatterns: ["routine", "weekend", "daily", "morning", "evening", "habit", "simple"],
  },
  {
    id: "inner-growth",
    label: "Inner Growth",
    description: "Learning, reading, and becoming",
    icon: "🌱",
    tagPatterns: ["growth", "reading", "learning", "wisdom", "book", "knowledge", "discipline"],
  },
  {
    id: "emotional-tides",
    label: "Emotional Tides",
    description: "Feelings, healing, and navigating inner weather",
    icon: "🌊",
    tagPatterns: ["emotions", "wellness", "feelings", "healing", "mental", "anxiety", "joy", "sadness", "anger"],
  },
  {
    id: "creative-flow",
    label: "Creative Flow",
    description: "Ideas, projects, and making something new",
    icon: "✨",
    tagPatterns: ["creative", "projects", "ideas", "inspiration", "art", "write", "music", "design"],
  },
  {
    id: "connections",
    label: "Connections",
    description: "Relationships, friends, and community",
    icon: "💛",
    tagPatterns: ["friends", "relationships", "community", "love", "family", "people", "social"],
  },
  {
    id: "the-work",
    label: "The Work",
    description: "Career, tech, and building your path",
    icon: "🔧",
    tagPatterns: ["work", "tech", "career", "productivity", "business", "code", "finance"],
  },
  {
    id: "nature-wonder",
    label: "Nature & Wonder",
    description: "Outdoors, travel, and the world around us",
    icon: "🌿",
    tagPatterns: ["nature", "adventure", "travel", "outdoors", "explore", "walk", "garden", "weather"],
  },
];

export const UNCATEGORIZED: CategoryDef = {
  id: "uncategorized",
  label: "Uncategorized",
  description: "Publications awaiting a category",
  icon: "📄",
  tagPatterns: [],
};

/* ─── Helpers ─── */

/**
 * Assign a category to a publication based on its tags.
 * Matches tags against each category's tagPatterns — the category with the
 * most matching tags wins. Ties are broken by category order (first wins).
 */
export function categorizeByTags(tags: string[]): string {
  if (!tags || tags.length === 0) return UNCATEGORIZED.id;

  const lowerTags = tags.map((t) => t.toLowerCase());
  let bestCategory = UNCATEGORIZED.id;
  let bestScore = 0;

  for (const cat of CATEGORIES) {
    const score = cat.tagPatterns.filter((pattern) =>
      lowerTags.some((tag) => tag.includes(pattern)),
    ).length;
    if (score > bestScore) {
      bestScore = score;
      bestCategory = cat.id;
    }
  }

  return bestCategory;
}

/**
 * Get the full category definition by ID.
 */
export function getCategory(id: string): CategoryDef {
  return CATEGORIES.find((c) => c.id === id) ?? UNCATEGORIZED;
}

/**
 * Get a colour class for a category tab/chip.
 */
export function getCategoryColor(id: string): string {
  const colors: Record<string, string> = {
    "mindful-living": "bg-tag-teal/20 text-tag-teal border-tag-teal/30",
    "daily-pulse": "bg-tag-amber/20 text-tag-amber border-tag-amber/30",
    "inner-growth": "bg-tag-green/20 text-tag-green border-tag-green/30",
    "emotional-tides": "bg-tag-rose/20 text-tag-rose border-tag-rose/30",
    "creative-flow": "bg-tag-violet/20 text-tag-violet border-tag-violet/30",
    "connections": "bg-tag-rose/20 text-rose-400 border-rose-400/30",
    "the-work": "bg-tag-blue/20 text-tag-blue border-tag-blue/30",
    "nature-wonder": "bg-tag-green/20 text-emerald-400 border-emerald-400/30",
  };
  return colors[id] ?? "bg-surface-hover text-muted border-border/50";
}