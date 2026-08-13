"use client";

import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

// Replaces window.confirm() with a proper in-app modal
// Props: isOpen, title, message, onConfirm, onCancel, confirmLabel, loading
export default function ConfirmModal({
  isOpen,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmLabel = "Delete",
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark overlay — clicking it cancels */}
      <div
        className="absolute inset-0 bg-black/25 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="relative bg-white border border-[#e8e2d8] rounded-2xl shadow-xl p-6 w-full max-w-sm z-10"
      >
        {/* Warning icon */}
        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-4">
          <AlertTriangle className="w-5 h-5 text-red-500" />
        </div>

        <h3 className="text-base font-bold text-[#1a1714] mb-1">{title}</h3>
        <p className="text-sm text-[#7a6f65] mb-6">{message}</p>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-[#e8e2d8] text-sm font-medium text-[#7a6f65] hover:bg-[#f8f6f2] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-all disabled:opacity-50"
          >
            {loading ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
