import { useEffect, useState } from "react";
import { Image as ImageIcon, Check, X, Hourglass, RefreshCw } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/uz-latn";
import { axiosAPI } from "../../lib/axiosAPI";

dayjs.extend(relativeTime);
dayjs.locale("uz-latn");

type Decision = "approved" | "rejected" | "requested";

interface ApiPhoto {
  id: string;
  image: string;
  is_main?: boolean;
  order?: number;
}

interface ApiProfile {
  id: string;
  first_name: string;
  last_name: string;
  candidate_type?: string | null;
  bio?: string | null;
  created_at: string;
  photos_info?: ApiPhoto[];
  region_info?: { name?: string } | null;
  user_info?: { id: string; phone_number: string } | null;
}

const CANDIDATE_TYPE_LABELS: Record<string, string> = {
  groom: "Kuyov",
  bride: "Kelin",
  representative: "Vakil",
};

const AVATAR_PALETTES = [
  "bg-[#FFF1E8] dark:bg-[#3a2417] text-[#0474F3]",
  "bg-[#EAF3FF] dark:bg-[#16283d] text-[#0084FF]",
  "bg-[#E9F9EF] dark:bg-[#15301f] text-[#16A34A]",
  "bg-[#F1EDFF] dark:bg-[#251d3d] text-[#7C5CFC]",
];

const initialsOf = (first: string, last: string) =>
  `${(first?.[0] ?? "")}${(last?.[0] ?? "")}`.toUpperCase() || "??";

const mainPhoto = (photos?: ApiPhoto[]) => {
  if (!photos || photos.length === 0) return null;
  return photos.find((p) => p.is_main) ?? photos[0];
};

interface ModerationRule {
  key: string;
  title: string;
  subtitle: string;
  enabled: boolean;
}

// Qoidalar hozircha lokal — backend'da moderatsiya sozlamalari endpointi yo'q
const DEFAULT_RULES: ModerationRule[] = [
  {
    key: "auto_face_check",
    title: "Selfi–rasm mosligini avtomatik tekshirish",
    subtitle: "Moslik 80% dan past bo'lsa qo'lda ko'riladi",
    enabled: true,
  },
  {
    key: "block_minors",
    title: "18 yoshdan kichiklarni bloklash",
    subtitle: "Tug'ilgan sana OneID ma'lumoti bilan solishtiriladi",
    enabled: true,
  },
  {
    key: "auto_reject_nsfw",
    title: "Bexayo kontentni avtomatik rad etish",
    subtitle: "Rasm yuklashda darhol tekshiriladi",
    enabled: true,
  },
  {
    key: "detect_duplicates",
    title: "Takroriy profillarni aniqlash",
    subtitle: "Bir xil rasm/telefon bo'yicha",
    enabled: false,
  },
];

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={onChange}
    className={`relative w-10 h-6 rounded-full transition-colors shrink-0 cursor-pointer ${checked ? "bg-[#0474F3]" : "bg-[#D4D4D4] dark:bg-[#404040]"
      }`}
  >
    <span
      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${checked ? "left-[18px]" : "left-0.5"
        }`}
    />
  </button>
);

const ProfileModerationPage = () => {
  const [profiles, setProfiles] = useState<ApiProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [rules, setRules] = useState<ModerationRule[]>(DEFAULT_RULES);

  const fetchProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      // Eng so'nggi profillar navbat sifatida ko'rsatiladi.
      // Backend'ga moderation_status filtri qo'shilgach:
      //   params: { moderation_status: "pending", ordering: "-created_at" }
      const res = await axiosAPI.get("accounts/profiles/", {
        params: { ordering: "-created_at" },
      });
      const payload = res.data?.data ?? res.data;
      const results: ApiProfile[] = payload?.results ?? (Array.isArray(payload) ? payload : []);
      setProfiles(results);
    } catch (err: any) {
      const apiError = err.response?.data?.error;
      setError(
        apiError?.errorMsg ||
        err.response?.data?.detail ||
        err.message ||
        "Profillarni yuklashda xatolik yuz berdi."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const decidedCount = Object.keys(decisions).length;
  const remainingCount = profiles.length - decidedCount;

  // Qaror hozircha lokal saqlanadi — backend'da moderatsiya qarori endpointi
  // (tasdiqlash/rad etish/qo'shimcha so'rash) hali mavjud emas.
  const decide = (id: string, decision: Decision) => {
    setDecisions((prev) => ({ ...prev, [id]: decision }));
  };

  const toggleRule = (key: string) => {
    setRules((prev) => prev.map((r) => (r.key === key ? { ...r, enabled: !r.enabled } : r)));
  };

  const cardBorder = (decision?: Decision) => {
    if (decision === "approved") return "border-[#86EFAC] dark:border-[#166534]";
    if (decision === "rejected") return "border-[#FCA5A5] dark:border-[#7F1D1D]";
    return "border-[#E5E5E5] dark:border-[#262626]";
  };

  return (
    <div className="p-6 flex gap-6 items-start">
      {/* ── Chap: moderatsiya navbati ── */}
      <div className="flex-1 min-w-0 space-y-6">
        {decidedCount > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 bg-[#ECFDF5] dark:bg-[#0d2b1d] border border-[#BBF7D0] dark:border-[#166534] rounded-xl">
            <Check className="w-4 h-4 text-[#15803D]" strokeWidth={2.5} />
            <span className="text-[13px] font-semibold text-[#15803D]">
              {decidedCount} ta arizaga qaror qabul qilindi · navbatda {remainingCount} ta ariza qoldi
            </span>
          </div>
        )}

        {loading && (
          <div className="bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#262626] rounded-2xl p-16 flex flex-col items-center gap-3">
            <span className="w-6 h-6 border-2 border-[#0474F3] border-t-transparent rounded-full animate-spin" />
            <p className="text-[13px] text-[#737373] dark:text-[#A3A3A3]">Profillar yuklanmoqda…</p>
          </div>
        )}

        {!loading && error && (
          <div className="bg-white dark:bg-[#141414] border border-[#FECACA] dark:border-[#7F1D1D] rounded-2xl p-10 text-center">
            <p className="text-[14px] font-semibold text-[#D32F2F]">Xatolik</p>
            <p className="text-[13px] text-[#737373] dark:text-[#A3A3A3] mt-1">{error}</p>
            <button
              onClick={fetchProfiles}
              className="mt-4 h-10 px-4 inline-flex items-center gap-2 bg-[#0474F3] hover:bg-[#042480] text-white text-[13px] font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" strokeWidth={2.2} /> Qayta urinish
            </button>
          </div>
        )}

        {!loading && !error && profiles.length === 0 && (
          <div className="bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#262626] rounded-2xl p-10 text-center">
            <p className="text-[14px] font-semibold text-[#0A0A0A] dark:text-white">Navbatda ariza yo'q</p>
            <p className="text-[13px] text-[#737373] dark:text-[#A3A3A3] mt-1">
              Yangi profil ro'yxatdan o'tganda shu yerda ko'rinadi.
            </p>
          </div>
        )}

        {!loading &&
          !error &&
          profiles.map((profile, idx) => {
            const decision = decisions[profile.id];
            const photo = mainPhoto(profile.photos_info);
            const tag = profile.candidate_type
              ? CANDIDATE_TYPE_LABELS[profile.candidate_type] ?? profile.candidate_type
              : "Profil";
            const palette = AVATAR_PALETTES[idx % AVATAR_PALETTES.length];

            return (
              <div
                key={profile.id}
                className={`bg-white dark:bg-[#141414] border rounded-2xl p-5 flex gap-5 transition-colors ${cardBorder(decision)}`}
              >
                {/* Rasm */}
                <div className="w-[120px] self-stretch min-h-[130px] shrink-0 rounded-xl bg-[#FAFAFA] dark:bg-[#1c1c1c] border border-[#F0F0F0] dark:border-[#262626] overflow-hidden flex flex-col items-center justify-center gap-2 text-[#A3A3A3]">
                  {photo ? (
                    <img
                      src={photo.image}
                      alt={`${profile.first_name} rasmi`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      <ImageIcon className="w-5 h-5" strokeWidth={1.8} />
                      <span className="text-[11px]">rasm yo'q</span>
                    </>
                  )}
                </div>

                {/* Kontent */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span
                        className={`w-8 h-8 rounded-full ${palette} flex items-center justify-center text-[11px] font-bold shrink-0`}
                      >
                        {initialsOf(profile.first_name, profile.last_name)}
                      </span>
                      <h3 className="text-[16px] font-bold text-[#0A0A0A] dark:text-white">
                        {profile.first_name} {profile.last_name}
                      </h3>
                      <span className="text-[12px] text-[#A3A3A3] tracking-wide uppercase">
                        {profile.id.slice(0, 8)}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#F5F5F5] dark:bg-[#262626] text-[12px] font-medium text-[#525252] dark:text-[#A3A3A3]">
                        {tag}
                      </span>
                    </div>

                    <p className="text-[14px] text-[#404040] dark:text-[#D4D4D4]">
                      {profile.bio || "Yangi profil — ma'lumotlar qo'lda tekshirishni kutmoqda."}
                    </p>

                    <div className="flex items-center gap-6 text-[13px] text-[#737373] dark:text-[#A3A3A3] flex-wrap">
                      <span>Yuz mosligi: —</span>
                      <span>Rasm soni: {profile.photos_info?.length ?? 0}</span>
                      <span>Yuborilgan: {dayjs(profile.created_at).fromNow()}</span>
                      {profile.region_info?.name && <span>Hudud: {profile.region_info.name}</span>}
                    </div>
                  </div>

                  {/* Amallar */}
                  <div className="flex items-center gap-3 mt-4">
                    {!decision && (
                      <>
                        <button
                          onClick={() => decide(profile.id, "approved")}
                          className="h-10 px-5 bg-[#0474F3] hover:bg-[#042480] active:scale-[0.99] text-white text-[13px] font-semibold rounded-lg transition-all cursor-pointer"
                        >
                          Tasdiqlash
                        </button>
                        <button
                          onClick={() => decide(profile.id, "rejected")}
                          className="h-10 px-5 bg-white dark:bg-transparent border border-[#E5E5E5] dark:border-[#262626] hover:border-[#FCA5A5] text-[#D32F2F] text-[13px] font-semibold rounded-lg transition-all cursor-pointer"
                        >
                          Rad etish
                        </button>
                        <button
                          onClick={() => decide(profile.id, "requested")}
                          className="h-10 px-5 bg-white dark:bg-transparent border border-[#E5E5E5] dark:border-[#262626] hover:border-[#A3A3A3] text-[#404040] dark:text-[#D4D4D4] text-[13px] font-semibold rounded-lg transition-all cursor-pointer"
                        >
                          Qo'shimcha so'rash
                        </button>
                      </>
                    )}

                    {decision === "approved" && (
                      <>
                        <button className="h-10 px-5 bg-[#0474F3] text-white text-[13px] font-semibold rounded-lg cursor-default">
                          Tasdiqlash
                        </button>
                        <span className="flex items-center gap-1.5 text-[13px] font-semibold text-[#15803D]">
                          <Check className="w-4 h-4" strokeWidth={2.5} /> Tasdiqlandi
                        </span>
                      </>
                    )}

                    {decision === "rejected" && (
                      <>
                        <button className="h-10 px-5 bg-white dark:bg-transparent border border-[#E5E5E5] dark:border-[#262626] text-[#D32F2F] text-[13px] font-semibold rounded-lg cursor-default">
                          Rad etish
                        </button>
                        <span className="flex items-center gap-1.5 text-[13px] font-semibold text-[#D32F2F]">
                          <X className="w-4 h-4" strokeWidth={2.5} /> Rad etildi
                        </span>
                      </>
                    )}

                    {decision === "requested" && (
                      <>
                        <button className="h-10 px-5 bg-white dark:bg-transparent border border-[#E5E5E5] dark:border-[#262626] text-[#404040] dark:text-[#D4D4D4] text-[13px] font-semibold rounded-lg cursor-default">
                          Qo'shimcha so'rash
                        </button>
                        <span className="flex items-center gap-1.5 text-[13px] font-semibold text-[#B45309]">
                          <Hourglass className="w-4 h-4" strokeWidth={2.2} /> So'rov yuborildi
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* ── O'ng: moderatsiya qoidalari ── */}
      <aside className="w-[340px] xl:w-[400px] shrink-0 bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#262626] rounded-2xl p-6">
        <h3 className="text-[16px] font-bold text-[#0A0A0A] dark:text-white mb-5">Moderatsiya qoidalari</h3>
        <div className="space-y-5">
          {rules.map((rule) => (
            <div key={rule.key} className="flex items-start gap-4">
              <Toggle checked={rule.enabled} onChange={() => toggleRule(rule.key)} />
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-[#0A0A0A] dark:text-white leading-snug">{rule.title}</p>
                <p className="text-[12px] text-[#737373] dark:text-[#A3A3A3] mt-0.5">{rule.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
};

export default ProfileModerationPage;
