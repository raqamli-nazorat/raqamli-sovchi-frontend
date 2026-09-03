import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  Search,
  ChevronRight,
  SlidersHorizontal,
  AlertCircle,
  Inbox,
  RefreshCw,
} from "lucide-react";
import {
  complaintsApi,
  type ComplaintListItem,
  COMPLAINT_REASON_MAP,
  COMPLAINT_REASONS,
} from "../../lib/complaintsApi";
import { setComplaints } from "../../store/slices/appealsSlice";
import AppealFilterModal, { type AppealFilters } from "./AppealFilterModal";
import dayjs from "dayjs";

const getStatusBadge = (status: string, statusLabel?: string) => {
  const norm = status?.toLowerCase();
  if (norm === "in_review" || norm === "pending") {
    return (
      <span className="bg-[#FFFBEB] dark:bg-amber-950/40 text-[#92400E] dark:text-amber-400 font-semibold text-[11px] px-3 py-1 rounded-full inline-block">
        {statusLabel || "Ko'rib chiqilmoqda"}
      </span>
    );
  }
  if (norm === "approved") {
    return (
      <span className="bg-[#ECFDF5] dark:bg-[#103020] text-[#047857] dark:text-[#2ee088] font-semibold text-[11px] px-3 py-1 rounded-full inline-block">
        {statusLabel || "Tasdiqlandi"}
      </span>
    );
  }
  if (norm === "rejected") {
    return (
      <span className="bg-[#FEF2F2] dark:bg-red-950/40 text-[#7F1D1D] dark:text-red-400 font-semibold text-[11px] px-3 py-1 rounded-full inline-block">
        {statusLabel || "Bekor qilindi"}
      </span>
    );
  }
  return (
    <span className="bg-[#F5F5F5] dark:bg-zinc-800 text-[#737373] dark:text-zinc-400 font-medium text-[12px] px-3 py-1 rounded-full inline-block">
      {statusLabel || status}
    </span>
  );
};

const mapReasonFilterToEnum = (label?: string): string | undefined => {
  if (!label || label === "Barchasi") return undefined;
  const match = COMPLAINT_REASONS.find((r) => r.label.toLowerCase() === label.toLowerCase());
  return match ? match.value : label;
};

const mapStatusFilterToEnum = (label?: string): string | undefined => {
  if (!label || label === "Barchasi") return undefined;
  const norm = label.toLowerCase();
  if (norm.includes("ko'rib") || norm.includes("pending")) return "pending";
  if (norm.includes("tasdiq") || norm.includes("approved")) return "approved";
  if (norm.includes("bekor") || norm.includes("rejected")) return "rejected";
  return label;
};

const AppealsPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [complaints, setComplaintsList] = useState<ComplaintListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<AppealFilters>({});

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch Complaints from API (Scroll Pagination)
  const fetchComplaints = useCallback(
    async (pageNumber: number, isInitial = false) => {
      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      try {
        const reasonEnum = mapReasonFilterToEnum(filters.reason);
        const statusEnum = mapStatusFilterToEnum(filters.status);

        const params: any = {
          page: pageNumber,
        };

        if (debouncedSearch.trim()) {
          params.search = debouncedSearch.trim();
        }
        if (reasonEnum) {
          params.reason = reasonEnum;
        }
        if (statusEnum) {
          params.status = statusEnum;
        }
        if (filters.start_date) {
          params.start_date = dayjs(filters.start_date).format("YYYY-MM-DDTHH:mm:ss");
        }
        if (filters.end_date) {
          params.end_date = dayjs(filters.end_date).format("YYYY-MM-DDTHH:mm:ss");
        }

        const res = await complaintsApi.list(params);
        const newResults = res.results;

        if (isInitial) {
          setComplaintsList(newResults);
          dispatch(setComplaints({ items: newResults, count: res.count }));
        } else {
          setComplaintsList((prev) => {
            const existingIds = new Set(prev.map((item) => item.id));
            const filtered = newResults.filter((item) => !existingIds.has(item.id));
            const updated = [...prev, ...filtered];
            dispatch(setComplaints({ items: updated, count: res.count }));
            return updated;
          });
        }

        setHasMore(Boolean(res.next !== null && newResults.length > 0));
      } catch (err: any) {
        const apiErr =
          err.response?.data?.error?.errorMsg ||
          err.response?.data?.detail ||
          err.message;
        setError(apiErr || "Shikoyatlarni yuklashda xatolik yuz berdi.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [debouncedSearch, filters, dispatch]
  );

  // Initial load or search/filter change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchComplaints(1, true);
  }, [debouncedSearch, filters, fetchComplaints]);

  // Handle pagination increment on scroll
  useEffect(() => {
    if (page > 1) {
      fetchComplaints(page, false);
    }
  }, [page, fetchComplaints]);

  // Scroll handler for Infinite Scroll Pagination
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    if (loading || loadingMore || !hasMore) return;
    const threshold = 100;
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    if (isNearBottom) {
      setPage((prev) => prev + 1);
    }
  };

  // Reset page to 1 when filters apply
  const handleFilterApply = (newFilters: AppealFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const activeFiltersCount = Object.keys(filters).filter((k) => (filters as any)[k]).length;

  return (
    <div className="p-4 space-y-4">
      {/* ── Top Bar: Search & Filter ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Search input */}
        <div className="relative w-full max-w-[340px]">
          <Search className="w-4 h-4 text-[#737373] dark:text-[#a3a3a3] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Sabab yoki foydalanuvchi bo'yicha..."
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#141414] text-[13px] text-[#0A0A0A] dark:text-[#fafafa] placeholder:text-[#a3a3a3] outline-none focus:border-[#0474F3] transition-colors"
          />
        </div>

        {/* Filter button */}
        <button
          onClick={() => setIsFilterModalOpen(true)}
          className={`h-10 px-4 rounded-lg border flex items-center gap-2 text-[13px] font-medium transition-colors cursor-pointer shrink-0 ${
            activeFiltersCount > 0
              ? "border-[#0474F3] text-[#0474F3] bg-blue-50/50 dark:bg-blue-950/20"
              : "border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#141414] text-[#404040] dark:text-[#d4d4d4] hover:bg-gray-50 dark:hover:bg-zinc-800"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filter</span>
          {activeFiltersCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#0474F3] text-white text-[10px] flex items-center justify-center font-bold">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center justify-between text-red-700 dark:text-red-400 text-[13px]">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchComplaints(1, true)}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            Qayta urinish
          </button>
        </div>
      )}

      {/* ── Appeals Table with Scroll Pagination ── */}
      <div
        onScroll={handleScroll}
        className="bg-white dark:bg-[#141414] overflow-auto h-[calc(100vh-150px)]"
      >
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-[#fafafa]">
            <tr className="border-b border-[#f0f0f0] dark:border-[#262626] text-[11px] font-semibold text-[#737373] dark:text-[#a3a3a3]">
              <th className="py-3 px-4 w-12 text-center">#</th>
              <th className="py-3 px-4">Kimdan</th>
              <th className="py-3 px-4">Kimga</th>
              <th className="py-3 px-4">Sababi</th>
              <th className="py-3 px-4">Yaratilgan</th>
              <th className="py-3 px-4">Holati</th>
              <th className="py-3 px-4 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f0f0] dark:divide-[#262626]">
            {loading && complaints.length === 0 ? (
              // Loading Skeleton Rows
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-4 px-4 text-center">
                    <div className="h-4 w-4 bg-gray-200 dark:bg-zinc-800 rounded mx-auto" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-4 w-32 bg-gray-200 dark:bg-zinc-800 rounded mb-1.5" />
                    <div className="h-3 w-20 bg-gray-100 dark:bg-zinc-800/60 rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-4 w-32 bg-gray-200 dark:bg-zinc-800 rounded mb-1.5" />
                    <div className="h-3 w-20 bg-gray-100 dark:bg-zinc-800/60 rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-4 w-28 bg-gray-200 dark:bg-zinc-800 rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-zinc-800 rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-6 w-28 bg-gray-200 dark:bg-zinc-800 rounded-full" />
                  </td>
                  <td className="py-4 px-4"></td>
                </tr>
              ))
            ) : complaints.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-[#737373] dark:text-[#a3a3a3]">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Inbox className="w-8 h-8 text-gray-400 stroke-1" />
                    <p className="text-[14px] font-medium text-[#0a0a0a] dark:text-zinc-200">
                      Shikoyatlar topilmadi
                    </p>
                    <p className="text-[12px] text-[#a3a3a3]">
                      {debouncedSearch || activeFiltersCount > 0
                        ? "Qidiruv yoki filter shartlarini o'zgartirib ko'ring."
                        : "Hozircha shikoyatlar mavjud emas."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              complaints.map((item, idx) => {
                const fromName =
                  item.from_user_info?.full_name ||
                  (item.from_user_info?.profile_info
                    ? `${item.from_user_info.profile_info.first_name || ""} ${item.from_user_info.profile_info.last_name || ""}`.trim()
                    : "") ||
                  item.from_user_info?.phone_number ||
                  "Foydalanuvchi";

                const fromUser =
                  item.from_user_info?.display_id ||
                  item.from_user_info?.phone_number ||
                  "-";

                const toName =
                  item.to_user_info?.full_name ||
                  (item.to_user_info?.profile_info
                    ? `${item.to_user_info.profile_info.first_name || ""} ${item.to_user_info.profile_info.last_name || ""}`.trim()
                    : "") ||
                  item.to_user_info?.phone_number ||
                  "Foydalanuvchi";

                const toUser =
                  item.to_user_info?.display_id ||
                  item.to_user_info?.phone_number ||
                  "-";

                const reasonLabel =
                  item.reason_label ||
                  COMPLAINT_REASON_MAP[item.reason] ||
                  item.reason;

                const formattedDate = item.created_at
                  ? dayjs(item.created_at).format("DD.MM.YYYY HH:mm")
                  : "-";

                return (
                  <tr
                    key={item.id}
                    onClick={() => navigate(`/appeals/${item.id}`)}
                    className="hover:bg-[#fafafa] dark:hover:bg-zinc-900/60 cursor-pointer transition-colors group"
                  >
                    {/* Index */}
                    <td className="py-4 px-4 text-center text-[13px] text-[#737373] dark:text-[#a3a3a3]">
                      {idx + 1}
                    </td>

                    {/* Kimdan */}
                    <td className="py-4 px-4">
                      <p className="text-[13px] font-bold text-[#0A0A0A] dark:text-[#fafafa]">
                        {fromName}
                      </p>
                      <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3]">
                        {fromUser}
                      </p>
                    </td>

                    {/* Kimga */}
                    <td className="py-4 px-4">
                      <p className="text-[13px] font-bold text-[#0A0A0A] dark:text-[#fafafa]">
                        {toName}
                      </p>
                      <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3]">
                        {toUser}
                      </p>
                    </td>

                    {/* Sababi */}
                    <td className="py-4 px-4 text-[13px] text-[#404040] dark:text-[#d4d4d4]">
                      {reasonLabel}
                    </td>

                    {/* Yaratilgan */}
                    <td className="py-4 px-4 text-[13px] text-[#737373] dark:text-[#a3a3a3] whitespace-nowrap">
                      {formattedDate}
                    </td>

                    {/* Holati */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {getStatusBadge(item.status, item.status_label)}
                    </td>

                    {/* Arrow */}
                    <td className="py-4 px-4 text-right">
                      <ChevronRight className="w-4 h-4 text-[#6B6B6B] group-hover:text-[#0A0A0A] dark:group-hover:text-white transition-colors" />
                    </td>
                  </tr>
                );
              })
            )}

            {/* Scroll Loading More Row */}
            {loadingMore && (
              <tr>
                <td colSpan={7} className="py-4 text-center text-[12px] text-[#737373] dark:text-[#a3a3a3]">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#0474F3]" />
                    <span>Yuklanmoqda...</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Filter Modal ── */}
      <AppealFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={handleFilterApply}
        initialFilters={filters}
      />
    </div>
  );
};

export default AppealsPage;
