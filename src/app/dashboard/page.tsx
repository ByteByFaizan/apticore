/* ═══════════════════════════════════════════════
   Dashboard Page — Orchestrator
   Composes all sub-components by active view.
   ═══════════════════════════════════════════════ */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthStore, useBatchStore, useDashboardStore } from "@/lib/store";

import DashboardHeader from "./components/DashboardHeader";
import StatsRow from "./components/StatsRow";
import BatchList from "./components/BatchList";
import CandidateList from "./components/CandidateList";
import BiasReportView from "./components/BiasReportView";
import CreateBatchModal from "./components/CreateBatchModal";

/* Statuses that indicate active processing — triggers auto-polling */
const ACTIVE_STATUSES = new Set([
  "UPLOADING", "PARSING", "ANALYZING_BIAS_BEFORE", "ANONYMIZING",
  "MATCHING", "RANKING", "EXPLAINING", "ANALYZING_BIAS_AFTER",
]);

export default function DashboardPage() {
  const { user } = useAuthStore();
  const {
    batches,
    activeBatch,
    candidates,
    biasReport,
    loading,
    error,
    fetchBatches,
    pollBatches,
    fetchBatch,
    fetchCandidates,
    fetchBiasReport,
    createBatch,
    processBatch,
    deleteBatch,
    clearError,
  } = useBatchStore();
  const { selectedView, setView } = useDashboardStore();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch batches on mount
  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  // Auto-poll while any batch is actively processing
  // Uses pollBatches (silent) to avoid layout flicker from loading state
  const hasActiveBatch = batches.some((b) => ACTIVE_STATUSES.has(b.status));
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (hasActiveBatch) {
      pollRef.current = setInterval(() => {
        pollBatches();
      }, 2000); // 2s for snappier updates
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [hasActiveBatch, pollBatches]);

  // View batch: switch tab immediately, fetch data in background
  const handleViewBatch = useCallback(
    async (batchId: string) => {
      setView("candidates");
      await Promise.all([
        fetchBatch(batchId),
        fetchCandidates(batchId),
        fetchBiasReport(batchId),
      ]);
    },
    [fetchBatch, fetchCandidates, fetchBiasReport, setView]
  );

  // Process batch
  const handleProcess = useCallback(
    async (batchId: string) => {
      await processBatch(batchId);
    },
    [processBatch]
  );

  // Retry failed batch (re-runs the processing pipeline)
  const handleRetry = useCallback(
    async (batchId: string) => {
      await processBatch(batchId);
    },
    [processBatch]
  );

  // Delete batch
  const handleDelete = useCallback(
    async (batchId: string) => {
      await deleteBatch(batchId);
    },
    [deleteBatch]
  );

  // Create batch
  const handleCreate = useCallback(
    async (jdText: string, files: File[]) => {
      return createBatch(jdText, files);
    },
    [createBatch]
  );

  return (
    <div>
      {/* ── Error banner ── */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between animate-fade-in-up">
          <span>{error}</span>
          <button
            onClick={clearError}
            className="text-red-400 hover:text-red-600 cursor-pointer p-1"
            aria-label="Dismiss error"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Overview ── */}
      {selectedView === "overview" && (
        <>
          <DashboardHeader
            userName={user?.displayName || "Recruiter"}
            onCreateBatch={() => setShowCreateModal(true)}
          />
          <StatsRow batches={batches} />
          <BatchList
            batches={batches}
            loading={loading}
            onViewBatch={handleViewBatch}
            onProcessBatch={handleProcess}
            onRetryBatch={handleRetry}
            onDeleteBatch={handleDelete}
            onCreateBatch={() => setShowCreateModal(true)}
          />
        </>
      )}

      {/* ── Candidates ── */}
      {selectedView === "candidates" && (
        <CandidateList activeBatch={activeBatch} candidates={candidates} />
      )}

      {/* ── Bias Report ── */}
      {selectedView === "bias-report" && (
        <BiasReportView biasReport={biasReport} />
      )}

      {/* ── Create Modal ── */}
      <CreateBatchModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
