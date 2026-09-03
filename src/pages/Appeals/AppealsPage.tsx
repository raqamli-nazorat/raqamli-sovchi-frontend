import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Search, ChevronRight, SlidersHorizontal } from "lucide-react";
import type { Appeal } from "../../store/slices/appealsSlice";
import AppealFilterModal, { type AppealFilters } from "./AppealFilterModal";

const getStatusBadge = (status: string) => {
  if (status === "in_review") {
    return (
      <span className="bg-[#FFFBEB] dark:bg-amber-950/40 text-[#92400E] dark:text-amber-400 font-semibold text-[11px] px-3 py-1 rounded-full inline-block">
        Ko'rib chiqilmoqda
      </span>
    );
  }
  if (status === "approved") {
    return (
      <span className="bg-[#ECFDF5] dark:bg-[#103020] text-[#047857] dark:text-[#2ee088] font-semibold text-[11px] px-3 py-1 rounded-full inline-block">
        Tasdiqlandi
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="bg-[#FEF2F2] dark:bg-red-950/40 text-[#7F1D1D] dark:text-red-400 font-semibold text-[11px] px-3 py-1 rounded-full inline-block">
        Bekor qilindi
      </span>
    );
  }
  return (
    <span className="bg-[#F5F5F5] dark:bg-zinc-800 text-[#737373] dark:text-zinc-400 font-medium text-[12px] px-3 py-1 rounded-full inline-block">
      {status}
    </span>
  );
};

const AppealsPage = () => {
  const navigate = useNavigate();
  const appeals: Appeal[] = useSelector((state: any) => state.appeals.items);

  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<AppealFilters>({});

  const filteredAppeals = useMemo(() => {
    return appeals.filter((item) => {
      // Search term filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchSearch =
          item.fromName.toLowerCase().includes(query) ||
          item.fromUser.toLowerCase().includes(query) ||
          item.toName.toLowerCase().includes(query) ||
          item.toUser.toLowerCase().includes(query) ||
          item.tag.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query);
        if (!matchSearch) return false;
      }

      // Reason filter
      if (filters.reason && filters.reason !== "Barchasi") {
        if (item.tag.toLowerCase() !== filters.reason.toLowerCase()) {
          return false;
        }
      }

      // Date range filter
      if (filters.created_at_after || filters.created_at_before) {
        const parts = item.time.split(" ");
        if (parts.length === 2) {
          const [d, m, y] = parts[0].split(".");
          const [hh, mm] = parts[1].split(":");
          const itemDate = new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm));

          if (filters.created_at_after && itemDate < filters.created_at_after) {
            return false;
          }
          if (filters.created_at_before && itemDate > filters.created_at_before) {
            return false;
          }
        }
      }

      return true;
    });
  }, [appeals, searchTerm, filters]);

  const activeFiltersCount = Object.keys(filters).filter((k) => (filters as any)[k]).length;

  return (
    <div className="p-4 space-y-4">
      
      {/* ── Top Bar: Search & Filter ── */}
      <div className="flex items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative w-full max-w-[320px]">
          <Search className="w-4 h-4 text-[#737373] dark:text-[#a3a3a3] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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

      {/* ── Appeals Table ── */}
      <div className="bg-white dark:bg-[#141414] overflow-auto h-[calc(100vh-150px)]">
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
              {filteredAppeals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#737373] dark:text-[#a3a3a3] text-[13px]">
                    Shikoyatlar topilmadi
                  </td>
                </tr>
              ) : (
                filteredAppeals.map((item, idx) => (
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
                        {item.fromName}
                      </p>
                      <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3]">
                        {item.fromUser}
                      </p>
                    </td>

                    {/* Kimga */}
                    <td className="py-4 px-4">
                      <p className="text-[13px] font-bold text-[#0A0A0A] dark:text-[#fafafa]">
                        {item.toName}
                      </p>
                      <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3]">
                        {item.toUser}
                      </p>
                    </td>

                    {/* Sababi */}
                    <td className="py-4 px-4 text-[13px] text-[#404040] dark:text-[#d4d4d4]">
                      {item.tag}
                    </td>

                    {/* Yaratilgan */}
                    <td className="py-4 px-4 text-[13px] text-[#737373] dark:text-[#a3a3a3] whitespace-nowrap">
                      {item.time}
                    </td>

                    {/* Holati */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>

                    {/* Arrow */}
                    <td className="py-4 px-4 text-right">
                      <ChevronRight className="w-4 h-4 text-[#6B6B6B] group-hover:text-[#0A0A0A] dark:group-hover:text-white transition-colors" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
      </div>

      {/* ── Filter Modal ── */}
      <AppealFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={(newFilters) => setFilters(newFilters)}
        initialFilters={filters}
      />

    </div>
  );
};

export default AppealsPage;
