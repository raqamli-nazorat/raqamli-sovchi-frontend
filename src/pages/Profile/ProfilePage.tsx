import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Check,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  Camera,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { axiosAPI } from "../../lib/axiosAPI";
import { setCurrentUser } from "../../store/slices/referencesSlice";
import dayjs from "dayjs";
import { HugeIcon } from "@/components/ui/HugeIcon";
import { Logout01Icon } from "@hugeicons/core-free-icons";

// ── Phone Number Auto-Formatter ──
const formatUzbekPhone = (input: string): string => {
  const raw = input.replace(/\D/g, "");
  let digits = raw;
  if (digits.startsWith("998")) {
    digits = digits.slice(3);
  }
  digits = digits.slice(0, 9);

  if (!digits) return "+998 ";

  let res = "+998";
  if (digits.length > 0) res += ` ${digits.slice(0, 2)}`;
  if (digits.length > 2) res += ` ${digits.slice(2, 5)}`;
  if (digits.length > 5) res += ` ${digits.slice(5, 7)}`;
  if (digits.length > 7) res += ` ${digits.slice(7, 9)}`;
  return res;
};

// ── Custom Toggle Switch (Matches screenshot layout) ──
interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  id?: string;
}

const Toggle = ({ checked, onChange, id }: ToggleProps) => (
  <button
    id={id}
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-[26px] w-[48px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${checked ? "bg-[#0474F3]" : "bg-[#d4d4d4] dark:bg-zinc-700"
      }`}
  >
    <span
      className={`pointer-events-none inline-block h-[22px] w-[22px] rounded-full bg-white shadow-md transform transition-transform duration-200 ${checked ? "translate-x-[22px]" : "translate-x-0"
        }`}
    />
  </button>
);

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const currentUser = useSelector((state: any) => state.references?.currentUser);

  // ── Profile Display State ──
  const [profileData, setProfileData] = useState({
    fullName: currentUser?.full_name || "",
    username: currentUser?.username || "",
    email: currentUser?.email || "",
    phone: currentUser?.phone_number ? formatUzbekPhone(currentUser.phone_number) : "",
    joinedDate: currentUser?.created_at ? dayjs(currentUser.created_at).format("DD.MM.YYYY") : "01.01.2026",
    roleName: currentUser?.role_info?.name || currentUser?.role || "Super admin",
    photoUrl: currentUser?.main_photo || currentUser?.photo_url || null as string | null,
  });

  // Sync if redux currentUser changes
  useEffect(() => {
    if (currentUser) {
      setProfileData((prev) => ({
        ...prev,
        fullName: currentUser.full_name || prev.fullName,
        username: currentUser.username || prev.username,
        email: currentUser.email || prev.email,
        phone: currentUser.phone_number
          ? formatUzbekPhone(currentUser.phone_number)
          : (currentUser.phone ? formatUzbekPhone(currentUser.phone) : prev.phone),
        joinedDate: currentUser.created_at
          ? dayjs(currentUser.created_at).format("DD.MM.YYYY")
          : prev.joinedDate,
        roleName: currentUser.role_info?.name || currentUser.role || prev.roleName,
        photoUrl: currentUser.main_photo || currentUser.photo_url || prev.photoUrl,
      }));
    }
  }, [currentUser]);

  // ── Inline Edit State ──
  const [isEditing, setIsEditing] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPhotoUrl, setEditPhotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStartEdit = () => {
    setEditFullName(profileData.fullName);
    setEditEmail(profileData.email);
    setEditPhone(profileData.phone);
    setEditPhotoUrl(profileData.photoUrl);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const formatted = formatUzbekPhone(val);
    setEditPhone(formatted);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setEditPhotoUrl(url);
    }
  };

  const handleSaveProfile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    // Update local state directly in place without breaking
    setProfileData((prev) => ({
      ...prev,
      fullName: editFullName.trim() || prev.fullName,
      email: editEmail.trim() || prev.email,
      phone: editPhone.trim() || prev.phone,
      photoUrl: editPhotoUrl,
    }));

    // Optionally update currentUser in redux
    if (currentUser) {
      dispatch(
        setCurrentUser({
          ...currentUser,
          full_name: editFullName.trim() || currentUser.full_name,
          email: editEmail.trim() || currentUser.email,
          phone: editPhone.trim() || currentUser.phone,
          phone_number: editPhone.trim() || currentUser.phone_number,
          photo_url: editPhotoUrl,
        })
      );
    }

    setIsEditing(false);
    showToast("Profil ma'lumotlari muvaffaqiyatli saqlandi!", "success");
  };

  // ── Password Change Form State ──
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // ── Security Toggles (UI only as requested) ──
  const [twoFactorAuth, setTwoFactorAuth] = useState(true);
  const [auditLogging, setAuditLogging] = useState(true);

  // ── Toast Notification State ──
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // ── Change Password Handler ──
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (!oldPassword.trim()) {
      setPasswordFeedback({ type: "error", message: "Oldingi parolni kiriting." });
      return;
    }
    if (!newPassword.trim()) {
      setPasswordFeedback({ type: "error", message: "Yangi parolni kiriting." });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordFeedback({
        type: "error",
        message: "Yangi parol kamida 8 ta belgidan iborat bo'lishi kerak.",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({
        type: "error",
        message: "Yangi parol va tasdiqlash paroli mos kelmadi.",
      });
      return;
    }

    setPasswordLoading(true);
    try {
      // PUT request to change-password endpoint
      const payload = {
        old_password: oldPassword,
        new_password: newPassword,
        confirm_new_password: confirmPassword,
      };

      const response = await axiosAPI.put("accounts/auth/change-password/", payload);

      if (response.status === 200 || response.status === 204 || response.data?.success !== false) {
        setPasswordFeedback({
          type: "success",
          message: "Parol muvaffaqiyatli o'zgartirildi!",
        });
        showToast("Parol muvaffaqiyatli yangilandi!", "success");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        throw new Error(response.data?.message || "Parolni o'zgartirib bo'lmadi.");
      }
    } catch (err: any) {
      console.error("Change password error:", err);
      const apiError = err?.response?.data?.error || err?.response?.data;
      let errorMsg = "Parolni almashtirishda xatolik yuz berdi.";

      if (typeof apiError === "string") {
        errorMsg = apiError;
      } else if (apiError?.message) {
        errorMsg = apiError.message;
      } else if (apiError?.detail) {
        errorMsg = apiError.detail;
      } else if (apiError?.old_password) {
        errorMsg = Array.isArray(apiError.old_password)
          ? apiError.old_password.join(", ")
          : String(apiError.old_password);
      } else if (apiError?.new_password) {
        errorMsg = Array.isArray(apiError.new_password)
          ? apiError.new_password.join(", ")
          : String(apiError.new_password);
      } else if (apiError?.confirm_new_password) {
        errorMsg = Array.isArray(apiError.confirm_new_password)
          ? apiError.confirm_new_password.join(", ")
          : String(apiError.confirm_new_password);
      } else if (apiError?.details) {
        errorMsg =
          typeof apiError.details === "object"
            ? Object.values(apiError.details).flat().join(", ")
            : String(apiError.details);
      }

      setPasswordFeedback({ type: "error", message: errorMsg });
      showToast(errorMsg, "error");
    } finally {
      setPasswordLoading(false);
    }
  };

  // ── Logout Handler ──
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    dispatch(setCurrentUser(null));
    navigate("/login", { replace: true });
  };

  // ── Active Sessions State (UI only) ──
  const [activeSessions, setActiveSessions] = useState([
    {
      id: "1",
      device: "Windows · Edge",
      location: "Toshkent · 213.230.x.x",
      isCurrent: true,
    },
    {
      id: "2",
      device: "iPhone · Safari",
      location: "Toshkent · 84.54.x.x",
      isCurrent: false,
    },
  ]);

  const handleRemoveSession = (id: string) => {
    setActiveSessions((prev) => prev.filter((s) => s.id !== id));
    showToast("Sessiya muvaffaqiyatli yakunlandi.", "success");
  };

  // Calculate initials for avatar fallback
  const getInitials = (name: string) => {
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    if (parts.length === 1 && parts[0].length > 0) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return "AM";
  };

  const currentPhoto = isEditing ? editPhotoUrl : profileData.photoUrl;
  const currentName = isEditing ? editFullName : profileData.fullName;

  return (
    <div className="p-4 space-y-4">
      {/* ── Toast Notification Banner ── */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-[13px] font-medium transition-all duration-300 animate-in fade-in slide-in-from-top-3 ${toast.type === "success"
            ? "bg-[#10B981] text-white"
            : "bg-[#DC2626] text-white"
            }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 hover:opacity-80 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Main 2-Column Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* ════════════════ LEFT COLUMN (8 cols) ════════════════ */}
        <div className="lg:col-span-8 space-y-4">
          {/* ── 1. Top Card: User Profile Information (Supports Inline Editing) ── */}
          <div className="bg-white dark:bg-[#141414] rounded-2xl border border-[#e5e5e5] dark:border-[#262626] p-6 shadow-sm">
            {/* Hidden file input for inline photo upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Avatar + Name + Badges */}
              <div className="flex items-center gap-4">
                {/* Avatar with edit overlay when isEditing */}
                <div className="relative group shrink-0">
                  {currentPhoto ? (
                    <img
                      src={currentPhoto}
                      alt={currentName}
                      className="w-14 h-14 rounded-full object-cover border-2 border-blue-500/20 shadow-sm"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-[#DCEEFE] dark:bg-blue-950/60 flex items-center justify-center font-bold text-[#0474F3] text-[18px] select-none">
                      {getInitials(currentName)}
                    </div>
                  )}

                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      title="Rasmni o'zgartirish"
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white dark:bg-zinc-800 border border-[#e5e5e5] dark:border-[#262626] text-[#0474F3] shadow-md flex items-center justify-center bottom-0 right-0 transition-all duration-200 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 transition-all" />
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 flex-1 min-w-0">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      placeholder="Ism va familiya"
                      className="w-full max-w-[280px] h-9 px-3 text-[15px] font-bold text-[#0A0A0A] dark:text-[#fafafa] bg-white dark:bg-zinc-900 border border-[#0474F3] rounded-xl outline-none focus:ring-2 focus:ring-[#0474F3]/20 transition-all"
                    />
                  ) : (
                    <h2 className="text-[17px] font-bold text-[#0A0A0A] dark:text-[#fafafa] leading-tight">
                      {profileData.fullName}
                    </h2>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Super admin pill */}
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#f5f5f5] dark:bg-zinc-800 text-[#525252] dark:text-[#a3a3a3] border border-[#e5e5e5] dark:border-zinc-700">
                      {profileData.roleName}
                    </span>
                    {/* To'liq huquq pill */}
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF5] text-[#10B981] dark:bg-emerald-950/40 dark:text-emerald-400 border border-[#A7F3D0] dark:border-emerald-800/50">
                      To'liq huquq
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Tahrirlash OR (Bekor qilish + Saqlash) */}
              {!isEditing ? (
                <button
                  id="edit-profile-btn"
                  onClick={handleStartEdit}
                  className="self-start sm:self-center flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#e5e5e5] dark:border-[#262626] text-[13px] font-medium text-[#0A0A0A] dark:text-[#fafafa] hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
                >
                  <Check className="w-4 h-4 text-[#0A0A0A] dark:text-[#fafafa]" strokeWidth={2.5} />
                  <span>Tahrirlash</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg border border-[#e5e5e5] dark:border-[#262626] text-[12px] font-medium text-[#737373] dark:text-[#a3a3a3] hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Bekor qilish</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveProfile()}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0474F3] hover:bg-[#023399] active:bg-[#0474F3] text-white text-[12px] font-semibold transition-colors cursor-pointer shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                    <span>Saqlash</span>
                  </button>
                </div>
              )}
            </div>

            {/* 4-Column Metadata Block (Inline editable inputs when isEditing) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-gray-100 dark:border-[#262626] items-start">
              {/* 1. Login */}
              <div>
                <p className="text-[12px] font-normal text-[#737373] dark:text-[#a3a3a3]">Login</p>
                <p className="text-[13px] font-semibold text-[#0A0A0A] dark:text-[#fafafa] mt-1 truncate">
                  {profileData.username}
                </p>
              </div>

              {/* 2. Email */}
              <div>
                <p className="text-[12px] font-normal text-[#737373] dark:text-[#a3a3a3] mb-1">Email</p>
                {isEditing ? (
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="admin@sovchi.app"
                    className="w-full h-9 px-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] focus:border-[#0474F3] rounded-lg text-[13px] text-[#0A0A0A] dark:text-[#fafafa] outline-none transition-colors"
                  />
                ) : (
                  <p className="text-[13px] font-semibold text-[#0A0A0A] dark:text-[#fafafa] truncate">
                    {profileData.email}
                  </p>
                )}
              </div>

              {/* 3. Telefon */}
              <div>
                <p className="text-[12px] font-normal text-[#737373] dark:text-[#a3a3a3] mb-1">Telefon</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={editPhone}
                    onChange={handlePhoneInputChange}
                    placeholder="+998 90 123 45 67"
                    className="w-full h-9 px-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] focus:border-[#0474F3] rounded-lg text-[13px] text-[#0A0A0A] dark:text-[#fafafa] outline-none transition-colors"
                  />
                ) : (
                  <p className="text-[13px] font-semibold text-[#0A0A0A] dark:text-[#fafafa] truncate">
                    {profileData.phone}
                  </p>
                )}
              </div>

              {/* 4. Qo'shilgan */}
              <div>
                <p className="text-[12px] font-normal text-[#737373] dark:text-[#a3a3a3]">Qo'shilgan</p>
                <p className="text-[13px] font-semibold text-[#0A0A0A] dark:text-[#fafafa] mt-1 truncate">
                  {profileData.joinedDate}
                </p>
              </div>
            </div>
          </div>

          {/* ── 2. Bottom Card: Xavfsizlik (Security & Password Change) ── */}
          <div className="bg-white dark:bg-[#141414] rounded-2xl border border-[#e5e5e5] dark:border-[#262626] p-6 shadow-sm space-y-6">
            <h3 className="text-[15px] font-bold text-[#0A0A0A] dark:text-[#fafafa]">
              Xavfsizlik
            </h3>

            {/* Change Password Form */}
            <form onSubmit={handleChangePassword} className="space-y-4">
              {passwordFeedback && (
                <div
                  className={`p-3 rounded-xl text-[12px] flex items-center gap-2 ${passwordFeedback.type === "success"
                    ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                    : "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800"
                    }`}
                >
                  {passwordFeedback.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  )}
                  <span>{passwordFeedback.message}</span>
                </div>
              )}

              {/* Password Inputs Grid: Oldingi parol, Yangi parol, Parolni tasdiqlang */}
              <div className="grid grid-cols-15 gap-3.5">
                {/* 1. Oldingi parol */}
                <div className="col-span-4">
                  <label className="text-[12px] font-medium text-[#404040] dark:text-[#a3a3a3] block mb-1.5">
                    Oldingi parol
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-[#737373] absolute left-3.5 pointer-events-none" />
                    <input
                      id="old-password-input"
                      type={showOldPassword ? "text" : "password"}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-11 pl-10 pr-10 bg-white dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] text-[#0A0A0A] dark:text-[#fafafa] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0474F3]/20 focus:border-[#0474F3] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword((v) => !v)}
                      className="absolute right-3 text-[#a3a3a3] hover:text-[#525252] dark:hover:text-zinc-300 transition-colors cursor-pointer"
                    >
                      {showOldPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 2. Yangi parol */}
                <div className="col-span-4">
                  <label className="text-[12px] font-medium text-[#404040] dark:text-[#a3a3a3] block mb-1.5">
                    Yangi parol
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-[#737373] absolute left-3.5 pointer-events-none" />
                    <input
                      id="new-password-input"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-11 pl-10 pr-10 bg-white dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] text-[#0A0A0A] dark:text-[#fafafa] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0474F3]/20 focus:border-[#0474F3] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((v) => !v)}
                      className="absolute right-3 text-[#a3a3a3] hover:text-[#525252] dark:hover:text-zinc-300 transition-colors cursor-pointer"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 3. Parolni tasdiqlang */}
                <div className="col-span-4">
                  <label className="text-[12px] font-medium text-[#404040] dark:text-[#a3a3a3] block mb-1.5">
                    Parolni tasdiqlang
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-[#737373] absolute left-3.5 pointer-events-none" />
                    <input
                      id="confirm-password-input"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-11 pl-10 pr-10 bg-white dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] text-[#0A0A0A] dark:text-[#fafafa] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0474F3]/20 focus:border-[#0474F3] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute right-3 text-[#a3a3a3] hover:text-[#525252] dark:hover:text-zinc-300 transition-colors cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  id="update-password-btn"
                  type="submit"
                  disabled={passwordLoading}
                  className="h-9 px-3 col-span-3 bg-[#0474F3] mt-auto hover:bg-[#023399] active:bg-[#0474F3] disabled:opacity-60 text-white font-medium text-[12px] rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  {passwordLoading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                  )}
                  <span>Parolni yangilash</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ════════════════ RIGHT COLUMN (4 cols) ════════════════ */}
        <div className="lg:col-span-4 space-y-4">
          {/* ── 4. Bottom Card: Tizimdan chiqish ── */}
          <div
            id="logout-card-btn"
            onClick={() => setShowLogoutConfirm(true)}
            className="bg-white dark:bg-[#141414] rounded-2xl border border-[#e5e5e5] dark:border-[#262626] p-5 shadow-sm hover:border-red-200 dark:hover:border-red-900/50 transition-colors cursor-pointer group flex items-center gap-3.5"
          >
            <div className="shrink-0 text-[#7F1D1D]">
              <HugeIcon icon={Logout01Icon} className="w-5 h-5" strokeWidth={3} />
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-[14px] font-bold text-[#7F1D1D] leading-tight">
                Tizimdan chiqish
              </h4>
              <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3] mt-0.5 leading-tight">
                Barcha qurilmalardan chiqish uchun sessiyalarni yoping
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════ LOGOUT CONFIRMATION MODAL ════════════════ */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-[400px] bg-white dark:bg-[#141414] rounded-[20px] border border-[#e5e5e5] dark:border-[#262626] shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-[#DC2626] mx-auto">
              <LogOut className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-[16px] font-bold text-[#0A0A0A] dark:text-[#fafafa]">
                Tizimdan chiqishni tasdiqlaysizmi?
              </h3>
              <p className="text-[13px] text-[#737373] dark:text-[#a3a3a3]">
                Hozirgi sessiyangiz yakunlanadi va login sahifasiga qaytasiz.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] font-medium text-[#404040] dark:text-[#e5e5e5] hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 py-2.5 bg-[#DC2626] hover:bg-red-700 text-white rounded-xl text-[13px] font-semibold transition-colors cursor-pointer shadow-sm"
              >
                Chiqish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;