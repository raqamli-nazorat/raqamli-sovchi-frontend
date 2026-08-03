import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ChevronRight, Check } from "lucide-react";
import type { Appeal, TagTone } from "../../store/slices/appealsSlice";

type Tab = "new" | "seen" | "closed";

// Ko'rilgan/yopilgan tab'lardagi bazaviy sonlar — ro'yxatdagi mock'lardan tashqari
// arxivdagi shikoyatlar soni (API ulangach paginated ro'yxatdan keladi).
const SEEN_BASE = 12;
const CLOSED_BASE = 87;

const tagStyles: Record<TagTone, string> = {
  red: "bg-[#FEF2F2] dark:bg-[#3a1414] text-[#DC2626]",
  yellow: "bg-[#FEFCE8] dark:bg-[#332b0d] text-[#A16207]",
  gray: "bg-[#F5F5F5] dark:bg-[#262626] text-[#525252] dark:text-[#A3A3A3]",
};

const AppealsPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("new");
  const appeals: Appeal[] = useSelector((state: any) => state.appeals.items);

  const newCount = appeals.filter((a) => a.status === "new").length;
  const reviewedCount = appeals.filter((a) => a.status === "reviewed").length;
  const closedCount = appeals.filter((a) => a.status === "closed").length;

  const seenTotal = SEEN_BASE + reviewedCount;
  const closedTotal = CLOSED_BASE + closedCount;

  // "Yangi" tabida ko'rilganlar ham (yashil holatda) ko'rinib turadi —
  // moderator sessiya davomida nima qilganini ko'rishi uchun.
  const visible = appeals.filter((a) => {
    if (tab === "new") return a.status === "new" || a.status === "reviewed";
    if (tab === "seen") return a.status === "reviewed";
    return a.status === "closed";
  });

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "new", label: "Yangi", count: newCount },
    { key: "seen", label: "Ko'rilgan", count: seenTotal },
    { key: "closed", label: "Yopilgan", count: closedTotal },
  ];

  return (
    <div className="p-6 space-y-5">
      {/* ── Tab'lar + SLA eslatmasi ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2.5">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`h-10 px-4 rounded-lg text-[13px] font-semibold transition-colors cursor-pointer ${tab === t.key
                  ? "bg-[#171717] text-white dark:bg-white dark:text-[#0A0A0A]"
                  : "bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#262626] text-[#404040] dark:text-[#D4D4D4] hover:border-[#A3A3A3]"
                }`}
            >
              {t.label} · {t.count}
            </button>
          ))}
        </div>
        <span className="text-[13px] font-semibold text-[#C2410C]">
          {reviewedCount > 0
            ? `${reviewedCount} ta shikoyat ko'rib chiqildi · ${newCount} ta navbatda`
            : "24 soat ichida ko'rilishi shart"}
        </span>
      </div>

      {/* ── Ro'yxat ── */}
      <div className="space-y-4">
        {visible.length === 0 && (
          <div className="bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#262626] rounded-2xl p-10 text-center">
            <p className="text-[14px] font-semibold text-[#0A0A0A] dark:text-white">Bu bo'limda shikoyat yo'q</p>
            <p className="text-[13px] text-[#737373] dark:text-[#A3A3A3] mt-1">
              {tab === "closed"
                ? "Yopilgan shikoyatlar arxivi API ulangach shu yerda ko'rinadi."
                : "Yangi shikoyat kelganda shu yerda paydo bo'ladi."}
            </p>
          </div>
        )}

        {visible.map((appeal) => {
          const reviewed = appeal.status === "reviewed";
          return (
            <div
              key={appeal.id}
              className={`bg-white dark:bg-[#141414] border rounded-2xl px-6 py-5 flex items-center justify-between gap-6 transition-colors ${reviewed
                  ? "border-[#86EFAC] dark:border-[#166534]"
                  : "border-[#E5E5E5] dark:border-[#262626]"
                }`}
            >
              <div className="min-w-0 space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-[15px] font-bold text-[#0A0A0A] dark:text-white tabular-nums">
                    {appeal.fromUser}
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#A3A3A3]" strokeWidth={2.2} />
                  <span className="text-[15px] font-bold text-[#0A0A0A] dark:text-white tabular-nums">
                    {appeal.toUser}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${tagStyles[appeal.tagTone]}`}
                  >
                    {appeal.tag}
                  </span>
                </div>
                <p className="text-[14px] text-[#525252] dark:text-[#A3A3A3]">{appeal.description}</p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <span className="text-[12px] text-[#A3A3A3]">{appeal.time}</span>
                {reviewed ? (
                  <button
                    onClick={() => navigate(`/appeals/${appeal.id}`)}
                    className="h-10 px-4 flex items-center gap-1.5 bg-[#ECFDF5] dark:bg-[#0d2b1d] border border-[#BBF7D0] dark:border-[#166534] text-[#15803D] text-[13px] font-semibold rounded-lg transition-colors cursor-pointer hover:bg-[#DCFCE7]"
                  >
                    <Check className="w-4 h-4" strokeWidth={2.5} /> Ko'rildi
                  </button>
                ) : (
                  <button
                    onClick={() => navigate(`/appeals/${appeal.id}`)}
                    className="h-10 px-4 bg-[#0474F3] hover:bg-[#042480] active:scale-[0.99] text-white text-[13px] font-semibold rounded-lg transition-all cursor-pointer"
                  >
                    Ko'rib chiqish
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AppealsPage;
