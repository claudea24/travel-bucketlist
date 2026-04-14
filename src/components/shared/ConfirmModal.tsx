"use client";

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", danger = false, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 text-center">
          <div className={`w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl ${danger ? "bg-rose-50" : "bg-teal-50"}`}>
            {danger ? "🗑️" : "❓"}
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-2">{message}</p>
        </div>
        <div className="flex border-t border-gray-100">
          <button onClick={onCancel}
            className="flex-1 py-3.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            {cancelLabel}
          </button>
          <button onClick={onConfirm}
            className={`flex-1 py-3.5 text-sm font-medium transition-colors border-l border-gray-100 ${
              danger ? "text-rose-600 hover:bg-rose-50" : "text-teal-600 hover:bg-teal-50"
            }`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
