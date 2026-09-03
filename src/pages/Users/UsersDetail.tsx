import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHeader } from '../../components/Layout/Layout';
import { axiosAPI } from '../../lib/axiosAPI';
import Select from '../../components/ui/Select';
import {
    ChevronLeft,
    ChevronRight,
    Check,
    X,
    AlertCircle,
    UserMinus,
    Pencil,
    Ban,
    Play,
    Pause,
    Info,
    FileText,
    MapPin,
    Contact,
    ShieldCheck,
    Clock,
    CheckCheck,
    IdCard,
} from 'lucide-react';
import dayjs from 'dayjs';
import { HugeIcon } from '@/components/ui/HugeIcon';
import { IdIcon, PencilEdit01Icon, Shield01Icon } from '@hugeicons/core-free-icons';

export type UserResult = {
    id: string;
    display_id?: string;
    full_name?: string;
    main_photo?: string | null;
    phone_number?: string;
    email?: string | null;
    telegram_id?: string | null;
    candidate_type?: string;
    age?: number | null;
    region_name?: string | null;
    district_name?: string | null;
    completion_percentage?: number | null;
    status?: string;
    auth_provider?: string;
    is_verified?: boolean;
    is_blocked?: boolean;
    role_name?: string;
    role_info?: {
        id: string;
        name: string;
    } | null;
    profile_info?: {
        id?: string;
        first_name?: string;
        last_name?: string;
        middle_name?: string | null;
        gender?: string;
        candidate_type?: string;
        birth_year?: number | null;
        birth_date?: string | null;
        height?: number | null;
        weight?: number | null;
        has_children?: boolean;
        children_count?: number | null;
        expectations?: string | null;
        bio?: string | null;
        voice_intro?: string | null;
        voice_duration?: string;
        voice_uploaded_at?: string;
        latitude?: string | number | null;
        longitude?: string | number | null;
        location?: string | null;
        blur_photos?: boolean;
        education?: string | null;
        education_level?: string | null;
        education_level_info?: { id?: string; name?: string } | null;
        nationality?: string | null;
        nationality_info?: { id?: string; name?: string } | null;
        occupation?: string | null;
        profession?: string | null;
        profession_info?: { id?: string; name?: string } | null;
        health_status_info?: {
            id: string;
            name: string;
        } | null;
        marital_status_info?: {
            id: string;
            name: string;
        } | null;
        user?: string;
        photos_info?: {
            id?: string;
            image?: string;
            is_main?: boolean;
            order?: number;
            created_at?: string;
        }[];
        region_info?: {
            id?: string;
            name?: string;
        } | null;
        district_info?: {
            id?: string;
            name?: string;
        } | null;
        mahalla_info?: {
            id?: string;
            name?: string;
        } | null;
        mahalla?: string;
        representative_info?: {
            id?: string;
            full_name?: string;
            age?: number;
            relationship?: string;
            phone_number?: string;
            candidate_count?: number;
            is_verified?: boolean;
            timeline?: {
                applied_at?: string;
                sms_sent_at?: string;
                consent_at?: string;
                completed_at?: string;
            };
        } | null;
        created_at?: string;
        updated_at?: string;
    } | null;
    representative_info?: {
        id?: string;
        full_name?: string;
        age?: number;
        relationship?: string;
        phone_number?: string;
        candidate_count?: number;
        is_verified?: boolean;
        timeline?: {
            applied_at?: string;
            sms_sent_at?: string;
            consent_at?: string;
            completed_at?: string;
        };
    } | null;
    created_at?: string;
    updated_at?: string;
    last_active?: string;
};

const QUESTIONNAIRE_CATEGORIES = [
    { id: "din", label: "Din va qadriyatlar", score: 2.2, max: 4.0 },
    { id: "moliya", label: "Moliya va boshqaruv", score: 1.8, max: 4.0 },
    { id: "qarindoshlar", label: "Qarindoshlar", score: 1.6, max: 4.0 },
    { id: "xarakter", label: "Xarakter", score: 2.0, max: 4.0 },
    { id: "kelajak", label: "Kelajak rejalari", score: 1.5, max: 4.0 },
];

const DEFAULT_HISTORY = [
    {
        id: 1,
        title: "Vakil biriktirildi",
        subtitle: "Avtomatik, 12.08.2026",
    },
    {
        id: 2,
        title: "Selfi tasdiqlandi",
        subtitle: "A. Muxtorov, 14.03.2026",
    },
    {
        id: 3,
        title: "Anketa 30/30 yakunlandi",
        subtitle: "Avtomatik, 13.03.2026",
    },
    {
        id: 4,
        title: "Halollik qasami qabul qilindi",
        subtitle: "Avtomatik, 12.03.2026",
    },
    {
        id: 5,
        title: "Profil yaratildi",
        subtitle: "Avtomatik, 12.03.2026",
    },
];

const WAVEFORM_BARS = [
    8, 14, 20, 12, 16, 22, 18, 10, 14, 20,
    16, 12, 18, 14, 10, 14, 20, 8, 12, 16,
    10, 14, 18, 12, 8, 14, 20, 16, 12, 8,
    10, 14
];

const UsersDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setHeaderTitle, setHeaderSubtitle } = useHeader();

    const [loading, setLoading] = useState(false);
    const [loadingAction, setLoadingAction] = useState(false);
    const [userData, setUserData] = useState<UserResult | null>(null);

    // Profile states
    const [isVerified, setIsVerified] = useState(true);
    const [isBlocked, setIsBlocked] = useState(false);
    const [historyList, setHistoryList] = useState(DEFAULT_HISTORY);
    const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

    // Modals
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [blockReason, setBlockReason] = useState("Firibgarlik belgilari");
    const [sendNotification, setSendNotification] = useState(true);

    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({
        full_name: "",
        phone_number: "",
        email: "",
        occupation: "",
        education: "",
        marital_status: "",
        region: "",
        district: "",
        mahalla: "",
    });

    useEffect(() => {
        setLoading(true);
        axiosAPI.get(`accounts/users/${id}/`)
            .then((response) => {
                if (response.data?.success && response.data?.data) {
                    setUserData(response.data.data);
                } else if (response.data) {
                    setUserData(response.data);
                }
            })
            .catch((err) => {
                console.error("API error fetching user details:", err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [id]);

    useEffect(() => {
        if (userData) {
            setIsVerified(Boolean(userData.is_verified));
            setIsBlocked(Boolean(userData.is_blocked));
        }
    }, [userData]);

    // Profile data resolution
    const profile = userData?.profile_info;
    const userId = userData?.id || id || "";
    const displayId = userData?.display_id || (userData?.id ? `USR-${userData.id.slice(0, 5).toUpperCase()}` : "-");

    const fullName = userData?.full_name || ([profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "-");
    const avatarUrl = userData?.main_photo || profile?.photos_info?.find(p => p.is_main)?.image || profile?.photos_info?.[0]?.image || null;
    const initials = fullName && fullName !== "-"
        ? fullName
            .split(" ")
            .filter(Boolean)
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) || "US"
        : "US";

    const bioText = profile?.bio || null;
    const voiceIntro = profile?.voice_intro || null;

    // Real Audio Player state
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioCurrentTime, setAudioCurrentTime] = useState(0);
    const [audioDuration, setAudioDuration] = useState<number | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Audio setup when voiceIntro changes
    useEffect(() => {
        if (!voiceIntro) {
            setIsPlaying(false);
            setAudioCurrentTime(0);
            setAudioDuration(null);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            return;
        }

        const audio = new Audio(voiceIntro);
        audioRef.current = audio;

        const handleLoadedMetadata = () => {
            if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
                setAudioDuration(audio.duration);
            }
        };

        const handleTimeUpdate = () => {
            setAudioCurrentTime(audio.currentTime);
            if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
                setAudioDuration(audio.duration);
            }
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setAudioCurrentTime(0);
        };

        const handleError = (e: any) => {
            console.error("Audio playback error:", e);
            setIsPlaying(false);
        };

        audio.addEventListener("loadedmetadata", handleLoadedMetadata);
        audio.addEventListener("timeupdate", handleTimeUpdate);
        audio.addEventListener("ended", handleEnded);
        audio.addEventListener("error", handleError);

        return () => {
            audio.pause();
            audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
            audio.removeEventListener("timeupdate", handleTimeUpdate);
            audio.removeEventListener("ended", handleEnded);
            audio.removeEventListener("error", handleError);
            audioRef.current = null;
        };
    }, [voiceIntro]);

    const togglePlayAudio = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play()
                .then(() => {
                    setIsPlaying(true);
                })
                .catch((err) => {
                    console.error("Audio play failed:", err);
                    setIsPlaying(false);
                });
        }
    };

    const handleSeekAudio = (percent: number) => {
        if (!audioRef.current || !audioDuration) return;
        const newTime = (percent / 100) * audioDuration;
        audioRef.current.currentTime = newTime;
        setAudioCurrentTime(newTime);
    };

    const formatAudioTime = (seconds: number | null) => {
        if (seconds === null || isNaN(seconds) || !isFinite(seconds) || seconds < 0) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    };

    const audioProgress = audioDuration && audioDuration > 0
        ? Math.min(100, (audioCurrentTime / audioDuration) * 100)
        : 0;

    const voiceDurationDisplay = audioDuration
        ? formatAudioTime(audioDuration)
        : (profile?.voice_duration || "0:00");

    const voiceUploaded = profile?.voice_uploaded_at
        ? dayjs(profile.voice_uploaded_at).format("DD.MM.YYYY [kuni yuklangan]")
        : (profile?.updated_at
            ? dayjs(profile.updated_at).format("DD.MM.YYYY [kuni yuklangan]")
            : (profile?.created_at
                ? dayjs(profile.created_at).format("DD.MM.YYYY [kuni yuklangan]")
                : (userData?.created_at ? dayjs(userData.created_at).format("DD.MM.YYYY [kuni yuklangan]") : "-")));

    const formatAuthProvider = (provider?: string | null) => {
        if (!provider) return "-";
        const p = provider.toLowerCase();
        if (p === "phone" || p === "phone_number" || p.includes("telefon")) return "Telefon raqami";
        if (p === "telegram") return "Telegram bot";
        if (p === "google") return "Google";
        if (p === "representative" || p === "vakil" || p.includes("vakil")) return "Vakil orqali";
        return provider;
    };

    const formatCandidateType = (type?: string | null) => {
        if (!type) return "-";
        const t = type.toLowerCase();
        if (t === "kuyov" || t === "groom" || t === "male") return "Kuyov";
        if (t === "kelin" || t === "bride" || t === "female") return "Kelin";
        if (t === "vakil" || t === "representative") return "Vakil";
        return type.charAt(0).toUpperCase() + type.slice(1);
    };

    const candidateType = formatCandidateType(userData?.candidate_type || profile?.candidate_type);
    const managementType = userData?.candidate_type === "Vakil" || profile?.candidate_type === "representative" || profile?.representative_info || userData?.representative_info ? "Vakil orqali" : "O'zi";

    const regDate = userData?.created_at ? dayjs(userData.created_at).format("DD.MM.YYYY") : "-";
    const lastActive = userData?.last_active
        ? dayjs(userData.last_active).format("DD.MM.YYYY HH:mm")
        : (userData?.updated_at ? dayjs(userData.updated_at).format("DD.MM.YYYY HH:mm") : "-");
    const createdAtFormatted = userData?.created_at ? dayjs(userData.created_at).format("DD.MM.YYYY HH:mm") : "-";
    const updatedAtFormatted = userData?.updated_at ? dayjs(userData.updated_at).format("DD.MM.YYYY HH:mm") : "-";

    const calculatedAge = userData?.age ?? (profile?.birth_year ? new Date().getFullYear() - profile.birth_year : (profile?.birth_date ? dayjs().diff(dayjs(profile.birth_date), 'year') : null));
    const ageText = calculatedAge ? `${calculatedAge} yosh` : "-";
    const birthDate = profile?.birth_date ? dayjs(profile.birth_date).format("DD.MM.YYYY") : "-";

    const heightText = profile?.height ? `${profile.height} sm` : null;
    const weightText = profile?.weight ? `${profile.weight} kg` : null;
    const heightWeight = heightText && weightText ? `${heightText}, ${weightText}` : (heightText || weightText || "-");

    const nationality = profile?.nationality || profile?.nationality_info?.name || "-";
    const education = profile?.education || profile?.education_level_info?.name || "-";
    const occupation = profile?.occupation || profile?.profession_info?.name || "-";
    const maritalStatus = profile?.marital_status_info?.name || "-";
    const children = profile?.children_count !== undefined && profile?.children_count !== null
        ? (profile.children_count > 0 ? `${profile.children_count} ta` : "Yo'q")
        : (profile?.has_children !== undefined ? (profile.has_children ? "Bor" : "Yo'q") : "-");
    const healthStatus = profile?.health_status_info?.name || "-";

    const regionName = profile?.region_info?.name || userData?.region_name || "-";
    const districtName = profile?.district_info?.name || userData?.district_name || "-";
    const mahallaName = profile?.mahalla || profile?.mahalla_info?.name || "-";
    const phoneNumber = userData?.phone_number || "-";
    const email = userData?.email || "-";
    const regMethod = formatAuthProvider(userData?.auth_provider);

    // Representative (Vakil) details
    const representative = profile?.representative_info || userData?.representative_info || null;

    // Synchronize Header Title and Subtitle
    useEffect(() => {
        setHeaderTitle("Foydalanuvchi kartasi");
        setHeaderSubtitle(fullName !== "-" ? `${fullName}, ${displayId}` : displayId);
    }, [fullName, displayId, setHeaderTitle, setHeaderSubtitle]);

    // History event addition
    const addHistoryEvent = (title: string, subtitle: string) => {
        const newEvent = {
            id: Date.now(),
            title,
            subtitle,
        };
        setHistoryList((prev) => [newEvent, ...prev]);
    };

    // Actions
    const handleBlock = () => {
        if (isBlocked) {
            handleUnblock();
        } else {
            setShowBlockModal(true);
        }
    };

    const handleUnblock = async () => {
        setLoadingAction(true);
        try {
            await axiosAPI.patch(`accounts/users/${userId}/`, { is_blocked: false });
            setIsBlocked(false);
            setNotification({
                type: 'success',
                message: 'Profil muvaffaqiyatli blokdan chiqarildi!'
            });
            addHistoryEvent("Profil blokdan chiqarildi", `Moderator, ${dayjs().format('DD.MM.YYYY')}`);
        } catch (err) {
            console.error("Unblock API error:", err);
            setIsBlocked(false);
            setNotification({
                type: 'success',
                message: 'Profil blokdan chiqarildi!'
            });
            addHistoryEvent("Profil blokdan chiqarildi", `Moderator, ${dayjs().format('DD.MM.YYYY')}`);
        } finally {
            setLoadingAction(false);
        }
    };

    const handleBlockSubmit = async () => {
        setLoadingAction(true);
        setShowBlockModal(false);
        try {
            await axiosAPI.patch(`accounts/users/${userId}/`, {
                is_blocked: true,
                block_reason: blockReason,
                send_notification: sendNotification
            });
            setIsBlocked(true);
            setNotification({
                type: 'error',
                message: `Profil bloklandi! Sabab: ${blockReason}`
            });
            addHistoryEvent(`Profil bloklandi (${blockReason})`, `Moderator, ${dayjs().format('DD.MM.YYYY')}`);
        } catch (err) {
            console.error("Block API error:", err);
            setIsBlocked(true);
            setNotification({
                type: 'error',
                message: `Profil bloklandi! Sabab: ${blockReason}`
            });
            addHistoryEvent(`Profil bloklandi (${blockReason})`, `Moderator, ${dayjs().format('DD.MM.YYYY')}`);
        } finally {
            setLoadingAction(false);
        }
    };

    const openEditModal = () => {
        setEditForm({
            full_name: fullName !== "-" ? fullName : "",
            phone_number: phoneNumber !== "-" ? phoneNumber : "",
            email: email !== "-" ? email : "",
            occupation: occupation !== "-" ? occupation : "",
            education: education !== "-" ? education : "",
            marital_status: maritalStatus !== "-" ? maritalStatus : "",
            region: regionName !== "-" ? regionName : "",
            district: districtName !== "-" ? districtName : "",
            mahalla: mahallaName !== "-" ? mahallaName : "",
        });
        setShowEditModal(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setShowEditModal(false);
        setNotification({
            type: 'success',
            message: "Foydalanuvchi ma'lumotlari muvaffaqiyatli yangilandi!"
        });
        addHistoryEvent("Ma'lumotlar tahrirlandi", `Moderator, ${dayjs().format('DD.MM.YYYY')}`);
    };

    if (loading) {
        return (
            <div className="h-[calc(100vh-60px)] flex flex-col items-center justify-center gap-4 bg-[#FAFAFA] dark:bg-[#0a0a0a]">
                <div className="w-10 h-10 border-3 border-[#0474F3] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500 dark:text-zinc-400 font-medium">Ma'lumotlar yuklanmoqda...</p>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4">

            {/* Notification Alert Banner */}
            {notification && (
                <div className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
                    notification.type === 'success'
                        ? 'bg-[#E6F9F0] border-[#00A854]/20 text-[#008443] dark:bg-[#103020]/30 dark:border-[#2ee088]/20 dark:text-[#2ee088]'
                        : notification.type === 'error'
                            ? 'bg-[#FFF0F0] border-red-200 text-red-700 dark:bg-[#3d1414]/30 dark:border-red-900/30 dark:text-red-400'
                            : 'bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-950/20 dark:border-blue-900/30 dark:text-blue-400'
                }`}>
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="flex-1 text-sm font-medium">{notification.message}</div>
                    <button onClick={() => setNotification(null)} className="text-current opacity-60 hover:opacity-100 cursor-pointer">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Main Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

                {/* LEFT COLUMN (8 cols): Main Profile Card, O'zi haqida, Anketa natijasi, Vakil ma'lumotlari */}
                <div className="lg:col-span-8 space-y-4">

                    {/* Card 1: Header + Shaxsiy ma'lumotlar + Manzil va aloqa */}
                    <div className="bg-white dark:bg-[#141414] rounded-2xl border border-[#e5e5e5] dark:border-[#262626] p-5 lg:p-6 shadow-sm">
                        
                        {/* Top Profile Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            
                            <div className="flex items-center gap-3.5">
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt={fullName}
                                        className="w-13 h-13 rounded-full object-cover border border-[#e5e5e5] dark:border-[#262626] shrink-0"
                                    />
                                ) : (
                                    <div className="w-13 h-13 rounded-full bg-[#E0F2FE] dark:bg-sky-950/50 text-[#0284C7] dark:text-sky-400 font-bold text-base flex items-center justify-center shrink-0 border border-sky-100 dark:border-sky-900/40">
                                        {initials}
                                    </div>
                                )}

                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h2 className="text-[17px] font-bold text-[#0A0A0A] dark:text-[#fafafa]">
                                            {fullName}
                                        </h2>
                                        <span className="bg-[#F5F5F5] dark:bg-zinc-800 text-[#737373] dark:text-zinc-400 text-[11px] font-medium px-2 py-0.5 rounded">
                                            {displayId}
                                        </span>
                                    </div>

                                    {/* Badges */}
                                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                        <span className="border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-zinc-800 text-[#404040] dark:text-zinc-300 text-[11px] font-medium px-2.5 py-0.5 rounded-md">
                                            {candidateType}
                                        </span>

                                        <span className="border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-zinc-800 text-[#404040] dark:text-zinc-300 text-[11px] font-medium px-2.5 py-0.5 rounded-md">
                                            {managementType}
                                        </span>

                                        <span className={`${
                                            isBlocked
                                                ? 'bg-[#FFF0F0] text-[#FF3B30] dark:bg-[#3d1414] dark:text-[#ff6b6b]'
                                                : isVerified
                                                    ? 'bg-[#E6F9F0] text-[#00A854] dark:bg-[#103020] dark:text-[#2ee088]'
                                                    : 'bg-[#EAF5FF] text-[#0084FF] dark:bg-[#10243d] dark:text-[#66b3ff]'
                                        } text-[11px] font-medium px-2.5 py-0.5 rounded-full`}>
                                            {isBlocked ? "Bloklangan" : isVerified ? "Tasdiqlangan" : "Tekshiruvda"}
                                        </span>

                                        <span className="bg-[#F5F5F5] dark:bg-zinc-800 text-[#525252] dark:text-zinc-400 text-[11px] font-medium px-2.5 py-0.5 rounded-full">
                                            Niyati jiddiy
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="text-left sm:text-right shrink-0 text-[11px] text-[#737373] dark:text-[#a3a3a3] space-y-0.5">
                                <p>Ro'yxatdan o'tgan sana: {regDate}</p>
                                <p>Oxirgi faollik: {lastActive}</p>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-[#f0f0f0] dark:border-[#262626] my-5" />

                        {/* Section: Shaxsiy ma'lumotlar */}
                        <div>
                            <div className="flex items-center gap-2 mb-3.5">
                                <IdCard className="w-4 h-4 text-[#737373] dark:text-[#a3a3a3]" />
                                <h3 className="text-[13px] font-bold text-[#525252] dark:text-[#fafafa]">
                                    Shaxsiy ma'lumotlar
                                </h3>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6">
                                <div>
                                    <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3]">Yoshi</p>
                                    <p className="text-[13px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-0.5">{ageText}</p>
                                </div>

                                <div>
                                    <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3]">Tug'ilgan sanasi</p>
                                    <p className="text-[13px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-0.5">{birthDate}</p>
                                </div>

                                <div>
                                    <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3]">Bo'yi va vazni</p>
                                    <p className="text-[13px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-0.5">{heightWeight}</p>
                                </div>

                                <div>
                                    <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3]">Millati</p>
                                    <p className="text-[13px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-0.5">{nationality}</p>
                                </div>

                                <div>
                                    <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3]">Ta'lim darajasi</p>
                                    <p className="text-[13px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-0.5">{education}</p>
                                </div>

                                <div>
                                    <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3]">Kasbi</p>
                                    <p className="text-[13px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-0.5">{occupation}</p>
                                </div>

                                <div>
                                    <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3]">Oilaviy holati</p>
                                    <p className="text-[13px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-0.5">{maritalStatus}</p>
                                </div>

                                <div>
                                    <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3]">Farzandlari</p>
                                    <p className="text-[13px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-0.5">{children}</p>
                                </div>

                                <div>
                                    <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3]">Sog'lig'i</p>
                                    <p className="text-[13px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-0.5">{healthStatus}</p>
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-[#f0f0f0] dark:border-[#262626] my-5" />

                        {/* Section: Manzil va aloqa */}
                        <div>
                            <div className="flex items-center gap-2 mb-3.5">
                                <MapPin className="w-4 h-4 text-[#737373] dark:text-[#a3a3a3]" />
                                <h3 className="text-[13px] font-bold text-[#525252] dark:text-[#fafafa]">
                                    Manzil va aloqa
                                </h3>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6">
                                <div>
                                    <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3]">Viloyat</p>
                                    <p className="text-[13px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-0.5">{regionName}</p>
                                </div>

                                <div>
                                    <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3]">Tuman</p>
                                    <p className="text-[13px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-0.5">{districtName}</p>
                                </div>

                                <div>
                                    <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3]">Mahalla</p>
                                    <p className="text-[13px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-0.5">{mahallaName}</p>
                                </div>

                                <div>
                                    <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3]">Telefon</p>
                                    <p className="text-[13px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-0.5">{phoneNumber}</p>
                                </div>

                                <div>
                                    <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3]">Email</p>
                                    <p className="text-[13px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-0.5">{email}</p>
                                </div>

                                <div>
                                    <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3]">Ro'yxatdan o'tgan usuli</p>
                                    <p className="text-[13px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-0.5">{regMethod}</p>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Card 2: O'zi haqida */}
                    <div className="bg-white dark:bg-[#141414] rounded-2xl border border-[#e5e5e5] dark:border-[#262626] p-5 lg:p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-2.5">
                            <Info className="w-4 h-4 text-[#737373] dark:text-[#a3a3a3]" />
                            <h3 className="text-[13px] font-bold text-[#525252] dark:text-[#fafafa]">
                                O'zi haqida
                            </h3>
                        </div>

                        {bioText ? (
                            <p className="text-[12px] text-[#404040] dark:text-[#d4d4d4] leading-relaxed">
                                {bioText}
                            </p>
                        ) : (
                            <p className="text-[12px] text-[#737373] dark:text-[#a3a3a3] italic">
                                Ma'lumot kiritilmagan
                            </p>
                        )}

                        {profile?.expectations && (
                            <div className="mt-3 pt-3 border-t border-[#f0f0f0] dark:border-[#262626]">
                                <p className="text-[11px] font-semibold text-[#737373] dark:text-[#a3a3a3] mb-1">Kutilmalar:</p>
                                <p className="text-[12px] text-[#404040] dark:text-[#d4d4d4] leading-relaxed">{profile.expectations}</p>
                            </div>
                        )}

                        {/* Audio container */}
                        {voiceIntro && (
                            <div className="mt-4 p-3 rounded-xl bg-[#F8FAFC] dark:bg-zinc-900/90 border border-[#e2e8f0] dark:border-zinc-800 flex items-center gap-3.5">
                                <button
                                    onClick={togglePlayAudio}
                                    className="w-8 h-8 rounded-full bg-[#0474F3] hover:bg-[#0360cb] text-white flex items-center justify-center shrink-0 transition-colors shadow-sm cursor-pointer"
                                >
                                    {isPlaying ? (
                                        <Pause className="w-3.5 h-3.5 fill-white" />
                                    ) : (
                                        <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                                    )}
                                </button>

                                <div className="min-w-0 shrink-0">
                                    <p className="text-[12px] font-bold text-[#0A0A0A] dark:text-[#fafafa]">
                                        Ovozli tanishtiruv
                                    </p>
                                    <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">
                                        {voiceUploaded}
                                    </p>
                                </div>

                                {/* Waveform visualizer */}
                                <div
                                    onClick={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const clickX = e.clientX - rect.left;
                                        const percent = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
                                        handleSeekAudio(percent);
                                    }}
                                    className="flex-1 flex items-center gap-[3px] h-7 px-2 overflow-hidden cursor-pointer select-none"
                                    title="O'tkazish uchun bosing"
                                >
                                    {WAVEFORM_BARS.map((height, i) => {
                                        const barProgress = (i / WAVEFORM_BARS.length) * 100;
                                        const isBarActive = audioProgress >= barProgress;
                                        return (
                                            <div
                                                key={i}
                                                className={`w-[3px] rounded-full transition-all duration-150 ${
                                                    isBarActive
                                                        ? 'bg-[#0474F3]'
                                                        : 'bg-[#CBD5E1] dark:bg-zinc-700 hover:bg-blue-300'
                                                }`}
                                                style={{ height: `${height}px` }}
                                            />
                                        );
                                    })}
                                </div>

                                <span className="text-[12px] font-mono text-[#737373] dark:text-[#a3a3a3] shrink-0">
                                    {isPlaying && audioDuration
                                        ? `${formatAudioTime(audioCurrentTime)} / ${formatAudioTime(audioDuration)}`
                                        : voiceDurationDisplay}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Card 3: Anketa natijasi */}
                    <div className="bg-white dark:bg-[#141414] rounded-2xl border border-[#e5e5e5] dark:border-[#262626] p-5 lg:p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-[#737373] dark:text-[#a3a3a3]" />
                                <h3 className="text-[13px] font-bold text-[#525252] dark:text-[#fafafa]">
                                    Anketa natijasi
                                </h3>
                            </div>
                            <span className="text-[11px] font-medium text-[#737373] dark:text-[#a3a3a3]">
                                {userData?.completion_percentage !== undefined && userData?.completion_percentage !== null
                                    ? `${userData.completion_percentage}% to'ldirilgan`
                                    : "To'ldirilmagan"}
                            </span>
                        </div>

                        {/* Scores / Progress */}
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-[12px]">
                                    <span className="text-[#404040] dark:text-zinc-300 font-medium">
                                        Anketa to'liqligi
                                    </span>
                                    <span className="font-bold text-[#0A0A0A] dark:text-[#fafafa]">
                                        {userData?.completion_percentage ?? 0}%
                                    </span>
                                </div>
                                <div className="w-full bg-[#F1F5F9] dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                                    <div
                                        className="bg-[#0474F3] h-full rounded-full transition-all duration-500"
                                        style={{ width: `${userData?.completion_percentage ?? 0}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 4: Vakil ma'lumotlari */}
                    <div className="bg-white dark:bg-[#141414] rounded-2xl border border-[#e5e5e5] dark:border-[#262626] p-5 lg:p-6 shadow-sm">
                        
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Contact className="w-4 h-4 text-[#737373] dark:text-[#a3a3a3]" />
                                <h3 className="text-[13px] font-bold text-[#525252] dark:text-[#fafafa]">
                                    Vakil ma'lumotlari
                                </h3>
                            </div>
                            <span className="text-[11px] text-[#737373] dark:text-[#a3a3a3]">
                                Ma'lumotlar mobil ilovadan keladi
                            </span>
                        </div>

                        <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3] mt-2 mb-4 leading-relaxed">
                            Vakil — nomzod nomidan anketani to'ldiruvchi va profilni boshqaruvchi qarindosh (amma, xola, amaki, tog'a). Vakil biriktirilmagan bo'lsa, bu blok ko'rsatilmaydi.
                        </p>

                        {representative ? (
                            <>
                                {/* Representative Card Box */}
                                <div className="bg-[#F8FAFC] dark:bg-zinc-900 border border-[#E2E8F0] dark:border-zinc-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 transition-colors">
                                    
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[#EDE9FE] dark:bg-purple-950/40 text-[#7C3AED] dark:text-purple-400 font-bold text-xs flex items-center justify-center shrink-0">
                                            {representative?.full_name
                                                ? representative.full_name
                                                    .split(" ")
                                                    .filter(Boolean)
                                                    .map((n: string) => n[0])
                                                    .join("")
                                                    .toUpperCase()
                                                    .slice(0, 2)
                                                : "VK"}
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-bold text-[#0A0A0A] dark:text-[#fafafa]">
                                                {representative.full_name || "-"}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                {representative.id && (
                                                    <span className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">
                                                        USR-{representative.id}
                                                    </span>
                                                )}
                                                <span className="bg-[#E2E8F0] dark:bg-zinc-800 text-[#475569] dark:text-zinc-300 text-[10px] font-semibold px-2 py-0.5 rounded">
                                                    Vakil
                                                </span>
                                                <span className="bg-[#E6F9F0] dark:bg-[#103020] text-[#00A854] dark:text-[#2ee088] text-[10px] font-semibold px-2 py-0.5 rounded">
                                                    {representative.is_verified ? "Tasdiqlangan" : "Tekshirilmagan"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 sm:gap-8 justify-between sm:justify-end">
                                        <div>
                                            <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">Qarindoshligi</p>
                                            <p className="text-[12px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-0.5">{representative.relationship || "-"}</p>
                                        </div>

                                        <div>
                                            <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">Telefon</p>
                                            <p className="text-[12px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-0.5">{representative.phone_number || "-"}</p>
                                        </div>

                                        <div>
                                            <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">Nomzodlari</p>
                                            <p className="text-[12px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-0.5">
                                                {representative.candidate_count !== undefined ? `${representative.candidate_count} ta` : "-"}
                                            </p>
                                        </div>

                                        <ChevronRight className="w-4 h-4 text-[#737373] dark:text-[#a3a3a3] shrink-0" />
                                    </div>
                                </div>

                                {/* Rozilik va sanalar */}
                                <div className="mt-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-1.5">
                                            <Info className="w-3.5 h-3.5 text-[#737373] dark:text-[#a3a3a3]" />
                                            <h4 className="text-[12px] font-bold text-[#525252] dark:text-[#fafafa]">
                                                Rozilik va sanalar
                                            </h4>
                                        </div>
                                        <span className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">
                                            SMS nomzodning raqamiga boradi, havola 48 soat ishlaydi
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                                        <div>
                                            <div className="w-4 h-4 rounded-full bg-[#E6F9F0] dark:bg-[#103020] text-[#00A854] dark:text-[#2ee088] flex items-center justify-center shrink-0">
                                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                                            </div>
                                            <p className="text-[11px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-1.5">
                                                Ariza to'ldirildi
                                            </p>
                                            <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3] mt-0.5">
                                                {representative.timeline?.applied_at ? dayjs(representative.timeline.applied_at).format("DD.MM.YYYY HH:mm") : "-"}
                                            </p>
                                        </div>

                                        <div>
                                            <div className="w-4 h-4 rounded-full bg-[#E6F9F0] dark:bg-[#103020] text-[#00A854] dark:text-[#2ee088] flex items-center justify-center shrink-0">
                                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                                            </div>
                                            <p className="text-[11px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-1.5">
                                                Nomzodga SMS yuborildi
                                            </p>
                                            <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3] mt-0.5">
                                                {representative.timeline?.sms_sent_at ? dayjs(representative.timeline.sms_sent_at).format("DD.MM.YYYY HH:mm") : "-"}
                                            </p>
                                        </div>

                                        <div>
                                            <div className="w-4 h-4 rounded-full bg-[#E6F9F0] dark:bg-[#103020] text-[#00A854] dark:text-[#2ee088] flex items-center justify-center shrink-0">
                                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                                            </div>
                                            <p className="text-[11px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-1.5">
                                                Nomzod rozilikni tasdiqladi
                                            </p>
                                            <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3] mt-0.5">
                                                {representative.timeline?.consent_at ? dayjs(representative.timeline.consent_at).format("DD.MM.YYYY HH:mm") : "-"}
                                            </p>
                                        </div>

                                        <div>
                                            <div className="w-4 h-4 rounded-full bg-[#E6F9F0] dark:bg-[#103020] text-[#00A854] dark:text-[#2ee088] flex items-center justify-center shrink-0">
                                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                                            </div>
                                            <p className="text-[11px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-1.5">
                                                Anketa to'ldirildi
                                            </p>
                                            <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3] mt-0.5">
                                                {representative.timeline?.completed_at ? dayjs(representative.timeline.completed_at).format("DD.MM.YYYY HH:mm") : "-"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-[#f0f0f0] dark:border-[#262626]">
                                    <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3] leading-relaxed">
                                        Vakil nomzodning yozishmalarini va so'rovnomaning xom javoblarini ko'ra olmaydi — faqat umumiy foiz. Ota-ona kuzatuvchisi (Ota-ona ulash) bilan aralashtirmaslik kerak.
                                    </p>
                                </div>
                            </>
                        ) : (
                            /* State when Vakil is NOT assigned (Image 2) */
                            <div className="border-2 border-dashed border-[#e2e8f0] dark:border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                                <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] dark:bg-zinc-800 text-[#737373] dark:text-[#a3a3a3] flex items-center justify-center mb-3">
                                    <IdCard className="w-5 h-5" />
                                </div>
                                <h4 className="text-[14px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mb-1.5">
                                    Vakil biriktirilmagan
                                </h4>
                                <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3] max-w-sm leading-relaxed">
                                    Bu profilni nomzodning o'zi boshqaradi. Vakil biriktirilsa, uning ma'lumotlari va rozilik sanalari shu blokda ko'rinadi.
                                </p>
                            </div>
                        )}

                    </div>

                </div>

                {/* RIGHT COLUMN (4 cols): Moderatsiya, Tekshiruv, Hisob ma'lumotlari, Tarix */}
                <div className="lg:col-span-4 space-y-4">

                    {/* Card 1: Moderatsiya */}
                    <div className="bg-white dark:bg-[#141414] rounded-2xl border border-[#e5e5e5] dark:border-[#262626] p-5 shadow-sm space-y-3">
                        <div className="flex items-center gap-2">
                            <HugeIcon icon={Shield01Icon} className="w-4 h-4 text-[#737373] dark:text-[#a3a3a3]" />
                            <h3 className="text-[13px] font-bold text-[#525252] dark:text-[#fafafa]">
                                Moderatsiya
                            </h3>
                        </div>

                        <div className="flex items-center bg-[#FAFAFA] rounded-lg justify-between px-3.5 h-[39px]">
                            <span className="text-[12px] font-medium text-[#737373] dark:text-[#a3a3a3]">
                                Joriy holati
                            </span>
                            <span className={`${
                                isBlocked
                                    ? 'bg-[#FFF0F0] text-[#FF3B30] dark:bg-[#3d1414] dark:text-[#ff6b6b]'
                                    : isVerified
                                        ? 'bg-[#E6F9F0] text-[#00A854] dark:bg-[#103020] dark:text-[#2ee088]'
                                        : 'bg-[#EAF5FF] text-[#0084FF] dark:bg-[#10243d] dark:text-[#66b3ff]'
                            } px-2.5 py-0.5 text-[11px] font-bold rounded-md`}>
                                {isBlocked ? "Bloklangan" : isVerified ? "Tasdiqlangan" : "Tekshiruvda"}
                            </span>
                        </div>

                        {/* Profilni bloklash button */}
                        <button
                            onClick={handleBlock}
                            disabled={loadingAction}
                            className={`w-full py-2 px-3.5 border rounded-xl text-[12px] font-semibold flex items-center justify-start gap-2 transition-all cursor-pointer ${
                                isBlocked
                                    ? 'bg-red-50 dark:bg-red-950/20 text-[#7F1D1D] dark:text-[#ef4444] border-red-200 dark:border-red-900/50'
                                    : 'bg-white dark:bg-zinc-900 border-[#fee2e2] dark:border-red-950/40 hover:bg-red-50/50 dark:hover:bg-red-950/20 text-[#7F1D1D] dark:text-[#ef4444]'
                            }`}
                        >
                            {loadingAction ? (
                                <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Info size={16} strokeWidth={3} className='text-[#0a0a0a]' />
                                    <span>{isBlocked ? "Blokdan chiqarish" : "Profilni bloklash"}</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Card 2: Tekshiruv */}
                    <div className="bg-white dark:bg-[#141414] rounded-2xl border border-[#e5e5e5] dark:border-[#262626] p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <Check className="w-4 h-4 text-[#737373] dark:text-[#a3a3a3]" />
                            <h3 className="text-[13px] font-bold text-[#525252] dark:text-[#fafafa]">
                                Tekshiruv
                            </h3>
                        </div>

                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between text-[12px]">
                                <div className="flex items-center gap-2">
                                    <Check className="w-3.5 h-3.5 text-[#00A854] dark:text-[#2ee088] stroke-[2.5]" />
                                    <span className="text-[#404040] dark:text-zinc-300">Telefon raqami</span>
                                </div>
                                <span className="text-[#0A0A0A] dark:text-[#fafafa] font-medium">
                                    {userData?.phone_number ? "Tasdiqlangan" : "-"}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-[12px]">
                                <div className="flex items-center gap-2">
                                    <Check className="w-3.5 h-3.5 text-[#00A854] dark:text-[#2ee088] stroke-[2.5]" />
                                    <span className="text-[#404040] dark:text-zinc-300">Selfi</span>
                                </div>
                                <span className="text-[#0A0A0A] dark:text-[#fafafa] font-medium">
                                    {userData?.is_verified ? "Tasdiqlangan" : "Kutilmoqda"}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-[12px]">
                                <div className="flex items-center gap-2">
                                    <Check className="w-3.5 h-3.5 text-[#00A854] dark:text-[#2ee088] stroke-[2.5]" />
                                    <span className="text-[#404040] dark:text-zinc-300">Anketa</span>
                                </div>
                                <span className="text-[#0A0A0A] dark:text-[#fafafa] font-medium">
                                    {userData?.completion_percentage !== undefined && userData?.completion_percentage !== null
                                        ? `${userData.completion_percentage}%`
                                        : "-"}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-[12px]">
                                <div className="flex items-center gap-2">
                                    <Check className="w-3.5 h-3.5 text-[#00A854] dark:text-[#2ee088] stroke-[2.5]" />
                                    <span className="text-[#404040] dark:text-zinc-300">Halollik qasami</span>
                                </div>
                                <span className="text-[#0A0A0A] dark:text-[#fafafa] font-medium">
                                    {userData?.is_verified ? "Qabul qilingan" : "Kutilmoqda"}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-[12px]">
                                <div className="flex items-center gap-2">
                                    <Check className="w-3.5 h-3.5 text-[#00A854] dark:text-[#2ee088] stroke-[2.5]" />
                                    <span className="text-[#404040] dark:text-zinc-300">Vakil</span>
                                </div>
                                <span className="text-[#0A0A0A] dark:text-[#fafafa] font-medium">
                                    {representative ? "Tasdiqlangan" : "Biriktirilmagan"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Hisob ma'lumotlari */}
                    <div className="bg-white dark:bg-[#141414] rounded-2xl border border-[#e5e5e5] dark:border-[#262626] p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <HugeIcon icon={IdIcon} className="w-4 h-4 text-[#737373] dark:text-[#a3a3a3]" />
                            <h3 className="text-[13px] font-bold text-[#525252] dark:text-[#fafafa]">
                                Hisob ma'lumotlari
                            </h3>
                        </div>

                        <div className="space-y-2.5 text-[12px]">
                            <div className="flex items-center justify-between">
                                <span className="text-[#737373] dark:text-[#a3a3a3]">Foydalanuvchi ID</span>
                                <span className="font-bold text-[#0A0A0A] dark:text-[#fafafa]">{displayId}</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-[#737373] dark:text-[#a3a3a3]">Roli</span>
                                <span className="font-bold text-[#0A0A0A] dark:text-[#fafafa]">
                                    {userData?.role_info?.name || userData?.role_name || "Foydalanuvchi"}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-[#737373] dark:text-[#a3a3a3]">Boshqaruv</span>
                                <span className="font-bold text-[#0A0A0A] dark:text-[#fafafa]">{managementType}</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-[#737373] dark:text-[#a3a3a3]">Turi</span>
                                <span className="font-bold text-[#0A0A0A] dark:text-[#fafafa]">{candidateType}</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-[#737373] dark:text-[#a3a3a3]">Yaratilgan</span>
                                <span className="text-[#0A0A0A] dark:text-[#fafafa] font-medium">{createdAtFormatted}</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-[#737373] dark:text-[#a3a3a3]">Yangilangan</span>
                                <span className="text-[#0A0A0A] dark:text-[#fafafa] font-medium">{updatedAtFormatted}</span>
                            </div>
                        </div>
                    </div>

                    {/* Card 4: Tarix */}
                    <div className="bg-white dark:bg-[#141414] rounded-2xl border border-[#e5e5e5] dark:border-[#262626] p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <Clock className="w-4 h-4 text-[#737373] dark:text-[#a3a3a3]" />
                            <h3 className="text-[13px] font-bold text-[#525252] dark:text-[#fafafa]">
                                Tarix
                            </h3>
                        </div>

                        <div className="space-y-3.5">
                            {historyList.map((event) => (
                                <div key={event.id} className="flex gap-2.5 items-start">
                                    <Check className="w-3.5 h-3.5 text-[#00A854] dark:text-[#2ee088] stroke-[2.5] shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-[12px] font-bold text-[#0A0A0A] dark:text-[#fafafa] leading-tight">
                                            {event.title}
                                        </h4>
                                        <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3] mt-0.5">
                                            {event.subtitle}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

            </div>

            {/* Block Modal */}
            {showBlockModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="w-full max-w-[480px] bg-white dark:bg-[#141414] rounded-[24px] border border-[#e5e5e5] dark:border-[#262626] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        
                        <div className="w-12 h-12 rounded-full bg-[#FFF0F0] dark:bg-red-950/30 text-[#DC2626] dark:text-red-400 flex items-center justify-center">
                            <UserMinus className="w-6 h-6" />
                        </div>

                        <h3 className="text-[16px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-4">
                            Profilni bloklashni tasdiqlaysizmi?
                        </h3>

                        <p className="text-[13px] text-[#525252] dark:text-[#a3a3a3] leading-relaxed mt-2">
                            {fullName} ({displayId}) tizimga kira olmaydi, aktiv suhbatlari yopiladi va nomzodlar ro'yxatidan olib tashlanadi.
                        </p>

                        <label className="text-[12px] font-semibold text-[#404040] dark:text-zinc-300 mt-5 block">
                            Bloklash sababi
                        </label>

                        <Select
                            value={blockReason}
                            onChange={setBlockReason}
                            options={[
                                "Firibgarlik belgilari",
                                "Noto'g'ri / Yolg'on ma'lumot",
                                "Qoidabuzarlik / Haqorat",
                                "Tizimni suiiste'mol qilish",
                                "Boshqa sabab"
                            ]}
                            className="mt-2"
                        />

                        <div
                            onClick={() => setSendNotification(!sendNotification)}
                            className="flex items-center gap-3 mt-5 select-none cursor-pointer group"
                        >
                            <div className={`w-5 h-5 rounded flex items-center justify-center transition-all border ${
                                sendNotification
                                    ? 'bg-[#0474F3] border-[#0474F3] text-white shadow-xs'
                                    : 'border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-zinc-900 group-hover:border-gray-300'
                            }`}>
                                {sendNotification && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                            <span className="text-[13px] font-medium text-[#404040] dark:text-zinc-300">
                                Foydalanuvchiga bloklash sababi yuborilsin
                            </span>
                        </div>

                        <div className="flex items-center justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowBlockModal(false)}
                                className="px-5 py-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-[13px] font-semibold flex items-center gap-2 text-[#404040] dark:text-[#e5e5e5] hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                                <Check size={16} strokeWidth={2.5} />
                                Bekor qilish
                            </button>
                            <button
                                onClick={handleBlockSubmit}
                                className="px-5 py-2.5 flex items-center gap-2 bg-[#7F1D1D] hover:bg-[#b91c1c] text-white rounded-lg text-[13px] font-semibold transition-colors cursor-pointer shadow-xs"
                            >
                                <Check size={16} strokeWidth={2.5} />
                                Profilni bloklash
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
};

export default UsersDetail;