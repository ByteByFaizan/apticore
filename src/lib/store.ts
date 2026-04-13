/* ═══════════════════════════════════════════════
   Zustand Stores — Client-Side State Management
   ═══════════════════════════════════════════════ */

import { create } from "zustand";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "./firebase";
import type { JobBatch, CandidateResult, BiasReport } from "./types";

// ── Auth Store ──
interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  initAuth: () => () => void; // returns unsubscribe
  logout: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  initialized: false,

  initAuth: () => {
    if (!get().initialized) {
      set({ loading: true });
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      set({ user, loading: false, initialized: true });
    });
    return unsubscribe;
  },

  logout: async () => {
    await signOut(auth);
    set({ user: null });
  },

  getIdToken: async () => {
    const { user } = get();
    if (!user) return null;
    return user.getIdToken();
  },
}));

// ── API Fetch Helper ──
// Handles new standardized { success, data, error } response format

interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: string | null;
}

async function apiFetch<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const token = await useAuthStore.getState().getIdToken();
  if (!token) throw new Error("Not authenticated");

  // Build headers — always include Authorization
  // For FormData, don't set Content-Type (browser sets it with boundary)
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  // Merge custom headers, but preserve Authorization
  if (options?.headers) {
    const customHeaders = options.headers as Record<string, string>;
    for (const [key, value] of Object.entries(customHeaders)) {
      if (key.toLowerCase() !== "authorization" && value) {
        headers[key] = value;
      }
    }
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  // Parse response
  const json: ApiResponse<T> = await response.json().catch(() => ({
    success: false,
    data: null,
    error: `API error: ${response.status}`,
  }));

  // Handle standardized error format
  if (!response.ok || !json.success) {
    throw new Error(json.error || `API error: ${response.status}`);
  }

  return json.data as T;
}

// ── Batch Store ──
interface BatchState {
  batches: JobBatch[];
  activeBatch: JobBatch | null;
  candidates: CandidateResult[];
  biasReport: BiasReport | null;
  loading: boolean;
  error: string | null;

  fetchBatches: () => Promise<void>;
  fetchBatch: (batchId: string) => Promise<void>;
  fetchCandidates: (batchId: string, view?: string) => Promise<void>;
  fetchBiasReport: (batchId: string) => Promise<void>;
  createBatch: (jdText: string, files: File[]) => Promise<string | null>;
  processBatch: (batchId: string) => Promise<void>;
  deleteBatch: (batchId: string) => Promise<boolean>;
  clearError: () => void;
}

export const useBatchStore = create<BatchState>((set, get) => ({
  batches: [],
  activeBatch: null,
  candidates: [],
  biasReport: null,
  loading: false,
  error: null,

  fetchBatches: async () => {
    set({ loading: true, error: null });
    try {
      const data = await apiFetch<{ batches: JobBatch[]; total: number }>("/api/batch/list");
      set({ batches: data.batches, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to fetch batches", loading: false });
    }
  },

  fetchBatch: async (batchId: string) => {
    set({ loading: true, error: null });
    try {
      const data = await apiFetch<{ batch: JobBatch }>(`/api/batch/${batchId}`);
      set({ activeBatch: data.batch, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to fetch batch", loading: false });
    }
  },

  fetchCandidates: async (batchId: string, view?: string) => {
    set({ loading: true, error: null });
    try {
      const query = view ? `?view=${view}` : "";
      const data = await apiFetch<{ candidates: CandidateResult[]; total: number }>(
        `/api/batch/${batchId}/candidates${query}`
      );
      set({ candidates: data.candidates, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to fetch candidates", loading: false });
    }
  },

  fetchBiasReport: async (batchId: string) => {
    set({ loading: true, error: null });
    try {
      const data = await apiFetch<{ report: BiasReport }>(`/api/batch/${batchId}/bias-report`);
      set({ biasReport: data.report, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to fetch bias report", loading: false });
    }
  },

  createBatch: async (jdText: string, files: File[]) => {
    set({ loading: true, error: null });
    try {
      // Step 1: Create batch
      const createData = await apiFetch<{ batchId: string; message: string }>("/api/batch/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jdText, fileCount: files.length }),
      });

      const batchId = createData.batchId;

      // Step 2: Upload files sequentially (avoid overwhelming server)
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("batchId", batchId);

        await apiFetch("/api/batch/upload", {
          method: "POST",
          body: formData,
          // Don't set Content-Type — browser sets multipart boundary automatically
        });
      }

      set({ loading: false });
      // Refresh batch list
      get().fetchBatches();
      return batchId;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to create batch", loading: false });
      return null;
    }
  },

  processBatch: async (batchId: string) => {
    set({ loading: true, error: null });
    try {
      await apiFetch("/api/batch/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId }),
      });
      // Fetch updated batch
      get().fetchBatch(batchId);
      set({ loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to process batch", loading: false });
    }
  },

  deleteBatch: async (batchId: string) => {
    // Optimistic: remove from UI immediately
    const prevBatches = get().batches;
    const prevActive = get().activeBatch;
    set((state) => ({
      batches: state.batches.filter((b) => b.id !== batchId),
      activeBatch: state.activeBatch?.id === batchId ? null : state.activeBatch,
      error: null,
    }));

    try {
      await apiFetch("/api/batch/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId }),
      });
      return true;
    } catch (err) {
      // Rollback on failure
      set({
        batches: prevBatches,
        activeBatch: prevActive,
        error: err instanceof Error ? err.message : "Failed to delete batch",
      });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));

// ── Dashboard UI Store ──
interface DashboardState {
  selectedView: "overview" | "candidates" | "bias-report";
  comparisonMode: boolean;
  showAnonymized: boolean;
  setView: (view: DashboardState["selectedView"]) => void;
  toggleComparison: () => void;
  toggleAnonymized: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  selectedView: "overview",
  comparisonMode: false,
  showAnonymized: true,

  setView: (view) => set({ selectedView: view }),
  toggleComparison: () => set((s) => ({ comparisonMode: !s.comparisonMode })),
  toggleAnonymized: () => set((s) => ({ showAnonymized: !s.showAnonymized })),
}));
