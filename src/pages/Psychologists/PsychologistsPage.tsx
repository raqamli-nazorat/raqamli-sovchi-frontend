import { useState, useEffect, useRef } from "react";
import { Plus, Clock, Star, Check, X, Loader2, Trash2, AlertCircle, UploadCloud } from "lucide-react";
import { useHeader } from "../../components/Layout/Layout";
import RefDeleteModal from "../References/RefDeleteModal";
import {
  psychologistsApi,
  type PsychologistItem,
  type CreatePsychologistPayload,
} from "../../lib/psychologistsApi";
import dayjs from "dayjs";

const AVATAR_COLORS = [
  { bg: "bg-[#E0F2FE] dark:bg-sky-950/40", text: "text-[#0284C7] dark:text-sky-400" },
  { bg: "bg-[#EDE9FE] dark:bg-purple-950/40", text: "text-[#7C3AED] dark:text-purple-400" },
  { bg: "bg-[#E6F9F0] dark:bg-[#103020]", text: "text-[#00A854] dark:text-[#2ee088]" },
  { bg: "bg-[#FEF3C7] dark:bg-amber-950/40", text: "text-[#D97706] dark:text-amber-400" },
  { bg: "bg-[#FCE7F3] dark:bg-pink-950/40", text: "text-[#DB2777] dark:text-pink-400" },
];

const getInitials = (name?: string | null): string => {
  if (!name || !name.trim()) return "PS";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
};


const formatSessionTime = (dateStr?: string | null): string => {
  if (!dateStr) return "Navbat yo'q";
  try {
    const d = dayjs(dateStr);
    if (!d.isValid()) return String(dateStr);
    const today = dayjs();
    if (d.isSame(today, "day")) {
      return `Bugun ${d.format("HH:mm")}`;
    }
    const tomorrow = today.add(1, "day");
    if (d.isSame(tomorrow, "day")) {
      return `Ertaga ${d.format("HH:mm")}`;
    }
    return d.format("DD.MM.YYYY HH:mm");
  } catch {
    return String(dateStr);
  }
};

const PsychologistsPage = () => {
  const { setHeaderTitle, setHeaderSubtitle } = useHeader();
  const [psychologists, setPsychologists] = useState<PsychologistItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFetchingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Status toggle & action loading
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Delete modal state
  const [itemToDelete, setItemToDelete] = useState<PsychologistItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Add modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [formSpecialty, setFormSpecialty] = useState("");
  const [formExperience, setFormExperience] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formDuration, setFormDuration] = useState("50");
  const [formPhone, setFormPhone] = useState("");
  const [formBio, setFormBio] = useState("");
  const [formPhoto, setFormPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [formIsActive, setFormIsActive] = useState(true);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setHeaderTitle("Psixologlar");
    setHeaderSubtitle("Mutaxassislar va suhbatlar");
  }, [setHeaderTitle, setHeaderSubtitle]);

  // ── Fetch Psychologists from API (with page parameter) ──
  const fetchPsychologists = async (pageNumber: number, isInitial: boolean = false) => {
    if (isFetchingRef.current && !isInitial) return;
    isFetchingRef.current = true;

    if (isInitial) {
      setIsLoading(true);
      setError(null);
      setHasMore(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const data = await psychologistsApi.list({ page: pageNumber });
      const newItems = data.results || [];

      if (isInitial) {
        setPsychologists(newItems);
      } else {
        setPsychologists((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newResults = newItems.filter((p) => !existingIds.has(p.id));
          return [...prev, ...newResults];
        });
      }

      setHasMore(Boolean(data.next) && newItems.length > 0);
    } catch (err: any) {
      console.error("Failed to load psychologists:", err);
      const errMsg =
        err?.response?.data?.error?.errorMsg ||
        err?.response?.data?.detail ||
        err?.message ||
        "Psixologlar ro'yxatini yuklashda xatolik yuz berdi";
      if (isInitial) {
        setError(errMsg);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    setPage(1);
    fetchPsychologists(1, true);
  }, []);

  // ── Infinite Scroll Observer (page pagination) ──
  useEffect(() => {
    if (isLoading || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && !isFetchingRef.current && hasMore) {
          setPage((prevPage) => {
            const nextPage = prevPage + 1;
            fetchPsychologists(nextPage, false);
            return nextPage;
          });
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
      observer.disconnect();
    };
  }, [isLoading, hasMore]);

  const activeCount = psychologists.filter((p) => p.is_available).length;
  const totalSessions = psychologists.reduce(
    (sum, p) => sum + (p.consultations_count || 0),
    0
  );

  // ── Toggle Active Status via PATCH (is_available) ──
  const toggleActiveStatus = async (item: PsychologistItem) => {
    if (togglingId) return;
    setTogglingId(item.id);
    const newStatus = !item.is_available;
    try {
      await psychologistsApi.patch(item.id, { is_available: newStatus });
      setPsychologists((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, is_available: newStatus } : p))
      );
      // Notify sidebar to refresh badge counts
      window.dispatchEvent(new CustomEvent("sidebar-reload"));
    } catch (err: any) {
      console.error("Failed to toggle psychologist status:", err);
      alert(
        err?.response?.data?.error?.errorMsg ||
          err?.response?.data?.detail ||
          "Holatni o'zgartirishda xatolik yuz berdi"
      );
    } finally {
      setTogglingId(null);
    }
  };

  // ── Delete Psychologist ──
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await psychologistsApi.delete(itemToDelete.id);
      setPsychologists((prev) => prev.filter((p) => p.id !== itemToDelete.id));
      window.dispatchEvent(new CustomEvent("sidebar-reload"));
      setItemToDelete(null);
    } catch (err: any) {
      console.error("Failed to delete psychologist:", err);
      setDeleteError(
        err?.response?.data?.error?.errorMsg ||
          err?.response?.data?.detail ||
          "O'chirishda xatolik yuz berdi"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputVal = e.target.value;

    if (!inputVal) {
      setFormPhone("");
      return;
    }

    const isDeleting = inputVal.length < formPhone.length;
    let cleaned = inputVal.replace(/\D/g, "");

    if (isDeleting && formPhone.endsWith(" ") && formPhone.length - inputVal.length === 1) {
      cleaned = cleaned.slice(0, -1);
    }

    if (cleaned === "") {
      setFormPhone("");
      return;
    }

    if (!cleaned.startsWith("998")) {
      if ("998".startsWith(cleaned)) {
        // user is typing prefix
      } else {
        cleaned = "998" + cleaned;
      }
    }

    cleaned = cleaned.slice(0, 12);

    let formatted = "+";
    if (cleaned.length > 0) {
      formatted += cleaned.substring(0, 3);
    }
    if (cleaned.length > 3) {
      formatted += " " + cleaned.substring(3, 5);
    }
    if (cleaned.length > 5) {
      formatted += " " + cleaned.substring(5, 8);
    }
    if (cleaned.length > 8) {
      formatted += " " + cleaned.substring(8, 10);
    }
    if (cleaned.length > 10) {
      formatted += " " + cleaned.substring(10, 12);
    }

    setFormPhone(formatted);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    if (!digits) {
      setFormPrice("");
      return;
    }
    const formatted = digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    setFormPrice(formatted);
  };

  const handleOpenAddModal = () => {
    setFirstName("");
    setLastName("");
    setFormSpecialty("");
    setFormExperience("");
    setFormPrice("");
    setFormDuration("50");
    setFormPhone("");
    setFormBio("");
    setFormPhoto(null);
    setPhotoPreview(null);
    setFormIsActive(true);
    setModalError(null);
    setShowAddModal(true);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // ── Handle Add Submit (POST) ──
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!firstName.trim()) {
      setModalError("Ism kiritilishi shart");
      return;
    }
    if (!lastName.trim()) {
      setModalError("Familiya kiritilishi shart");
      return;
    }
    if (!formSpecialty.trim()) {
      setModalError("Mutaxassislik kiritilishi shart");
      return;
    }

    const cleanPhone = formPhone.replace(/\s+/g, "");
    const phoneRegex = /^\+998\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setModalError("Telefon raqami to'liq kiritilishi shart (+998 __ ___ __ __)");
      return;
    }

    const parsedPrice = parseInt(formPrice.replace(/\s+/g, ""), 10) || 0;
    const parsedExp = parseInt(formExperience.replace(/\D/g, ""), 10) || 0;
    const parsedDuration = parseInt(formDuration.replace(/\D/g, ""), 10) || 50;

    const payload: CreatePsychologistPayload = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone_number: cleanPhone,
      specialization: formSpecialty.trim(),
      experience_years: parsedExp,
      price: parsedPrice,
      session_duration_minutes: parsedDuration,
      bio: formBio.trim() || undefined,
      photo: formPhoto || undefined,
      is_available: formIsActive,
    };

    setIsSubmitting(true);
    try {
      const created = await psychologistsApi.create(payload);
      setPsychologists((prev) => [created, ...prev]);
      setShowAddModal(false);
      window.dispatchEvent(new CustomEvent("sidebar-reload"));
    } catch (err: any) {
      console.error("Failed to create psychologist:", err);
      const apiError = err?.response?.data?.error;
      if (apiError?.details && typeof apiError.details === "object") {
        const detailMsg = Object.entries(apiError.details)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
          .join(" | ");
        setModalError(detailMsg);
      } else if (apiError?.errorMsg) {
        setModalError(apiError.errorMsg);
      } else if (err?.response?.data?.detail) {
        setModalError(err.response.data.detail);
      } else {
        setModalError(err?.message || "Psixolog qo'shishda xatolik yuz berdi");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* ── Top Header Row ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-[13px] text-[#737373] dark:text-[#a3a3a3] font-medium">
          {activeCount} ta faol mutaxassis · {totalSessions} ta suhbat
        </p>

        <button
          onClick={handleOpenAddModal}
          className="h-8.5 px-3.5 bg-[#0474F3] hover:bg-[#0360cb] active:scale-[0.99] text-white text-[12px] font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Psixolog qo'shish</span>
        </button>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-[13px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchPsychologists(1, true)}
            className="underline font-semibold cursor-pointer text-[12px]"
          >
            Qayta urinish
          </button>
        </div>
      )}

      {/* ── Loading Skeleton ── */}
      {isLoading && (
        <div className="space-y-3.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#141414] rounded-2xl border border-[#e5e5e5] dark:border-[#262626] p-4 lg:p-5 flex items-center justify-between animate-pulse"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-zinc-800 shrink-0" />
                <div className="space-y-2">
                  <div className="w-36 h-4 bg-gray-200 dark:bg-zinc-800 rounded" />
                  <div className="w-56 h-3 bg-gray-100 dark:bg-zinc-800/60 rounded" />
                </div>
              </div>
              <div className="w-24 h-9 bg-gray-200 dark:bg-zinc-800 rounded-lg" />
            </div>
          ))}
        </div>
      )}

      {/* ── Empty State ── */}
      {!isLoading && !error && psychologists.length === 0 && (
        <div className="bg-white dark:bg-[#141414] rounded-2xl border border-[#e5e5e5] dark:border-[#262626] p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#0474F3] flex items-center justify-center mx-auto mb-3">
            <Plus className="w-6 h-6" />
          </div>
          <h3 className="text-[16px] font-bold text-[#0A0A0A] dark:text-[#fafafa]">
            Hozircha psixologlar mavjud emas
          </h3>
          <p className="text-[13px] text-[#737373] dark:text-[#a3a3a3] mt-1 max-w-sm mx-auto">
            Yangi mutaxassis qo'shish uchun "Psixolog qo'shish" tugmasini bosing
          </p>
          <button
            onClick={handleOpenAddModal}
            className="mt-4 h-9 px-4 bg-[#0474F3] hover:bg-[#0360cb] text-white text-[13px] font-semibold rounded-lg inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Psixolog qo'shish</span>
          </button>
        </div>
      )}

      {/* ── Psychologists List ── */}
      {!isLoading && (
        <div className="space-y-3.5">
          {psychologists.map((psychologist, index) => {
            const displayName =
              psychologist.full_name ||
              `${psychologist.first_name || ""} ${psychologist.last_name || ""}`.trim() ||
              "Psixolog";
            const initials = getInitials(displayName);
            const colorScheme = AVATAR_COLORS[index % AVATAR_COLORS.length];
            const isToggling = togglingId === psychologist.id;

            return (
              <div
                key={psychologist.id}
                className="bg-white dark:bg-[#141414] rounded-2xl border border-[#e5e5e5] dark:border-[#262626] p-4 lg:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-xs hover:border-gray-300 dark:hover:border-zinc-700"
              >
                {/* Left Info: Avatar + Details */}
                <div className="flex items-center gap-3.5 min-w-0">
                  {psychologist.photo ? (
                    <img
                      src={psychologist.photo}
                      alt={displayName}
                      className="w-11 h-11 rounded-full object-cover shrink-0 border border-gray-100 dark:border-zinc-800"
                    />
                  ) : (
                    <div
                      className={`w-11 h-11 rounded-full ${colorScheme.bg} ${colorScheme.text} font-bold text-xs flex items-center justify-center shrink-0`}
                    >
                      {initials}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-bold text-[#0A0A0A] dark:text-[#fafafa] truncate">
                        {displayName}
                      </h3>
                      {psychologist.phone_number && (
                        <span className="text-[11px] text-[#a3a3a3] font-mono hidden md:inline">
                          {psychologist.phone_number}
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-[#737373] dark:text-[#a3a3a3] mt-0.5 truncate">
                      {psychologist.specialization} · {psychologist.experience_years} yil ·{" "}
                      {Number(psychologist.price || 0).toLocaleString("uz-UZ")} so'm /{" "}
                      {psychologist.session_duration_minutes} daqiqa
                    </p>
                  </div>
                </div>

                {/* Right Info: Availability + Rating + Action Buttons */}
                <div className="flex items-center gap-4 sm:gap-6 justify-between sm:justify-end shrink-0">
                  {/* Next available time */}
                  <div className="flex items-center gap-1.5 text-[12px] text-[#737373] dark:text-[#a3a3a3] whitespace-nowrap">
                    <Clock className="w-4 h-4 text-[#737373] dark:text-[#a3a3a3]" strokeWidth={2} />
                    <span>{formatSessionTime(psychologist.next_session_at)}</span>
                  </div>

                  {/* Rating & Sessions */}
                  <div className="text-right shrink-0">
                    <div className="flex items-center justify-end gap-1 text-[13px] font-bold text-[#0474F3]">
                      <Star className="w-3.5 h-3.5 fill-[#0474F3] stroke-[#0474F3]" />
                      <span>
                        {psychologist.rating !== null && psychologist.rating !== undefined
                          ? Number(psychologist.rating).toFixed(1)
                          : "5.0"}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3] mt-0.5">
                      {psychologist.consultations_count ?? 0} suhbat
                    </p>
                  </div>

                  {/* Toggle Active Button (PATCH is_available) */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleActiveStatus(psychologist)}
                      disabled={isToggling}
                      className={`h-9 px-4 rounded-lg text-[12px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 disabled:opacity-50 ${
                        psychologist.is_available
                          ? "bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] text-[#0A0A0A] dark:text-[#fafafa] hover:bg-gray-50 dark:hover:bg-zinc-800"
                          : "bg-[#0474F3] hover:bg-[#0360cb] text-white shadow-xs"
                      }`}
                    >
                      {isToggling ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check
                          className={`w-3.5 h-3.5 ${
                            psychologist.is_available
                              ? "text-[#0A0A0A] dark:text-[#fafafa]"
                              : "text-white"
                          }`}
                          strokeWidth={2.5}
                        />
                      )}
                      <span>{psychologist.is_available ? "O'chirish" : "Yoqish"}</span>
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => {
                        setDeleteError(null);
                        setItemToDelete(psychologist);
                      }}
                      title="O'chirish"
                      className="h-9 w-9 rounded-lg border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-zinc-900 text-[#a3a3a3] hover:text-red-600 hover:border-red-200 dark:hover:border-red-900/40 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Sentinel element for infinite scroll */}
          <div ref={sentinelRef} className="h-2" />

          {/* Loading more indicator */}
          {isLoadingMore && (
            <div className="flex items-center justify-center py-4 gap-2 text-[12px] text-[#737373] dark:text-[#a3a3a3]">
              <Loader2 className="w-4 h-4 animate-spin text-[#0474F3]" />
              <span>Yana yuklanmoqda...</span>
            </div>
          )}
        </div>
      )}

      {/* ── Psixolog qo'shish Modali (POST) ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-[560px] bg-white dark:bg-[#141414] rounded-2xl border border-[#e5e5e5] dark:border-[#262626] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[18px] font-bold text-[#0A0A0A] dark:text-[#fafafa]">
                  Psixolog qo'shish
                </h3>
                <p className="text-[12px] text-[#737373] dark:text-[#a3a3a3] mt-1">
                  Mutaxassis platformaga qo'shiladi va foydalanuvchilarga ko'rinadi
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error in modal */}
            {modalError && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-[12px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleAddSubmit} className="space-y-4 mt-5">
              {/* Ismi & Familiyasi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[13px] font-medium text-[#404040] dark:text-zinc-300 block mb-1.5">
                    Ismi *
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Dilshod"
                    required
                    maxLength={100}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] text-[#0A0A0A] dark:text-[#fafafa] placeholder:text-[#a3a3a3] outline-none focus:border-[#0474F3] transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[13px] font-medium text-[#404040] dark:text-zinc-300 block mb-1.5">
                    Familiyasi *
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Rasulov"
                    required
                    maxLength={100}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] text-[#0A0A0A] dark:text-[#fafafa] placeholder:text-[#a3a3a3] outline-none focus:border-[#0474F3] transition-colors"
                  />
                </div>
              </div>

              {/* Mutaxassislik & Tajriba */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[13px] font-medium text-[#404040] dark:text-zinc-300 block mb-1.5">
                    Mutaxassislik *
                  </label>
                  <input
                    type="text"
                    value={formSpecialty}
                    onChange={(e) => setFormSpecialty(e.target.value)}
                    placeholder="Oila psixologi"
                    required
                    maxLength={255}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] text-[#0A0A0A] dark:text-[#fafafa] placeholder:text-[#a3a3a3] outline-none focus:border-[#0474F3] transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[13px] font-medium text-[#404040] dark:text-zinc-300 block mb-1.5">
                    Tajriba (yil) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={formExperience}
                    onChange={(e) => setFormExperience(e.target.value)}
                    placeholder="5"
                    required
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] text-[#0A0A0A] dark:text-[#fafafa] placeholder:text-[#a3a3a3] outline-none focus:border-[#0474F3] transition-colors"
                  />
                </div>
              </div>

              {/* Narx & Sessiya davomiyligi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[13px] font-medium text-[#404040] dark:text-zinc-300 block mb-1.5">
                    Narx (so'm) *
                  </label>
                  <input
                    type="text"
                    value={formPrice}
                    onChange={handlePriceChange}
                    placeholder="150 000"
                    required
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] text-[#0A0A0A] dark:text-[#fafafa] placeholder:text-[#a3a3a3] outline-none focus:border-[#0474F3] transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[13px] font-medium text-[#404040] dark:text-zinc-300 block mb-1.5">
                    Sessiya davomiyligi (daqiqa) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={360}
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    placeholder="50"
                    required
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] text-[#0A0A0A] dark:text-[#fafafa] placeholder:text-[#a3a3a3] outline-none focus:border-[#0474F3] transition-colors"
                  />
                </div>
              </div>

              {/* Telefon */}
              <div>
                <label className="text-[13px] font-medium text-[#404040] dark:text-zinc-300 block mb-1.5">
                  Telefon raqam *
                </label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={handlePhoneChange}
                  placeholder="+998"
                  required
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] text-[#0A0A0A] dark:text-[#fafafa] placeholder:text-[#a3a3a3] outline-none focus:border-[#0474F3] transition-colors"
                />
              </div>

              {/* Bio / Tavsif */}
              <div>
                <label className="text-[13px] font-medium text-[#404040] dark:text-zinc-300 block mb-1.5">
                  Tavsif
                </label>
                <textarea
                  rows={2}
                  value={formBio}
                  onChange={(e) => setFormBio(e.target.value)}
                  placeholder="Mutaxassis haqida qisqacha ma'lumot..."
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] text-[#0A0A0A] dark:text-[#fafafa] placeholder:text-[#a3a3a3] outline-none focus:border-[#0474F3] transition-colors resize-none"
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="text-[13px] font-medium text-[#404040] dark:text-zinc-300 block mb-1.5">
                  Rasm
                </label>
                <div className="flex items-center gap-3">
                  {photoPreview ? (
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-[#e5e5e5] dark:border-[#262626] shrink-0">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormPhoto(null);
                          setPhotoPreview(null);
                        }}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full text-white flex items-center justify-center cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2.5 px-3 border border-dashed border-[#e5e5e5] dark:border-[#262626] hover:border-[#0474F3] dark:hover:border-[#0474F3] rounded-xl text-[12px] text-[#737373] hover:text-[#0474F3] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>{photoPreview ? "Rasmni almashtirish" : "Rasm tanlash"}</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Darhol faollashtirish checkbox */}
              <div
                onClick={() => setFormIsActive(!formIsActive)}
                className="bg-[#F8FAFC] dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl p-3.5 flex items-start gap-3 cursor-pointer select-none"
              >
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center transition-all mt-0.5 ${
                    formIsActive
                      ? "bg-[#0474F3] text-white"
                      : "border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-zinc-800"
                  }`}
                >
                  {formIsActive && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-[#0A0A0A] dark:text-[#fafafa]">
                    Darhol faollashtirish
                  </h4>
                  <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3] mt-0.5">
                    Mutaxassis ro'yxatda darhol ko'rinadi va band qilish ochiladi
                  </p>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#e5e5e5] dark:border-[#262626]">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] font-medium text-[#404040] dark:text-[#e5e5e5] hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span>Bekor qilish</span>
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-[#0474F3] hover:bg-[#0360cb] active:scale-[0.99] text-white rounded-xl text-[13px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  )}
                  <span>{isSubmitting ? "Saqlanmoqda..." : "Qo'shish"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── O'chirish Modali (Ma'lumotlar sahifasidagi kabi) ── */}
      {itemToDelete && (
        <RefDeleteModal
          name={
            itemToDelete.full_name ||
            `${itemToDelete.first_name || ""} ${itemToDelete.last_name || ""}`.trim() ||
            "Psixolog"
          }
          noun="psixologini"
          note="Ushbu psixolog ma'lumotlari butunlay o'chiriladi va uni qayta tiklab bo'lmaydi."
          deleting={isDeleting}
          error={deleteError}
          onClose={() => {
            setItemToDelete(null);
            setDeleteError(null);
          }}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
};

export default PsychologistsPage;