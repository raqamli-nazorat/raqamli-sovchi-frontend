import { X, Trash2 } from "lucide-react";

interface RefDeleteModalProps {
  // «{name}» {noun} o'chirasizmi?
  name: string;
  noun: string;
  note: string;
  // to'ldirilgan bo'lsa — o'chirishni bloklaydigan sabab (qizil ogohlantirish)
  blockReason?: string | null;
  deleting: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

const RefDeleteModal = ({
  name,
  noun,
  note,
  blockReason,
  deleting,
  error,
  onClose,
  onConfirm,
}: RefDeleteModalProps) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-[440px] bg-white dark:bg-[#141414] rounded-[20px] border border-[#e5e5e5] dark:border-[#262626] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <Trash2 className="w-7 h-7 text-[#DC2626]" strokeWidth={2} />

        <h3 className="text-[16px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-4">
          «{name}» {noun} o'chirasizmi?
        </h3>
        <p className="text-[13px] text-[#525252] dark:text-[#a3a3a3] leading-relaxed mt-2">{note}</p>

        {blockReason && (
          <div className="mt-3 px-3.5 py-3 bg-[#FEF2F2] dark:bg-red-950/20 rounded-xl">
            <p className="text-[12.5px] text-[#DC2626] dark:text-red-400 leading-relaxed">
              {blockReason}
            </p>
          </div>
        )}

        {error && <p className="text-[12px] text-[#D32F2F] mt-3">{error}</p>}

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-5 py-2.5 flex items-center gap-2 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] font-semibold text-[#404040] dark:text-[#e5e5e5] hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 shrink-0" strokeWidth={2} />
            Bekor qilish
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting || !!blockReason}
            className="px-5 py-2.5 flex items-center gap-2 bg-[#DC2626] hover:bg-[#B91C1C] active:bg-[#7F1D1D] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-[13px] font-semibold transition-colors cursor-pointer"
          >
            {deleting ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 shrink-0" strokeWidth={2} />
            )}
            O'chirish
          </button>
        </div>
      </div>
    </div>
  );
};

export default RefDeleteModal;
