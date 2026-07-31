import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ChevronLeft, ChevronRight, Clock, Check } from "lucide-react";
import { closeAppeal, markReviewed } from "../../store/slices/appealsSlice";
import type { Appeal, TagTone } from "../../store/slices/appealsSlice";

interface ChatMessage {
  side: "left" | "right";
  text: string;
  time: string;
  flagged?: boolean;
}

interface AppealDetail {
  chat: ChatMessage[];
  analysis: { level: string; warnings: string; reports: string; advice: string };
  profile: { status: string; registered: string; questionnaire: string; aiSignals: string };
}

// ── Mock tafsilotlar — shikoyat tafsiloti endpointi tayyor bo'lgach API'ga ulanadi ──
const DETAILS: Record<string, AppealDetail> = {
  "REP-2291": {
    chat: [
      { side: "left", text: "Assalomu alaykum. Taklifingiz uchun rahmat.", time: "09:02" },
      { side: "right", text: "Va alaykum assalom. Vaqtingiz bo'lsa tanishsak.", time: "09:04" },
      { side: "left", text: "Rasmingizni yuboring, hech kim ko'rmaydi.", time: "09:09", flagged: true },
      { side: "right", text: "Bunday so'rovga javob bermayman.", time: "09:12" },
    ],
    analysis: { level: "Yuqori", warnings: "2 marta", reports: "3 ta", advice: "Profilni bloklash" },
    profile: { status: "Bloklangan", registered: "02.02.2026", questionnaire: "30/30 · 100%", aiSignals: "4 ta" },
  },
  "REP-2292": {
    chat: [
      { side: "left", text: "Salom! Profilingiz juda yoqdi.", time: "14:20" },
      { side: "right", text: "Rahmat. Rasmlaringiz o'zingizga tegishlimi?", time: "14:25" },
      { side: "left", text: "Albatta o'zimniki, shubha qilmang.", time: "14:31", flagged: true },
    ],
    analysis: { level: "O'rta", warnings: "1 marta", reports: "2 ta", advice: "Qo'shimcha tekshirish" },
    profile: { status: "Faol", registered: "15.03.2026", questionnaire: "24/30 · 80%", aiSignals: "2 ta" },
  },
  "REP-2293": {
    chat: [
      { side: "left", text: "Assalomu alaykum, tanishsak bo'ladimi?", time: "11:05" },
      { side: "right", text: "Men bu yerda shunchaki do'st izlayapman.", time: "11:12", flagged: true },
    ],
    analysis: { level: "Past", warnings: "0 marta", reports: "1 ta", advice: "Ogohlantirish yuborish" },
    profile: { status: "Faol", registered: "28.04.2026", questionnaire: "30/30 · 100%", aiSignals: "1 ta" },
  },
  "REP-2294": {
    chat: [
      { side: "left", text: "Uchrashishdan oldin bitta iltimosim bor edi.", time: "18:40" },
      { side: "right", text: "Qanday iltimos?", time: "18:42" },
      { side: "left", text: "Kartamga ozgina pul tashlab tura olasizmi?", time: "18:45", flagged: true },
    ],
    analysis: { level: "Yuqori", warnings: "3 marta", reports: "5 ta", advice: "Profilni bloklash" },
    profile: { status: "Kuzatuvda", registered: "09.01.2026", questionnaire: "27/30 · 90%", aiSignals: "6 ta" },
  },
};

const tagStyles: Record<TagTone, string> = {
  red: "bg-[#FEF2F2] dark:bg-[#3a1414] text-[#DC2626]",
  yellow: "bg-[#FEFCE8] dark:bg-[#332b0d] text-[#A16207]",
  gray: "bg-[#F5F5F5] dark:bg-[#262626] text-[#525252] dark:text-[#A3A3A3]",
};

const initialsOf = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const AppealDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [decision, setDecision] = useState<"blocked" | "warned" | null>(null);

  const appeal: Appeal | undefined = useSelector((state: any) =>
    state.appeals.items.find((a: Appeal) => a.id === id)
  );

  // Sahifa ochilishi shikoyatni "ko'rilgan" deb belgilaydi
  useEffect(() => {
    if (appeal && appeal.status === "new") {
      dispatch(markReviewed(appeal.id));
    }
  }, [appeal, dispatch]);

  if (!appeal) {
    return (
      <div className="p-6">
        <div className="bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#262626] rounded-2xl p-10 text-center">
          <p className="text-[14px] font-semibold text-[#0A0A0A] dark:text-white">Shikoyat topilmadi</p>
          <button
            onClick={() => navigate("/appeals")}
            className="mt-4 h-10 px-4 bg-[#FF5900] hover:bg-[#E04F00] text-white text-[13px] font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Shikoyatlar ro'yxatiga qaytish
          </button>
        </div>
      </div>
    );
  }

  const detail = DETAILS[appeal.id] ?? DETAILS["REP-2291"];

  const handleClose = () => {
    dispatch(closeAppeal(appeal.id));
    navigate("/appeals");
  };

  return (
    <div className="p-6 space-y-5">
      {/* ── Orqaga ── */}
      <button
        onClick={() => navigate("/appeals")}
        className="flex items-center gap-1.5 text-[14px] font-medium text-[#525252] dark:text-[#A3A3A3] hover:text-[#0A0A0A] dark:hover:text-white transition-colors cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" strokeWidth={2.2} />
        Shikoyatlar ro'yxatiga qaytish
      </button>

      <div className="flex gap-6 items-start">
        {/* ── Chap ustun ── */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* Taraflar */}
          <div className="bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#262626] rounded-2xl p-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-[#F1EDFF] dark:bg-[#251d3d] text-[#7C5CFC] flex items-center justify-center text-[12px] font-bold">
                    {initialsOf(appeal.fromName)}
                  </span>
                  <div>
                    <p className="text-[15px] font-bold text-[#0A0A0A] dark:text-white">{appeal.fromName}</p>
                    <p className="text-[12px] text-[#A3A3A3]">{appeal.fromUser} · shikoyatchi</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#A3A3A3]" strokeWidth={2.2} />
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-[#EAF3FF] dark:bg-[#16283d] text-[#0084FF] flex items-center justify-center text-[12px] font-bold">
                    {initialsOf(appeal.toName)}
                  </span>
                  <div>
                    <p className="text-[15px] font-bold text-[#0A0A0A] dark:text-white">{appeal.toName}</p>
                    <p className="text-[12px] text-[#A3A3A3]">{appeal.toUser} · shikoyat qilingan</p>
                  </div>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-[12px] font-semibold ${tagStyles[appeal.tagTone]}`}>
                {appeal.tag}
              </span>
            </div>
            <p className="text-[14px] text-[#404040] dark:text-[#D4D4D4] mt-4">{appeal.description}</p>
          </div>

          {/* Suhbat tarixi */}
          <div className="bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#262626] rounded-2xl p-6">
            <h3 className="text-[16px] font-bold text-[#0A0A0A] dark:text-white mb-5">Suhbat tarixi · dalil</h3>
            <div className="space-y-4">
              {detail.chat.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.side === "right" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[55%] rounded-xl px-4 py-3 ${
                      msg.flagged
                        ? "bg-[#FEF2F2] dark:bg-[#3a1414] border border-[#FECACA] dark:border-[#7F1D1D]"
                        : "bg-[#F5F5F5] dark:bg-[#1c1c1c]"
                    }`}
                  >
                    <p
                      className={`text-[14px] ${
                        msg.flagged ? "text-[#B91C1C] dark:text-[#F87171]" : "text-[#404040] dark:text-[#D4D4D4]"
                      }`}
                    >
                      {msg.text}
                    </p>
                    <p className="text-[11px] text-[#A3A3A3] mt-1.5">
                      {msg.time}
                      {msg.flagged && (
                        <span className="ml-2 font-semibold text-[#DC2626]">AI: qoidabuzarlik aniqlandi</span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI tahlili */}
          <div className="bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#262626] rounded-2xl p-6">
            <h3 className="text-[16px] font-bold text-[#0A0A0A] dark:text-white mb-5">AI tahlili</h3>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                { label: "Qoidabuzarlik darajasi", value: detail.analysis.level, danger: true },
                { label: "Oldingi ogohlantirishlar", value: detail.analysis.warnings, danger: true },
                { label: "Shikoyatlar soni", value: detail.analysis.reports, danger: false },
                { label: "Tavsiya", value: detail.analysis.advice, danger: true },
              ].map((box) => (
                <div
                  key={box.label}
                  className="border border-[#F0F0F0] dark:border-[#262626] rounded-xl p-4"
                >
                  <p className="text-[12px] text-[#737373] dark:text-[#A3A3A3]">{box.label}</p>
                  <p
                    className={`text-[15px] font-bold mt-1.5 ${
                      box.danger ? "text-[#B91C1C] dark:text-[#F87171]" : "text-[#0A0A0A] dark:text-white"
                    }`}
                  >
                    {box.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── O'ng ustun ── */}
        <aside className="w-[340px] xl:w-[400px] shrink-0 space-y-5">
          {/* Qaror */}
          <div className="bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#262626] rounded-2xl p-6">
            <h3 className="text-[16px] font-bold text-[#0A0A0A] dark:text-white mb-4">Qaror</h3>
            <div className="space-y-3">
              <button
                onClick={() => setDecision("blocked")}
                className={`w-full h-11 px-4 flex items-center justify-center gap-2 border text-[13px] font-semibold rounded-lg transition-colors cursor-pointer ${
                  decision === "blocked"
                    ? "border-[#FCA5A5] bg-[#FEF2F2] dark:bg-[#3a1414] text-[#B91C1C]"
                    : "border-[#E5E5E5] dark:border-[#262626] text-[#D32F2F] hover:border-[#FCA5A5]"
                }`}
              >
                {decision === "blocked" && <Check className="w-4 h-4" strokeWidth={2.5} />}
                {decision === "blocked" ? "Profil bloklandi" : "Profilni bloklash"}
              </button>
              <button
                onClick={() => setDecision("warned")}
                className={`w-full h-11 px-4 flex items-center justify-center gap-2 border text-[13px] font-semibold rounded-lg transition-colors cursor-pointer ${
                  decision === "warned"
                    ? "border-[#FDE68A] bg-[#FEFCE8] dark:bg-[#332b0d] text-[#A16207]"
                    : "border-[#E5E5E5] dark:border-[#262626] text-[#404040] dark:text-[#D4D4D4] hover:border-[#A3A3A3]"
                }`}
              >
                {decision === "warned" && <Check className="w-4 h-4" strokeWidth={2.5} />}
                {decision === "warned" ? "Ogohlantirish yuborildi" : "Ogohlantirish yuborish"}
              </button>
              <button
                onClick={handleClose}
                className="w-full h-11 px-4 bg-[#FF5900] hover:bg-[#E04F00] active:scale-[0.99] text-white text-[13px] font-semibold rounded-lg transition-all cursor-pointer"
              >
                Shikoyatni yopish
              </button>
            </div>
            <div className="flex items-center gap-2.5 mt-4 px-3.5 py-3 bg-[#FEF9EC] dark:bg-[#332b0d] rounded-lg">
              <Clock className="w-4 h-4 text-[#B45309] shrink-0" strokeWidth={2.2} />
              <span className="text-[12px] font-medium text-[#B45309]">
                14 soat 46 daqiqa qoldi (24 soatlik SLA)
              </span>
            </div>
          </div>

          {/* Shikoyat qilingan profil */}
          <div className="bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#262626] rounded-2xl p-6">
            <h3 className="text-[16px] font-bold text-[#0A0A0A] dark:text-white mb-4">Shikoyat qilingan profil</h3>
            <div className="space-y-3.5">
              {[
                { label: "Holati", value: decision === "blocked" ? "Bloklangan" : detail.profile.status },
                { label: "Ro'yxatdan", value: detail.profile.registered },
                { label: "Anketa", value: detail.profile.questionnaire },
                { label: "AI signallari", value: detail.profile.aiSignals },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-4">
                  <span className="text-[13px] text-[#737373] dark:text-[#A3A3A3]">{row.label}</span>
                  <span className="text-[14px] font-bold text-[#0A0A0A] dark:text-white tabular-nums">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AppealDetailPage;
