/**
 * AI Service Layer — Knock Engine
 *
 * Unified client that attempts to analyse thoughts and process goals
 * through a chain of providers:
 *   1. Supabase Edge Function (knock-ai)
 *   2. Go Backend (legacy)
 *   3. Mock AI (browser-based fallback)
 *
 * Also handles rate limiting and result caching.
 */

import { supabase } from "../lib/supabase";
import { CONFIG } from "../lib/config";
import { canKnock, recordKnock } from "../lib/rateLimiter";
import { runMockAI as mockThoughtAnalysis } from "../lib/mockAI";
import type { Thought, ThoughtAnalysis } from "../types/thought";
import type { GoalCourseResponse } from "../api/types";

/* ─── Types ─── */

export interface AiServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  fromCache?: boolean;
  source: "edge-function" | "go-backend" | "mock";
}

export interface ProcessingState {
  isProcessing: boolean;
  currentType: "thought" | "goal" | "polish" | null;
  progress: number;
  message: string;
}

export type ProcessingListener = (state: ProcessingState) => void;

/* ─── Processing queue state ─── */

let _processingState: ProcessingState = {
  isProcessing: false,
  currentType: null,
  progress: 0,
  message: "",
};

const _listeners = new Set<ProcessingListener>();

function notifyListeners(): void {
  _listeners.forEach((fn) => fn({ ..._processingState }));
}

function setProcessing(partial: Partial<ProcessingState>): void {
  _processingState = { ..._processingState, ...partial };
  notifyListeners();
}

/* ─── Public API ─── */

export function onProcessingChange(listener: ProcessingListener): () => void {
  _listeners.add(listener);
  return () => _listeners.delete(listener);
}

export function getProcessingState(): ProcessingState {
  return { ..._processingState };
}

/**
 * Analyse a thought using the Knock AI engine.
 * Tries: Edge Function → Go Backend → Mock
 */
export async function knockThought(
  thought: Thought,
): Promise<AiServiceResult<ThoughtAnalysis>> {
  // Check rate limit first
  const blockReason = canKnock("thought");
  if (blockReason) {
    return { success: false, error: blockReason, source: "mock" };
  }

  setProcessing({ isProcessing: true, currentType: "thought", progress: 0, message: "Knocking on your thought…" });

  try {
    setProcessing({ progress: 25, message: "Consulting Knock AI…" });

    // 1. Try Supabase Edge Function
    const edgeResult = await tryEdgeFunction<ThoughtAnalysis>("thought", {
      content: thought.content,
      title: thought.title,
    });

    if (edgeResult.success && edgeResult.data) {
      recordKnock("thought");
      setProcessing({ isProcessing: false, currentType: null, progress: 100, message: "Analysis complete!" });
      return { success: true, data: edgeResult.data, source: "edge-function" };
    }

    setProcessing({ progress: 50, message: "Edge function unavailable, trying backend…" });

    // 2. Try Go Backend
    const goResult = await tryGoBackend<ThoughtAnalysis>("thought", thought.id);
    if (goResult.success && goResult.data) {
      recordKnock("thought");
      setProcessing({ isProcessing: false, currentType: null, progress: 100, message: "Analysis complete!" });
      return { success: true, data: goResult.data, source: "go-backend" };
    }

    setProcessing({ progress: 75, message: "Running local analysis…" });

    // 3. Fall back to browser-based mock
    const mockResult = await mockThoughtAnalysis(thought);
    recordKnock("thought");
    setProcessing({ isProcessing: false, currentType: null, progress: 100, message: "Analysis complete!" });
    return { success: true, data: mockResult, source: "mock" };
  } catch (err) {
    setProcessing({
      isProcessing: false,
      currentType: null,
      progress: 0,
      message: err instanceof Error ? err.message : "Analysis failed",
    });
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
      source: "mock",
    };
  }
}

/**
 * Process a goal into a structured course using Knock AI.
 * Tries: Edge Function → Go Backend → Mock
 */
export async function processGoal(
  goalId: string,
  title: string,
  description: string,
): Promise<AiServiceResult<GoalCourseResponse>> {
  const blockReason = canKnock("goal");
  if (blockReason) {
    return { success: false, error: blockReason, source: "mock" };
  }

  setProcessing({ isProcessing: true, currentType: "goal", progress: 0, message: "Processing your goal…" });

  try {
    setProcessing({ progress: 20, message: "Generating course structure…" });

    // 1. Try Edge Function
    const edgeResult = await tryEdgeFunction<{ modules: GoalCourseResponse["modules"] }>("goal", {
      content: description,
      title,
    });

    if (edgeResult.success && edgeResult.data) {
      const course: GoalCourseResponse = {
        goalId,
        modules: edgeResult.data.modules,
      };
      recordKnock("goal");
      setProcessing({ isProcessing: false, currentType: null, progress: 100, message: "Course ready!" });
      return { success: true, data: course, source: "edge-function" };
    }

    setProcessing({ progress: 40, message: "Backend unavailable, trying local generation…" });

    // 2. Try Go Backend
    const goResult = await tryGoBackend<GoalCourseResponse>("goal", goalId);
    if (goResult.success && goResult.data) {
      recordKnock("goal");
      setProcessing({ isProcessing: false, currentType: null, progress: 100, message: "Course ready!" });
      return { success: true, data: goResult.data, source: "go-backend" };
    }

    setProcessing({ progress: 70, message: "Running local course generation…" });

    // 3. Fall back to mock
    const { mockProcessGoal } = await import("../api/client"); // dynamic import avoids circular
    const course = await mockProcessGoal(goalId);
    recordKnock("goal");
    setProcessing({ isProcessing: false, currentType: null, progress: 100, message: "Course ready!" });
    return { success: true, data: course, source: "mock" };
  } catch (err) {
    setProcessing({
      isProcessing: false,
      currentType: null,
      progress: 0,
      message: err instanceof Error ? err.message : "Goal processing failed",
    });
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
      source: "mock",
    };
  }
}

/**
 * Polish a publication draft using the Knock AI engine.
 * Tries: Edge Function → Mock
 */
export async function knockPolish(
  content: string,
  title?: string,
): Promise<AiServiceResult<{ polished: string; summary: string; improvements: string[] }>> {
  const blockReason = canKnock("thought"); // reuse thought rate limit
  if (blockReason) {
    return { success: false, error: blockReason, source: "mock" };
  }

  setProcessing({ isProcessing: true, currentType: "polish", progress: 0, message: "Polishing your publication…" });

  try {
    setProcessing({ progress: 25, message: "Consulting Knock AI…" });

    // 1. Try Edge Function
    const edgeResult = await tryEdgeFunction<{ polished: string; summary: string; improvements: string[] }>(
      "polish",
      { content, title },
    );

    if (edgeResult.success && edgeResult.data) {
      recordKnock("thought");
      setProcessing({ isProcessing: false, currentType: null, progress: 100, message: "Polished!" });
      return { success: true, data: edgeResult.data, source: "edge-function" };
    }

    setProcessing({ progress: 50, message: "Running local polish…" });

    // 2. Fall back to mock
    const { mockPolish } = await import("../api/client");
    const mockResult = await mockPolish(content, title);
    recordKnock("thought");
    setProcessing({ isProcessing: false, currentType: null, progress: 100, message: "Polished!" });
    return { success: true, data: mockResult, source: "mock" };
  } catch (err) {
    setProcessing({
      isProcessing: false,
      currentType: null,
      progress: 0,
      message: err instanceof Error ? err.message : "Polishing failed",
    });
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
      source: "mock",
    };
  }
}

/* ─── Provider attempts ─── */

async function tryEdgeFunction<T>(
  type: "thought" | "goal" | "polish",
  params: { content: string; title?: string },
): Promise<AiServiceResult<T>> {
  try {
    const { data, error } = await supabase.functions.invoke("knock-ai", {
      body: {
        type,
        content: params.content,
        title: params.title,
        // Pass the frontend's Fireworks API key so the Edge Function can use it
        apiKey: CONFIG.fireworks.apiKey || undefined,
      },
    });

    if (error) throw new Error(error.message);

    if (type === "thought" && data?.analysis) {
      return { success: true, data: data.analysis as T, source: "edge-function" };
    }
    if (type === "goal" && data?.course) {
      return { success: true, data: data.course as T, source: "edge-function" };
    }
    if (type === "polish" && data?.result) {
      return { success: true, data: data.result as T, source: "edge-function" };
    }

    throw new Error("Unexpected response format");
  } catch (err) {
    console.warn("Edge function call failed:", err);
    return { success: false, error: "Edge function unavailable", source: "edge-function" };
  }
}

async function tryGoBackend<T>(
  type: "thought" | "goal",
  id: string,
): Promise<AiServiceResult<T>> {
  try {
    const token = (await supabase.auth.getSession()).data.session?.access_token;

    const endpoint = type === "thought"
      ? `${CONFIG.goBackend.url}/api/ai/knock/thought`
      : `${CONFIG.goBackend.url}/api/ai/process/goal`;

    const body = type === "thought" ? { thoughtId: id } : { goalId: id };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Backend error ${res.status}`);

    const result = await res.json();
    return { success: true, data: result as T, source: "go-backend" };
  } catch (err) {
    console.warn("Go backend call failed:", err);
    return { success: false, error: "Go backend unavailable", source: "go-backend" };
  }
}