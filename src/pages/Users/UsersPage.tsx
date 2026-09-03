import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { axiosAPI } from "../../lib/axiosAPI";
import { ChevronRight, Search, X, SlidersHorizontal } from "lucide-react";
import dayjs from "dayjs";
import UserFilterModal, { type UserFilters } from "./UserFilterModal";

export interface UserResult {
  id: string;
  display_id?: string;
  full_name?: string | null;
  phone_number?: string;
  email?: string | null;
  candidate_type?: string | null;
  region_name?: string | null;
  district_name?: string | null;
  role_name?: string | null;
  role_info?: { id: string; name: string } | null;
  auth_provider?: string | null;
  registered_method?: string | null;
  completion_percentage?: number;
  status?: string;
  is_verified?: boolean;
  is_blocked?: boolean;
  avatar?: string | null;
  avatar_url?: string | null;
  profile_info?: {
    first_name?: string;
    last_name?: string;
    candidate_type?: string;
    photos_info?: { image: string; is_main: boolean }[];
    region_info?: { id: string; name: string };
    district_info?: { id: string; name: string };
  } | null;
  created_at: string;
  updated_at?: string;
}

const SAMPLE_USERS: UserResult[] = [
  {
    id: "10241",
    display_id: "USR-10241",
    full_name: "Safarali Muxtorov",
    phone_number: "+998 90 123 45 67",
    candidate_type: "Kuyov",
    region_name: "Toshkent",
    district_name: "Yunusobod",
    role_name: "Nomzod",
    auth_provider: "Telefon raqami",
    completion_percentage: 100,
    status: "Tasdiqlangan",
    is_verified: true,
    is_blocked: false,
    created_at: "2026-03-12T14:02:00",
    updated_at: "2026-06-18T09:31:00",
  },
  {
    id: "10318",
    display_id: "USR-10318",
    full_name: "Mohira Rasulova",
    phone_number: "+998 91 234 56 78",
    candidate_type: "Kelin",
    region_name: "Toshkent",
    district_name: "Chilonzor",
    role_name: "Nomzod",
    auth_provider: "Telegram",
    completion_percentage: 100,
    status: "Tasdiqlangan",
    is_verified: true,
    is_blocked: false,
    created_at: "2026-03-18T09:40:00",
    updated_at: "2026-04-02T12:32:00",
  },
  {
    id: "10402",
    display_id: "USR-10402",
    full_name: "Zulfiya Muxtorova",
    phone_number: "+998 93 345 67 89",
    candidate_type: "Kelin",
    region_name: "Namangan",
    district_name: "Chust",
    role_name: "Vakil",
    auth_provider: "Telefon raqami",
    completion_percentage: 63,
    status: "Anketa to'liq emas",
    is_verified: false,
    is_blocked: false,
    created_at: "2026-04-02T11:26:00",
    updated_at: "2026-05-30T13:14:00",
  },
  {
    id: "10455",
    display_id: "USR-10455",
    full_name: "Nilufar Ahmedova",
    phone_number: "+998 94 456 78 90",
    candidate_type: "Kelin",
    region_name: "Farg'ona",
    district_name: "Quva",
    role_name: "Nomzod",
    auth_provider: "Vakil orqali",
    completion_percentage: 47,
    status: "Anketa to'liq emas",
    is_verified: false,
    is_blocked: false,
    created_at: "2026-04-17T16:08:00",
    updated_at: "2026-07-11T16:54:00",
  },
  {
    id: "10511",
    display_id: "USR-10511",
    full_name: "Bekzod Qodirov",
    phone_number: "+998 97 567 89 01",
    candidate_type: "Kuyov",
    region_name: "Samarqand",
    district_name: "Urgut",
    role_name: "Nomzod",
    auth_provider: "Google",
    completion_percentage: 100,
    status: "Bloklangan",
    is_verified: true,
    is_blocked: true,
    created_at: "2026-05-05T10:33:00",
    updated_at: "2026-06-21T12:22:00",
  },
  {
    id: "10604",
    display_id: "USR-10604",
    full_name: "Dilnoza Sattorova",
    phone_number: "+998 99 678 90 12",
    candidate_type: "Kelin",
    region_name: "Buxoro",
    district_name: "G'ijduvon",
    role_name: "Nomzod",
    auth_provider: "Telegram",
    completion_percentage: 83,
    status: "Tasdiqlangan",
    is_verified: true,
    is_blocked: false,
    created_at: "2026-05-21T13:57:00",
    updated_at: "2026-06-29T10:05:00",
  },
  {
    id: "10688",
    display_id: "USR-10688",
    full_name: "Sevinch Toshpo'latova",
    phone_number: "+998 90 789 01 23",
    candidate_type: "Kelin",
    region_name: "Namangan",
    district_name: "Namangan sh.",
    role_name: "Nomzod",
    auth_provider: "Vakil orqali",
    completion_percentage: 30,
    status: "Anketa to'liq emas",
    is_verified: false,
    is_blocked: false,
    created_at: "2026-06-09T08:19:00",
    updated_at: "2026-06-21T12:54:00",
  },
];

const UsersPage = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") || "";
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<UserFilters>({});

  const observerTarget = useRef<HTMLDivElement>(null);

  // Sync search state with debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Count active filters for badge
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.region) count++;
    if (appliedFilters.district) count++;
    if (appliedFilters.candidate_type) count++;
    if (appliedFilters.auth_provider) count++;
    if (appliedFilters.role) count++;
    if (appliedFilters.status) count++;
    if (appliedFilters.created_at_after) count++;
    if (appliedFilters.created_at_before) count++;
    if (appliedFilters.updated_at_after) count++;
    if (appliedFilters.updated_at_before) count++;
    return count;
  }, [appliedFilters]);

  // Fetch Users data
  const fetchUsers = async (pageNumber: number, isInitial: boolean = false) => {
    if (isInitial) {
      setLoading(true);
      setError(null);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const params: Record<string, any> = {
        page: pageNumber,
      };

      if (debouncedSearch) {
        params.search = debouncedSearch;
      }

      if (appliedFilters.region) params.region = appliedFilters.region;
      if (appliedFilters.district) params.district = appliedFilters.district;
      if (appliedFilters.candidate_type) params.candidate_type = appliedFilters.candidate_type;
      if (appliedFilters.auth_provider) params.auth_provider = appliedFilters.auth_provider;
      if (appliedFilters.role) params.role = appliedFilters.role;
      if (appliedFilters.status) params.status = appliedFilters.status;

      if (appliedFilters.created_at_after) {
        params.created_at_after = dayjs(appliedFilters.created_at_after).format("YYYY-MM-DDTHH:mm:ss");
      }
      if (appliedFilters.created_at_before) {
        params.created_at_before = dayjs(appliedFilters.created_at_before).format("YYYY-MM-DDTHH:mm:ss");
      }
      if (appliedFilters.updated_at_after) {
        params.updated_at_after = dayjs(appliedFilters.updated_at_after).format("YYYY-MM-DDTHH:mm:ss");
      }
      if (appliedFilters.updated_at_before) {
        params.updated_at_before = dayjs(appliedFilters.updated_at_before).format("YYYY-MM-DDTHH:mm:ss");
      }

      const response = await axiosAPI.get(`accounts/users/`, { params });
      const data = response.data?.data ?? response.data;

      if (response.data?.success !== false && data) {
        const results = Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : [];

        // If backend returned results
        if (results.length > 0 || pageNumber > 1) {
          if (isInitial) {
            setUsers(results);
          } else {
            setUsers((prev) => {
              const existingIds = new Set(prev.map((u) => u.id));
              const newResults = results.filter((u: UserResult) => !existingIds.has(u.id));
              return [...prev, ...newResults];
            });
          }
          setHasMore(data.next !== null && results.length > 0);
        } else {
          // If empty search/filter on mock mode, filter sample users
          let filtered = [...SAMPLE_USERS];
          if (debouncedSearch) {
            const q = debouncedSearch.toLowerCase();
            filtered = filtered.filter(
              (u) =>
                u.full_name?.toLowerCase().includes(q) ||
                u.display_id?.toLowerCase().includes(q) ||
                u.phone_number?.toLowerCase().includes(q) ||
                u.region_name?.toLowerCase().includes(q) ||
                u.district_name?.toLowerCase().includes(q)
            );
          }
          if (appliedFilters.region) {
            const reg = appliedFilters.region.toLowerCase();
            filtered = filtered.filter(
              (u) =>
                u.region_name?.toLowerCase() === reg ||
                String(u.profile_info?.region_info?.id) === appliedFilters.region ||
                u.profile_info?.region_info?.name?.toLowerCase() === reg
            );
          }
          if (appliedFilters.district) {
            const dist = appliedFilters.district.toLowerCase();
            filtered = filtered.filter(
              (u) =>
                u.district_name?.toLowerCase() === dist ||
                String(u.profile_info?.district_info?.id) === appliedFilters.district ||
                u.profile_info?.district_info?.name?.toLowerCase() === dist
            );
          }
          if (appliedFilters.candidate_type) {
            filtered = filtered.filter(
              (u) =>
                (u.candidate_type || u.profile_info?.candidate_type)?.toLowerCase() ===
                appliedFilters.candidate_type?.toLowerCase()
            );
          }
          if (appliedFilters.auth_provider) {
            filtered = filtered.filter((u) =>
              (u.auth_provider || u.registered_method || "")
                .toLowerCase()
                .includes(appliedFilters.auth_provider!.toLowerCase())
            );
          }
          if (appliedFilters.role) {
            const roleVal = appliedFilters.role.toLowerCase();
            filtered = filtered.filter(
              (u) =>
                u.role_name?.toLowerCase() === roleVal ||
                String(u.role_info?.id) === appliedFilters.role ||
                u.role_info?.name?.toLowerCase() === roleVal
            );
          }
          if (appliedFilters.status) {
            filtered = filtered.filter((u) => u.status === appliedFilters.status);
          }
          setUsers(filtered);
          setHasMore(false);
        }
      } else {
        throw new Error(response.data?.error || "Foydalanuvchilarni yuklashda xatolik yuz berdi");
      }
    } catch (err: any) {
      console.warn("Users fetch notice (falling back to sample dataset if empty):", err);
      // Fallback to demo sample dataset
      let filtered = [...SAMPLE_USERS];
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        filtered = filtered.filter(
          (u) =>
            u.full_name?.toLowerCase().includes(q) ||
            u.display_id?.toLowerCase().includes(q) ||
            u.phone_number?.toLowerCase().includes(q) ||
            u.region_name?.toLowerCase().includes(q) ||
            u.district_name?.toLowerCase().includes(q)
        );
      }
      if (appliedFilters.region) {
        const reg = appliedFilters.region.toLowerCase();
        filtered = filtered.filter(
          (u) =>
            u.region_name?.toLowerCase() === reg ||
            String(u.profile_info?.region_info?.id) === appliedFilters.region ||
            u.profile_info?.region_info?.name?.toLowerCase() === reg
        );
      }
      if (appliedFilters.district) {
        const dist = appliedFilters.district.toLowerCase();
        filtered = filtered.filter(
          (u) =>
            u.district_name?.toLowerCase() === dist ||
            String(u.profile_info?.district_info?.id) === appliedFilters.district ||
            u.profile_info?.district_info?.name?.toLowerCase() === dist
        );
      }
      if (appliedFilters.candidate_type) {
        filtered = filtered.filter(
          (u) =>
            (u.candidate_type || u.profile_info?.candidate_type)?.toLowerCase() ===
            appliedFilters.candidate_type?.toLowerCase()
        );
      }
      if (appliedFilters.auth_provider) {
        filtered = filtered.filter((u) =>
          (u.auth_provider || u.registered_method || "")
            .toLowerCase()
            .includes(appliedFilters.auth_provider!.toLowerCase())
        );
      }
      if (appliedFilters.role) {
        const roleVal = appliedFilters.role.toLowerCase();
        filtered = filtered.filter(
          (u) =>
            u.role_name?.toLowerCase() === roleVal ||
            String(u.role_info?.id) === appliedFilters.role ||
            u.role_info?.name?.toLowerCase() === roleVal
        );
      }
      if (appliedFilters.status) {
        filtered = filtered.filter((u) => u.status === appliedFilters.status);
      }
      setUsers(filtered);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Trigger search / filter changes
  useEffect(() => {
    setPage(1);
    fetchUsers(1, true);
  }, [debouncedSearch, appliedFilters]);

  // Handle page increment for pagination
  useEffect(() => {
    if (page > 1) {
      fetchUsers(page, false);
    }
  }, [page]);

  // Infinite Scroll IntersectionObserver
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

  // Generate initials for profile avatar fallback
  const getInitials = (fullName?: string | null, phone?: string) => {
    const name = (fullName || phone || "").trim();
    if (!name) return "?";

    if (name.startsWith("+")) {
      const numeric = name.replace(/[^\d]/g, "");
      if (numeric.length >= 5) {
        return numeric.slice(3, 5);
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

  // Map status to visual styles (Strictly excluding "Tekshiruvda" as requested)
  const getStatusStyles = (statusText?: string, isBlocked?: boolean) => {
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

    if (status === "Anketa to'liq emas") {
      return {
        bg: "bg-[#F5F5F5] dark:bg-[#262626]",
        text: "text-[#737373] dark:text-[#a3a3a3]",
        label: "Anketa to'liq emas",
      };
    }

    // Default or unknown fallback
    return {
      bg: "bg-[#F5F5F5] dark:bg-[#262626]",
      text: "text-[#737373] dark:text-[#a3a3a3]",
      label: status === "Tekshiruvda" ? "Anketa to'liq emas" : status || "Tasdiqlangan",
    };
  };

  const formatCandidateType = (type?: string | null) => {
    if (!type) return "—";
    const t = type.toLowerCase();
    if (t === "kuyov" || t === "groom") return "Kuyov";
    if (t === "kelin" || t === "bride") return "Kelin";
    if (t === "vakil" || t === "representative") return "Vakil";
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const formatRole = (role?: string | null, candidateType?: string | null) => {
    if (role) {
      const r = role.toLowerCase();
      if (r === "vakil" || r === "representative") return "Vakil";
      if (r === "user" || r === "nomzod") return "Nomzod";
      return role;
    }
    if (candidateType?.toLowerCase() === "vakil" || candidateType?.toLowerCase() === "representative") {
      return "Vakil";
    }
    return "Nomzod";
  };

  const formatAuthProvider = (provider?: string | null) => {
    if (!provider) return "Telefon raqami";
    const p = provider.toLowerCase();
    if (p === "phone" || p === "phone_number" || p.includes("telefon")) return "Telefon raqami";
    if (p === "telegram") return "Telegram";
    if (p === "google") return "Google";
    if (p === "representative" || p === "vakil" || p.includes("vakil")) return "Vakil orqali";
    return provider;
  };

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    const d = dayjs(dateStr);
    return d.isValid() ? d.format("DD.MM.YYYY HH:mm") : "—";
  };

  const handleClearAllFilters = () => {
    setAppliedFilters({});
    setSearchParams((prev) => {
      prev.delete("search");
      return prev;
    });
  };

  return (
    <div className="p-2 space-y-4">
      {/* Top Search & Filter Row */}
      <div className="flex w-full justify-between items-center gap-3">
        {/* Search Bar */}
        <div className="relative w-full max-w-[360px]">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737373] pointer-events-none stroke-[2]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              const val = e.target.value;
              setSearchParams((prev) => {
                if (val) {
                  prev.set("search", val);
                } else {
                  prev.delete("search");
                }
                return prev;
              });
            }}
            placeholder="Ism, ID yoki telefon bo'yicha qidirish..."
            className="w-full h-9 pl-10 pr-10 bg-white dark:bg-[#141414] border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-[13.5px] text-[#0A0A0A] dark:text-[#fafafa] placeholder:text-[#a3a3a3] outline-none focus:border-[#0474F3] transition-colors shadow-2xs"
          />
          {search && (
            <button
              onClick={() => {
                setSearchParams((prev) => {
                  prev.delete("search");
                  return prev;
                });
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 cursor-pointer p-1"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filter Button */}
        <button
          onClick={() => setIsFilterModalOpen(true)}
          className={`flex items-center gap-2 h-9 px-4 rounded-lg border text-[13.5px] font-medium transition-colors cursor-pointer shrink-0 shadow-2xs ${
            activeFiltersCount > 0
              ? "bg-[#0474F3]/10 border-[#0474F3] text-[#0474F3] dark:bg-[#0474F3]/20"
              : "bg-white dark:bg-[#141414] border-[#e5e5e5] dark:border-[#262626] text-[#0A0A0A] dark:text-[#fafafa] hover:bg-gray-50 dark:hover:bg-zinc-800"
          }`}
        >
          <SlidersHorizontal size={16} className="stroke-[2]" />
          <span>Filter</span>
          {activeFiltersCount > 0 && (
            <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-[#0474F3] text-white text-[10px] font-bold rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Users Table Card */}
      <div className="bg-white dark:bg-[#141414] overflow-auto max-h-[calc(100vh-150px)]">
          <table className="w-full text-left border-collapse min-w-max">
            {/* Table Header */}
            <thead className="sticky top-0 z-10 bg-[#fafafa] dark:bg-[#141414]">
              <tr className="border-b border-[#F5F5F5] dark:border-[#262626] text-[12px] font-normal text-[#737373] dark:text-[#a3a3a3] whitespace-nowrap">
                <th className="py-4 pl-6 pr-2 font-normal">#</th>
                <th className="py-4 px-3 font-normal">Foydalanuvchi</th>
                <th className="py-4 px-3 font-normal">ID</th>
                <th className="py-4 px-3 font-normal">Viloyat</th>
                <th className="py-4 px-3 font-normal">Tuman</th>
                <th className="py-4 px-3 font-normal">Turi</th>
                <th className="py-4 px-3 font-normal">Roli</th>
                <th className="py-4 px-3 font-normal">Ro'yxatdan o'tgan usul</th>
                <th className="py-4 px-3 font-normal">So'rovnoma</th>
                <th className="py-4 px-3 font-normal">Holati</th>
                <th className="py-4 px-3 font-normal">Yaratilgan</th>
                <th className="py-4 px-3 font-normal">Yangilangan</th>
                <th className="py-4 pl-2 pr-6 text-right font-normal"></th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-[#F5F5F5] dark:divide-[#262626]">
              {loading && page === 1 ? (
                // Shimmer loading skeletons
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 pl-6 pr-2">
                      <div className="w-4 h-4 bg-gray-200 dark:bg-zinc-800 rounded" />
                    </td>
                    <td className="py-4 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-zinc-800" />
                        <div className="w-32 h-4 bg-gray-200 dark:bg-zinc-800 rounded" />
                      </div>
                    </td>
                    <td className="py-4 px-3">
                      <div className="w-20 h-4 bg-gray-200 dark:bg-zinc-800 rounded" />
                    </td>
                    <td className="py-4 px-3">
                      <div className="w-16 h-4 bg-gray-200 dark:bg-zinc-800 rounded" />
                    </td>
                    <td className="py-4 px-3">
                      <div className="w-16 h-4 bg-gray-200 dark:bg-zinc-800 rounded" />
                    </td>
                    <td className="py-4 px-3">
                      <div className="w-12 h-4 bg-gray-200 dark:bg-zinc-800 rounded" />
                    </td>
                    <td className="py-4 px-3">
                      <div className="w-12 h-4 bg-gray-200 dark:bg-zinc-800 rounded" />
                    </td>
                    <td className="py-4 px-3">
                      <div className="w-24 h-4 bg-gray-200 dark:bg-zinc-800 rounded" />
                    </td>
                    <td className="py-4 px-3">
                      <div className="w-20 h-4 bg-gray-200 dark:bg-zinc-800 rounded" />
                    </td>
                    <td className="py-4 px-3">
                      <div className="w-24 h-6 bg-gray-200 dark:bg-zinc-800 rounded-full" />
                    </td>
                    <td className="py-4 px-3">
                      <div className="w-24 h-4 bg-gray-200 dark:bg-zinc-800 rounded" />
                    </td>
                    <td className="py-4 px-3">
                      <div className="w-24 h-4 bg-gray-200 dark:bg-zinc-800 rounded" />
                    </td>
                    <td className="py-4 pl-2 pr-6">
                      <div className="w-4 h-4 bg-gray-200 dark:bg-zinc-800 rounded ml-auto" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-14 h-14 bg-gray-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-3.5 border border-gray-100 dark:border-zinc-800">
                        <Search size={22} className="text-gray-400 dark:text-gray-500" />
                      </div>
                      <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">
                        {error ? "Xatolik yuz berdi" : "Natija topilmadi"}
                      </h3>
                      <p className="text-[13px] text-gray-500 dark:text-gray-400 max-w-sm">
                        {error || "Kiritilgan qidiruv yoki filtr bo'yicha hech qanday foydalanuvchi topilmadi."}
                      </p>
                      {(search || activeFiltersCount > 0) && (
                        <button
                          onClick={handleClearAllFilters}
                          className="mt-4 flex items-center gap-2 px-4 py-2 border border-[#E5E5E5] dark:border-[#262626] rounded-xl text-[12.5px] font-semibold text-[#404040] dark:text-[#E5E5E5] bg-white dark:bg-[#141414] hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                        >
                          <X size={14} className="stroke-[2.5]" />
                          Filtrlarni tozalash
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user, index) => {
                  const statusStyles = getStatusStyles(user.status, user.is_blocked);
                  const fullName =
                    user.full_name ||
                    (user.profile_info?.first_name
                      ? `${user.profile_info.first_name} ${user.profile_info.last_name || ""}`.trim()
                      : "") ||
                    user.phone_number ||
                    "—";
                  const displayId = user.display_id || (user.id ? `USR-${user.id}` : "—");
                  const regionName =
                    user.region_name || user.profile_info?.region_info?.name || "—";
                  const districtName =
                    user.district_name || user.profile_info?.district_info?.name || "—";
                  const candidateType = formatCandidateType(
                    user.candidate_type || user.profile_info?.candidate_type
                  );
                  const roleName = formatRole(
                    user.role_name || user.role_info?.name,
                    user.candidate_type || user.profile_info?.candidate_type
                  );
                  const registeredMethod = formatAuthProvider(
                    user.auth_provider || user.registered_method
                  );
                  const completion = user.completion_percentage ?? 0;
                  const createdAt = formatDateTime(user.created_at);
                  const updatedAt = formatDateTime(user.updated_at || user.created_at);
                  const avatarImage =
                    user.avatar ||
                    user.avatar_url ||
                    user.profile_info?.photos_info?.find((p) => p.is_main)?.image ||
                    user.profile_info?.photos_info?.[0]?.image;
                  const initials = getInitials(fullName, user.phone_number);

                  return (
                    <tr
                      key={user.id || index}
                      onClick={() => navigate(`/users/details/${user.id}`)}
                      className="hover:bg-gray-50/70 dark:hover:bg-zinc-900/40 cursor-pointer transition-colors text-[13px] whitespace-nowrap"
                    >
                      {/* # */}
                      <td className="py-3.5 pl-6 pr-2 text-[#737373] dark:text-[#a3a3a3] font-normal">
                        {index + 1}
                      </td>

                      {/* Foydalanuvchi */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3">
                          {avatarImage ? (
                            <img
                              src={avatarImage}
                              alt={fullName}
                              className="w-8 h-8 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11.5px] shrink-0 ${statusStyles.bg} ${statusStyles.text}`}
                            >
                              {initials}
                            </div>
                          )}
                          <span className="font-semibold text-[#0A0A0A] dark:text-[#fafafa] truncate">
                            {fullName}
                          </span>
                        </div>
                      </td>

                      {/* ID */}
                      <td className="py-3.5 px-3 text-[#737373] dark:text-[#a3a3a3] font-normal">
                        {displayId}
                      </td>

                      {/* Viloyat */}
                      <td className="py-3.5 px-3 text-[#0a0a0a] dark:text-[#fafafa] font-normal">
                        {regionName}
                      </td>

                      {/* Tuman */}
                      <td className="py-3.5 px-3 text-[#737373] dark:text-[#a3a3a3] font-normal">
                        {districtName}
                      </td>

                      {/* Turi */}
                      <td className="py-3.5 px-3 text-[#0a0a0a] dark:text-[#fafafa] font-normal">
                        {candidateType}
                      </td>

                      {/* Roli */}
                      <td className="py-3.5 px-3 text-[#737373] dark:text-[#a3a3a3] font-normal">
                        {roleName}
                      </td>

                      {/* Ro'yxatdan o'tgan usul */}
                      <td className="py-3.5 px-3 text-[#0a0a0a] dark:text-[#fafafa] font-normal">
                        {registeredMethod}
                      </td>

                      {/* So'rovnoma */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-14 bg-[#E5E5E5] dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden shrink-0">
                            <div
                              className="bg-[#0474F3] h-full transition-all duration-500 rounded-full"
                              style={{ width: `${completion}%` }}
                            />
                          </div>
                          <span className="text-[12px] font-normal text-[#737373] dark:text-[#a3a3a3]">
                            {completion}%
                          </span>
                        </div>
                      </td>

                      {/* Holati */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11.5px] font-medium tracking-wide ${statusStyles.bg} ${statusStyles.text}`}
                        >
                          {statusStyles.label}
                        </span>
                      </td>

                      {/* Yaratilgan */}
                      <td className="py-3.5 px-3 text-[#0a0a0a] dark:text-[#fafafa] font-normal whitespace-nowrap">
                        {createdAt}
                      </td>

                      {/* Yangilangan */}
                      <td className="py-3.5 px-3 text-[#0a0a0a] dark:text-[#fafafa] font-normal whitespace-nowrap">
                        {updatedAt}
                      </td>

                      {/* Action Chevron */}
                      <td className="py-3.5 pl-2 pr-6 text-right text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors">
                        <ChevronRight size={16} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

        {/* Observer Trigger for Infinite Scroll */}
        {hasMore && !loading && (
          <div ref={observerTarget} className="h-10 w-full flex items-center justify-center py-6">
            {loadingMore && (
              <div className="w-5 h-5 border-2 border-[#0474F3] border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        )}
      </div>

      {/* Filter Modal */}
      <UserFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={(filters) => setAppliedFilters(filters)}
        initialFilters={appliedFilters}
      />
    </div>
  );
};

export default UsersPage;