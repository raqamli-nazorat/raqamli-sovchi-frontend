import { useState, useEffect } from "react";
import { X, Check, BrushCleaning } from "lucide-react";
import Select from "../../components/ui/Select";
import { DatePicker } from "../../components/ui/DatePicker";
import { REF_APIS } from "../References/referencesApi";
import dayjs from "dayjs";

export interface UserFilters {
  region?: string;
  district?: string;
  candidate_type?: string;
  auth_provider?: string;
  role?: string;
  status?: string;
  created_at_after?: Date | null;
  created_at_before?: Date | null;
  updated_at_after?: Date | null;
  updated_at_before?: Date | null;
  search?: string;
}

interface UserFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: UserFilters) => void;
  initialFilters?: UserFilters;
}

const CANDIDATE_TYPE_OPTIONS = [
  { value: "Kuyov", label: "Kuyov" },
  { value: "Kelin", label: "Kelin" },
  { value: "Vakil", label: "Vakil" },
];

const AUTH_PROVIDER_OPTIONS = [
  { value: "phone", label: "Telefon raqami" },
  { value: "telegram", label: "Telegram" },
  { value: "google", label: "Google" },
  { value: "representative", label: "Vakil orqali" },
];

const ROLE_OPTIONS = [
  { value: "Nomzod", label: "Nomzod" },
  { value: "Vakil", label: "Vakil" },
];

const STATUS_OPTIONS = [
  { value: "Tasdiqlangan", label: "Tasdiqlangan" },
  { value: "Anketa to'liq emas", label: "Anketa to'liq emas" },
  { value: "Bloklangan", label: "Bloklangan" },
];

const DEFAULT_FILTERS: UserFilters = {
  region: "",
  district: "",
  candidate_type: "",
  auth_provider: "",
  role: "",
  status: "",
  created_at_after: null,
  created_at_before: null,
  updated_at_after: null,
  updated_at_before: null,
};

const UserFilterModal = ({
  isOpen,
  onClose,
  onApply,
  initialFilters = {},
}: UserFilterModalProps) => {
  const [filters, setFilters] = useState<UserFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });

  const [regionOptions, setRegionOptions] = useState<{ value: string; label: string }[]>([]);
  const [districtOptions, setDistrictOptions] = useState<{ value: string; label: string }[]>([]);
  const [allDistricts, setAllDistricts] = useState<any[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setFilters({
        ...DEFAULT_FILTERS,
        ...initialFilters,
      });
    }
  }, [isOpen, initialFilters]);

  // Load regions & districts
  useEffect(() => {
    if (!isOpen) return;

    const fetchLocations = async () => {
      setLoadingLocations(true);
      try {
        const [regionsRes, districtsRes] = await Promise.allSettled([
          REF_APIS.regions.list(),
          REF_APIS.districts.list(),
        ]);

        if (regionsRes.status === "fulfilled" && Array.isArray(regionsRes.value)) {
          setRegionOptions(
            regionsRes.value.map((r: any) => ({
              value: String(r.id || r.name),
              label: r.name || String(r.id),
            }))
          );
        }

        if (districtsRes.status === "fulfilled" && Array.isArray(districtsRes.value)) {
          setAllDistricts(districtsRes.value);
          setDistrictOptions(
            districtsRes.value.map((d: any) => ({
              value: String(d.id || d.name),
              label: d.name || String(d.id),
            }))
          );
        }
      } catch (err) {
        console.error("Locations fetch error:", err);
      } finally {
        setLoadingLocations(false);
      }
    };

    fetchLocations();
  }, [isOpen]);

  // Filter districts when region changes
  useEffect(() => {
    if (!filters.region) {
      setDistrictOptions(
        allDistricts.map((d: any) => ({
          value: String(d.id || d.name),
          label: d.name || String(d.id),
        }))
      );
      return;
    }

    const filtered = allDistricts.filter(
      (d: any) =>
        String(d.region) === String(filters.region) ||
        String(d.region_id) === String(filters.region) ||
        d.region_name?.toLowerCase() === filters.region?.toLowerCase()
    );

    if (filtered.length > 0) {
      setDistrictOptions(
        filtered.map((d: any) => ({
          value: String(d.id || d.name),
          label: d.name || String(d.id),
        }))
      );
    } else {
      setDistrictOptions(
        allDistricts.map((d: any) => ({
          value: String(d.id || d.name),
          label: d.name || String(d.id),
        }))
      );
    }
  }, [filters.region, allDistricts]);

  if (!isOpen) return null;

  const setVal = (key: keyof UserFilters, val: any) => {
    setFilters((prev) => ({ ...prev, [key]: val }));
  };

  const handleClear = () => {
    setFilters({ ...DEFAULT_FILTERS });
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-in fade-in duration-200">
      <div className="w-full max-w-[560px] bg-white dark:bg-[#141414] rounded-2xl border border-[#e5e5e5] dark:border-[#262626] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-[#F5F5F5] dark:border-[#262626] shrink-0">
          <h2 className="text-[17px] font-bold text-[#0A0A0A] dark:text-[#fafafa]">
            Filtr
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4.5 min-h-0">
          {/* Row 1: Viloyat & Tuman */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#0A0A0A] dark:text-[#fafafa] mb-1.5">
                Viloyat
              </label>
              <Select
                value={filters.region || ""}
                onChange={(v) => {
                  setVal("region", v);
                  setVal("district", "");
                }}
                placeholder={loadingLocations ? "Yuklanmoqda..." : "Viloyat tanlang"}
                options={regionOptions}
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#0A0A0A] dark:text-[#fafafa] mb-1.5">
                Tuman
              </label>
              <Select
                value={filters.district || ""}
                onChange={(v) => setVal("district", v)}
                placeholder={loadingLocations ? "Yuklanmoqda..." : "Tuman tanlang"}
                options={districtOptions}
              />
            </div>
          </div>

          {/* Row 2: Turi & Ro'yxatdan o'tgan usul */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#0A0A0A] dark:text-[#fafafa] mb-1.5">
                Turi
              </label>
              <Select
                value={filters.candidate_type || ""}
                onChange={(v) => setVal("candidate_type", v)}
                placeholder="Turini tanlang"
                options={CANDIDATE_TYPE_OPTIONS}
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#0A0A0A] dark:text-[#fafafa] mb-1.5">
                Ro'yxatdan o'tgan usul
              </label>
              <Select
                value={filters.auth_provider || ""}
                onChange={(v) => setVal("auth_provider", v)}
                placeholder="Usulni tanlang"
                options={AUTH_PROVIDER_OPTIONS}
              />
            </div>
          </div>

          {/* Row 3: Rol & Holat */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#0A0A0A] dark:text-[#fafafa] mb-1.5">
                Rol
              </label>
              <Select
                value={filters.role || ""}
                onChange={(v) => setVal("role", v)}
                placeholder="Rolni tanlang"
                options={ROLE_OPTIONS}
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#0A0A0A] dark:text-[#fafafa] mb-1.5">
                Holat
              </label>
              <Select
                value={filters.status || ""}
                onChange={(v) => setVal("status", v)}
                placeholder="Holatni tanlang"
                options={STATUS_OPTIONS}
              />
            </div>
          </div>

          {/* Row 4: Yaratilgan sana */}
          <div>
            <label className="block text-[13px] font-medium text-[#0A0A0A] dark:text-[#fafafa] mb-1.5">
              Yaratilgan sana
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DatePicker
                prefixLabel="dan"
                showTime
                defaultTime="start"
                value={filters.created_at_after}
                onChange={(d) => setVal("created_at_after", d)}
                widthClass="w-full"
                placeholder="01.01.2026 00:00"
              />
              <DatePicker
                prefixLabel="gacha"
                showTime
                defaultTime="end"
                value={filters.created_at_before}
                onChange={(d) => setVal("created_at_before", d)}
                widthClass="w-full"
                placeholder="31.12.2026 23:59"
              />
            </div>
          </div>

          {/* Row 5: Yangilangan sana */}
          <div>
            <label className="block text-[13px] font-medium text-[#0A0A0A] dark:text-[#fafafa] mb-1.5">
              Yangilangan sana
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DatePicker
                prefixLabel="dan"
                showTime
                defaultTime="start"
                value={filters.updated_at_after}
                onChange={(d) => setVal("updated_at_after", d)}
                widthClass="w-full"
                placeholder="01.01.2026 00:00"
              />
              <DatePicker
                prefixLabel="gacha"
                showTime
                defaultTime="end"
                value={filters.updated_at_before}
                onChange={(d) => setVal("updated_at_before", d)}
                widthClass="w-full"
                placeholder="31.12.2026 23:59"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-[#F5F5F5] dark:border-[#262626] shrink-0 bg-white dark:bg-[#141414]">
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] font-medium text-[#404040] dark:text-[#e5e5e5] hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <BrushCleaning size={16} className="text-[#737373] dark:text-[#a3a3a3]" />
            Tozalash
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] font-medium text-[#404040] dark:text-[#e5e5e5] hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X size={16} className="text-[#737373] dark:text-[#a3a3a3]" />
              Bekor qilish
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#0474F3] hover:bg-[#023399] active:bg-[#0474F3] text-white rounded-xl text-[13px] font-medium transition-colors cursor-pointer shadow-sm"
            >
              <Check size={16} strokeWidth={2.5} />
              Qo'llash
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserFilterModal;
