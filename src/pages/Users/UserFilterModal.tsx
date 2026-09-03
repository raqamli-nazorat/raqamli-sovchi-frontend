import { useState, useEffect } from "react";
import { X, Check, BrushCleaning } from "lucide-react";
import Select from "../../components/ui/Select";
import { DatePicker } from "../../components/ui/DatePicker";
import { REF_APIS } from "../References/referencesApi";
import dayjs from "dayjs";
import { HugeIcon } from "@/components/ui/HugeIcon";
import { CleanIcon } from "@hugeicons/core-free-icons";

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
  const [roleOptions, setRoleOptions] = useState<{ value: string; label: string }[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loadingMoreRoles, setLoadingMoreRoles] = useState(false);
  const [rolesPage, setRolesPage] = useState(1);
  const [hasMoreRoles, setHasMoreRoles] = useState(false);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setFilters({
        ...DEFAULT_FILTERS,
        ...initialFilters,
      });
    }
  }, [isOpen, initialFilters]);

  // Fetch roles with pagination
  const fetchRoles = async (pageNumber: number, isInitial: boolean = false) => {
    if (isInitial) {
      setLoadingRoles(true);
    } else {
      setLoadingMoreRoles(true);
    }
    try {
      const res: any = await REF_APIS.roles.list({ page: pageNumber });
      const newItems = Array.isArray(res) ? res : [];
      const mapped = newItems.map((r: any) => ({
        value: String(r.id || r.name),
        label: r.name || String(r.id),
      }));

      if (isInitial) {
        setRoleOptions(mapped.length > 0 ? mapped : ROLE_OPTIONS);
      } else {
        setRoleOptions((prev) => {
          const existing = new Set(prev.map((o) => o.value));
          const unique = mapped.filter((o: any) => !existing.has(o.value));
          return [...prev, ...unique];
        });
      }

      const hasNext = Boolean(res?.next !== null && res?.next !== undefined && newItems.length > 0);
      setHasMoreRoles(hasNext);
      setRolesPage(pageNumber);
    } catch (err) {
      console.error("Roles fetch error:", err);
      if (isInitial) {
        setRoleOptions(ROLE_OPTIONS);
      }
      setHasMoreRoles(false);
    } finally {
      setLoadingRoles(false);
      setLoadingMoreRoles(false);
    }
  };

  const handleLoadMoreRoles = () => {
    if (!loadingRoles && !loadingMoreRoles && hasMoreRoles) {
      fetchRoles(rolesPage + 1, false);
    }
  };

  // Load regions & initial roles when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchInitialData = async () => {
      setLoadingLocations(true);
      try {
        const regionsRes = await REF_APIS.regions.list();
        if (Array.isArray(regionsRes)) {
          setRegionOptions(
            regionsRes.map((r: any) => ({
              value: String(r.id),
              label: r.name || String(r.id),
            }))
          );
        }
      } catch (err) {
        console.error("Regions fetch error:", err);
      } finally {
        setLoadingLocations(false);
      }
    };

    fetchInitialData();
    fetchRoles(1, true);
  }, [isOpen]);

  // Fetch districts from API with region query param whenever filters.region changes
  useEffect(() => {
    if (!isOpen) return;

    const fetchDistricts = async () => {
      setLoadingDistricts(true);
      try {
        const params = filters.region ? { region: filters.region } : undefined;
        const res = await REF_APIS.districts.list(params);
        if (Array.isArray(res)) {
          setDistrictOptions(
            res.map((d: any) => ({
              value: String(d.id || d.name),
              label: d.name || String(d.id),
            }))
          );
        } else {
          setDistrictOptions([]);
        }
      } catch (err) {
        console.error("Districts fetch error:", err);
        setDistrictOptions([]);
      } finally {
        setLoadingDistricts(false);
      }
    };

    fetchDistricts();
  }, [filters.region, isOpen]);

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
        <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-4.5 min-h-0">
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
                placeholder={
                  loadingDistricts
                    ? "Yuklanmoqda..."
                    : !filters.region
                    ? "Tuman tanlang"
                    : districtOptions.length === 0
                    ? "Tumanlar mavjud emas"
                    : "Tuman tanlang"
                }
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
                placeholder={loadingRoles ? "Yuklanmoqda..." : "Rolni tanlang"}
                options={roleOptions.length > 0 ? roleOptions : ROLE_OPTIONS}
                hasMore={hasMoreRoles}
                loadingMore={loadingMoreRoles}
                onLoadMore={handleLoadMoreRoles}
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
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-[13px] font-medium text-[#404040] dark:text-[#e5e5e5] hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <HugeIcon icon={CleanIcon} size={16} className="text-[#737373] dark:text-[#a3a3a3]" />
            Tozalash
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-[13px] font-medium text-[#404040] dark:text-[#e5e5e5] hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X size={16} className="text-[#737373] dark:text-[#a3a3a3]" />
              Bekor qilish
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#0474F3] hover:bg-[#023399] active:bg-[#0474F3] text-white rounded-lg text-[13px] font-medium transition-colors cursor-pointer shadow-sm"
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
