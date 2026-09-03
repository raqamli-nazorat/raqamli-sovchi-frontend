import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ChevronLeft, ChevronRight, Clock, Check, X } from "lucide-react";
import { approveAppeal, rejectAppeal, type Appeal } from "../../store/slices/appealsSlice";
import dayjs from "dayjs";

const AppealDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const appeals: Appeal[] = useSelector((state: any) => state.appeals.items);
  const appeal = appeals.find((a) => String(a.id) === String(id)) || appeals[0];

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReasonText, setRejectReasonText] = useState("");

  if (!appeal) {
    return (
      <div className="p-6">
        <div className="bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#262626] rounded-2xl p-10 text-center">
          <p className="text-[14px] font-semibold text-[#0A0A0A] dark:text-white">Shikoyat topilmadi</p>
          <button
            onClick={() => navigate("/appeals")}
            className="mt-4 h-10 px-4 bg-[#0474F3] hover:bg-[#0360cb] text-white text-[13px] font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Shikoyatlar ro'yxatiga qaytish
          </button>
        </div>
      </div>
    );
  }

  const fromInitials = appeal.fromName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "MR";

  const toInitials = appeal.toName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "BQ";

  const chat = appeal.chat || [
    { side: "left", text: "Assalomu alaykum. Taklifingiz uchun rahmat.", time: "09:02" },
    { side: "right", text: "Va alaykum assalom. Vaqtingiz bo'lsa tanishsak.", time: "09:04" },
    { side: "left", text: "Rasmingizni yuboring, hech kim ko'rmaydi.", time: "09:09", flagged: true },
    { side: "right", text: "Bunday so'rovga javob bermayman.", time: "09:12" },
  ];

  const analysis = appeal.analysis || {
    level: "Yuqori",
    warnings: "2 marta",
    reports: "3 ta",
    advice: "Profilni bloklash",
  };

  const profile = appeal.profile || {
    status: "Bloklangan",
    registered: "02.02.2026",
    questionnaire: "30/30 · 100%",
    aiSignals: "4 ta",
  };

  const handleApprove = () => {
    dispatch(
      approveAppeal({
        id: appeal.id,
        moderator: "A. Muxtorov",
        resolvedAt: dayjs().format("DD.MM.YYYY HH:mm"),
      })
    );
  };

  const handleOpenRejectModal = () => {
    setRejectReasonText(
      appeal.rejectReason ||
        "Shikoyat asossiz: suhbat tarixida haqoratli ibora topilmadi, keltirilgan skrinshot boshqa foydalanuvchiga tegishli."
    );
    setShowRejectModal(true);
  };

  const handleRejectSubmit = () => {
    if (rejectReasonText.trim().length < 10) return;
    dispatch(
      rejectAppeal({
        id: appeal.id,
        reason: rejectReasonText.trim(),
        moderator: "A. Muxtorov",
        resolvedAt: dayjs().format("DD.MM.YYYY HH:mm"),
      })
    );
    setShowRejectModal(false);
  };

  return (
    <div className="p-4 space-y-4">
      
      {/* ── Orqaga qaytish ── */}
      <div>
        <button
          onClick={() => navigate("/appeals")}
          className="flex items-center gap-1.5 text-[12px] font-medium text-[#737373] hover:text-[#0A0A0A] dark:text-[#a3a3a3] dark:hover:text-white transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Shikoyatlar ro'yxatiga qaytish</span>
        </button>
      </div>

      {/* ── Main 2-Column Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* ── CHAP USTUN (8 cols) ── */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Card 1: Taraflar & Sabab */}
          <div className="bg-white dark:bg-[#141414] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5 shadow-xs">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              
              <div className="flex items-center gap-4 flex-wrap">
                {/* Shikoyatchi */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#EDE9FE] dark:bg-purple-950/40 text-[#7C3AED] dark:text-purple-400 font-bold text-xs flex items-center justify-center shrink-0">
                    {fromInitials}
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-[#0A0A0A] dark:text-[#fafafa]">
                      {appeal.fromName}
                    </h3>
                    <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3]">
                      {appeal.fromUser} · shikoyatchi
                    </p>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-[#A3A3A3] shrink-0" />

                {/* Shikoyat qilingan */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#E0F2FE] dark:bg-sky-950/40 text-[#0284C7] dark:text-sky-400 font-bold text-xs flex items-center justify-center shrink-0">
                    {toInitials}
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-[#0A0A0A] dark:text-[#fafafa]">
                      {appeal.toName}
                    </h3>
                    <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3]">
                      {appeal.toUser} · shikoyat qilingan
                    </p>
                  </div>
                </div>
              </div>

              {/* Sababi Badge */}
              <span className="bg-[#FEF2F2] dark:bg-red-950/40 text-[#7F1D1D] dark:text-red-400 font-semibold text-[11px] px-3 py-1 rounded-full">
                {appeal.tag}
              </span>
            </div>

            <p className="text-[12px] text-[#404040] dark:text-[#d4d4d4] mt-4 leading-relaxed">
              {appeal.description}
            </p>
          </div>

          {/* Card 2: Suhbat tarixi · dalil */}
          <div className="bg-white dark:bg-[#141414] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5 shadow-xs">
            <h3 className="text-[13px] font-semibold text-[#0A0A0A] dark:text-[#fafafa] mb-4">
              Suhbat tarixi · dalil
            </h3>

            <div className="space-y-3.5">
              {chat.map((msg, idx) => {
                const isRight = msg.side === "right";
                return (
                  <div
                    key={idx}
                    className={`flex ${isRight ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[65%] rounded-2xl px-4 py-3 ${
                        msg.flagged
                          ? "bg-[#FEF2F2] dark:bg-red-950/20 border border-[#FCA5A5] dark:border-red-900/40"
                          : "bg-[#F5F5F5] dark:bg-zinc-900"
                      }`}
                    >
                      <p
                        className={`text-[12px] ${
                          msg.flagged
                            ? "text-[#7F1D1D] dark:text-red-300 font-medium"
                            : "text-[#0A0A0A] dark:text-[#fafafa]"
                        }`}
                      >
                        {msg.text}
                      </p>
                      <p className="text-[10px] text-[#6B6B6B] mt-1.5 flex items-center gap-2">
                        <span>{msg.time}</span>
                        {msg.flagged && (
                          <span className="font-semibold text-[#7F1D1D] dark:text-red-400">
                            AI: qoidabuzarlik aniqlandi
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 3: AI tahlili */}
          <div className="bg-white dark:bg-[#141414] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5 shadow-xs">
            <h3 className="text-[13px] font-semibold text-[#0A0A0A] dark:text-[#fafafa] mb-4">
              AI tahlili
            </h3>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="border border-[#f0f0f0] dark:border-[#262626] rounded-xl p-3.5">
                <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3]">
                  Qoidabuzarlik darajasi
                </p>
                <p className="text-[12px] font-semibold text-[#7F1D1D] dark:text-red-400 mt-1">
                  {analysis.level}
                </p>
              </div>

              <div className="border border-[#f0f0f0] dark:border-[#262626] rounded-xl p-3.5">
                <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3]">
                  Oldingi ogohlantirishlar
                </p>
                <p className="text-[12px] font-semibold text-[#92400E] dark:text-amber-400 mt-1">
                  {analysis.warnings}
                </p>
              </div>

              <div className="border border-[#f0f0f0] dark:border-[#262626] rounded-xl p-3.5">
                <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3]">
                  Shikoyatlar soni
                </p>
                <p className="text-[12px] font-semibold text-[#0A0A0A] dark:text-[#fafafa] mt-1">
                  {analysis.reports}
                </p>
              </div>

              <div className="border border-[#f0f0f0] dark:border-[#262626] rounded-xl p-3.5">
                <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3]">
                  Tavsiya
                </p>
                <p className="text-[12px] font-semibold text-[#7F1D1D] dark:text-red-400 mt-1">
                  {analysis.advice}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* ── O'NG USTUN (4 cols) ── */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Card 1: Qaror */}
          <div className="bg-white dark:bg-[#141414] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5 shadow-xs">
            <h3 className="text-[13px] font-semibold text-[#0A0A0A] dark:text-[#fafafa] mb-3">
              Qaror
            </h3>

            {appeal.status === "in_review" ? (
              /* State: In Review (Image 3) */
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium text-[#737373] dark:text-[#a3a3a3]">
                    Holati
                  </span>
                  <span className="bg-[#FEF9EC] dark:bg-amber-950/40 text-[#B45309] dark:text-amber-400 font-medium text-[12px] px-3 py-1 rounded-full">
                    Ko'rib chiqilmoqda
                  </span>
                </div>

                {/* Actions */}
                <div className="space-y-2.5 mt-3.5">
                  <button
                    onClick={handleApprove}
                    className="w-full py-2.5 px-4 bg-[#0474F3] hover:bg-[#0360cb] active:scale-[0.99] text-white text-[13px] font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Tasdiqlash</span>
                  </button>

                  <button
                    onClick={handleOpenRejectModal}
                    className="w-full py-2.5 px-4 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] hover:bg-gray-50 dark:hover:bg-zinc-800 text-[#7F1D1D] dark:text-[#fafafa] text-[13px] font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4 text-[#0a0a0a]" strokeWidth={3} />
                    <span>Bekor qilish</span>
                  </button>
                </div>

                {/* SLA Timer */}
                <div className="flex items-center gap-2 mt-4 px-3.5 py-2.5 bg-[#FFFBEB] dark:bg-amber-950/20 text-[#92400E] dark:text-amber-400 rounded-xl">
                  <Clock className="w-4 h-4 text-[#92400E] shrink-0" strokeWidth={3} />
                  <span className="text-[12px] font-medium">
                    14 soat 46 daqiqa qoldi (24 soatlik SLA)
                  </span>
                </div>
              </div>
            ) : appeal.status === "rejected" ? (
              /* State: Cancelled / Rejected (Image 5) */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium text-[#737373] dark:text-[#a3a3a3]">
                    Holati
                  </span>
                  <span className="bg-[#FFF0F0] dark:bg-red-950/40 text-[#E11D48] dark:text-red-400 font-medium text-[12px] px-3 py-1 rounded-full">
                    Bekor qilindi
                  </span>
                </div>

                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-[#737373] dark:text-[#a3a3a3]">Moderator</span>
                  <span className="font-bold text-[#0A0A0A] dark:text-[#fafafa]">
                    {appeal.moderator || "A. Muxtorov"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-[#737373] dark:text-[#a3a3a3]">Sana</span>
                  <span className="font-bold text-[#0A0A0A] dark:text-[#fafafa]">
                    {appeal.resolvedAt || "12.03.2026 10:02"}
                  </span>
                </div>

                <div className="pt-2 border-t border-[#f0f0f0] dark:border-[#262626]">
                  <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3]">
                    Bekor qilish sababi
                  </p>
                  <p className="text-[12px] text-[#404040] dark:text-[#d4d4d4] leading-relaxed mt-1">
                    {appeal.rejectReason ||
                      "Shikoyat asossiz: suhbat tarixida haqoratli ibora topilmadi, keltirilgan skrinshot boshqa foydalanuvchiga tegishli."}
                  </p>
                </div>
              </div>
            ) : (
              /* State: Approved */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium text-[#737373] dark:text-[#a3a3a3]">
                    Holati
                  </span>
                  <span className="bg-[#E6F9F0] dark:bg-[#103020] text-[#00A854] dark:text-[#2ee088] font-medium text-[12px] px-3 py-1 rounded-full">
                    Tasdiqlandi
                  </span>
                </div>

                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-[#737373] dark:text-[#a3a3a3]">Moderator</span>
                  <span className="font-bold text-[#0A0A0A] dark:text-[#fafafa]">
                    {appeal.moderator || "A. Muxtorov"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-[#737373] dark:text-[#a3a3a3]">Sana</span>
                  <span className="font-bold text-[#0A0A0A] dark:text-[#fafafa]">
                    {appeal.resolvedAt || "12.03.2026 10:02"}
                  </span>
                </div>

                <div className="pt-2 border-t border-[#f0f0f0] dark:border-[#262626]">
                  <p className="text-[12px] text-[#00A854] dark:text-[#2ee088] leading-relaxed font-medium">
                    Shikoyat tasdiqlandi va profilga nisbatan qoidabuzarlik choralari qo'llanildi.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Shikoyat qilingan profil */}
          <div className="bg-white dark:bg-[#141414] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5 shadow-xs">
            <h3 className="text-[13px] font-semibold text-[#0A0A0A] dark:text-[#fafafa] mb-3.5">
              Shikoyat qilingan profil
            </h3>

            <div className="space-y-2.5 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-[#737373] dark:text-[#a3a3a3]">Holati</span>
                <span className="font-semibold text-[#0A0A0A] dark:text-[#fafafa]">
                  {profile.status}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#737373] dark:text-[#a3a3a3]">Ro'yxatdan</span>
                <span className="font-semibold text-[#0A0A0A] dark:text-[#fafafa]">
                  {profile.registered}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#737373] dark:text-[#a3a3a3]">Anketa</span>
                <span className="font-semibold text-[#0A0A0A] dark:text-[#fafafa]">
                  {profile.questionnaire}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#737373] dark:text-[#a3a3a3]">AI signallari</span>
                <span className="font-semibold text-[#0A0A0A] dark:text-[#fafafa]">
                  {profile.aiSignals}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ── Shikoyatni bekor qilish Modali (Image 4) ── */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-[500px] bg-white dark:bg-[#141414] rounded-2xl border border-[#e5e5e5] dark:border-[#262626] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-[#0A0A0A] dark:text-[#fafafa]">
                Shikoyatni bekor qilish
              </h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            <p className="text-[12px] text-[#737373] dark:text-[#a3a3a3] mt-2 leading-relaxed">
              Shikoyat rad etilsa, sabab majburiy. U shikoyat kartasida saqlanadi va tekshiruv tarixida ko'rinadi.
            </p>

            {/* Form */}
            <div className="mt-4">
              <label className="text-[13px] font-medium text-[#404040] dark:text-zinc-300 block mb-1.5">
                Bekor qilish sababi
              </label>
              <textarea
                rows={4}
                value={rejectReasonText}
                onChange={(e) => setRejectReasonText(e.target.value)}
                placeholder="Nima uchun shikoyat bekor qilinmoqda?"
                className="w-full p-3.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] text-[#0A0A0A] dark:text-[#fafafa] outline-none focus:border-[#0474F3] transition-colors resize-none placeholder:text-[#a3a3a3]"
              />
              <p className="text-[11px] text-[#a3a3a3] mt-1">
                Majburiy maydon. Kamida 10 ta belgi.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 mt-6">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-[13px] font-medium text-[#404040] dark:text-[#e5e5e5] hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Ortga</span>
              </button>

              <button
                type="button"
                onClick={handleRejectSubmit}
                disabled={rejectReasonText.trim().length < 10}
                className="px-4 py-2.5 not-disabled:bg-[#DC2626] text-white disabled:border disabled:border-[#e5e5e5] dark:disabled:border-[#262626] rounded-lg text-[13px] font-medium disabled:text-[#404040] dark:disabled:text-[#e5e5e5] hover:disabled:bg-gray-50 dark:disabled:hover:bg-zinc-800 transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-3.5 h-3.5 " />
                <span>Bekor qilish</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AppealDetailPage;
