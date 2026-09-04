import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Check,
  X,
  AlertCircle,
  Loader2,
  ExternalLink,
  MessageSquare,
  FileText,
  ShieldAlert,
  User,
} from "lucide-react";
import {
  complaintsApi,
  type ComplaintDetail,
  COMPLAINT_REASON_MAP,
  parseConversationExcerpt,
  parseAiAnalysis,
  parseProfileSnapshot,
  getInitials,
} from "../../lib/complaintsApi";
import {
  upsertComplaintDetail,
  approveAppeal,
  rejectAppeal,
} from "../../store/slices/appealsSlice";
import dayjs from "dayjs";

const AppealDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Decision actions
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReasonText, setRejectReasonText] = useState("");
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<"warning" | "block" | null>(null);

  const fetchComplaintDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await complaintsApi.get(id);
      setComplaint(data);
      dispatch(upsertComplaintDetail(data));
    } catch (err: any) {
      const apiErr =
        err.response?.data?.error?.errorMsg ||
        err.response?.data?.detail ||
        err.message;
      setError(apiErr || "Shikoyat tafsilotini yuklashda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  }, [id, dispatch]);

  useEffect(() => {
    fetchComplaintDetail();
  }, [fetchComplaintDetail]);

  // Handle Approve Modal Open
  const handleOpenApproveModal = () => {
    setSelectedAction(null);
    setShowApproveModal(true);
  };

  // Handle Approve Confirm
  const handleConfirmApprove = async () => {
    if (!id || !selectedAction || decisionLoading) return;
    setDecisionLoading(true);
    setDecisionError(null);
    const actionLabel =
      selectedAction === "block" ? "Profil bloklandi" : "Ogohlantirish yuborildi";
    try {
      const res = await complaintsApi.decision(id, {
        decision: "approved",
        action: selectedAction,
        admin_note: actionLabel,
      });
      setComplaint((prev) =>
        prev
          ? {
            ...prev,
            status: "approved",
            status_label: "Tasdiqlandi",
            action: actionLabel,
            resolved_at: res.resolved_at || new Date().toISOString(),
            resolved_by_info: res.resolved_by_info || prev.resolved_by_info,
            admin_note: res.admin_note ?? actionLabel,
          }
          : prev
      );
      dispatch(
        approveAppeal({
          id,
          action: actionLabel,
          moderator: res.resolved_by_info?.full_name || "Admin",
          resolvedAt: res.resolved_at
            ? dayjs(res.resolved_at).format("DD.MM.YYYY HH:mm")
            : dayjs().format("DD.MM.YYYY HH:mm"),
        })
      );
      setShowApproveModal(false);
    } catch (err: any) {
      const apiErr =
        err.response?.data?.error?.errorMsg ||
        err.response?.data?.detail ||
        err.message;
      setDecisionError(apiErr || "Qarorni saqlashda xatolik yuz berdi.");
    } finally {
      setDecisionLoading(false);
    }
  };

  // Handle Reject Modal Open
  const handleOpenRejectModal = () => {
    setRejectReasonText(complaint?.admin_note || "");
    setShowRejectModal(true);
  };

  // Handle Reject Submit
  const handleRejectSubmit = async () => {
    if (!id || rejectReasonText.trim().length < 10 || decisionLoading) return;
    setDecisionLoading(true);
    setDecisionError(null);
    try {
      const res = await complaintsApi.decision(id, {
        decision: "rejected",
        admin_note: rejectReasonText.trim(),
      });
      setComplaint((prev) =>
        prev
          ? {
            ...prev,
            status: "rejected",
            status_label: "Bekor qilindi",
            admin_note: rejectReasonText.trim(),
            resolved_at: res.resolved_at || new Date().toISOString(),
            resolved_by_info: res.resolved_by_info || prev.resolved_by_info,
          }
          : prev
      );
      dispatch(
        rejectAppeal({
          id,
          reason: rejectReasonText.trim(),
          moderator: res.resolved_by_info?.full_name || "Admin",
          resolvedAt: res.resolved_at
            ? dayjs(res.resolved_at).format("DD.MM.YYYY HH:mm")
            : dayjs().format("DD.MM.YYYY HH:mm"),
        })
      );
      setShowRejectModal(false);
    } catch (err: any) {
      const apiErr =
        err.response?.data?.error?.errorMsg ||
        err.response?.data?.detail ||
        err.message;
      setDecisionError(apiErr || "Qarorni saqlashda xatolik yuz berdi.");
    } finally {
      setDecisionLoading(false);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0474F3] mb-3" />
        <p className="text-[13px] text-[#737373] dark:text-[#a3a3a3]">
          Shikoyat tafsilotlari yuklanmoqda...
        </p>
      </div>
    );
  }

  // Error State
  if (error || !complaint) {
    return (
      <div className="p-6">
        <div className="bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#262626] rounded-2xl p-10 text-center max-w-lg mx-auto">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-[16px] font-bold text-[#0A0A0A] dark:text-white">
            {error || "Shikoyat topilmadi"}
          </h3>
          <p className="text-[12px] text-[#737373] dark:text-[#a3a3a3] mt-1.5">
            So'ralgan shikoyat mavjud emas yoki o'chirilgan bo'lishi mumkin.
          </p>
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={fetchComplaintDetail}
              className="h-10 px-4 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-[#0A0A0A] dark:text-white text-[13px] font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Qayta urinish
            </button>
            <button
              onClick={() => navigate("/appeals")}
              className="h-10 px-4 bg-[#0474F3] hover:bg-[#0360cb] text-white text-[13px] font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Shikoyatlar ro'yxatiga qaytish
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Extracted user details
  const fromName =
    complaint.from_user_info?.full_name ||
    (complaint.from_user_info?.profile_info
      ? `${complaint.from_user_info.profile_info.first_name || ""} ${complaint.from_user_info.profile_info.last_name || ""}`.trim()
      : "") ||
    complaint.from_user_info?.phone_number ||
    "Shikoyatchi";

  const fromUser =
    complaint.from_user_info?.display_id ||
    complaint.from_user_info?.phone_number ||
    "-";

  const toName =
    complaint.to_user_info?.full_name ||
    (complaint.to_user_info?.profile_info
      ? `${complaint.to_user_info.profile_info.first_name || ""} ${complaint.to_user_info.profile_info.last_name || ""}`.trim()
      : "") ||
    complaint.to_user_info?.phone_number ||
    "Foydalanuvchi";

  const toUser =
    complaint.to_user_info?.display_id ||
    complaint.to_user_info?.phone_number ||
    "-";

  const fromInitials = getInitials(fromName, "SH");
  const toInitials = getInitials(toName, "FO");

  const reasonLabel =
    complaint.reason_label ||
    COMPLAINT_REASON_MAP[complaint.reason] ||
    complaint.reason ||
    "Shikoyat";

  const status = (complaint.status === "in_review" ? "pending" : complaint.status) as string;

  // Parsed sub-structures
  const chat = parseConversationExcerpt(
    complaint.conversation_excerpt,
    complaint.from_user_info,
    complaint.to_user_info
  );

  const analysis = parseAiAnalysis(
    complaint.ai_analysis,
    complaint.previous_complaints_count
  );

  const profile = parseProfileSnapshot(
    complaint.profile_snapshot,
    complaint.to_user_info
  );

  // SLA Calculation (24 hours from created_at)
  const calculateSlaRemaining = () => {
    if (!complaint.created_at) return "24 soatlik SLA";
    const createdTime = dayjs(complaint.created_at);
    const deadline = createdTime.add(24, "hour");
    const diffMinutes = deadline.diff(dayjs(), "minute");

    if (diffMinutes <= 0) {
      return "SLA muddati tugagan (24 soatlik SLA)";
    }
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    return `${hours} soat ${mins} daqiqa qoldi (24 soatlik SLA)`;
  };

  const moderatorName =
    complaint.resolved_by_info?.full_name ||
    (complaint.resolved_by_info?.profile_info
      ? `${complaint.resolved_by_info.profile_info.first_name || ""} ${complaint.resolved_by_info.profile_info.last_name || ""}`.trim()
      : "") ||
    "A. Muxtorov";

  const resolvedDate = complaint.resolved_at
    ? dayjs(complaint.resolved_at).format("DD.MM.YYYY HH:mm")
    : complaint.updated_at
      ? dayjs(complaint.updated_at).format("DD.MM.YYYY HH:mm")
      : "12.03.2026 10:02";

  return (
    <div className="p-4 space-y-4">
      {/* ── Orqaga qaytish ── */}
      {decisionError && (
        <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-3 py-1.5 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{decisionError}</span>
        </div>
      )}

      {/* ── Main 2-Column Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ── CHAP USTUN (8 cols) ── */}
        <div className="lg:col-span-8 space-y-4">
          {/* Card 1: Taraflar & Sabab */}
          <div className="bg-white dark:bg-[#141414] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5 shadow-xs">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4 flex-wrap">
                {/* Shikoyatchi */}
                <div
                  onClick={() =>
                    complaint.from_user_info?.id &&
                    window.open(`/users/details/${complaint.from_user_info.id}`, '_blank')
                  }
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#EDE9FE] dark:bg-purple-950/40 text-[#7C3AED] dark:text-purple-400 font-bold text-xs flex items-center justify-center shrink-0">
                    {fromInitials}
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-[#0A0A0A] dark:text-[#fafafa] group-hover:text-[#0474F3] transition-colors flex items-center gap-1">
                      <span>{fromName}</span>
                      {complaint.from_user_info?.id && (
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#0474F3]" />
                      )}
                    </h3>
                    <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3]">
                      {fromUser} · shikoyatchi
                    </p>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-[#A3A3A3] shrink-0" />

                {/* Shikoyat qilingan */}
                <div
                  onClick={() =>
                    complaint.to_user_info?.id &&
                    window.open(`/users/details/${complaint.to_user_info.id}`, '_blank')
                  }
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#E0F2FE] dark:bg-sky-950/40 text-[#0284C7] dark:text-sky-400 font-bold text-xs flex items-center justify-center shrink-0">
                    {toInitials}
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-[#0A0A0A] dark:text-[#fafafa] group-hover:text-[#0474F3] transition-colors flex items-center gap-1">
                      <span>{toName}</span>
                      {complaint.to_user_info?.id && (
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#0474F3]" />
                      )}
                    </h3>
                    <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3]">
                      {toUser} · shikoyat qilingan
                    </p>
                  </div>
                </div>
              </div>

              {/* Sababi Badge */}
              <span className="bg-[#FEF2F2] dark:bg-red-950/40 text-[#7F1D1D] dark:text-red-400 font-semibold text-[11px] px-3 py-1 rounded-full">
                {reasonLabel}
              </span>
            </div>

            <p className="text-[12px] text-[#404040] dark:text-[#d4d4d4] mt-4 leading-relaxed">
              {complaint.message}
            </p>
          </div>

          {/* Card 2: Suhbat tarixi · dalil */}
          <div className="bg-white dark:bg-[#141414] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5 shadow-xs">
            <h3 className="text-[13px] font-semibold text-[#0A0A0A] dark:text-[#fafafa] mb-4">
              Suhbat tarixi · dalil
            </h3>

            {chat.length === 0 ? (
              <p className="text-xs text-center py-8 text-[#737373] dark:text-[#a3a3a3]">
                Ushbu shikoyat uchun suhbat tarixi mavjud emas.
              </p>
            ) : (
              <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
                {chat.map((msg, idx) => {
                  const isRight = msg.side === "right";
                  return (
                    <div
                      key={idx}
                      className={`flex ${isRight ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 ${msg.flagged
                          ? "bg-[#FEF2F2] dark:bg-red-950/20 border border-[#FCA5A5] dark:border-red-900/40"
                          : "bg-[#F5F5F5] dark:bg-zinc-900"
                          }`}
                      >
                        <p
                          className={`text-[12px] leading-relaxed ${msg.flagged
                            ? "text-[#7F1D1D] dark:text-red-300 font-medium"
                            : "text-[#0A0A0A] dark:text-[#fafafa]"
                            }`}
                        >
                          {msg.text}
                        </p>
                        <p className="text-[10px] text-[#6B6B6B] mt-1.5 flex items-center justify-between gap-2">
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
            )}
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

            {status === "pending" ? (
              /* State: Pending / In Review */
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium text-[#737373] dark:text-[#a3a3a3]">
                    Holati
                  </span>
                  <span className="bg-[#FEF9EC] dark:bg-amber-950/40 text-[#B45309] dark:text-amber-400 font-medium text-[12px] px-3 py-1 rounded-full">
                    {complaint.status_label}
                  </span>
                </div>

                {/* Actions */}
                <div className="space-y-2.5 mt-3.5">
                  <button
                    onClick={handleOpenApproveModal}
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
                  <Clock className="w-4 h-4 text-[#92400E] shrink-0" strokeWidth={2.5} />
                  <span className="text-[12px] font-medium">
                    {calculateSlaRemaining()}
                  </span>
                </div>
              </div>
            ) : status === "rejected" ? (
              /* State: Cancelled / Rejected */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium text-[#737373] dark:text-[#a3a3a3]">
                    Holati
                  </span>
                  <span className="bg-[#FEF2F2] dark:bg-red-950/40 text-[#7F1D1D] dark:text-red-400 font-semibold text-[11px] px-3 py-1 rounded-full">
                    {complaint.status_label || "Bekor qilindi"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-[#737373] dark:text-[#a3a3a3]">Moderator</span>
                  <span className="font-bold text-[#0A0A0A] dark:text-[#fafafa]">
                    {moderatorName}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-[#737373] dark:text-[#a3a3a3]">Sana</span>
                  <span className="font-bold text-[#0A0A0A] dark:text-[#fafafa]">
                    {resolvedDate}
                  </span>
                </div>

                <div className="pt-2 border-t border-[#f0f0f0] dark:border-[#262626]">
                  <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3]">
                    Bekor qilish sababi
                  </p>
                  <p className="text-[12px] text-[#404040] dark:text-[#d4d4d4] leading-relaxed mt-1">
                    {complaint.admin_note || "Shikoyat rad etildi."}
                  </p>
                </div>
              </div>
            ) : (
              /* State: Approved */
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium text-[#737373] dark:text-[#a3a3a3]">
                    Holati
                  </span>
                  <span className="bg-[#ECFDF5] dark:bg-[#103020] text-[#047857] dark:text-[#2ee088] font-medium text-[12px] px-3 py-0.5 rounded-full">
                    {complaint.status_label || "Tasdiqlandi"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-[#737373] dark:text-[#a3a3a3]">Chora</span>
                  <span
                    className={`font-semibold ${(complaint.action || complaint.admin_note || "").includes("ogohlantirish") ||
                        (complaint.action || complaint.admin_note || "").includes("Ogohlantirish")
                        ? "text-[#92400E] dark:text-amber-400"
                        : "text-[#7F1D1D] dark:text-red-400"
                      }`}
                  >
                    {complaint.action ||
                      (complaint.admin_note?.includes("ogohlantirish") ||
                        complaint.admin_note?.includes("Ogohlantirish")
                        ? "Ogohlantirish yuborildi"
                        : "Profil bloklandi")}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-[#737373] dark:text-[#a3a3a3]">Moderator</span>
                  <span className="font-bold text-[#0A0A0A] dark:text-[#fafafa]">
                    {moderatorName}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-[#737373] dark:text-[#a3a3a3]">Sana</span>
                  <span className="font-bold text-[#0A0A0A] dark:text-[#fafafa]">
                    {resolvedDate}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Shikoyat qilingan profil */}
          <div className="bg-white dark:bg-[#141414] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-5 shadow-xs">
            <h3 className="text-[13px] font-semibold text-[#0A0A0A] dark:text-[#fafafa] mb-3.5 flex items-center justify-between">
              <span>Shikoyat qilingan profil</span>
              {complaint.to_user_info?.id && (
                <button
                  onClick={() => window.open(`/users/details/${complaint.to_user_info?.id}`, '_blank')}
                  className="text-xs text-[#0474F3] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Profilga o'tish</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
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

      {/* ── Shikoyatni tasdiqlash Modali ── */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-[520px] bg-white dark:bg-[#141414] rounded-2xl border border-[#e5e5e5] dark:border-[#262626] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-[#0A0A0A] dark:text-[#fafafa]">
                Shikoyatni tasdiqlash
              </h3>
              <button
                onClick={() => setShowApproveModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            <p className="text-[13px] text-[#737373] dark:text-[#a3a3a3] mt-2 leading-relaxed">
              Shikoyat tasdiqlansa, qoidabuzarlik qayd etiladi. Qaysi chora ko'rilishini tanlang.
            </p>

            {/* Form */}
            <div className="mt-4">
              <label className="text-[13px] font-semibold text-[#0A0A0A] dark:text-[#fafafa] block mb-3">
                Chora
              </label>

              <div className="space-y-3">
                {/* Ogohlantirish yuborish */}
                <div
                  onClick={() => setSelectedAction("warning")}
                  className={`p-4 rounded-2xl border-2 transition-colors cursor-pointer flex items-start gap-3.5 ${selectedAction === "warning"
                      ? "border-[#0474F3] bg-white dark:bg-[#141414]"
                      : "border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#141414] hover:border-gray-300 dark:hover:border-zinc-700"
                    }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {selectedAction === "warning" ? (
                      <div className="w-5 h-5 rounded-full border-2 border-[#0474F3] flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#0474F3]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-[#d4d4d4] dark:border-zinc-600" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-[13px] font-semibold text-[#0A0A0A] dark:text-[#fafafa] leading-snug">
                      Ogohlantirish yuborish
                    </h4>
                    <p className="text-[12px] text-[#737373] dark:text-[#a3a3a3] mt-1 leading-normal">
                      Foydalanuvchiga ogohlantirish boradi, profil ochiq qoladi.
                    </p>
                  </div>
                </div>

                {/* Profilni bloklash */}
                <div
                  onClick={() => setSelectedAction("block")}
                  className={`p-4 rounded-2xl border-2 transition-colors cursor-pointer flex items-start gap-3.5 ${selectedAction === "block"
                      ? "border-[#0474F3] bg-white dark:bg-[#141414]"
                      : "border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#141414] hover:border-gray-300 dark:hover:border-zinc-700"
                    }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {selectedAction === "block" ? (
                      <div className="w-5 h-5 rounded-full border-2 border-[#0474F3] flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#0474F3]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-[#d4d4d4] dark:border-zinc-600" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-[13px] font-semibold text-[#0A0A0A] dark:text-[#fafafa] leading-snug">
                      Profilni bloklash
                    </h4>
                    <p className="text-[12px] text-[#737373] dark:text-[#a3a3a3] mt-1 leading-normal">
                      Profil yopiladi, foydalanuvchi tizimga kira olmaydi.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 mt-6">
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                disabled={decisionLoading}
                className="px-4 py-2 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-[13px] font-medium text-[#0A0A0A] dark:text-[#e5e5e5] hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <X className="w-4 h-4 text-[#0A0A0A] dark:text-white" />
                <span>Ortga</span>
              </button>

              {selectedAction ? (
                <button
                  type="button"
                  onClick={handleConfirmApprove}
                  disabled={decisionLoading}
                  className="px-4 py-2 bg-[#0474F3] hover:bg-[#0360cb] text-white rounded-lg text-[13px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  {decisionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  )}
                  <span>Tasdiqlash</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="px-4 py-2 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-[13px] font-medium text-[#a3a3a3] dark:text-zinc-500 cursor-not-allowed flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[#a3a3a3] stroke-[2.5]" />
                  <span>Tasdiqlash</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Shikoyatni bekor qilish Modali ── */}
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
                disabled={decisionLoading}
                className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-[13px] font-medium text-[#404040] dark:text-[#e5e5e5] hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Ortga</span>
              </button>

              <button
                type="button"
                onClick={handleRejectSubmit}
                disabled={rejectReasonText.trim().length < 10 || decisionLoading}
                className="px-4 py-2.5 not-disabled:bg-[#DC2626] text-white disabled:border disabled:border-[#e5e5e5] dark:disabled:border-[#262626] rounded-lg text-[13px] font-medium disabled:text-[#404040] dark:disabled:text-[#e5e5e5] hover:disabled:bg-gray-50 dark:disabled:hover:bg-zinc-800 transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {decisionLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <X className="w-3.5 h-3.5" />
                )}
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
