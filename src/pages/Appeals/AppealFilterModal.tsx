import React, { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import Select from "../../components/ui/Select";
import { DatePicker } from "../../components/ui/DatePicker";
import { HugeIcon } from "@/components/ui/HugeIcon";
import { CleanIcon } from "@hugeicons/core-free-icons";
import { COMPLAINT_REASONS } from "../../lib/complaintsApi";

export interface AppealFilters {
  reason?: string;
  status?: string;
  start_date?: Date | null;
  end_date?: Date | null;
}

interface AppealFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: AppealFilters) => void;
  initialFilters: AppealFilters;
}

const REASON_OPTIONS = [
  "Barchasi",
  ...COMPLAINT_REASONS.map((r) => r.label),
];

const STATUS_OPTIONS = [
  "Barchasi",
  "Ko'rib chiqilmoqda",
  "Tasdiqlandi",
  "Bekor qilindi",
];

const AppealFilterModal: React.FC<AppealFilterModalProps> = ({
  isOpen,
  onClose,
  onApply,
  initialFilters,
}) => {
  const [reason, setReason] = useState<string>(initialFilters.reason || "Barchasi");
  const [status, setStatus] = useState<string>(initialFilters.status || "Barchasi");
  const [startDate, setStartDate] = useState<Date | null>(initialFilters.start_date || null);
  const [endDate, setEndDate] = useState<Date | null>(initialFilters.end_date || null);

  useEffect(() => {
    if (isOpen) {
      setReason(initialFilters.reason || "Barchasi");
      setStatus(initialFilters.status || "Barchasi");
      setStartDate(initialFilters.start_date || null);
      setEndDate(initialFilters.end_date || null);
    }
  }, [isOpen, initialFilters]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApply({
      reason: reason === "Barchasi" ? undefined : reason,
      status: status === "Barchasi" ? undefined : status,
      start_date: startDate,
      end_date: endDate,
    });
    onClose();
  };

  const handleReset = () => {
    setReason("Barchasi");
    setStatus("Barchasi");
    setStartDate(null);
    setEndDate(null);
    onApply({});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="w-full max-w-[500px] bg-white dark:bg-[#141414] rounded-2xl border border-[#e5e5e5] dark:border-[#262626] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4">
          <h3 className="text-[18px] font-bold text-[#0A0A0A] dark:text-[#fafafa]">
            Filtr
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 pt-2">
          {/* Sababi dropdown */}
          <div>
            <label className="text-[13px] font-medium text-[#525252] dark:text-zinc-300 block mb-1.5">
              Sababi
            </label>
            <Select
              value={reason}
              onChange={setReason}
              options={REASON_OPTIONS}
              placeholder="Sababni tanlang"
            />
          </div>

          {/* Yaratilgan sana */}
          <div>
            <label className="text-[13px] font-medium text-[#525252] dark:text-zinc-300 block mb-1.5">
              Yaratilgan sana
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DatePicker
                prefixLabel="dan"
                showTime
                defaultTime="start"
                value={startDate}
                onChange={(d) => setStartDate(d)}
                widthClass="w-full"
                placeholder="01.01.2026 00:00"
              />
              <DatePicker
                prefixLabel="gacha"
                showTime
                defaultTime="end"
                value={endDate}
                onChange={(d) => setEndDate(d)}
                widthClass="w-full"
                placeholder="31.12.2026 23:59"
              />
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between gap-3 pt-6 mt-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] font-medium text-[#404040] dark:text-[#e5e5e5] hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <HugeIcon icon={CleanIcon} size={16} className="text-[#737373] dark:text-[#a3a3a3]" />
            <span>Tozalash</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] font-medium text-[#404040] dark:text-[#e5e5e5] hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X size={16} className="text-[#737373] dark:text-[#a3a3a3]" />
              <span>Bekor qilish</span>
            </button>

            <button
              type="button"
              onClick={handleApply}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#0474F3] hover:bg-[#0360cb] active:scale-[0.99] text-white rounded-xl text-[13px] font-semibold transition-all cursor-pointer shadow-xs"
            >
              <Check size={16} strokeWidth={2.5} />
              <span>Qo'llash</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AppealFilterModal;
