import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { X, Check, Eye, EyeOff, Loader2, Trash2, Plus, AlertCircle, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { setCurrentUser } from "../../store/slices/referencesSlice";
import { axiosAPI } from "../../lib/axiosAPI";
import dayjs from "dayjs";
import { HugeIcon } from "./HugeIcon";
import { FloppyDiskIcon } from "@hugeicons/core-free-icons";

export const formatUzbekPhone = (input: string): string => {
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

interface AvatarCropperModalProps {
  imageSrc: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (croppedDataUrl: string) => void;
}

const AvatarCropperModal: React.FC<AvatarCropperModalProps> = ({
  imageSrc,
  isOpen,
  onClose,
  onSave,
}) => {
  const containerSize = 320;
  const cropDiameter = 240;
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [imgDim, setImgDim] = useState({ w: 0, h: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  const baseScale =
    imgDim.w > 0 && imgDim.h > 0
      ? Math.max(cropDiameter / imgDim.w, cropDiameter / imgDim.h)
      : 1;

  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.onload = () => {
      setImgDim({ w: img.naturalWidth, h: img.naturalHeight });
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  if (!isOpen || !imageSrc) return null;

  const clampOffset = (newZoom: number, curOffset: { x: number; y: number }) => {
    if (imgDim.w === 0 || imgDim.h === 0) return curOffset;
    const curW = imgDim.w * baseScale * newZoom;
    const curH = imgDim.h * baseScale * newZoom;
    const maxX = Math.max(0, (curW - cropDiameter) / 2);
    const maxY = Math.max(0, (curH - cropDiameter) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, curOffset.x)),
      y: Math.max(-maxY, Math.min(maxY, curOffset.y)),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || imgDim.w === 0) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const proposed = {
      x: dragStartRef.current.offsetX + dx,
      y: dragStartRef.current.offsetY + dy,
    };
    setOffset(clampOffset(zoom, proposed));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch { }
  };

  const handleZoomChange = (newZoom: number) => {
    const clampedZoom = Math.max(1, Math.min(3, newZoom));
    setZoom(clampedZoom);
    setOffset((prev) => clampOffset(clampedZoom, prev));
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    handleZoomChange(zoom + delta);
  };

  const handleReset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleSaveCrop = () => {
    if (!imgRef.current || imgDim.w === 0 || imgDim.h === 0) return;
    const canvas = document.createElement("canvas");
    const OUTPUT_SIZE = 512;
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const factor = OUTPUT_SIZE / cropDiameter;
    const renderedW = imgDim.w * baseScale * zoom * factor;
    const renderedH = imgDim.h * baseScale * zoom * factor;
    const drawX = OUTPUT_SIZE / 2 + offset.x * factor - renderedW / 2;
    const drawY = OUTPUT_SIZE / 2 + offset.y * factor - renderedH / 2;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(imgRef.current, drawX, drawY, renderedW, renderedH);

    const croppedDataUrl = canvas.toDataURL("image/jpeg", 0.92);
    onSave(croppedDataUrl);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-[420px] bg-white dark:bg-[#141414] rounded-2xl p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[17px] font-bold text-[#0A0A0A] dark:text-[#fafafa]">
              Rasmni moslash
            </h3>
            <p className="text-[12px] text-[#737373] dark:text-[#a3a3a3] mt-0.5">
              Suratni suring va kerakli qismini tanlang
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 transition-colors cursor-pointer p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cropper Container */}
        <div
          style={{ width: `${containerSize}px`, height: `${containerSize}px` }}
          className="mx-auto relative rounded-xl overflow-hidden bg-black flex items-center justify-center select-none touch-none cursor-grab active:cursor-grabbing border border-zinc-200 dark:border-zinc-800"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
        >
          {/* Image */}
          {imgDim.w > 0 && (
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop preview"
              draggable={false}
              style={{
                width: `${imgDim.w * baseScale * zoom}px`,
                height: `${imgDim.h * baseScale * zoom}px`,
                transform: `translate(${offset.x}px, ${offset.y}px)`,
                maxWidth: "none",
              }}
              className="pointer-events-none select-none"
            />
          )}

          {/* Circular Mask & Border */}
          <div
            style={{ width: `${cropDiameter}px`, height: `${cropDiameter}px` }}
            className="absolute rounded-full pointer-events-none border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]"
          >
            <div className="absolute inset-0 rounded-full border border-white/25 pointer-events-none" />
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-3 mt-4 px-1">
          <button
            type="button"
            onClick={() => handleZoomChange(zoom - 0.2)}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors p-1 cursor-pointer"
            title="Kichraytirish"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <input
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
            className="flex-1 h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#0070F3]"
          />

          <button
            type="button"
            onClick={() => handleZoomChange(zoom + 0.2)}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors p-1 cursor-pointer"
            title="Kattalashtirish"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 transition-colors p-1 ml-1 cursor-pointer"
            title="Qaytarish"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-5 pt-3 border-t border-gray-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] font-medium text-[#0A0A0A] dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Bekor qilish
          </button>
          <button
            type="button"
            onClick={handleSaveCrop}
            className="px-5 py-2 bg-[#0070F3] hover:bg-[#0060df] text-white rounded-xl text-[13px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Saqlash</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface ProfileModalsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModals: React.FC<ProfileModalsProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector((state: any) => state.references?.currentUser);

  // Active view: "main" (Mening profilim), "password" (Parolni o'zgartirish), "edit" (Profilni tahrirlash), "photo" (Profil surati)
  const [activeModal, setActiveModal] = useState<"main" | "password" | "edit" | "photo">("main");

  // Alert in main modal (Rasm 3)
  const [alertInfo, setAlertInfo] = useState<{ title: string; message: string } | null>(null);

  // Base profile details
  const fullName =
    currentUser?.full_name ||
    (currentUser?.profile_info
      ? `${currentUser.profile_info.first_name || ""} ${currentUser.profile_info.last_name || ""}`.trim()
      : "") ||
    "Abdulaziz Muxtorov";

  const splitNames = fullName.split(" ");
  const initialFirstName = currentUser?.first_name || currentUser?.profile_info?.first_name || splitNames[0] || "Abdulaziz";
  const initialLastName = currentUser?.last_name || currentUser?.profile_info?.last_name || splitNames.slice(1).join(" ") || "Muxtorov";
  const initialPhone = currentUser?.phone_number
    ? formatUzbekPhone(currentUser.phone_number)
    : currentUser?.phone
      ? formatUzbekPhone(currentUser.phone)
      : "+998 90 123 45 67";
  const initialUsername = currentUser?.username || "a.muxtorov";
  const joinedDate = currentUser?.created_at
    ? dayjs(currentUser.created_at).format("DD.MM.YYYY HH:mm")
    : "01.01.2026 09:00";
  const roleName = currentUser?.role_info?.name || currentUser?.role || "Super admin";
  const initialPhoto = currentUser?.avatar || currentUser?.main_photo || currentUser?.photo_url || null;

  // Edit profile form state
  const [editFirstName, setEditFirstName] = useState(initialFirstName);
  const [editLastName, setEditLastName] = useState(initialLastName);
  const [editPhone, setEditPhone] = useState(initialPhone);
  const [draftPhoto, setDraftPhoto] = useState<string | null>(initialPhoto);
  const [tempPhoto, setTempPhoto] = useState<string | null>(initialPhoto);
  const [rawImageToCrop, setRawImageToCrop] = useState<string | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset or initialize edit values whenever modal opens or activeModal changes to edit
  useEffect(() => {
    if (isOpen) {
      setEditFirstName(initialFirstName);
      setEditLastName(initialLastName);
      setEditPhone(initialPhone);
      setDraftPhoto(initialPhoto);
      setTempPhoto(initialPhoto);
      setSaveError(null);
    }
  }, [isOpen, initialFirstName, initialLastName, initialPhone, initialPhoto]);

  // Check if form changed (for disabled state on save button)
  const isProfileChanged =
    editFirstName.trim() !== initialFirstName.trim() ||
    editLastName.trim() !== initialLastName.trim() ||
    editPhone.trim() !== initialPhone.trim() ||
    draftPhoto !== initialPhoto;

  // Initials generator
  const getInitials = (fName: string, lName: string) => {
    const f = fName.trim().charAt(0).toUpperCase();
    const l = lName.trim().charAt(0).toUpperCase();
    return `${f}${l}` || "AM";
  };

  const currentInitials = getInitials(
    activeModal === "edit" ? editFirstName : initialFirstName,
    activeModal === "edit" ? editLastName : initialLastName
  );

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    dispatch(setCurrentUser(null));
    onClose();
    navigate("/login", { replace: true });
  };

  // Password change submit handler
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!currentPassword.trim()) {
      setPasswordError("Joriy parolni kiriting.");
      return;
    }
    if (!newPassword.trim()) {
      setPasswordError("Yangi parolni kiriting.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Yangi parol kamida 8 ta belgidan iborat bo'lishi kerak.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Yangi parol va tasdiqlash paroli mos kelmadi.");
      return;
    }

    setPasswordLoading(true);
    try {
      const payload = {
        old_password: currentPassword,
        new_password: newPassword,
        confirm_new_password: confirmPassword,
      };

      const response = await axiosAPI.put("accounts/auth/change-password/", payload);

      if (response.status === 200 || response.status === 204 || response.data?.success !== false) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setAlertInfo({
          title: "Parol yangilandi",
          message: "Keyingi kirishda yangi paroldan foydalaning.",
        });
        setActiveModal("main");
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
      }
      setPasswordError(errorMsg);
    } finally {
      setPasswordLoading(false);
    }
  };

  // Helper to convert dataURL or blob URI to File object for multipart upload
  const getAvatarBlobOrFile = async (photoUri: string): Promise<Blob | File | null> => {
    if (!photoUri) return null;
    if (photoUri.startsWith("data:")) {
      const arr = photoUri.split(",");
      const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new File([u8arr], "avatar.jpg", { type: mime });
    }
    if (photoUri.startsWith("blob:")) {
      const res = await fetch(photoUri);
      const blob = await res.blob();
      return new File([blob], "avatar.jpg", { type: blob.type || "image/jpeg" });
    }
    return null;
  };

  // Edit profile save handler -> POST/PATCH to /api/v1/accounts/staff/me/
  const handleSaveProfile = async () => {
    if (!isProfileChanged || saveLoading) return;

    setSaveLoading(true);
    setSaveError(null);

    const rawDigits = editPhone.replace(/\D/g, "");
    const cleanPhone = rawDigits.startsWith("998") ? `+${rawDigits}` : `+998${rawDigits}`;

    try {
      const formData = new FormData();
      formData.append("first_name", editFirstName.trim());
      formData.append("last_name", editLastName.trim());
      formData.append("phone_number", cleanPhone);

      if (draftPhoto && draftPhoto !== initialPhoto) {
        const file = await getAvatarBlobOrFile(draftPhoto);
        if (file) {
          formData.append("avatar", file);
        }
      } else if (!draftPhoto && initialPhoto) {
        // Avatar o'chirilgan holatda
        formData.append("avatar", "");
      }

      let response;
      try {
        response = await axiosAPI.patch("accounts/staff/me/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } catch (patchErr: any) {
        if (patchErr?.response?.status === 405) {
          response = await axiosAPI.put("accounts/staff/me/", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } else {
          throw patchErr;
        }
      }

      const responseData = response?.data?.data || response?.data;
      const newFullName = `${editFirstName.trim()} ${editLastName.trim()}`.trim();
      const updatedPhoto = responseData?.avatar || responseData?.main_photo || draftPhoto;

      dispatch(
        setCurrentUser({
          ...currentUser,
          ...responseData,
          full_name: responseData?.full_name || newFullName,
          first_name: responseData?.first_name || editFirstName.trim(),
          last_name: responseData?.last_name || editLastName.trim(),
          phone_number: responseData?.phone_number || cleanPhone,
          phone: responseData?.phone_number || cleanPhone,
          avatar: updatedPhoto,
          main_photo: updatedPhoto,
          photo_url: updatedPhoto,
          profile_info: {
            ...currentUser?.profile_info,
            first_name: responseData?.first_name || editFirstName.trim(),
            last_name: responseData?.last_name || editLastName.trim(),
            avatar: updatedPhoto,
            main_photo: updatedPhoto,
          },
        })
      );

      setAlertInfo({
        title: "Profil yangilandi",
        message: "O'zgarishlar muvaffaqiyatli saqlandi.",
      });
      setActiveModal("main");
    } catch (err: any) {
      console.error("Save staff profile error:", err);
      const apiErr = err?.response?.data?.error || err?.response?.data;
      let errorMsg = "Ma'lumotlarni saqlashda xatolik yuz berdi.";
      if (typeof apiErr === "string") {
        errorMsg = apiErr;
      } else if (apiErr?.message) {
        errorMsg = apiErr.message;
      } else if (apiErr?.detail) {
        errorMsg = apiErr.detail;
      } else if (typeof apiErr === "object") {
        const firstKey = Object.keys(apiErr)[0];
        if (firstKey) {
          const val = apiErr[firstKey];
          errorMsg = `${firstKey}: ${Array.isArray(val) ? val.join(", ") : val}`;
        }
      }
      setSaveError(errorMsg);
    } finally {
      setSaveLoading(false);
    }
  };

  // File upload handler -> opens crop modal
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setRawImageToCrop(reader.result);
          setIsCropOpen(true);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const handleCropSaved = (croppedUrl: string) => {
    setTempPhoto(croppedUrl);
    setIsCropOpen(false);
    setRawImageToCrop(null);
  };

  const handleCropClose = () => {
    setIsCropOpen(false);
    setRawImageToCrop(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      {/* ════════════════ 1-RASM & 3-RASM: MENING PROFILIM MODALI ════════════════ */}
      {activeModal === "main" && (
        <div className="w-full max-w-[560px] bg-white dark:bg-[#141414] rounded-xl p-6 animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[18px] font-bold text-[#0A0A0A] dark:text-[#fafafa]">
              Mening profilim
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 transition-colors cursor-pointer p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 3-rasm: Yashil alert bloki */}
          {alertInfo && (
            <div className="bg-[#ECFDF5] dark:bg-emerald-950/20 border border-[#A7F3D0] dark:border-emerald-900/40 rounded-2xl p-4 flex items-start gap-3.5 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="w-6 h-6 rounded-full border-2 border-[#059669] flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 text-[#059669] stroke-[3]" />
              </div>
              <div className="flex-1">
                <h4 className="text-[14px] font-bold text-[#065F46] dark:text-emerald-300">
                  {alertInfo.title}
                </h4>
                <p className="text-[12px] text-[#047857] dark:text-emerald-400 mt-0.5">
                  {alertInfo.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAlertInfo(null)}
                className="text-[#047857] dark:text-emerald-400 hover:opacity-75 transition-opacity cursor-pointer p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Profile User Info Row */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              {initialPhoto ? (
                <img
                  src={initialPhoto}
                  alt={fullName}
                  className="w-14 h-14 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-[#E0F2FE] dark:bg-sky-950/40 text-[#0284C7] dark:text-sky-400 font-bold text-base flex items-center justify-center shrink-0">
                  {currentInitials}
                </div>
              )}

              {/* Name & Badges */}
              <div>
                <h4 className="text-[17px] font-bold text-[#0A0A0A] dark:text-[#fafafa]">
                  {fullName}
                </h4>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="bg-[#F5F5F5] dark:bg-zinc-800 text-[#404040] dark:text-zinc-300 text-[12px] font-medium px-3 py-0.5 rounded-full">
                    {roleName}
                  </span>
                  <span className="bg-[#ECFDF5] dark:bg-emerald-950/40 text-[#047857] dark:text-emerald-400 text-[12px] font-medium px-3 py-0.5 rounded-full">
                    To'liq huquq
                  </span>
                </div>
              </div>
            </div>

            {/* Edit Button (Qalamcha) */}
            <button
              type="button"
              onClick={() => setActiveModal("edit")}
              className="w-10 h-10 rounded-xl border border-[#e5e5e5] dark:border-[#262626] hover:bg-gray-50 dark:hover:bg-zinc-800 text-[#0A0A0A] dark:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Profilni tahrirlash"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
            </button>
          </div>

          {/* 3 Columns: Login, Telefon, Qo'shilgan */}
          <div className="grid grid-cols-3 gap-4 py-4 border-t border-transparent">
            <div>
              <p className="text-[12px] text-[#737373] dark:text-[#a3a3a3]">Login</p>
              <p className="text-[14px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-1 truncate">
                {initialUsername}
              </p>
            </div>

            <div>
              <p className="text-[12px] text-[#737373] dark:text-[#a3a3a3]">Telefon</p>
              <p className="text-[14px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-1 truncate">
                {initialPhone}
              </p>
            </div>

            <div>
              <p className="text-[12px] text-[#737373] dark:text-[#a3a3a3]">Qo'shilgan</p>
              <p className="text-[14px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-1 truncate">
                {joinedDate}
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-[13px] font-semibold text-[#7F1D1D] dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer flex items-center gap-2"
            >
              <X className="w-4 h-4 text-[#7F1D1D] dark:text-red-400" />
              <span>Tizimdan chiqish</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPasswordError(null);
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setActiveModal("password");
              }}
              className="px-4 py-2.5 bg-[#0070F3] hover:bg-[#0060df] text-white rounded-lg text-[13px] font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <HugeIcon icon={FloppyDiskIcon} size={16} strokeWidth={3} className="text-[#0a0a0a]" />
              <span>Parolni o'zgartirish</span>
            </button>
          </div>
        </div>
      )}

      {/* ════════════════ 2-RASM: PAROLNI O'ZGARTIRISH MODALI ════════════════ */}
      {activeModal === "password" && (
        <div className="w-full max-w-[540px] bg-white dark:bg-[#141414] rounded-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[18px] font-bold text-[#0A0A0A] dark:text-[#fafafa]">
              Parolni o'zgartirish
            </h3>
            <button
              type="button"
              onClick={() => setActiveModal("main")}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 transition-colors cursor-pointer p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Error display */}
          {passwordError && (
            <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-3 rounded-xl mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            {/* Joriy parol */}
            <div>
              <label className="text-[13px] text-[#737373] dark:text-[#a3a3a3] block mb-1.5">
                Joriy parol
              </label>
              <div className="relative">
                <input
                  type={showCurrentPass ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[14px] text-[#0A0A0A] dark:text-white outline-none focus:border-[#0474F3] transition-colors pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 p-1"
                >
                  {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Yangi parol */}
            <div>
              <label className="text-[13px] text-[#737373] dark:text-[#a3a3a3] block mb-1.5">
                Yangi parol
              </label>
              <div className="relative">
                <input
                  type={showNewPass ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[14px] text-[#0A0A0A] dark:text-white outline-none focus:border-[#0474F3] transition-colors pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 p-1"
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Takrorlash */}
            <div>
              <label className="text-[13px] text-[#737373] dark:text-[#a3a3a3] block mb-1.5">
                Takrorlash
              </label>
              <div className="relative">
                <input
                  type={showConfirmPass ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[14px] text-[#0A0A0A] dark:text-white outline-none focus:border-[#0474F3] transition-colors pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 p-1"
                >
                  {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-2">
              <button
                type="button"
                onClick={() => setActiveModal("main")}
                disabled={passwordLoading}
                className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-[13px] font-medium text-[#0A0A0A] dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <X className="w-4 h-4 text-[#0A0A0A] dark:text-white" />
                <span>Bekor qilish</span>
              </button>

              <button
                type="submit"
                disabled={passwordLoading}
                className="px-5 py-2.5 bg-[#0070F3] hover:bg-[#0060df] text-white rounded-lg text-[13px] font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                {passwordLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <HugeIcon icon={FloppyDiskIcon} size={16} className="text-[#0a0a0a]" strokeWidth={3} />
                )}
                <span>Saqlash</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ════════════════ 4-RASM: PROFILNI TAHRIRLASH MODALI ════════════════ */}
      {activeModal === "edit" && (
        <div className="w-full max-w-[560px] bg-white dark:bg-[#141414] rounded-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[18px] font-bold text-[#0A0A0A] dark:text-[#fafafa]">
              Profilni tahrirlash
            </h3>
            <button
              type="button"
              onClick={() => setActiveModal("main")}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 transition-colors cursor-pointer p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Avatar with Plus button */}
          <div className="flex items-center gap-4 mb-4">
            <div
              onClick={() => {
                setTempPhoto(draftPhoto);
                setActiveModal("photo");
              }}
              className="relative cursor-pointer group"
              title="Profil suratini o'zgartirish"
            >
              {draftPhoto ? (
                <img
                  src={draftPhoto}
                  alt="Profile draft"
                  className="w-14 h-14 rounded-full object-cover shrink-0 group-hover:opacity-90 transition-opacity"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-[#E0F2FE] dark:bg-sky-950/40 text-[#0284C7] dark:text-sky-400 font-bold text-base flex items-center justify-center shrink-0 group-hover:opacity-90 transition-opacity">
                  {currentInitials}
                </div>
              )}

              {/* Plus icon button (Rasm 5 ga ochadi) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setTempPhoto(draftPhoto);
                  setActiveModal("photo");
                }}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0070F3] text-white flex items-center justify-center hover:bg-[#0060df] transition-colors shadow-xs cursor-pointer"
                title="Profil suratini o'zgartirish"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-[#F5F5F5] dark:bg-zinc-800 text-[#404040] dark:text-zinc-300 text-[12px] font-medium px-3 py-0.5 rounded-full">
                {roleName}
              </span>
              <span className="bg-[#ECFDF5] dark:bg-emerald-950/40 text-[#047857] dark:text-emerald-400 text-[12px] font-medium px-3 py-0.5 rounded-full">
                To'liq huquq
              </span>
            </div>
          </div>

          {/* Error Alert if save failed */}
          {saveError && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl p-3 flex items-start gap-2.5 mb-3 text-red-600 dark:text-red-400 text-[12.5px]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{saveError}</span>
            </div>
          )}

          {/* Form fields: Foydalanuvchi talabi - F.I.Sh o'rniga alohida Ismi va Familiyasi (2 ta maydon) */}
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[13px] text-[#737373] dark:text-[#a3a3a3] block mb-1.5">
                  Ismi
                </label>
                <input
                  type="text"
                  value={editFirstName}
                  onChange={(e) => {
                    setEditFirstName(e.target.value);
                    if (saveError) setSaveError(null);
                  }}
                  placeholder="Ism"
                  className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[14px] font-medium text-[#0A0A0A] dark:text-white outline-none focus:border-[#0474F3] transition-colors"
                />
              </div>

              <div>
                <label className="text-[13px] text-[#737373] dark:text-[#a3a3a3] block mb-1.5">
                  Familiyasi
                </label>
                <input
                  type="text"
                  value={editLastName}
                  onChange={(e) => {
                    setEditLastName(e.target.value);
                    if (saveError) setSaveError(null);
                  }}
                  placeholder="Familiya"
                  className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[14px] font-medium text-[#0A0A0A] dark:text-white outline-none focus:border-[#0474F3] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-[13px] text-[#737373] dark:text-[#a3a3a3] block mb-1.5">
                Telefon
              </label>
              <input
                type="text"
                value={editPhone}
                onChange={(e) => {
                  setEditPhone(formatUzbekPhone(e.target.value));
                  if (saveError) setSaveError(null);
                }}
                placeholder="+998 90 123 45 67"
                className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[14px] font-medium text-[#0A0A0A] dark:text-white outline-none focus:border-[#0474F3] transition-colors"
              />
            </div>
          </div>

          {/* Info row */}
          <div className="text-[12px] text-[#737373] dark:text-[#a3a3a3] flex items-center gap-6 mt-4 pt-1">
            <span>Login: <strong className="text-[#0A0A0A] dark:text-white font-semibold">{initialUsername}</strong></span>
            <span>Qo'shilgan: <strong className="text-[#0A0A0A] dark:text-white font-semibold">{joinedDate}</strong></span>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 mt-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveModal("main")}
              disabled={saveLoading}
              className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] font-medium text-[#0A0A0A] dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <X className="w-4 h-4 text-[#0A0A0A] dark:text-white" />
              <span>Bekor qilish</span>
            </button>

            {/* O'zgarmagan holatda disabled (4-rasmdagidek), o'zgarganda ko'k */}
            {isProfileChanged ? (
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saveLoading}
                className="px-5 py-2.5 bg-[#0070F3] hover:bg-[#0060df] text-white rounded-xl text-[13px] font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {saveLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <HugeIcon icon={FloppyDiskIcon} size={16} strokeWidth={3} className="text-[#0a0a0a]" />
                )}
                <span>{saveLoading ? "Saqlanmoqda..." : "Saqlash"}</span>
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="px-5 py-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] font-semibold text-gray-400 dark:text-zinc-500 cursor-not-allowed flex items-center gap-2"
              >
                <HugeIcon icon={FloppyDiskIcon} size={16} strokeWidth={3} />
                <span>Saqlash</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ════════════════ 5-RASM: PROFIL SURATI MODALI ════════════════ */}
      {activeModal === "photo" && (
        <div className="w-full max-w-[560px] bg-white dark:bg-[#141414] rounded-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelected}
            accept="image/png, image/jpeg, image/webp, image/*"
            className="hidden"
          />

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[18px] font-bold text-[#0A0A0A] dark:text-[#fafafa]">
              Profil surati
            </h3>
            <button
              type="button"
              onClick={() => {
                setTempPhoto(draftPhoto);
                setActiveModal("edit");
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 transition-colors cursor-pointer p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Info Row */}
          <div className="flex items-center gap-4 mb-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative cursor-pointer group"
              title="Surat yuklash uchun bosing"
            >
              {tempPhoto ? (
                <img
                  src={tempPhoto}
                  alt="Profile"
                  className="w-14 h-14 rounded-full object-cover shrink-0 group-hover:opacity-90 transition-opacity"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-[#E0F2FE] dark:bg-sky-950/40 text-[#0284C7] dark:text-sky-400 font-bold text-base flex items-center justify-center shrink-0 group-hover:opacity-90 transition-opacity">
                  {currentInitials}
                </div>
              )}

              {/* Small plus badge on avatar */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0070F3] text-white flex items-center justify-center shadow-xs group-hover:bg-[#0060df] transition-colors">
                <Plus className="w-4 h-4 stroke-[3]" />
              </div>
            </div>

            <div>
              <h4 className="text-[16px] font-bold text-[#0A0A0A] dark:text-[#fafafa]">
                {editFirstName} {editLastName}
              </h4>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="bg-[#F5F5F5] dark:bg-zinc-800 text-[#404040] dark:text-zinc-300 text-[12px] font-medium px-3 py-0.5 rounded-full">
                  {roleName}
                </span>
                <span className="bg-[#ECFDF5] dark:bg-emerald-950/40 text-[#047857] dark:text-emerald-400 text-[12px] font-medium px-3 py-0.5 rounded-full">
                  To'liq huquq
                </span>
              </div>
            </div>
          </div>

          {/* Notice text */}
          <p className="text-[13px] text-[#737373] dark:text-[#a3a3a3] mt-4 mb-6 leading-relaxed">
            JPG yoki PNG, 5 MB gacha. Surat qo'yilmasa, bosh harflar ko'rsatiladi.
          </p>

          {/* Footer buttons */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <button
              type="button"
              disabled={!tempPhoto}
              onClick={() => {
                setTempPhoto(null);
                setDraftPhoto(null);
              }}
              className={`px-4 py-2.5 rounded-xl text-[13px] font-semibold flex items-center gap-2 transition-colors ${tempPhoto
                  ? "bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] text-[#7F1D1D] dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                  : "bg-gray-100 dark:bg-zinc-800/60 border border-transparent text-gray-400 dark:text-zinc-600 cursor-not-allowed opacity-60"
                }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>Suratni o'chirish</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setTempPhoto(draftPhoto);
                  setActiveModal("edit");
                }}
                className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] font-medium text-[#0A0A0A] dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <X className="w-4 h-4 text-[#0A0A0A] dark:text-white" />
                <span>Bekor qilish</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDraftPhoto(tempPhoto);
                  setActiveModal("edit");
                }}
                className="px-4 py-2.5 bg-[#0070F3] hover:bg-[#0060df] text-white rounded-xl text-[13px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Yuklash</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ 6: RASMNI KESISH (CROP) MODALI ════════════════ */}
      <AvatarCropperModal
        imageSrc={rawImageToCrop || ""}
        isOpen={isCropOpen}
        onClose={handleCropClose}
        onSave={handleCropSaved}
      />
    </div>
  );
};
