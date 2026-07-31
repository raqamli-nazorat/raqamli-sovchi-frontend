import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { axiosAPI } from "../../lib/axiosAPI";
import { ChevronRight, Search, X } from "lucide-react";

interface UserResult {
  id: string;
  display_id: string;
  full_name: string | null;
  phone_number: string;
  email: string | null;
  candidate_type: string | null;
  region_name: string | null;
  completion_percentage: number;
  status: string;
  is_verified: boolean;
  is_blocked: boolean;
  created_at: string;
}

const FILTERS = ["Hammasi", "Kuyov", "Kelin", "Vakil"];

const UsersPage = () => {
    const navigate = useNavigate();

  const [users, setUsers] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState("Hammasi");
  const [error, setError] = useState<string | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") || "";
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  const observerTarget = useRef<HTMLDivElement>(null);

  // Sync search state with debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch Users data
  const fetchUsers = async (pageNumber: number, filter: string, isInitial: boolean = false) => {
    if (isInitial) {
      setLoading(true);
      setError(null);
      setHasMore(true); // Reset hasMore when starting a fresh search or filter
    } else {
      setLoadingMore(true);
    }

    try {
      const params: Record<string, any> = {
        page: pageNumber,
      };

      if (filter !== "Hammasi") {
        params.candidate_type = filter;
      }

      if (debouncedSearch) {
        params.search = debouncedSearch;
      }

      const response = await axiosAPI.get(`accounts/users/`, { params });

      const data = response.data?.data;
      if (response.data?.success && data) {
        const results = data.results || [];

        if (isInitial) {
          setUsers(results);
        } else {
          setUsers((prev) => {
            // Filter out duplicates just in case
            const existingIds = new Set(prev.map((u) => u.id));
            const newResults = results.filter((u: UserResult) => !existingIds.has(u.id));
            return [...prev, ...newResults];
          });
        }

        setTotalCount(data.count || 0);
        // Only allow pagination if there is a next page and the current page returned some results
        setHasMore(data.next !== null && results.length > 0);
      } else {
        throw new Error(response.data?.error || "Foydalanuvchilarni yuklashda xatolik yuz berdi");
      }
    } catch (err: any) {
      console.error("Users fetch error:", err);
      setError(err?.message || "Foydalanuvchilar ro'yxatini yuklab bo'lmadi.");
      setHasMore(false); // Stop infinite requests if an error (like 403 Forbidden) occurs
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Fetch initial data on filter or search change
  useEffect(() => {
    setPage(1);
    fetchUsers(1, activeFilter, true);
  }, [activeFilter, debouncedSearch]);

  // Fetch next page when page state changes
  useEffect(() => {
    if (page > 1) {
      fetchUsers(page, activeFilter, false);
    }
  }, [page]);

  // Setup IntersectionObserver for scroll pagination
  useEffect(() => {
    const target = observerTarget.current;
    if (!target || !hasMore || loading || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && !loadingMore && hasMore) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [hasMore, loading, loadingMore]);

  // Generate initials for profile avatar
  const getInitials = (fullName: string | null, phone: string) => {
    const name = (fullName || phone || "").trim();
    if (!name) return "?";

    if (name.startsWith("+")) {
      const numeric = name.replace(/[^\d]/g, "");
      if (numeric.length >= 5) {
        return numeric.slice(3, 5); // Operator prefix, e.g. "77"
      }
      return numeric.slice(0, 2);
    }

    const parts = name.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    if (parts.length === 1 && parts[0].length > 0) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return "?";
  };

  // Map status dynamically to styles (colors & labels)
  const getStatusStyles = (statusText: string, isBlocked: boolean) => {
    if (isBlocked) {
      return {
        bg: "bg-[#FFF0F0] dark:bg-[#3d1414]",
        text: "text-[#FF3B30] dark:text-[#ff6b6b]",
        label: "Bloklangan",
      };
    }

    const status = statusText || "";

    if (status === "Tasdiqlangan") {
      return {
        bg: "bg-[#E6F9F0] dark:bg-[#103020]",
        text: "text-[#00A854] dark:text-[#2ee088]",
        label: "Tasdiqlangan",
      };
    }

    if (status === "Tekshiruvda") {
      return {
        bg: "bg-[#EAF5FF] dark:bg-[#10243d]",
        text: "text-[#0084FF] dark:text-[#66b3ff]",
        label: "Tekshiruvda",
      };
    }

    if (status === "Anketa to'liq emas") {
      return {
        bg: "bg-[#F5F5F5] dark:bg-[#262626]",
        text: "text-[#737373] dark:text-[#a3a3a3]",
        label: "Anketa to'liq emas",
      };
    }

    return {
      bg: "bg-[#F5F5F5] dark:bg-[#262626]",
      text: "text-[#737373] dark:text-[#a3a3a3]",
      label: status || "Noma'lum",
    };
  };

  const formatCandidateType = (type: string | null) => {
    if (!type) return "";
    const t = type.toLowerCase();
    if (t === "kuyov") return "Kuyov";
    if (t === "kelin") return "Kelin";
    if (t === "vakil") return "Vakil";
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const handleClearFilters = () => {
    setActiveFilter("Hammasi");
    setSearchParams((prev) => {
      prev.delete("search");
      return prev;
    });
  };

  const emptyStateMessage = useMemo(() => {
    if (search && activeFilter !== "Hammasi") {
      return (
        <p className="text-[13px] text-gray-500 dark:text-gray-400 max-w-md leading-relaxed">
          «<span className="font-semibold text-gray-800 dark:text-gray-200">{search}</span>» bo'yicha «<span className="font-semibold text-gray-800 dark:text-gray-200">{activeFilter}</span>» filtrida hech narsa yo'q.
          <br />
          ID, ism yoki telefonni tekshirib ko'ring.
        </p>
      );
    }
    if (search) {
      return (
        <p className="text-[13px] text-gray-500 dark:text-gray-400 max-w-md leading-relaxed">
          «<span className="font-semibold text-gray-800 dark:text-gray-200">{search}</span>» bo'yicha hech narsa yo'q.
          <br />
          ID, ism yoki telefonni tekshirib ko'ring.
        </p>
      );
    }
    if (activeFilter !== "Hammasi") {
      return (
        <p className="text-[13px] text-gray-500 dark:text-gray-400 max-w-md leading-relaxed">
          «<span className="font-semibold text-gray-800 dark:text-gray-200">{activeFilter}</span>» filtrida hech narsa yo'q.
        </p>
      );
    }
    return (
      <p className="text-[13px] text-gray-500 dark:text-gray-400 max-w-md leading-relaxed">
        Foydalanuvchilar topilmadi
      </p>
    );
  }, [search, activeFilter]);

  return (
    <div className="p-4 space-y-4">
      {/* Filters and Counter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 h-8 rounded-lg font-semibold text-[12px] transition-all cursor-pointer border ${isActive
                    ? "bg-[#0A0A0A] text-white border-[#0A0A0A] dark:bg-white dark:text-black dark:border-white"
                    : "bg-white text-[#525252] border-[#E5E5E5] hover:bg-gray-50 dark:bg-[#141414] dark:text-[#A3A3A3] dark:border-[#262626] dark:hover:bg-[#1c1c1c]"
                  }`}
              >
                {filter}
              </button>
            );
          })}
        </div>

        {/* Counter */}
        <div className="text-[12px] text-[#737373] dark:text-[#a3a3a3] font-medium sm:text-right">
          {users.length} / {totalCount} foydalanuvchi
        </div>
      </div>

      {/* Users List Container */}
      <div className="bg-white dark:bg-[#141414] rounded-xl border border-[#E5E5E5] dark:border-[#262626] shadow-xs overflow-y-auto max-h-[calc(100vh-140px)]">
        {/* Table Headers */}
        <div className="hidden md:flex bg-[#FAFAFA] dark:bg-[#202020] items-center px-6 py-3.5 border-b border-[#F5F5F5] dark:border-[#262626] text-[11px] font-semibold text-[#737373] dark:text-[#A3A3A3] tracking-wider sticky top-0 z-10">
          <div className="flex-1 min-w-[240px]">Foydalanuvchi</div>
          <div className="w-[130px]">Turi</div>
          <div className="w-[160px]">Hudud</div>
          <div className="w-[180px]">Anketa</div>
          <div className="w-[300px]">Holati</div>
          <div className="w-[40px] text-right"></div>
        </div>

        {/* User Rows */}
        <div className="divide-y divide-[#F5F5F5] dark:divide-[#262626]">
          {loading && page === 1 ? (
            // Shimmer loading effect
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center px-6 py-5 animate-pulse gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-zinc-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded w-1/4" />
                </div>
                <div className="w-[130px] h-4 bg-gray-200 dark:bg-zinc-800 rounded hidden md:block" />
                <div className="w-[160px] h-4 bg-gray-200 dark:bg-zinc-800 rounded hidden md:block" />
                <div className="w-[180px] h-4 bg-gray-200 dark:bg-zinc-800 rounded hidden md:block" />
                <div className="w-[300px] h-6 bg-gray-200 dark:bg-zinc-800 rounded-full hidden md:block" />
              </div>
            ))
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-14 h-14 bg-gray-50 dark:bg-[#1f1f1f] rounded-full flex items-center justify-center mb-4 border border-gray-100/50 dark:border-zinc-800/50">
                <Search size={20} className="text-gray-400 dark:text-gray-500 stroke-[2]" />
              </div>
              <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1.5">
                {error ? "Xatolik yuz berdi" : "Natija topilmadi"}
              </h3>
              {error ? (
                <p className="text-[13px] text-gray-500 dark:text-gray-400 max-w-md leading-relaxed">
                  {error}
                </p>
              ) : (
                emptyStateMessage
              )}
              {!error && (search || activeFilter !== "Hammasi") && (
                <button
                  onClick={handleClearFilters}
                  className="mt-5 flex items-center gap-2 px-4 py-2 border border-[#E5E5E5] dark:border-[#262626] rounded-lg text-[12.5px] font-semibold text-[#404040] dark:text-[#E5E5E5] bg-white dark:bg-[#141414] hover:bg-gray-50 dark:hover:bg-zinc-900 transition-all cursor-pointer"
                >
                  <X size={14} className="stroke-[2.5]" />
                  Filtrlarni tozalash
                </button>
              )}
            </div>
          ) : (
            users.map((user) => {
              const statusStyles = getStatusStyles(user.status, user.is_blocked);
              const initials = getInitials(user.full_name, user.phone_number);

              return (
                <div
                  key={user.id}
                  className="flex flex-col md:flex-row md:items-center px-6 py-4.5 hover:bg-gray-50/50 dark:hover:bg-zinc-900/30 transition-colors gap-3 md:gap-0 cursor-pointer"
                  onClick={() => navigate(`/users/details/${user.id}`)}
                >
                  {/* Foydalanuvchi */}
                  <div className="flex-1 min-w-[240px] flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-[13px] shrink-0 transition-colors ${statusStyles.bg} ${statusStyles.text}`}
                    >
                      {initials}
                    </div>
                    <div>
                      <h4 className="text-[13.5px] font-semibold text-gray-900 dark:text-white leading-tight">
                        {user.full_name || user.phone_number}
                      </h4>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 font-medium">
                        {user.display_id}
                      </p>
                    </div>
                  </div>

                  {/* Turi (Mobile-friendly label included) */}
                  <div className="w-[130px] flex items-center text-[13px] text-gray-800 dark:text-gray-200 font-medium">
                    <span className="md:hidden text-gray-400 mr-2 text-[11px] uppercase w-16">Turi:</span>
                    {formatCandidateType(user.candidate_type)}
                  </div>

                  {/* Hudud */}
                  <div className="w-[160px] flex items-center text-[13px] text-gray-800 dark:text-gray-200 font-medium">
                    <span className="md:hidden text-gray-400 mr-2 text-[11px] uppercase w-16">Hudud:</span>
                    {user.region_name || ""}
                  </div>

                  {/* Anketa Progress */}
                  <div className="w-[180px] flex items-center gap-2 text-[13px]">
                    <span className="md:hidden text-gray-400 mr-2 text-[11px] uppercase w-16">Anketa:</span>
                    <div className="w-24 bg-[#E5E5E5] dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden shrink-0">
                      <div
                        className="bg-[#FF5900] h-full transition-all duration-500"
                        style={{ width: `${user.completion_percentage || 0}%` }}
                      />
                    </div>
                    <span className="text-[12px] font-semibold text-[#737373] dark:text-[#A3A3A3] w-10">
                      {user.completion_percentage || 0}%
                    </span>
                  </div>

                  {/* Holati */}
                  <div className="w-[300px] flex items-center">
                    <span className="md:hidden text-gray-400 mr-2 text-[11px] uppercase w-16">Holati:</span>
                    <span
                      className={`px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-colors ${statusStyles.bg} ${statusStyles.text}`}
                    >
                      {statusStyles.label}
                    </span>
                  </div>

                  {/* Action Chevron */}
                  <div className="w-[40px] hidden md:flex items-center justify-end text-gray-400 hover:text-gray-600 dark:text-zinc-600 dark:hover:text-zinc-400 transition-colors">
                    <ChevronRight size={16} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Observer Trigger for Infinite Scroll */}
        {hasMore && !loading && (
          <div ref={observerTarget} className="h-10 w-full flex items-center justify-center py-6">
            {loadingMore && (
              <div className="w-5 h-5 border-2 border-[#FF5900] border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersPage;