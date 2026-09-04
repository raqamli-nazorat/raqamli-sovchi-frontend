import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHeader } from '../../components/Layout/Layout';
import { axiosAPI } from '../../lib/axiosAPI';
import Select from '../../components/ui/Select';
import {
    ChevronRight,
    Check,
    X,
    AlertCircle,
    UserMinus,
    Play,
    Pause,
    Info,
    FileText,
    MapPin,
    Contact,
    Clock,
    IdCard,
    HeartHandshake,
    Image as ImageIcon,
    Minus,
} from 'lucide-react';
import dayjs from 'dayjs';
import { HugeIcon } from '@/components/ui/HugeIcon';
import { IdIcon, Shield01Icon } from '@hugeicons/core-free-icons';

// ── Types ─────────────────────────────────────────────────────────────

export type UserDetailResponse = {
    id: string;
    display_id?: string;
    full_name?: string;
    status?: string;
    personal?: {
        age?: number | null;
        birth_date?: string | null;
        height?: number | null;
        weight?: number | null;
        gender?: string | null;
        candidate_type?: string | null;
        nationality?: string | { id?: string; name?: string } | null;
        profession?: string | { id?: string; name?: string } | null;
        education_level?: string | { id?: string; name?: string } | null;
        marital_status?: string | { id?: string; name?: string } | null;
        health_status?: string | { id?: string; name?: string } | null;
        has_children?: boolean;
        children_count?: number | null;
    };
    contact?: {
        region?: string | { id?: string; name?: string } | null;
        district?: string | { id?: string; name?: string } | null;
        mahalla?: string | { id?: string; name?: string } | null;
        phone_masked?: string | null;
        email?: string | null;
        auth_provider?: string | null;
        bio?: string | null;
        voice_intro_url?: string | null;
    };
    photos?: {
        id: string;
        url: string;
        is_main?: boolean;
        order?: number;
    }[];
    questionnaire?: {
        answered?: number;
        sections?: {
            name: string;
            score: number;
            max_score: number;
            answered: number;
        }[];
    };
    guardian?: {
        id?: string;
        display_id?: string;
        name?: string;
        full_name?: string | null;
        phone?: string | null;
        kinship?: string | null;
        candidate_role?: string | null;
        phone_masked?: string | null;
        main_photo?: string | null;
        region?: string | null;
        district?: string | null;
        is_approved?: boolean;
    } | null;
    account?: {
        display_id?: string;
        role?: {
            id: string;
            name: string;
        } | null;
        management_type?: string;
        candidate_type?: string;
        auth_provider?: string;
        is_verified?: boolean;
        is_blocked?: boolean;
        created_at?: string;
        deactivated_at?: string | null;
    };
    // Compatibility fields
    main_photo?: string | null;
    phone_number?: string;
    email?: string | null;
    candidate_type?: string;
    age?: number | null;
    region_name?: string | null;
    district_name?: string | null;
    completion_percentage?: number | null;
    auth_provider?: string;
    is_verified?: boolean;
    is_blocked?: boolean;
    role_name?: string;
    role_info?: { id: string; name: string } | null;
    created_at?: string;
    updated_at?: string;
    last_active?: string;
    profile_info?: any;
    representative_info?: any;
};

export type RepresentedUserItem = {
    id: string;
    display_id?: string;
    name?: string;
    age?: number | null;
    photo?: string | null;
    status?: string;
    phone?: string;
    kinship_name?: string | null;
    candidate_role?: string;
    is_approved?: boolean;
    candidates_count?: number;
    dates?: {
        application_date?: string | null;
        sms_sent_date?: string | null;
        approved_date?: string | null;
        questionnaire_date?: string | null;
    };
    created_at?: string;
};

export type UserHistoryItem = {
    event_type: string;
    label: string;
    actor: string;
    date: string;
    is_done: boolean;
};

export type MatchHistoryItem = {
    id: string;
    partner_name: string;
    partner_photo?: string | null;
    direction?: string;
    status?: string;
    status_label?: string;
    created_at?: string;
};

const BLOCK_REASONS = [
    { value: "fraud", label: "Firibgarlik belgilari" },
    { value: "fake_profile", label: "Soxta profil" },
    { value: "abusive_language", label: "Odobsiz xulq" },
    { value: "spam", label: "Spam va reklama" },
    { value: "other", label: "Boshqa sabab" },
];

const UNBLOCK_REASONS = [
    { value: "Shikoyat tasdiqlanmadi", label: "Shikoyat tasdiqlanmadi" },
    { value: "Xatolik tufayli bloklangan", label: "Xatolik tufayli bloklangan" },
    { value: "Foydalanuvchi murojaati qanoatlantirildi", label: "Foydalanuvchi murojaati qanoatlantirildi" },
    { value: "Boshqa sabab", label: "Boshqa sabab" },
];

const WAVEFORM_BARS = [
    6, 10, 14, 18, 12, 8, 14, 20, 16, 10, 14, 22, 18, 12, 8, 14, 20, 24, 18, 14,
    10, 16, 22, 16, 12, 8, 14, 18, 22, 16, 10, 14, 20, 16, 12, 8, 14, 20, 24, 18,
    12, 16, 22, 16, 10, 14, 18, 22, 16, 12, 8, 14, 20, 16, 10, 14, 18, 14, 10, 16,
    20, 16, 12, 8, 6
];

const UsersDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setHeaderTitle, setHeaderSubtitle } = useHeader();

    const [loading, setLoading] = useState(false);
    const [loadingAction, setLoadingAction] = useState(false);
    const [userData, setUserData] = useState<UserDetailResponse | null>(null);

    // Associated API states
    const [representedUsers, setRepresentedUsers] = useState<RepresentedUserItem[]>([]);
    const [loadingRepresented, setLoadingRepresented] = useState(false);

    const [historyList, setHistoryList] = useState<UserHistoryItem[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const [matchHistory, setMatchHistory] = useState<MatchHistoryItem[]>([]);
    const [matchHistoryCount, setMatchHistoryCount] = useState<number | null>(null);
    const [loadingMatch, setLoadingMatch] = useState(false);

    // Profile states
    const [isVerified, setIsVerified] = useState(true);
    const [isBlocked, setIsBlocked] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

    // Modals
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [blockReason, setBlockReason] = useState("fraud");
    const [sendNotification, setSendNotification] = useState(false);

    const [showUnblockModal, setShowUnblockModal] = useState(false);
    const [unblockReason, setUnblockReason] = useState("Shikoyat tasdiqlanmadi");
    const [sendUnblockNotification, setSendUnblockNotification] = useState(true);
    const [unblockSuccessAlert, setUnblockSuccessAlert] = useState<string | null>(null);

    const [selectedPhotoModal, setSelectedPhotoModal] = useState<string | null>(null);

    // 1. Fetch Main User Data
    const fetchUserData = () => {
        if (!id) return;
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
    };

    // 2. Fetch Represented Users (Vakillar)
    const fetchRepresentedUsers = () => {
        if (!id) return;
        setLoadingRepresented(true);
        axiosAPI.get(`accounts/users/${id}/represented-users/`)
            .then((response) => {
                const list = response.data?.data || (Array.isArray(response.data) ? response.data : []);
                setRepresentedUsers(list);
            })
            .catch((err) => {
                console.warn("API error fetching represented users:", err);
                setRepresentedUsers([]);
            })
            .finally(() => {
                setLoadingRepresented(false);
            });
    };

    // 3. Fetch History (Tekshiruv holatlari)
    const fetchHistory = () => {
        if (!id) return;
        setLoadingHistory(true);
        axiosAPI.get(`accounts/users/${id}/history/`)
            .then((response) => {
                const list = response.data?.data || (Array.isArray(response.data) ? response.data : []);
                setHistoryList(list);
            })
            .catch((err) => {
                console.warn("API error fetching user history:", err);
                setHistoryList([]);
            })
            .finally(() => {
                setLoadingHistory(false);
            });
    };

    // 4. Fetch Match History (Tarix)
    const fetchMatchHistory = () => {
        if (!id) return;
        setLoadingMatch(true);
        axiosAPI.get(`accounts/users/${id}/match-history/`)
            .then((response) => {
                if (response.data?.results) {
                    setMatchHistory(response.data.results);
                    setMatchHistoryCount(response.data.count ?? response.data.results.length);
                } else if (Array.isArray(response.data?.data)) {
                    setMatchHistory(response.data.data);
                    setMatchHistoryCount(response.data.data.length);
                } else if (Array.isArray(response.data)) {
                    setMatchHistory(response.data);
                    setMatchHistoryCount(response.data.length);
                }
            })
            .catch((err) => {
                console.warn("API error fetching match history:", err);
                setMatchHistory([]);
            })
            .finally(() => {
                setLoadingMatch(false);
            });
    };

    useEffect(() => {
        fetchUserData();
        fetchRepresentedUsers();
        fetchHistory();
        fetchMatchHistory();
    }, [id]);

    useEffect(() => {
        if (userData) {
            const blocked = Boolean(userData.account?.is_blocked ?? userData.is_blocked);
            const verified = Boolean(userData.account?.is_verified ?? userData.is_verified ?? (userData.status === "Tasdiqlangan"));
            setIsBlocked(blocked);
            setIsVerified(verified);
        }
    }, [userData]);

    // Data Resolution Helpers
    const userId = userData?.id || id || "";
    const displayId = userData?.account?.display_id || userData?.display_id || (userId ? `USR-${userId.slice(0, 5).toUpperCase()}` : "");
    const fullName = userData?.full_name || "";

    const photos = userData?.photos || [];
    const mainPhotoUrl = photos.find(p => p.is_main)?.url || photos[0]?.url || userData?.main_photo || null;
    const initials = fullName && fullName !== ""
        ? fullName
            .split(" ")
            .filter(Boolean)
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) || "US"
        : "US";

    const bioText = userData?.contact?.bio || userData?.profile_info?.bio || null;
    const voiceIntro = userData?.contact?.voice_intro_url || userData?.profile_info?.voice_intro || null;

    // Audio Player State
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioCurrentTime, setAudioCurrentTime] = useState(0);
    const [audioDuration, setAudioDuration] = useState<number | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

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

    const voiceDurationDisplay = audioDuration ? formatAudioTime(audioDuration) : "0:00";

    const formatAuthProvider = (provider?: string | null) => {
        if (!provider) return "";
        const p = provider.toLowerCase();
        if (p === "phone" || p === "phone_number" || p.includes("telefon")) return "Telefon raqami";
        if (p === "telegram") return "Telegram bot";
        if (p === "google") return "Google";
        if (p === "representative" || p === "vakil" || p.includes("vakil")) return "Vakil orqali";
        return provider;
    };

    const formatCandidateType = (type?: string | null) => {
        if (!type) return "";
        const t = type.toLowerCase();
        if (t === "kuyov" || t === "groom" || t === "male") return "Kuyov";
        if (t === "kelin" || t === "bride" || t === "female") return "Kelin";
        if (t === "vakil" || t === "representative") return "Vakil";
        return type.charAt(0).toUpperCase() + type.slice(1);
    };

    const candidateType = formatCandidateType(userData?.account?.candidate_type || userData?.personal?.candidate_type || userData?.candidate_type);
    const hasGuardian = Boolean(userData?.guardian && (userData.guardian.id || userData.guardian.name || userData.guardian.full_name || userData.guardian.phone || userData.guardian.phone_masked || userData.guardian.kinship));
    const hasRepresented = Boolean(representedUsers && representedUsers.length > 0);
    const hasVakilData = hasRepresented || hasGuardian;
    const managementType = userData?.account?.management_type || (hasVakilData ? "Vakil orqali" : "O'zi");

    const regDate = userData?.account?.created_at
        ? dayjs(userData.account.created_at).format("DD.MM.YYYY")
        : (userData?.created_at ? dayjs(userData.created_at).format("DD.MM.YYYY") : "");
    const lastActive = userData?.last_active
        ? dayjs(userData.last_active).format("DD.MM.YYYY HH:mm")
        : (userData?.account?.created_at ? dayjs(userData.account.created_at).format("DD.MM.YYYY HH:mm") : "");
    const createdAtFormatted = userData?.account?.created_at
        ? dayjs(userData.account.created_at).format("DD.MM.YYYY HH:mm")
        : (userData?.created_at ? dayjs(userData.created_at).format("DD.MM.YYYY HH:mm") : "");

    // Shaxsiy ma'lumotlar
    const personal = userData?.personal;
    const calculatedAge = personal?.age ?? (personal?.birth_date ? dayjs().diff(dayjs(personal.birth_date), 'year') : (userData?.age ?? null));
    const ageText = calculatedAge ? `${calculatedAge} yosh` : "";
    const birthDate = personal?.birth_date ? dayjs(personal.birth_date).format("DD.MM.YYYY") : "";

    const heightText = personal?.height ? `${personal.height} sm` : null;
    const weightText = personal?.weight ? `${personal.weight} kg` : null;
    const heightWeight = heightText && weightText ? `${heightText}, ${weightText}` : (heightText || weightText || "");

    const nationality = typeof personal?.nationality === 'object' ? personal?.nationality?.name : (personal?.nationality || "");
    const education = typeof personal?.education_level === 'object' ? personal?.education_level?.name : (personal?.education_level || "");
    const profession = typeof personal?.profession === 'object' ? personal?.profession?.name : (personal?.profession || "");
    const maritalStatus = typeof personal?.marital_status === 'object' ? personal?.marital_status?.name : (personal?.marital_status || "");
    const children = personal?.children_count !== undefined && personal?.children_count !== null
        ? (personal.children_count > 0 ? `${personal.children_count} ta` : "Yo'q")
        : (personal?.has_children !== undefined ? (personal.has_children ? "Bor" : "Yo'q") : "");
    const healthStatus = typeof personal?.health_status === 'object' ? personal?.health_status?.name : (personal?.health_status || "");

    // Manzil va aloqa
    const contact = userData?.contact;
    const regionName = typeof contact?.region === 'object' ? contact?.region?.name : (contact?.region || userData?.region_name || "");
    const districtName = typeof contact?.district === 'object' ? contact?.district?.name : (contact?.district || userData?.district_name || "");
    const mahallaName = typeof contact?.mahalla === 'object' ? contact?.mahalla?.name : (contact?.mahalla || "");
    const phoneNumber = contact?.phone_masked || userData?.phone_number || "";
    const email = contact?.email || userData?.email || "";
    const regMethod = formatAuthProvider(contact?.auth_provider || userData?.account?.auth_provider || userData?.auth_provider);

    // Questionnaire
    const questionnaire = userData?.questionnaire;
    const totalAnswered = questionnaire?.answered ?? 0;
    const questionnaireSections = questionnaire?.sections || [];

    // Header updates
    useEffect(() => {
        setHeaderTitle("Foydalanuvchi kartasi");
        setHeaderSubtitle(fullName !== "" ? `${fullName}, ${displayId}` : displayId);
    }, [fullName, displayId, setHeaderTitle, setHeaderSubtitle]);

    // Block / Unblock Handlers
    const handleBlock = () => {
        if (isBlocked) {
            setShowUnblockModal(true);
        } else {
            setShowBlockModal(true);
        }
    };

    const handleUnblockSubmit = async () => {
        setLoadingAction(true);
        setShowUnblockModal(false);
        try {
            const unblockPayload = {
                reason: unblockReason,
                notify_user: sendUnblockNotification,
                phone_number: contact?.phone_masked || userData?.phone_number || "",
                email: contact?.email || userData?.email || "user@example.com",
                role: userData?.account?.role?.id || userData?.role_info?.id || "",
                is_blocked: false,
            };

            await axiosAPI.post(`accounts/users/${userId}/unblock/`, unblockPayload);
            setIsBlocked(false);
            const reasonLabel = UNBLOCK_REASONS.find(r => r.value === unblockReason)?.label || unblockReason;
            const formattedReason = reasonLabel.charAt(0).toLowerCase() + reasonLabel.slice(1);
            const nowFormatted = dayjs().format("DD.MM.YYYY HH:mm");
            setUnblockSuccessAlert(`Foydalanuvchi blokdan chiqarildi, ${nowFormatted}. Sabab: ${formattedReason}.`);
            setNotification(null);
            fetchUserData();
            fetchHistory();
        } catch (err: any) {
            console.error("Unblock API error:", err);
            // Fallback patch attempt if post fails
            try {
                await axiosAPI.patch(`accounts/users/${userId}/`, {
                    is_blocked: false,
                    unblock_reason: unblockReason,
                });
                setIsBlocked(false);
                const reasonLabel = UNBLOCK_REASONS.find(r => r.value === unblockReason)?.label || unblockReason;
                const formattedReason = reasonLabel.charAt(0).toLowerCase() + reasonLabel.slice(1);
                const nowFormatted = dayjs().format("DD.MM.YYYY HH:mm");
                setUnblockSuccessAlert(`Foydalanuvchi blokdan chiqarildi, ${nowFormatted}. Sabab: ${formattedReason}.`);
                setNotification(null);
                fetchUserData();
                fetchHistory();
            } catch (patchErr) {
                setNotification({
                    type: 'error',
                    message: err?.response?.data?.message || "Blokdan chiqarishda xatolik yuz berdi"
                });
            }
        } finally {
            setLoadingAction(false);
        }
    };

    const handleBlockSubmit = async () => {
        setLoadingAction(true);
        setShowBlockModal(false);
        setUnblockSuccessAlert(null);
        try {
            const blockPayload = {
                reason: blockReason,
                notify_user: sendNotification,
            };

            await axiosAPI.post(`accounts/users/${userId}/block/`, blockPayload);
            setIsBlocked(true);
            const reasonObj = BLOCK_REASONS.find(r => r.value === blockReason);
            setNotification({
                type: 'error',
                message: `Profil bloklandi! Sabab: ${reasonObj?.label || blockReason}`
            });
            fetchUserData();
            fetchHistory();
        } catch (err: any) {
            console.error("Block API error:", err);
            // Fallback patch attempt
            try {
                await axiosAPI.patch(`accounts/users/${userId}/`, {
                    is_blocked: true,
                    block_reason: blockReason,
                });
                setIsBlocked(true);
                setNotification({
                    type: 'error',
                    message: `Profil bloklandi!`
                });
                fetchUserData();
                fetchHistory();
            } catch (patchErr) {
                setNotification({
                    type: 'error',
                    message: err?.response?.data?.message || "Bloklashda xatolik yuz berdi"
                });
            }
        } finally {
            setLoadingAction(false);
        }
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

            {/* Unblock Success Alert Banner (matching Image 2) */}
            {unblockSuccessAlert && (
                <div className="w-full bg-[#E8FAF0] dark:bg-[#103020]/70 border border-[#9CE3BF] dark:border-[#2ee088]/40 text-[#08834C] dark:text-[#2ee088] px-5 py-3.5 rounded-2xl text-[13px] font-medium leading-relaxed transition-all">
                    {unblockSuccessAlert}
                </div>
            )}

            {/* Notification Alert Banner */}
            {notification && (
                <div className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${notification.type === 'success'
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
                                {mainPhotoUrl ? (
                                    <img
                                        src={mainPhotoUrl}
                                        alt={fullName}
                                        onClick={() => setSelectedPhotoModal(mainPhotoUrl)}
                                        className="w-14 h-14 rounded-full object-cover border border-[#e5e5e5] dark:border-[#262626] shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                                    />
                                ) : (
                                    <div className="w-14 h-14 rounded-full bg-[#E0F2FE] dark:bg-sky-950/50 text-[#0284C7] dark:text-sky-400 font-bold text-base flex items-center justify-center shrink-0 border border-sky-100 dark:border-sky-900/40">
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

                                        <span className={`${isBlocked
                                            ? 'bg-[#FEF2F2] text-[#7F1D1D] dark:bg-[#3d1414] dark:text-[#ff6b6b]'
                                            : isVerified
                                                ? 'bg-[#E6F9F0] text-[#00A854] dark:bg-[#103020] dark:text-[#2ee088]'
                                                : 'bg-[#EAF5FF] text-[#0084FF] dark:bg-[#10243d] dark:text-[#66b3ff]'
                                            } text-[11px] font-semibold px-2.5 py-0.5 rounded-full`}>
                                            {isBlocked ? "Bloklangan" : (userData?.status || (isVerified ? "Tasdiqlangan" : "Tekshiruvda"))}
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
                                    <p className="text-[13px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-0.5">{profession}</p>
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
                    <div className="bg-white dark:bg-[#141414] rounded-2xl border border-[#e5e5e5] dark:border-[#262626] p-5 lg:p-6 shadow-sm space-y-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2.5">
                                <Info className="w-4 h-4 text-[#737373] dark:text-[#a3a3a3]" />
                                <h3 className="text-[13px] font-bold text-[#525252] dark:text-[#fafafa]">
                                    O'zi haqida
                                </h3>
                            </div>

                            {bioText ? (
                                <p className="text-[12px] text-[#404040] dark:text-[#d4d4d4] leading-relaxed whitespace-pre-line">
                                    {bioText}
                                </p>
                            ) : (
                                <p className="text-[12px] text-[#737373] dark:text-[#a3a3a3] italic">
                                    Ma'lumot kiritilmagan
                                </p>
                            )}
                        </div>

                        {/* Audio container */}
                        {voiceIntro && (
                            <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-zinc-900/90 border border-[#e2e8f0] dark:border-zinc-800 flex items-center gap-3.5">
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
                                        {dayjs().format("DD.MM.YYYY [kuni yuklangan]")}
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
                                    className="flex-1 flex items-center justify-between h-7 px-2 overflow-hidden cursor-pointer select-none"
                                    title="O'tkazish uchun bosing"
                                >
                                    {WAVEFORM_BARS.map((height, i) => {
                                        const barProgress = (i / (WAVEFORM_BARS.length - 1)) * 100;
                                        const isBarActive = (!isPlaying && audioCurrentTime === 0) ? true : (audioProgress >= barProgress);
                                        return (
                                            <div
                                                key={i}
                                                className={`w-[2.5px] rounded-full transition-all duration-150 ${isBarActive
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
                                {totalAnswered > 0 ? `${totalAnswered} ta savolga javob berilgan` : "To'ldirilmagan"}
                            </span>
                        </div>

                        {/* Sections from API */}
                        {questionnaireSections.length > 0 ? (
                            <div className="space-y-4">
                                {questionnaireSections.map((sec, idx) => {
                                    const percent = sec.max_score > 0 ? Math.round((sec.score / sec.max_score) * 100) : 0;
                                    return (
                                        <div key={idx} className="space-y-1.5">
                                            <div className="flex justify-between items-center text-[12px]">
                                                <span className="text-[#404040] dark:text-zinc-300 font-medium">
                                                    {sec.name}
                                                </span>
                                                <div className="flex items-center gap-2 font-medium">
                                                    <span className="text-[11px] text-[#737373] dark:text-[#a3a3a3]">
                                                        {sec.answered} ta savol
                                                    </span>
                                                    <span className="font-bold text-[#0A0A0A] dark:text-[#fafafa]">
                                                        {sec.score} / {sec.max_score}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="w-full bg-[#F1F5F9] dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-[#0474F3] h-full rounded-full transition-all duration-500"
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
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
                        )}
                    </div>

                    {/* Card 4: Vakil ma'lumotlari (from represented-users API & guardian) */}
                    {hasVakilData && (
                        <div className="bg-white dark:bg-[#141414] rounded-2xl border border-[#e5e5e5] dark:border-[#262626] p-5 lg:p-6 shadow-sm">

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Contact className="w-4 h-4 text-[#737373] dark:text-[#a3a3a3]" />
                                    <h3 className="text-[13px] font-bold text-[#525252] dark:text-[#fafafa]">
                                        Vakil ma'lumotlari
                                    </h3>
                                </div>
                            </div>

                            <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3] mt-2 mb-4 leading-relaxed">
                                Vakil — nomzod nomidan anketani to'ldiruvchi va profilni boshqaruvchi qarindosh (amma, xola, amaki, tog'a).
                            </p>

                            {loadingRepresented ? (
                                <div className="py-6 flex justify-center">
                                    <div className="w-6 h-6 border-2 border-[#0474F3] border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {(representedUsers.length > 0 ? representedUsers : [userData?.guardian]).map((rep: any, idx: number) => {
                                        if (!rep) return null;

                                        const repName = rep.name || rep.full_name || "";
                                        const repDisplayId = rep.display_id || (rep.id ? `USR-${rep.id.slice(0, 5).toUpperCase()}` : "");
                                        const repPhoto = rep.photo || rep.main_photo || null;
                                        const repInitials = repName !== ""
                                            ? repName.split(" ").filter(Boolean).map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
                                            : "VK";
                                        const repKinship = rep.kinship_name || rep.kinship || "";
                                        const repPhone = rep.phone || rep.phone_masked || "";
                                        const repRole = rep.candidate_role ? formatCandidateType(rep.candidate_role) : candidateType;
                                        const repDates = rep.dates;
                                        const repTargetId = (rep.id && rep.id !== id) ? rep.id : (rep.user_id && rep.user_id !== id) ? rep.user_id : null;

                                        return (
                                            <div key={rep.id || idx} className="space-y-4">
                                                {/* Representative Card Box */}
                                                <div
                                                    onClick={() => {
                                                        if (repTargetId) {
                                                            window.open(`/users/${repTargetId}`, '_blank');
                                                        }
                                                    }}
                                                    className={`bg-[#F8FAFC] dark:bg-zinc-900 border border-[#E2E8F0] dark:border-zinc-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${repTargetId ? 'cursor-pointer hover:border-blue-400 hover:shadow-sm' : ''}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {repPhoto ? (
                                                            <img
                                                                src={repPhoto}
                                                                alt={repName}
                                                                className="w-10 h-10 rounded-full object-cover border border-[#e2e8f0] dark:border-zinc-700 shrink-0"
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-[#EDE9FE] dark:bg-purple-950/40 text-[#7C3AED] dark:text-purple-400 font-bold text-xs flex items-center justify-center shrink-0">
                                                                {repInitials}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="text-[13px] font-bold text-[#0A0A0A] dark:text-[#fafafa]">
                                                                {repName}
                                                            </p>
                                                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                                                {repDisplayId && (
                                                                    <span className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">
                                                                        {repDisplayId}
                                                                    </span>
                                                                )}
                                                                <span className="bg-[#E2E8F0] dark:bg-zinc-800 text-[#475569] dark:text-zinc-300 text-[10px] font-semibold px-2 py-0.5 rounded">
                                                                    {repRole}
                                                                </span>
                                                                <span className={`${rep.is_approved || rep.status === "Tasdiqlangan"
                                                                    ? 'bg-[#E6F9F0] dark:bg-[#103020] text-[#00A854] dark:text-[#2ee088]'
                                                                    : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
                                                                    } text-[10px] font-semibold px-2 py-0.5 rounded`}>
                                                                    {rep.status || (rep.is_approved ? "Tasdiqlangan" : "Kutilmoqda")}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-6 sm:gap-8 justify-between sm:justify-end">
                                                        <div>
                                                            <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">Qarindoshligi</p>
                                                            <p className="text-[12px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-0.5">{repKinship}</p>
                                                        </div>

                                                        <div>
                                                            <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">Telefon</p>
                                                            <p className="text-[12px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-0.5">{repPhone}</p>
                                                        </div>

                                                        <div>
                                                            <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">Nomzodlari</p>
                                                            <p className="text-[12px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-0.5">
                                                                {rep.candidates_count !== undefined ? `${rep.candidates_count} ta` : "1 ta"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Rozilik va sanalar Timeline */}
                                                {repDates && (
                                                    <div className="mt-4 pt-3 border-t border-[#f0f0f0] dark:border-[#262626]">
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
                                                                <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${repDates.application_date
                                                                    ? 'bg-[#E6F9F0] dark:bg-[#103020] text-[#00A854] dark:text-[#2ee088]'
                                                                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-400'
                                                                    }`}>
                                                                    {repDates.application_date ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : <Minus className="w-2.5 h-2.5" />}
                                                                </div>
                                                                <p className="text-[11px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-1.5">
                                                                    Ariza to'ldirildi
                                                                </p>
                                                                <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3] mt-0.5">
                                                                    {repDates.application_date ? dayjs(repDates.application_date).format("DD.MM.YYYY HH:mm") : ""}
                                                                </p>
                                                            </div>

                                                            <div>
                                                                <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${repDates.sms_sent_date
                                                                    ? 'bg-[#E6F9F0] dark:bg-[#103020] text-[#00A854] dark:text-[#2ee088]'
                                                                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-400'
                                                                    }`}>
                                                                    {repDates.sms_sent_date ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : <Minus className="w-2.5 h-2.5" />}
                                                                </div>
                                                                <p className="text-[11px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-1.5">
                                                                    Nomzodga SMS yuborildi
                                                                </p>
                                                                <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3] mt-0.5">
                                                                    {repDates.sms_sent_date ? dayjs(repDates.sms_sent_date).format("DD.MM.YYYY HH:mm") : ""}
                                                                </p>
                                                            </div>

                                                            <div>
                                                                <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${repDates.approved_date
                                                                    ? 'bg-[#E6F9F0] dark:bg-[#103020] text-[#00A854] dark:text-[#2ee088]'
                                                                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-400'
                                                                    }`}>
                                                                    {repDates.approved_date ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : <Minus className="w-2.5 h-2.5" />}
                                                                </div>
                                                                <p className="text-[11px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-1.5">
                                                                    Nomzod rozilikni tasdiqladi
                                                                </p>
                                                                <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3] mt-0.5">
                                                                    {repDates.approved_date ? dayjs(repDates.approved_date).format("DD.MM.YYYY HH:mm") : ""}
                                                                </p>
                                                            </div>

                                                            <div>
                                                                <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${repDates.questionnaire_date
                                                                    ? 'bg-[#E6F9F0] dark:bg-[#103020] text-[#00A854] dark:text-[#2ee088]'
                                                                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-400'
                                                                    }`}>
                                                                {repDates.questionnaire_date ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : <Minus className="w-2.5 h-2.5" />}
                                                            </div>
                                                            <p className="text-[11px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-1.5">
                                                                Anketa to'ldirildi
                                                            </p>
                                                            <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3] mt-0.5">
                                                                {repDates.questionnaire_date ? dayjs(repDates.questionnaire_date).format("DD.MM.YYYY HH:mm") : ""}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            )}

                        </div>
                    )}

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

                        <div className="flex items-center bg-[#FAFAFA] dark:bg-zinc-900 rounded-lg justify-between px-3.5 h-[39px]">
                            <span className="text-[12px] font-medium text-[#737373] dark:text-[#a3a3a3]">
                                Joriy holati
                            </span>
                            <span className={`${isBlocked
                                ? 'bg-[#FEF2F2] text-[#7F1D1D] dark:bg-[#3d1414] dark:text-[#ff6b6b]'
                                : isVerified
                                    ? 'bg-[#E6F9F0] text-[#00A854] dark:bg-[#103020] dark:text-[#2ee088]'
                                    : 'bg-[#EAF5FF] text-[#0084FF] dark:bg-[#10243d] dark:text-[#66b3ff]'
                                } px-2.5 py-0.5 text-[11px] font-bold rounded-md`}>
                                {isBlocked ? "Bloklangan" : (userData?.status || (isVerified ? "Tasdiqlangan" : "Tekshiruvda"))}
                            </span>
                        </div>

                        {/* Profilni bloklash / blokdan chiqarish button */}
                        <button
                            onClick={handleBlock}
                            disabled={loadingAction}
                            className={`w-full py-2 px-3.5 border rounded-xl text-[12px] font-semibold flex items-center justify-start gap-2 transition-all cursor-pointer ${!isBlocked
                                    ? 'bg-red-50 dark:bg-red-950/20 text-[#7F1D1D] dark:text-[#ef4444] border-red-200 dark:border-red-900/50'
                                    : 'bg-white! border-[#e5e5e5]! text-[#0474F3] dark:text-[#0474F3]'
                                }`}
                        >
                            {loadingAction ? (
                                <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Info size={16} strokeWidth={3} className={`text-[#0a0a0a] ${isBlocked ? 'text-[#0474F3]!' : ''} `} />
                                    <span>{isBlocked ? "Blokdan chiqarish" : "Profilni bloklash"}</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Card 2: Tekshiruv (from /history/ API) */}
                    <div className="bg-white dark:bg-[#141414] rounded-2xl border border-[#e5e5e5] dark:border-[#262626] p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-[#737373] dark:text-[#a3a3a3]" />
                                <h3 className="text-[13px] font-bold text-[#525252] dark:text-[#fafafa]">
                                    Tekshiruv
                                </h3>
                            </div>
                        </div>

                        {loadingHistory ? (
                            <div className="py-4 flex justify-center">
                                <div className="w-5 h-5 border-2 border-[#0474F3] border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : historyList.length > 0 ? (
                            <div className="space-y-3">
                                {historyList.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-[12px] gap-2">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${item.is_done
                                                ? 'bg-[#E6F9F0] dark:bg-[#103020] text-[#00A854] dark:text-[#2ee088]'
                                                : 'bg-amber-50 dark:bg-amber-950/30 text-amber-500'
                                                }`}>
                                                {item.is_done ? (
                                                    <Check className="w-3 h-3 stroke-[2.5]" />
                                                ) : (
                                                    <Clock className="w-3 h-3" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[#0A0A0A] dark:text-[#fafafa] font-medium truncate">
                                                    {item.label}
                                                </p>
                                                <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3] truncate">
                                                    {item.actor} • {dayjs(item.date).format("DD.MM.YYYY HH:mm")}
                                                </p>
                                            </div>
                                        </div>

                                        <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded ${item.is_done
                                            ? 'bg-[#E6F9F0] dark:bg-[#103020] text-[#00A854] dark:text-[#2ee088]'
                                            : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
                                            }`}>
                                            {item.is_done ? "Bajarildi" : "Kutilmoqda"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between text-[12px]">
                                    <div className="flex items-center gap-2">
                                        <Check className="w-3.5 h-3.5 text-[#00A854] stroke-[2.5]" />
                                        <span className="text-[#404040] dark:text-zinc-300">Telefon raqami</span>
                                    </div>
                                    <span className="text-[#0A0A0A] dark:text-[#fafafa] font-medium">
                                        {contact?.phone_masked || userData?.phone_number ? "Tasdiqlangan" : ""}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-[12px]">
                                    <div className="flex items-center gap-2">
                                        <Check className="w-3.5 h-3.5 text-[#00A854] stroke-[2.5]" />
                                        <span className="text-[#404040] dark:text-zinc-300">Selfi</span>
                                    </div>
                                    <span className="text-[#0A0A0A] dark:text-[#fafafa] font-medium">
                                        {isVerified ? "Tasdiqlangan" : "Kutilmoqda"}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-[12px]">
                                    <div className="flex items-center gap-2">
                                        <Check className="w-3.5 h-3.5 text-[#00A854] stroke-[2.5]" />
                                        <span className="text-[#404040] dark:text-zinc-300">Anketa</span>
                                    </div>
                                    <span className="text-[#0A0A0A] dark:text-[#fafafa] font-medium">
                                        {totalAnswered > 0 ? `${totalAnswered} ta javob` : ""}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-[12px]">
                                    <div className="flex items-center gap-2">
                                        <Check className="w-3.5 h-3.5 text-[#00A854] stroke-[2.5]" />
                                        <span className="text-[#404040] dark:text-zinc-300">Halollik qasami</span>
                                    </div>
                                    <span className="text-[#0A0A0A] dark:text-[#fafafa] font-medium">
                                        {isVerified ? "Qabul qilingan" : "Kutilmoqda"}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-[12px]">
                                    <div className="flex items-center gap-2">
                                        <Check className="w-3.5 h-3.5 text-[#00A854] stroke-[2.5]" />
                                        <span className="text-[#404040] dark:text-zinc-300">Vakil</span>
                                    </div>
                                    <span className="text-[#0A0A0A] dark:text-[#fafafa] font-medium">
                                        {representedUsers.length > 0 || userData?.guardian ? "Biriktirilgan" : "Biriktirilmagan"}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Card 3: Hisob ma'lumotlari (from account) */}
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
                                    {userData?.account?.role?.name || userData?.role_info?.name || userData?.role_name || "Foydalanuvchi"}
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
                                <span className="text-[#737373] dark:text-[#a3a3a3]">Autentifikatsiya</span>
                                <span className="text-[#0A0A0A] dark:text-[#fafafa] font-medium">{regMethod}</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-[#737373] dark:text-[#a3a3a3]">Yaratilgan</span>
                                <span className="text-[#0A0A0A] dark:text-[#fafafa] font-medium">{createdAtFormatted}</span>
                            </div>

                            {userData?.account?.deactivated_at && (
                                <div className="flex items-center justify-between">
                                    <span className="text-[#737373] dark:text-[#a3a3a3]">Deaktivatsiya</span>
                                    <span className="text-[#0A0A0A] dark:text-[#fafafa] font-medium">
                                        {dayjs(userData.account.deactivated_at).format("DD.MM.YYYY HH:mm")}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Card 4: Tarix / Mosliklar tarixi (from match-history API) */}
                    <div className="bg-white dark:bg-[#141414] rounded-2xl border border-[#e5e5e5] dark:border-[#262626] p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-[#737373] dark:text-[#a3a3a3]" />
                                <h3 className="text-[13px] font-bold text-[#525252] dark:text-[#fafafa]">
                                    Tarix
                                </h3>
                            </div>
                            {matchHistoryCount !== null && (
                                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400">
                                    {matchHistoryCount} ta
                                </span>
                            )}
                        </div>

                        {loadingMatch ? (
                            <div className="py-4 flex justify-center">
                                <div className="w-5 h-5 border-2 border-[#0474F3] border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : matchHistory.length > 0 ? (
                            <div className="space-y-3">
                                {matchHistory.map((item) => {
                                    const partnerInitials = item.partner_name
                                        ? item.partner_name.split(" ").filter(Boolean).map(n => n[0]).join("").toUpperCase().slice(0, 2)
                                        : "P";
                                    const isPending = item.status === "pending" || item.status === "kutilmoqda";
                                    const isAccepted = item.status === "accepted" || item.status === "tasdiqlangan" || item.status === "matched";

                                    return (
                                        <div key={item.id} className="flex items-center justify-between gap-3 text-[12px] p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                {item.partner_photo ? (
                                                    <img
                                                        src={item.partner_photo}
                                                        alt={item.partner_name}
                                                        className="w-8 h-8 rounded-full object-cover border border-[#e5e5e5] dark:border-[#262626] shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold text-[11px] flex items-center justify-center shrink-0">
                                                        {partnerInitials}
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="font-bold text-[#0A0A0A] dark:text-[#fafafa] truncate">
                                                        {item.partner_name}
                                                    </p>
                                                    <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">
                                                        {item.created_at ? dayjs(item.created_at).format("DD.MM.YYYY HH:mm") : ""}
                                                    </p>
                                                </div>
                                            </div>

                                            <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded ${isAccepted
                                                ? 'bg-[#E6F9F0] dark:bg-[#103020] text-[#00A854] dark:text-[#2ee088]'
                                                : isPending
                                                    ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
                                                    : 'bg-gray-100 dark:bg-zinc-800 text-[#737373] dark:text-zinc-400'
                                                }`}>
                                                {item.status_label || item.status || "Kutilmoqda"}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-6 text-center text-[12px] text-[#737373] dark:text-[#a3a3a3]">
                                Tarixi mavjud emas
                            </div>
                        )}
                    </div>

                </div>

            </div>

            {/* Photo Lightbox Modal */}
            {selectedPhotoModal && (
                <div
                    onClick={() => setSelectedPhotoModal(null)}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
                >
                    <div className="relative max-w-2xl max-h-[90vh] flex flex-col items-center">
                        <button
                            onClick={() => setSelectedPhotoModal(null)}
                            className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors cursor-pointer"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <img
                            src={selectedPhotoModal}
                            alt="Preview"
                            className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl"
                        />
                    </div>
                </div>
            )}

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
                            options={BLOCK_REASONS}
                            className="mt-2"
                        />

                        <div
                            onClick={() => setSendNotification(!sendNotification)}
                            className="flex items-center gap-3 mt-5 select-none cursor-pointer group"
                        >
                            <div className={`w-5 h-5 rounded flex items-center justify-center transition-all border ${sendNotification
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

            {/* Unblock Modal (matching Image 1) */}
            {showUnblockModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="w-full max-w-[480px] bg-white dark:bg-[#141414] rounded-[24px] border border-[#e5e5e5] dark:border-[#262626] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">

                        <h3 className="text-[17px] font-bold text-[#0A0A0A] dark:text-[#fafafa]">
                            Blokdan chiqarasizmi?
                        </h3>

                        <p className="text-[13px] text-[#525252] dark:text-[#a3a3a3] leading-relaxed mt-2.5">
                            {fullName || "Foydalanuvchi"} ({displayId}) qayta tizimga kira oladi, profili nomzodlar ro'yxatiga qaytadi. Bloklash yozuvi audit jurnalida saqlanadi.
                        </p>

                        <label className="text-[12px] font-semibold text-[#404040] dark:text-zinc-300 mt-5 block">
                            Blokdan chiqarish sababi
                        </label>

                        <Select
                            value={unblockReason}
                            onChange={setUnblockReason}
                            options={UNBLOCK_REASONS}
                            className="mt-2"
                        />

                        <div
                            onClick={() => setSendUnblockNotification(!sendUnblockNotification)}
                            className="flex items-center gap-3 mt-5 select-none cursor-pointer group"
                        >
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all border ${sendUnblockNotification
                                ? 'bg-[#0474F3] border-[#0474F3] text-white shadow-xs'
                                : 'border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-zinc-900 group-hover:border-gray-300'
                                }`}>
                                {sendUnblockNotification && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                            <span className="text-[13px] font-medium text-[#404040] dark:text-zinc-300">
                                Foydalanuvchiga xabar yuborilsin
                            </span>
                        </div>

                        <div className="flex items-center justify-end gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => setShowUnblockModal(false)}
                                className="px-5 py-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] font-semibold flex items-center gap-2 text-[#404040] dark:text-[#e5e5e5] hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                                <Check size={16} strokeWidth={2.5} className="text-[#0a0a0a] dark:text-[#fafafa]" />
                                Bekor qilish
                            </button>
                            <button
                                type="button"
                                onClick={handleUnblockSubmit}
                                disabled={loadingAction}
                                className="px-5 py-2.5 flex items-center gap-2 bg-[#0474F3] hover:bg-[#0362cf] text-white rounded-xl text-[13px] font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                            >
                                {loadingAction ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Check size={16} strokeWidth={2.5} />
                                )}
                                Blokdan chiqarish
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
};

export default UsersDetail;