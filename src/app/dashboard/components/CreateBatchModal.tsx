"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface CreateBatchModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (jdText: string, files: File[]) => Promise<string | null>;
}

export default function CreateBatchModal({
  open,
  onClose,
  onCreate,
}: CreateBatchModalProps) {
  const [jdText, setJdText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [creating, setCreating] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleCreate = useCallback(async () => {
    if (!jdText.trim() || jdText.trim().length < 50 || files.length === 0)
      return;
    setCreating(true);
    const batchId = await onCreate(jdText, files);
    setCreating(false);
    if (batchId) {
      setJdText("");
      setFiles([]);
      onClose();
    }
  }, [jdText, files, onCreate, onClose]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files).filter(
      (f) =>
        f.type === "application/pdf" ||
        f.name.endsWith(".docx") ||
        f.name.endsWith(".doc")
    );
    if (dropped.length > 0) setFiles((prev) => [...prev, ...dropped]);
  }, []);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  if (!open) return null;

  const isReady = jdText.trim().length >= 50 && files.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        style={{
          animation: "fade-in 0.2s ease-out both",
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative bg-white w-full max-w-lg rounded-2xl border border-edge shadow-[0_20px_60px_rgba(0,0,0,0.12)] overflow-hidden"
        style={{
          animation: "fade-in-up 0.35s cubic-bezier(0.16,1,0.3,1) both",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-edge">
          <h2 className="text-lg font-semibold text-ink font-display tracking-tight">
            Create New Batch
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-faint hover:text-ink hover:bg-surface-alt transition-all cursor-pointer"
            aria-label="Close"
          >
            <svg
              width="16"
              height="16"
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

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* JD Input */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Job Description
            </label>
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste the full job description here…"
              rows={5}
              className="w-full border border-edge rounded-xl px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-accent/40 focus:shadow-[0_0_0_3px_rgba(91,160,143,0.1)] transition-all resize-none"
            />
            <p className="text-xs text-ink-faint mt-1">
              {jdText.trim().length < 50 ? (
                <span>
                  {50 - jdText.trim().length} more characters needed
                </span>
              ) : (
                <span className="text-emerald">✓ Ready</span>
              )}
            </p>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Resume Files
            </label>

            {/* Drop zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${
                dragOver
                  ? "border-accent bg-accent/5"
                  : "border-edge hover:border-ink-faint/30"
              }`}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-ink-faint mx-auto mb-2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <p className="text-sm text-ink-muted mb-1">
                Drag & drop PDF/DOCX files here
              </p>
              <label className="text-xs text-accent font-medium cursor-pointer hover:underline">
                or browse files
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,.doc"
                  onChange={(e) =>
                    setFiles((prev) => [
                      ...prev,
                      ...Array.from(e.target.files || []),
                    ])
                  }
                  className="sr-only"
                />
              </label>
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {files.map((file, i) => (
                  <div
                    key={`${file.name}-${i}`}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-alt text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-ink-faint shrink-0"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      <span className="text-ink truncate">{file.name}</span>
                    </div>
                    <button
                      onClick={() => removeFile(i)}
                      className="text-ink-faint hover:text-red-500 transition-colors cursor-pointer shrink-0 ml-2"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
                <p className="text-xs text-ink-muted">
                  {files.length} file{files.length > 1 ? "s" : ""} selected
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-edge bg-surface/30">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-ink-muted hover:text-ink transition-colors cursor-pointer rounded-lg hover:bg-surface-alt"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || !isReady}
            className="px-6 py-2.5 rounded-full bg-brand text-white text-sm font-medium hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-[0.97]"
          >
            {creating ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating…
              </span>
            ) : (
              "Create & Upload"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
