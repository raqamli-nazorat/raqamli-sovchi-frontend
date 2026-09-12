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
import {
    CheckmarkBadge01Icon,
    Note01Icon,
    UserAccountIcon,
    Globe02Icon,
    Location01Icon,
    File01Icon,
    PlayIcon,
    PauseIcon,
    InformationCircleIcon,
    UserBlock01Icon,
    IdIcon,
    Shield01Icon,
    UserCheck01Icon,
    DocumentValidationIcon,
} from '@hugeicons/core-free-icons';

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
        phone_masked?: string | null;
        phone_number?: string | null;
        kinship?: string | { id?: string; name?: string } | null;
        kinship_name?: string | null;
        candidate_role?: string | null;
        main_photo?: string | null;
        photo?: string | null;
        region?: string | null;
        district?: string | null;
        is_approved?: boolean;
        status?: string;
        candidates_count?: number;
        user_id?: string;
        dates?: {
            application_date?: string | null;
            sms_sent_date?: string | null;
            approved_date?: string | null;
            questionnaire_date?: string | null;
        };
        application_date?: string | null;
        sms_sent_date?: string | null;
        approved_date?: string | null;
        questionnaire_date?: string | null;
        created_at?: string;
    } | any | null;
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
    { value: "appeal_accepted", label: "Apellyatsiya qabul qilindi" },
    { value: "mistake", label: "Xato bloklangan edi" },
    { value: "reviewed_cleared", label: "Qayta ko'rib chiqildi, qoidabuzarlik topilmadi" },
    { value: "penalty_period_ended", label: "Jazo muddati tugadi" },
    { value: "other", label: "Boshqa" },
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
    const [unblockReason, setUnblockReason] = useState("appeal_accepted");
    const [sendUnblockNotification, setSendUnblockNotification] = useState(true);
    const [unblockSuccessAlert, setUnblockSuccessAlert] = useState<string | null>(null);

    const [selectedPhotoModal, setSelectedPhotoModal] = useState<string | null>(null);
    const [showQuestionnaireModal, setShowQuestionnaireModal] = useState(false);
    const [showConsentModal, setShowConsentModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);

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
    const intentLabel = (userData as any)?.personal?.intent_label || (userData as any)?.intent_label || "Niyati jiddiy";
    const guardian = userData?.guardian;
    const hasGuardian = Boolean(
        guardian && (
            Array.isArray(guardian)
                ? guardian.length > 0
                : (guardian.id || guardian.name || guardian.full_name || guardian.phone || guardian.phone_masked || guardian.phone_number || guardian.kinship)
        )
    );
    const hasVakilData = hasGuardian;
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

    // Top Card 4: Ro'yxatdan o'tgan sana (if blocked) vs Oxirgi faollik (if unblocked)
    const card4Title = isBlocked ? "Ro'yxatdan o'tgan sana" : "Oxirgi faollik";
    const card4Value = isBlocked
        ? (userData?.account?.created_at
            ? dayjs(userData.account.created_at).format("DD.MM.YYYY HH:mm")
            : (userData?.created_at ? dayjs(userData.created_at).format("DD.MM.YYYY HH:mm") : ""))
        : (userData?.last_active
            ? dayjs(userData.last_active).format("DD.MM.YYYY HH:mm")
            : (userData?.account?.created_at ? dayjs(userData.account.created_at).format("DD.MM.YYYY HH:mm") : ""));

    // Block display info for profile header
    const blockReasonValue = (userData as any)?.account?.block_reason || (userData as any)?.block_reason || (userData as any)?.account?.blocked_reason;
    const rawReasonLabel = BLOCK_REASONS.find(r => r.value === blockReasonValue)?.label || blockReasonValue;
    const blockedReasonDisplay = rawReasonLabel || "";

    const blockedByName = (userData as any)?.account?.blocked_by?.name || (userData as any)?.account?.blocked_by || (userData as any)?.blocked_by?.name || (userData as any)?.blocked_by || "";
    const blockedAtDate = (userData as any)?.account?.blocked_at || (userData as any)?.blocked_at || (userData as any)?.account?.deactivated_at;
    const blockedAtFormatted = blockedAtDate ? dayjs(blockedAtDate).format("DD.MM.YYYY HH:mm") : "";
    const blockedByAndDateDisplay = `${blockedByName} ${blockedAtFormatted}`;

    const defaultBio = "";
    const displayBio = bioText || defaultBio;

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
    const TOTAL_QUESTIONNAIRE_QUESTIONS = 30;
    const questionnaireProgressText = totalAnswered > 0
        ? `${totalAnswered}/${TOTAL_QUESTIONNAIRE_QUESTIONS} savol`
        : "To'ldirilmagan";

    // Guardian / Representative Details for Rozilik va sanalar Modal
    const guardianObj = Array.isArray(guardian) ? guardian[0] : guardian;
    const guardianFullName = guardianObj?.full_name || guardianObj?.name || userData?.representative_info?.full_name || "";
    const guardianAge = guardianObj?.age ?? (guardianObj?.birth_date ? dayjs().diff(dayjs(guardianObj.birth_date), 'year') : (userData?.representative_info?.age ?? 52));
    const guardianDisplayId = guardianObj?.display_id || userData?.representative_info?.display_id || (guardianObj?.id ? `USR-${guardianObj.id.slice(0, 5).toUpperCase()}` : "");
    const guardianRole = guardianObj?.candidate_role || "";
    const guardianKinship = typeof guardianObj?.kinship === 'object'
        ? guardianObj?.kinship?.name
        : (guardianObj?.kinship_name || guardianObj?.kinship || userData?.representative_info?.kinship || "");
    const guardianPhone = guardianObj?.phone_masked || guardianObj?.phone || guardianObj?.phone_number || userData?.representative_info?.phone || "";
    const guardianCandidatesCount = guardianObj?.candidates_count !== undefined && guardianObj?.candidates_count !== null
        ? `${guardianObj.candidates_count} ta`
        : (userData?.representative_info?.candidates_count ? `${userData.representative_info.candidates_count} ta` : "");

    const guardianInitials = guardianFullName
        ? guardianFullName.split(" ").filter(Boolean).map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "ZM"
        : "";

    const consentSteps = [
        {
            title: "Ariza to'ldirildi",
            date: (guardianObj?.dates?.application_date || guardianObj?.application_date || guardianObj?.created_at)
                ? dayjs(guardianObj?.dates?.application_date || guardianObj?.application_date || guardianObj?.created_at).format("DD.MM.YYYY HH:mm")
                : "",
        },
        {
            title: "Nomzodga SMS yuborildi",
            date: (guardianObj?.dates?.sms_sent_date || guardianObj?.sms_sent_date)
                ? dayjs(guardianObj?.dates?.sms_sent_date || guardianObj?.sms_sent_date).format("DD.MM.YYYY HH:mm")
                : "",
        },
        {
            title: "Nomzod rozilikni tasdiqladi",
            date: (guardianObj?.dates?.approved_date || guardianObj?.approved_date)
                ? dayjs(guardianObj?.dates?.approved_date || guardianObj?.approved_date).format("DD.MM.YYYY HH:mm")
                : "",
        },
        {
            title: "Anketa to'ldirildi",
            date: (guardianObj?.dates?.questionnaire_date || guardianObj?.questionnaire_date)
                ? dayjs(guardianObj?.dates?.questionnaire_date || guardianObj?.questionnaire_date).format("DD.MM.YYYY HH:mm")
                : "",
        },
    ];

    // Questionnaire Sections for Anketa Natijasi Modal
    const questionnaireSectionsData = (questionnaireSections && questionnaireSections.length > 0)
        ? questionnaireSections.map((s: any) => ({
            name: s.name,
            score: typeof s.score === 'number' ? s.score : 2.0,
            max_score: typeof s.max_score === 'number' ? s.max_score : 4.0,
        }))
        : [];

    // History Items for Tarix Modal
    const historyItemsData = (historyList && historyList.length > 0)
        ? historyList.map((item: any) => {
            const dateVal = item.date || item.created_at || item.timestamp;
            const dateFormatted = dateVal ? dayjs(dateVal).format("DD.MM.YYYY HH:mm") : "";
            const actor = item.actor || "Avtomatik";
            return {
                label: item.label || item.title || item.action || item.event_type || "Harakat",
                subtitle: dateFormatted ? `${actor}, ${dateFormatted}` : actor,
            };
        })
        : [];

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

            {/* Top summary stat bar matching Image 1 & 2 & 3 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* Card 1: Holati */}
                <div className="bg-[#E5FFF1] dark:bg-[#0c2a1a] rounded-lg py-3.5 px-4 flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[12px] font-medium text-[#475467] dark:text-[#a3a3a3]">Holati</span>
                            <HugeIcon icon={CheckmarkBadge01Icon} size={15} className="text-[#24BF6C] dark:text-[#2ee088]" />
                        </div>
                        <p className={`text-[17px] font-bold ${isBlocked ? 'text-[#7F1D1D] dark:text-[#ff6b6b]' : 'text-[#101828] dark:text-[#fafafa]'}`}>
                            {isBlocked ? "Bloklangan" : (userData?.status || (isVerified ? "Tasdiqlangan" : "Tekshiruvda"))}
                        </p>
                    </div>
                    <img src="/card_i_1.svg" alt="Holati" className="w-12 h-12 object-contain select-none" />
                </div>

                {/* Card 2: So'rovnoma */}
                <div
                    onClick={() => setShowQuestionnaireModal(true)}
                    className="bg-[#F9FFE5] dark:bg-[#2a270c] rounded-lg py-3.5 px-4 flex items-center justify-between cursor-pointer transition-all"
                >
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[12px] font-medium text-[#475467] dark:text-[#a3a3a3]">So'rovnoma</span>
                            <HugeIcon icon={DocumentValidationIcon} size={15} className="text-[#CA8A04] dark:text-yellow-400" />
                        </div>
                        <p className="text-[17px] font-bold text-[#101828] dark:text-[#fafafa]">
                            {totalAnswered > 0 ? `${totalAnswered}/${TOTAL_QUESTIONNAIRE_QUESTIONS} savol` : "30/30 savol"}
                        </p>
                    </div>
                    <img src="/card_i_2.svg" alt="So'rovnoma" className="w-12 h-12 object-contain select-none" />
                </div>

                {/* Card 3: Boshqaruv */}
                <div
                    onClick={hasGuardian ? () => setShowConsentModal(true) : undefined}
                    className={`bg-[#FBE5FF] dark:bg-[#251033] rounded-lg py-3.5 px-4 flex items-center justify-between ${
                        hasGuardian
                            ? "cursor-pointer transition-all"
                            : "cursor-default"
                    }`}
                >
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[12px] font-medium text-[#475467] dark:text-[#a3a3a3]">Boshqaruv</span>
                            <HugeIcon icon={UserCheck01Icon} size={15} strokeWidth={3} className="text-[#9333EA] dark:text-purple-400" />
                        </div>
                        <p className="text-[17px] font-bold text-[#101828] dark:text-[#fafafa]">
                            {managementType}
                        </p>
                    </div>
                    <img src="/card_i_3.svg" alt="Boshqaruv" className="w-12 h-12 object-contain select-none" />
                </div>

                {/* Card 4: Oxirgi faollik (unblocked) / Ro'yxatdan o'tgan sana (blocked) */}
                <div
                    onClick={() => setShowHistoryModal(true)}
                    className="bg-[#F5FDFF] dark:bg-[#0c2438] rounded-lg py-3.5 px-4 flex items-center justify-between cursor-pointer transition-all"
                >
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[12px] font-medium text-[#475467] dark:text-[#a3a3a3]">{card4Title}</span>
                            <HugeIcon icon={Globe02Icon} size={15} className="text-[#24A8BF] dark:text-sky-400" />
                        </div>
                        <p className="text-[17px] font-bold text-[#101828] dark:text-[#fafafa]">
                            {card4Value}
                        </p>
                    </div>
                    <img src="/card_i_4.svg" alt="Activity" className="w-12 h-12 object-contain select-none" />
                </div>
            </div>

            {/* Main Profile Card (Header, Shaxsiy ma'lumotlar, Manzil va aloqa, O'zi haqida) */}
            <div className="bg-white dark:bg-[#141414] p-5 space-y-">

                {/* Top Profile Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Avatar + Name + Badges */}
                    <div className="flex items-center gap-4">
                        {mainPhotoUrl ? (
                            <img
                                src={mainPhotoUrl}
                                alt={fullName}
                                onClick={() => setSelectedPhotoModal(mainPhotoUrl)}
                                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border border-[#e5e5e5] dark:border-[#262626] shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                            />
                        ) : (
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#E0F2FE] dark:bg-sky-950/50 text-[#0284C7] dark:text-sky-400 font-bold text-lg flex items-center justify-center shrink-0 border border-sky-100 dark:border-sky-900/40">
                                {initials}
                            </div>
                        )}

                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-[17px] sm:text-[18px] font-bold text-[#0A0A0A] dark:text-[#fafafa]">
                                    {fullName}
                                </h2>
                                <span className="bg-[#F5F5F5] dark:bg-zinc-800 text-[#737373] dark:text-zinc-400 text-[11px] font-medium px-2 py-0.5 rounded">
                                    {displayId}
                                </span>
                            </div>

                            {/* Badges */}
                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                <span className="bg-[#F5F5F5] dark:bg-zinc-800 text-[#404040] dark:text-zinc-300 text-[11px] font-medium px-2.5 py-0.5 rounded-full">
                                    {candidateType}
                                </span>

                                <span className="bg-[#F5F5F5] dark:bg-zinc-800 text-[#404040] dark:text-zinc-300 text-[11px] font-medium px-2.5 py-0.5 rounded-full">
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

                                {intentLabel && (
                                    <span className="bg-[#F5F5F5] dark:bg-zinc-800 text-[#404040] dark:text-zinc-300 text-[11px] font-medium px-2.5 py-0.5 rounded-full">
                                        {intentLabel}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Registration Date & Block action button (or Unblock button if blocked) */}
                    <div className="flex items-center gap-4 sm:gap-6 flex-wrap lg:flex-nowrap shrink-0">
                        {!isBlocked ? (
                            <>
                                {createdAtFormatted && (
                                    <span className="text-[12px] text-[#737373] dark:text-[#a3a3a3]">
                                        Ro'yxatdan o'tgan sana: {createdAtFormatted}
                                    </span>
                                )}
                                <button
                                    onClick={handleBlock}
                                    disabled={loadingAction}
                                    className="px-3.5 py-2 border border-[#E5E5E5] dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg text-[13px] font-medium text-[#DC2626] dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer shadow-xs flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {loadingAction ? (
                                        <div className="w-4 h-4 border-2 border-[#DC2626] border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <HugeIcon icon={UserBlock01Icon} size={16} strokeWidth={2} className="text-[#DC2626] dark:text-red-400" />
                                    )}
                                    <span>Profilni bloklash</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="text-[12px] space-y-0.5">
                                    <div className="flex items-center gap-4">
                                        <span className="text-[#737373] dark:text-[#a3a3a3] w-14">Sabab</span>
                                        <span className="font-semibold text-[#0A0A0A] dark:text-[#fafafa]">{blockedReasonDisplay}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-[#737373] dark:text-[#a3a3a3] w-14">Bloklandi</span>
                                        <span className="font-semibold text-[#0A0A0A] dark:text-[#fafafa]">{blockedByAndDateDisplay}</span>
                                    </div>
                                </div>
                            <button
                                onClick={handleBlock}
                                disabled={loadingAction}
                                className="px-4 py-2 border border-[#E5E5E5] dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg text-[13px] font-medium text-[#0474F3] hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all cursor-pointer shadow-xs flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {loadingAction ? (
                                    <div className="w-4 h-4 border-2 border-[#0474F3] border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <HugeIcon icon={InformationCircleIcon} size={17} strokeWidth={2} className="text-[#0474F3]" />
                                )}
                                <span>Blokdan chiqarish</span>
                            </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Middle Row: Shaxsiy ma'lumotlar (left) + Manzil va aloqa (right) */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 pt-1">
                    {/* Shaxsiy ma'lumotlar */}
                    <div className="xl:col-span-7 space-y-3.5">
                        <div className="flex items-center gap-2">
                            <HugeIcon icon={IdIcon} size={16} className="text-[#737373] dark:text-[#a3a3a3]" />
                            <h3 className="text-[13px] font-bold text-[#525252] dark:text-[#fafafa]">
                                Shaxsiy ma'lumotlar
                            </h3>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-y-4 gap-x-4">
                            <div>
                                <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3]">Yoshi</p>
                                <p className="text-[13px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-0.5">{ageText || "—"}</p>
                            </div>

                            <div>
                                <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3]">Tug'ilgan sanasi</p>
                                <p className="text-[13px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-0.5">{birthDate || "—"}</p>
                            </div>

                            <div>
                                <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3]">Bo'yi va vazni</p>
                                <p className="text-[13px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-0.5">{heightWeight || "—"}</p>
                            </div>

                            <div>
                                <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3]">Millati</p>
                                <p className="text-[13px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-0.5">{nationality || "—"}</p>
                            </div>

                            <div>
                                <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3]">Ta'lim darajasi</p>
                                <p className="text-[13px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-0.5">{education || "—"}</p>
                            </div>

                            <div>
                                <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3]">Kasbi</p>
                                <p className="text-[13px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-0.5">{profession || "—"}</p>
                            </div>

                            <div>
                                <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3]">Oilaviy holati</p>
                                <p className="text-[13px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-0.5">{maritalStatus || "—"}</p>
                            </div>

                            <div>
                                <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3]">Farzandlari</p>
                                <p className="text-[13px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-0.5">{children || "—"}</p>
                            </div>

                            <div>
                                <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3]">Sog'lig'i</p>
                                <p className="text-[13px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-0.5">{healthStatus || "—"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Manzil va aloqa */}
                    <div className="xl:col-span-5 space-y-3.5">
                        <div className="flex items-center gap-2">
                            <HugeIcon icon={Location01Icon} size={16} className="text-[#737373] dark:text-[#a3a3a3]" />
                            <h3 className="text-[13px] font-bold text-[#525252] dark:text-[#fafafa]">
                                Manzil va aloqa
                            </h3>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-4">
                            <div>
                                <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3]">Viloyat</p>
                                <p className="text-[13px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-0.5">{regionName || "—"}</p>
                            </div>

                            <div>
                                <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3]">Tuman</p>
                                <p className="text-[13px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-0.5">{districtName || "—"}</p>
                            </div>

                            <div>
                                <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3]">Joylashuv</p>
                                <p className="text-[13px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-0.5">{mahallaName || "—"}</p>
                            </div>

                            <div>
                                <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3]">Telefon</p>
                                <p className="text-[13px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-0.5">{phoneNumber || "—"}</p>
                            </div>

                            <div>
                                <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3]">Email</p>
                                <p className="text-[13px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-0.5 truncate">{email || "—"}</p>
                            </div>

                            <div>
                                <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3]">Ro'yxatdan o'tgan usuli</p>
                                <p className="text-[13px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-0.5">{regMethod || "—"}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Row: O'zi haqida (Bio + Audio player) */}
                <div className="space-y-3 pt-1">
                    <div className="flex items-center gap-2">
                        <HugeIcon icon={InformationCircleIcon} size={16} className="text-[#737373] dark:text-[#a3a3a3]" />
                        <h3 className="text-[13px] font-bold text-[#525252] dark:text-[#fafafa]">
                            O'zi haqida
                        </h3>
                    </div>

                    {displayBio ? (
                        /* Bio container */
                        <div className="border border-[#E5E5E5] dark:border-zinc-800 rounded-xl p-3.5 flex items-center gap-3.5 bg-white dark:bg-[#141414]">
                            <div className="w-9 h-9 rounded-full bg-[#0474F3] text-white flex items-center justify-center shrink-0 shadow-xs">
                                <HugeIcon icon={File01Icon} size={17} strokeWidth={2} className="text-white" />
                            </div>
                            <p className="text-[13px] text-[#404040] dark:text-[#d4d4d4] leading-relaxed">
                                {displayBio}
                            </p>
                        </div>
                    ) : null}

                    {voiceIntro ? (
                        /* Audio container */
                        <div className="border border-[#E5E5E5] dark:border-zinc-800 rounded-xl p-3 sm:p-3.5 flex items-center gap-3.5 bg-white dark:bg-[#141414]">
                            <button
                                onClick={togglePlayAudio}
                                className="w-9 h-9 rounded-full bg-[#0474F3] hover:bg-[#0360cb] text-white flex items-center justify-center shrink-0 transition-colors shadow-xs cursor-pointer"
                            >
                                {isPlaying ? (
                                    <HugeIcon icon={PauseIcon} size={16} strokeWidth={2.5} className="text-white fill-white" />
                                ) : (
                                    <HugeIcon icon={PlayIcon} size={16} strokeWidth={2.5} className="text-white fill-white ml-0.5" />
                                )}
                            </button>

                            <div className="min-w-0 shrink-0">
                                <p className="text-[13px] font-bold text-[#0A0A0A] dark:text-[#fafafa]">
                                    Ovozli tanishtiruv
                                </p>
                                <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">
                                    {createdAtFormatted ? `${createdAtFormatted.split(" ")[0]} kuni yuklangan` : ""}
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
                                className="flex-1 flex items-center justify-between h-7 px-3 overflow-hidden cursor-pointer select-none"
                                title="O'tkazish uchun bosing"
                            >
                                {WAVEFORM_BARS.map((height, i) => {
                                    const barProgress = (i / (WAVEFORM_BARS.length - 1)) * 100;
                                    const isBarActive = isPlaying || audioCurrentTime > 0
                                        ? (audioProgress >= barProgress)
                                        : true;
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

                            <span className="text-[12px] font-medium text-[#737373] dark:text-[#a3a3a3] shrink-0">
                                {isPlaying && audioDuration
                                    ? `${formatAudioTime(audioCurrentTime)} / ${formatAudioTime(audioDuration)}`
                                    : (voiceIntro && audioDuration ? voiceDurationDisplay : "0:00")}
                            </span>
                        </div>
                    ) : null}

                    {!displayBio && !voiceIntro && (
                        <p className="text-[12px] text-[#737373] dark:text-[#a3a3a3] italic">
                            Ma'lumot kiritilmagan
                        </p>
                    )}
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
                    <div className="w-full max-w-[480px] bg-white dark:bg-[#141414] rounded-2xl border border-[#e5e5e5] dark:border-[#262626] pt-6 pr-6 pb-[22px] pl-6 shadow-[0px_18px_44px_0px_#0000002E] animate-in fade-in zoom-in-95 duration-200">

                        <h3 className="text-[16px] font-bold text-[#0A0A0A] dark:text-[#fafafa]">
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
                                disabled={loadingAction}
                                className="px-5 py-2.5 bg-[#7F1D1D] hover:bg-[#b91c1c] text-white rounded-lg text-[13px] font-semibold transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {loadingAction && (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                )}
                                <span>Profilni bloklash</span>
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* Unblock Modal (matching Image 1) */}
            {showUnblockModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="w-full max-w-[480px] bg-white dark:bg-[#141414] rounded-2xl border border-[#e5e5e5] dark:border-[#262626] pt-6 pr-6 pb-[22px] pl-6 shadow-[0px_18px_44px_0px_#0000002E] animate-in fade-in zoom-in-95 duration-200">

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
                                className="px-5 py-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] font-semibold text-[#404040] dark:text-[#e5e5e5] hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                                Bekor qilish
                            </button>
                            <button
                                type="button"
                                onClick={handleUnblockSubmit}
                                disabled={loadingAction}
                                className="px-5 py-2.5 flex items-center justify-center gap-2 bg-[#0474F3] hover:bg-[#0362cf] text-white rounded-xl text-[13px] font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                            >
                                {loadingAction && (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                )}
                                Blokdan chiqarish
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* 1. Questionnaire Modal (Anketa natijasi - Image 1) */}
            {showQuestionnaireModal && (
                <div
                    onClick={() => setShowQuestionnaireModal(false)}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-[500px] bg-white dark:bg-[#141414] rounded-2xl border border-[#e5e5e5] dark:border-[#262626] p-6 shadow-[0px_18px_44px_0px_#0000002E] animate-in fade-in zoom-in-95 duration-200"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between pb-3">
                            <h3 className="text-[17px] font-bold text-[#0A0A0A] dark:text-[#fafafa]">
                                Anketa natijasi
                            </h3>
                            <button
                                onClick={() => setShowQuestionnaireModal(false)}
                                className="text-[#737373] hover:text-[#0A0A0A] dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Sub-header row */}
                        <div className="flex items-center justify-between py-2.5 mb-2 border-b border-[#F2F4F7] dark:border-zinc-800/80">
                            <div className="flex items-center gap-2">
                                <HugeIcon icon={Note01Icon} size={18} className="text-[#344054] dark:text-zinc-300" />
                                <span className="text-[13.5px] font-medium text-[#344054] dark:text-zinc-200">
                                    Anketa natijasi
                                </span>
                            </div>
                            <span className="text-[12.5px] text-[#737373] dark:text-zinc-400">
                                {totalAnswered > 0 ? `${totalAnswered}/${TOTAL_QUESTIONNAIRE_QUESTIONS} savol yakunlangan` : "30/30 savol yakunlangan"}
                            </span>
                        </div>

                        {/* Sections List */}
                        <div className="space-y-4 pt-2">
                            {questionnaireSectionsData.map((sec, idx) => {
                                const percentage = Math.min(100, Math.max(0, (sec.score / (sec.max_score || 4.0)) * 100));
                                return (
                                    <div key={idx} className="space-y-1.5">
                                        <div className="flex items-center justify-between text-[13px]">
                                            <span className="font-normal text-[#344054] dark:text-zinc-300">
                                                {sec.name}
                                            </span>
                                            <span className="font-bold text-[#101828] dark:text-[#fafafa]">
                                                {sec.score.toFixed(1)} / {(sec.max_score || 4.0).toFixed(1)}
                                            </span>
                                        </div>
                                        <div className="w-full bg-[#F2F4F7] dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                                            <div
                                                className="bg-[#0474F3] h-full rounded-full transition-all duration-300"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end mt-7 pt-2">
                            <button
                                onClick={() => setShowQuestionnaireModal(false)}
                                className="px-5 py-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] font-semibold text-[#404040] dark:text-[#e5e5e5] hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                            >
                                <X className="w-4 h-4" />
                                <span>Yopish</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Consent and Dates Modal (Rozilik va sanalar - Image 2) */}
            {showConsentModal && (
                <div
                    onClick={() => setShowConsentModal(false)}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-[560px] bg-white dark:bg-[#141414] rounded-2xl border border-[#e5e5e5] dark:border-[#262626] p-6 shadow-[0px_18px_44px_0px_#0000002E] animate-in fade-in zoom-in-95 duration-200"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between pb-3">
                            <h3 className="text-[17px] font-bold text-[#0A0A0A] dark:text-[#fafafa]">
                                Rozilik va sanalar
                            </h3>
                            <button
                                onClick={() => setShowConsentModal(false)}
                                className="text-[#737373] hover:text-[#0A0A0A] dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Representative Card */}
                        <div className="border border-[#E5E5E5] dark:border-zinc-800 rounded-xl p-4 bg-[#FCFCFD] dark:bg-zinc-900/40">
                            <div className="flex items-center gap-3.5">
                                {guardianObj?.photo || guardianObj?.main_photo ? (
                                    <img
                                        src={guardianObj.photo || guardianObj.main_photo}
                                        alt={guardianFullName}
                                        className="w-12 h-12 rounded-full object-cover shrink-0 border border-purple-200 dark:border-purple-900/40"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-[#F3E8FF] dark:bg-purple-950/60 text-[#7E22CE] dark:text-purple-300 font-bold text-sm flex items-center justify-center shrink-0">
                                        {guardianInitials}
                                    </div>
                                )}
                                <div>
                                    <p className="text-[15px] font-bold text-[#101828] dark:text-[#fafafa]">
                                        {guardianFullName}{guardianAge ? `, ${guardianAge}` : ""}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[11px] font-medium text-[#737373] dark:text-zinc-400 bg-[#F2F4F7] dark:bg-zinc-800 px-2 py-0.5 rounded">
                                            {guardianDisplayId}
                                        </span>
                                        <span className="text-[11px] font-medium text-[#404040] dark:text-zinc-300 bg-[#F2F4F7] dark:bg-zinc-800 px-2.5 py-0.5 rounded-full">
                                            {guardianRole}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[#F2F4F7] dark:border-zinc-800">
                                <div>
                                    <p className="text-[11px] text-[#737373] dark:text-zinc-400">Qarindoshligi</p>
                                    <p className="text-[13.5px] font-bold text-[#101828] dark:text-[#fafafa] mt-0.5">
                                        {guardianKinship || "—"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-[#737373] dark:text-zinc-400">Telefon</p>
                                    <p className="text-[13.5px] font-bold text-[#101828] dark:text-[#fafafa] mt-0.5">
                                        {guardianPhone || "—"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-[#737373] dark:text-zinc-400">Nomzodlari</p>
                                    <p className="text-[13.5px] font-bold text-[#101828] dark:text-[#fafafa] mt-0.5">
                                        {guardianCandidatesCount}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Timeline Header */}
                        <div className="flex items-center gap-2 mt-5 mb-3">
                            <Clock className="w-4 h-4 text-[#737373] dark:text-zinc-400" />
                            <span className="text-[13.5px] font-bold text-[#344054] dark:text-zinc-200">
                                Rozilik va sanalar
                            </span>
                        </div>

                        {/* Timeline Steps (Horizontal stepper matching Image 2) */}
                        <div className="grid grid-cols-4 gap-2 pt-1">
                            {consentSteps.map((step, idx) => (
                                <div key={idx} className="flex flex-col">
                                    <div className="flex items-center w-full">
                                        <div className="w-5 h-5 rounded-full bg-[#E8FAF0] dark:bg-emerald-950/60 text-[#08834C] dark:text-emerald-400 flex items-center justify-center shrink-0">
                                            <Check className="w-3 h-3 stroke-[3]" />
                                        </div>
                                        {idx < consentSteps.length - 1 && (
                                            <div className="h-[1.5px] bg-[#E4E7EC] dark:bg-zinc-800 flex-1 ml-1.5" />
                                        )}
                                    </div>
                                    <p className="text-[12px] font-bold text-[#101828] dark:text-[#fafafa] mt-2 leading-snug">
                                        {step.title}
                                    </p>
                                    <p className="text-[11px] text-[#737373] dark:text-zinc-400 mt-1">
                                        {step.date}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end mt-7 pt-2">
                            <button
                                onClick={() => setShowConsentModal(false)}
                                className="px-5 py-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] font-semibold text-[#404040] dark:text-[#e5e5e5] hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                            >
                                <X className="w-4 h-4" />
                                <span>Yopish</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. History Modal (Tarix - Image 3) */}
            {showHistoryModal && (
                <div
                    onClick={() => setShowHistoryModal(false)}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-[480px] bg-white dark:bg-[#141414] rounded-2xl border border-[#e5e5e5] dark:border-[#262626] p-6 shadow-[0px_18px_44px_0px_#0000002E] animate-in fade-in zoom-in-95 duration-200"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between pb-3">
                            <h3 className="text-[17px] font-bold text-[#0A0A0A] dark:text-[#fafafa]">
                                Tarix
                            </h3>
                            <button
                                onClick={() => setShowHistoryModal(false)}
                                className="text-[#737373] hover:text-[#0A0A0A] dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Sub-header row */}
                        <div className="flex items-center gap-2 mb-4">
                            <Clock className="w-4 h-4 text-[#737373] dark:text-zinc-400" />
                            <span className="text-[13.5px] font-bold text-[#344054] dark:text-zinc-200">
                                Tarix
                            </span>
                        </div>

                        {/* History List */}
                        <div className="space-y-3.5">
                            {historyItemsData.map((item, idx) => (
                                <div key={idx} className="flex items-start gap-3">
                                    <Check className="w-4 h-4 text-[#00A854] dark:text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]" />
                                    <div className="space-y-0.5">
                                        <p className="text-[13.5px] font-bold text-[#101828] dark:text-[#fafafa]">
                                            {item.label}
                                        </p>
                                        <p className="text-[12px] text-[#737373] dark:text-zinc-400">
                                            {item.subtitle}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end mt-7 pt-2">
                            <button
                                onClick={() => setShowHistoryModal(false)}
                                className="px-5 py-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] font-semibold text-[#404040] dark:text-[#e5e5e5] hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                            >
                                <X className="w-4 h-4" />
                                <span>Yopish</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default UsersDetail;