/**
 * Guest Storage — localStorage-based persistence for non-authenticated users.
 *
 * Mirrors the Supabase-backed API layer but saves everything to localStorage
 * under a `guest_vault` namespace. On first use it seeds empty arrays.
 */

import type { Thought } from "../types/thought";
import type { Goal } from "../types/goal";
import type { Publication } from "../types/publication";

/* ─── Storage key ─── */

const STORAGE_KEY = "vital_vault_guest";

/* ─── Types ─── */

export interface GuestData {
  thoughts: Thought[];
  goals: Goal[];
  publications: Publication[];
}

/* ─── Defaults ─── */

function emptyData(): GuestData {
  return { thoughts: [], goals: [], publications: [] };
}

/* ─── Read / Write ─── */

function load(): GuestData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    return JSON.parse(raw) as GuestData;
  } catch {
    return emptyData();
  }
}

function save(data: GuestData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/* ─── Public API ─── */

export function getGuestThoughts(): Thought[] {
  return load().thoughts;
}

export function setGuestThoughts(thoughts: Thought[]): void {
  const data = load();
  data.thoughts = thoughts;
  save(data);
}

export function addGuestThought(thought: Thought): void {
  const data = load();
  data.thoughts.unshift(thought);
  save(data);
}

export function updateGuestThought(
  id: string,
  partial: Partial<Thought>,
): Thought[] {
  const data = load();
  const updated = data.thoughts.map((t) =>
    t.id === id ? { ...t, ...partial, updated_at: new Date().toISOString() } : t,
  );
  data.thoughts = updated;
  save(data);
  return updated;
}

export function deleteGuestThought(id: string): void {
  const data = load();
  data.thoughts = data.thoughts.filter((t) => t.id !== id);
  save(data);
}

export function getGuestGoals(): Goal[] {
  return load().goals;
}

export function setGuestGoals(goals: Goal[]): void {
  const data = load();
  data.goals = goals;
  save(data);
}

export function addGuestGoal(goal: Goal): void {
  const data = load();
  data.goals.unshift(goal);
  save(data);
}

export function updateGuestGoal(id: string, partial: Partial<Goal>): Goal[] {
  const data = load();
  const updated = data.goals.map((g) =>
    g.id === id ? { ...g, ...partial, updated_at: new Date().toISOString() } : g,
  );
  data.goals = updated;
  save(data);
  return updated;
}

export function deleteGuestGoal(id: string): void {
  const data = load();
  data.goals = data.goals.filter((g) => g.id !== id);
  save(data);
}

/* ─── Publications ─── */

export function getGuestPublications(): Publication[] {
  return load().publications;
}

export function setGuestPublications(publications: Publication[]): void {
  const data = load();
  data.publications = publications;
  save(data);
}

export function addGuestPublication(publication: Publication): void {
  const data = load();
  data.publications.unshift(publication);
  save(data);
}

export function updateGuestPublication(
  id: string,
  partial: Partial<Publication>,
): Publication[] {
  const data = load();
  const updated = data.publications.map((p) =>
    p.id === id ? { ...p, ...partial, updated_at: new Date().toISOString() } : p,
  );
  data.publications = updated;
  save(data);
  return updated;
}

export function deleteGuestPublication(id: string): void {
  const data = load();
  data.publications = data.publications.filter((p) => p.id !== id);
  save(data);
}

export function clearGuestData(): void {
  localStorage.removeItem(STORAGE_KEY);
}