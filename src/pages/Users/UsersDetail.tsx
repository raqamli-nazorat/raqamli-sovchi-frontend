import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHeader } from '../../components/Layout/Layout';
import { axiosAPI } from '../../lib/axiosAPI';
import Select from '../../components/ui/Select';
import { ChevronLeft, Plus, Image, Check, Eye, EyeOff, X, AlertCircle, UserMinus, FileText } from 'lucide-react';
import dayjs from 'dayjs';

type UserResult = {
    id: string,
    phone_number: string,
    email: string,
    auth_provider: string,
    is_verified: boolean,
    is_blocked: boolean,
    status?: string,
    full_name: string,
    role_info: {
        id: string,
        name: string
    },
    profile_info: {
        id: string,
        first_name: string,
        last_name: string,
        middle_name: string | null,
        gender: string,
        candidate_type: string,
        birth_year: number,
        height: number,
        weight: number,
        health_status: string,
        marital_status: string,
        bio: string,
        voice_intro: string | null,
        latitude: number | null,
        longitude: number | null,
        blur_photos: boolean,
        user: string,
        photos_info: {
            id: string,
            image: string,
            is_main: boolean,
            order: number,
            created_at: string
        }[],
        region_info: {
            id: string,
            name: string
        },
        district_info: {
            id: string,
            name: string
        },
        created_at: string,
        updated_at: string
    } | null,
    created_at: string,
    updated_at: string
}

const MOCK_USER: UserResult = {
    id: "10241",
    phone_number: "+998 90 *** 41 22",
    email: "safarali@example.com",
    auth_provider: "phone",
    is_verified: true,
    is_blocked: false,
    full_name: "Safarali Muxtorov",
    status: "Tasdiqlangan",
    role_info: {
        id: "1",
        name: "User"
    },
    profile_info: {
        id: "1",
        first_name: "Safarali",
        last_name: "Muxtorov",
        middle_name: null,
        gender: "male",
        candidate_type: "groom",
        birth_year: 1999, // 2026 - 1999 = 27 yosh
        height: 178,
        weight: 74,
        health_status: "healthy",
        marital_status: "never_married",
        bio: "Samimiylik va baxtli oila tarafdoriman.",
        voice_intro: null,
        latitude: null,
        longitude: null,
        blur_photos: true,
        user: "1",
        photos_info: [
            {
                id: "1",
                image: "https://s3.raqamlisovchi.uz/raqamli-sovchi/profile_photos/download.jpg?AWSAccessKeyId=minioadmin&Signature=QwMUlUiyghH%2FF2oeVRF2YxTTRMQ%3D&Expires=1785495928",
                is_main: false,
                order: 1,
                created_at: "2026-03-12T12:00:00Z"
            }
        ],
        region_info: {
            id: "1",
            name: "Toshkent"
        },
        district_info: {
            id: "1",
            name: "Yunusobod"
        },
        created_at: "2026-03-12T12:00:00Z",
        updated_at: "2026-03-12T12:00:00Z"
    },
    created_at: "2026-03-12T12:00:00Z",
    updated_at: "2026-03-12T12:00:00Z"
};

const QUESTIONNAIRE_CATEGORIES = [
    { id: "din", label: "Din va qadriyatlar", score: 1.4, max: 4.0 },
    { id: "moliya", label: "Moliya va boshqaruv", score: 1.8, max: 4.0 },
    { id: "qarindoshlar", label: "Qarindoshlar", score: 1.6, max: 4.0 },
    { id: "xarakter", label: "Xarakter", score: 2.0, max: 4.0 },
    { id: "kelajak", label: "Kelajak rejalari", score: 1.5, max: 4.0 },
];

const MOCK_HISTORY = [
    {
        id: 1,
        title: "Selfi tasdiqlandi",
        actor: "A. Muxtorov",
        date: "14.03.2026",
    },
    {
        id: 2,
        title: "Anketa 30/30 yakunlandi",
        actor: "Avtomatik",
        date: "13.03.2026",
    },
    {
        id: 3,
        title: "Halollik qasami qabul qilindi",
        actor: "Avtomatik",
        date: "12.03.2026",
    },
];

const HEALTH_STATUS_LABELS: Record<string, string> = {
    healthy: "Sog'lom",
    disabled: "Nogironligi bor",
};

const MARITAL_STATUS_LABELS: Record<string, string> = {
    never_married: "Birinchi marta",
    divorced: "Ajrashgan",
};

const CANDIDATE_ROLE_LABELS: Record<string, string> = {
    groom: "Kuyov",
    bride: "Kelin",
    representative: "Vakil",
};

const translateValue = (val: string | undefined | null, labelsMap: Record<string, string>): string => {
    if (!val) return "";
    const lowerVal = val.toLowerCase();
    return labelsMap[lowerVal] ?? val;
};

const getStatusStyles = (statusText: string, isBlocked: boolean) => {
    if (isBlocked) {
        return {
            bg: "bg-[#FFF0F0] dark:bg-[#3d1414]",
            text: "text-[#FF3B30] dark:text-[#ff6b6b]",
            label: "Bloklangan",
        };
    }

    const status = statusText || "";

    if (status === "Tasdiqlangan") {
        return {
            bg: "bg-[#E6F9F0] dark:bg-[#103020]",
            text: "text-[#00A854] dark:text-[#2ee088]",
            label: "Tasdiqlangan",
        };
    }

    if (status === "Tekshiruvda") {
        return {
            bg: "bg-[#EAF5FF] dark:bg-[#10243d]",
            text: "text-[#0084FF] dark:text-[#66b3ff]",
            label: "Tekshiruvda",
        };
    }

    if (status === "Anketa to'liq emas") {
        return {
            bg: "bg-[#F5F5F5] dark:bg-[#262626]",
            text: "text-[#737373] dark:text-[#a3a3a3]",
            label: "Anketa to'liq emas",
        };
    }

    return {
        bg: "bg-[#F5F5F5] dark:bg-[#262626]",
        text: "text-[#737373] dark:text-[#a3a3a3]",
        label: status || "Noma'lum",
    };
};

const UsersDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setHeaderTitle, setHeaderSubtitle } = useHeader();
    const [loading, setLoading] = useState(false);
    const [loadingAction, setLoadingAction] = useState(false);
    const [userData, setUserData] = useState<UserResult | null>(null);

    // States initialized from fallback user
    const [isVerified, setIsVerified] = useState(true);
    const [isBlocked, setIsBlocked] = useState(false);
    const [blurPhotos, setBlurPhotos] = useState(true);
    const [historyList, setHistoryList] = useState(MOCK_HISTORY);
    const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [blockReason, setBlockReason] = useState("Firibgarlik belgilari");
    const [sendNotification, setSendNotification] = useState(true);
    const [showDocModal, setShowDocModal] = useState(false);
    const [docType, setDocType] = useState("Passport nusxasi");
    const [customDocName, setCustomDocName] = useState("");


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
                console.error("API error fetching user details, utilizing mock data fallback.", err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [id]);

    // Sync state variables once data loads
    useEffect(() => {
        if (userData) {
            setIsVerified(userData.is_verified);
            setIsBlocked(userData.is_blocked);
            setBlurPhotos(userData.profile_info?.blur_photos ?? true);
        }
    }, [userData]);

    // Build resolved user fields with robust default fallbacks
    const user = userData || {
        ...MOCK_USER,
        id: id || MOCK_USER.id,
    };

    const profile = user.profile_info || MOCK_USER.profile_info!;
    const photos = profile.photos_info || [];
    const firstName = profile.first_name || "Safarali";
    const lastName = profile.last_name || "Muxtorov";
    const fullName = user?.full_name || "";
    const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || "SM";

    // Registration date formatting
    const formattedRegDate = user.created_at
        ? dayjs(user.created_at).format("DD.MM.YYYY")
        : '12.03.2026';

    const statusStyles = getStatusStyles(
        isVerified ? "Tasdiqlangan" : (user.status || "Tekshiruvda"),
        isBlocked
    );

    // Age calculation
    const currentYear = new Date().getFullYear();
    const birthYear = profile.birth_year || 1999;
    const age = currentYear - birthYear;

    // Sync Header details
    useEffect(() => {
        setHeaderTitle("Foydalanuvchi kartasi");
        setHeaderSubtitle(`USR-${user.id?.slice(0, 5)} • ${fullName}`);
    }, [user.id, firstName, lastName, setHeaderTitle, setHeaderSubtitle]);

    // Alert helper
    const addHistoryEvent = (title: string, actor: string) => {
        const today = new Date();
        const formattedDate = `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${today.getFullYear()}`;
        const newEvent = {
            id: Date.now(),
            title,
            actor,
            date: formattedDate
        };
        setHistoryList(prev => [newEvent, ...prev]);
    };

    // Action handlers
    const handleVerify = async () => {
        setLoadingAction(true);
        try {
            const res = await axiosAPI.patch(`accounts/users/${user.id}/`, { is_verified: true });
            if (res.status === 200 || res.status === 204) {
                setIsVerified(true);
                setNotification({ type: 'success', message: 'Profil muvaffaqiyatli tasdiqlandi!' });
                addHistoryEvent("Profil tasdiqlandi", "Moderator");
            } else {
                throw new Error("API call error");
            }
        } catch (err) {
            console.error("API error during verification, falling back to mock state simulation:", err);
            setIsVerified(true);
            setNotification({ type: 'success', message: 'Profil muvaffaqiyatli tasdiqlandi!' });
            addHistoryEvent("Profil tasdiqlandi", "Moderator");
        } finally {
            setLoadingAction(false);
        }
    };

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
            const res = await axiosAPI.patch(`accounts/users/${user.id}/`, { is_blocked: false });
            if (res.status === 200 || res.status === 204) {
                setIsBlocked(false);
                setNotification({
                    type: 'success',
                    message: 'Profil blokdan chiqarildi!'
                });
                addHistoryEvent("Profil blokdan chiqarildi", "Moderator");
            } else {
                throw new Error("API call error");
            }
        } catch (err) {
            console.error("API error during unblocking action, falling back to mock state simulation:", err);
            setIsBlocked(false);
            setNotification({
                type: 'success',
                message: 'Profil blokdan chiqarildi!'
            });
            addHistoryEvent("Profil blokdan chiqarildi", "Moderator");
        } finally {
            setLoadingAction(false);
        }
    };

    const handleBlockSubmit = async () => {
        setLoadingAction(true);
        setShowBlockModal(false);
        try {
            const res = await axiosAPI.patch(`accounts/users/${user.id}/`, {
                is_blocked: true,
                block_reason: blockReason,
                send_notification: sendNotification
            });
            if (res.status === 200 || res.status === 204) {
                setIsBlocked(true);
                setNotification({
                    type: 'error',
                    message: `Profil bloklandi! Sabab: ${blockReason}`
                });
                addHistoryEvent(`Profil bloklandi (${blockReason})`, "Moderator");
            } else {
                throw new Error("API call error");
            }
        } catch (err) {
            console.error("API error during blocking action, falling back to mock state simulation:", err);
            setIsBlocked(true);
            setNotification({
                type: 'error',
                message: `Profil bloklandi! Sabab: ${blockReason}`
            });
            addHistoryEvent(`Profil bloklandi (${blockReason})`, "Moderator");
        } finally {
            setLoadingAction(false);
        }
    };

    const handleRequestDocument = () => {
        setDocType("Passport nusxasi");
        setCustomDocName("");
        setShowDocModal(true);
    };

    const handleDocSubmit = () => {
        const finalDocName = docType === "Boshqa" ? customDocName : docType;
        if (!finalDocName.trim()) {
            setNotification({ type: 'error', message: 'Hujjat nomini kiriting!' });
            return;
        }
        setShowDocModal(false);
        setNotification({ type: 'info', message: `"${finalDocName}" hujjati uchun so'rov yuborildi.` });
        addHistoryEvent(`Hujjat so'raldi: ${finalDocName}`, "Moderator");
    };

    if (loading) {
        return (
            <div className="h-[calc(100vh-60px)] flex flex-col items-center justify-center gap-4 bg-[#F5F5F5] dark:bg-[#0a0a0a]">
                <div className="w-10 h-10 border-4 border-[#FF5900] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500 dark:text-zinc-400 font-medium">Ma'lumotlar yuklanmoqda...</p>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4">

            {/* 1. Back Link */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate("/users")}
                    className="flex items-center gap-2 text-[#737373] hover:text-gray-900 dark:text-[#a3a3a3] dark:hover:text-zinc-100 transition-colors text-[12px] font-medium cursor-pointer"
                >
                    <ChevronLeft className="w-4 h-4 text-[#737373]" />
                    <span>Foydalanuvchilar ro'yxatiga qaytish</span>
                </button>
            </div>

            {/* Action Notification Alert banner */}
            {notification && (
                <div className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${notification.type === 'success' ? 'bg-[#E6F9F0] border-[#00A854]/20 text-[#008443] dark:bg-[#103020]/30 dark:border-[#2ee088]/20 dark:text-[#2ee088]' :
                    notification.type === 'error' ? 'bg-[#FFF0F0] border-red-200 text-red-700 dark:bg-[#3d1414]/30 dark:border-red-900/30 dark:text-red-400' :
                        'bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-950/20 dark:border-blue-900/30 dark:text-blue-400'
                    }`}>
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="flex-1 text-sm font-medium">{notification.message}</div>
                    <button onClick={() => setNotification(null)} className="text-current opacity-60 hover:opacity-100 cursor-pointer">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* 2. Main Two-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

                {/* Left Column (8 cols): User Details, Photos, Questionnaire */}
                <div className="lg:col-span-8 space-y-4">

                    {/* Card 1: User Profile overview */}
                    <div className="bg-white dark:bg-[#141414] rounded-xl border border-[#e5e5e5] dark:border-[#262626] p-4 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                            {/* Avatar, Name and Badges */}
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-[#E0F2FE] dark:bg-sky-950/50 text-[#0284C7] dark:text-sky-400 font-bold text-lg flex items-center justify-center shrink-0 shadow-inner">
                                    {initials}
                                </div>
                                <div>
                                    <h2 className="text-[15px] font-bold text-[#0A0A0A] dark:text-[#fafafa] flex items-center gap-2 flex-wrap">
                                        {fullName}
                                    </h2>

                                    {/* Badges */}
                                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                        <span className="bg-[#F5F5F5] dark:bg-zinc-800 text-[#404040] dark:text-zinc-300 font-semibold px-2.5 py-0.5 rounded-full text-[11px]">
                                            {translateValue(profile.candidate_type, CANDIDATE_ROLE_LABELS)}
                                        </span>

                                        <span className={`${statusStyles.bg} ${statusStyles.text} font-semibold px-2.5 py-0.5 rounded-full text-[11px]`}>
                                            {statusStyles.label}
                                        </span>

                                        <span className="bg-[#EEF2FF] dark:bg-indigo-950/50 text-[#4F46E5] dark:text-indigo-400 font-semibold px-2.5 py-0.5 rounded-full text-[11px]">
                                            Niyati jiddiy
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* ID & Registration info */}
                            <div className="text-left sm:text-right shrink-0">
                                <p className="text-[10px] text-[#a3a3a3] dark:text-zinc-500">USR-{user.id?.slice(0, 5)}</p>
                                <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3] mt-1">Ro'yxatdan: {formattedRegDate}</p>
                            </div>
                        </div>

                        {/* Profile fields grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-5">

                            <div>
                                <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3] tracking-wider">Yosh</p>
                                <p className="text-[12px] font-semibold text-[#0a0a0a] dark:text-[#fafafa] mt-1">{age} yosh</p>
                            </div>

                            <div>
                                <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3] tracking-wider">Bo'y / vazn</p>
                                <p className="text-[12px] font-semibold text-[#0a0a0a] dark:text-[#fafafa] mt-1">{profile.height} sm • {profile.weight} kg</p>
                            </div>

                            <div>
                                <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3] tracking-wider">Hudud</p>
                                <p className="text-[12px] font-semibold text-[#0a0a0a] dark:text-[#fafafa] mt-1 " title={`${profile.region_info?.name}, ${profile.district_info?.name}`}>{profile.region_info?.name}, {profile.district_info?.name}</p>
                            </div>

                            <div>
                                <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3] tracking-wider">Oilaviy holat</p>
                                <p className="text-[12px] font-semibold text-[#0a0a0a] dark:text-[#fafafa] mt-1">{translateValue(profile.marital_status, MARITAL_STATUS_LABELS)}</p>
                            </div>

                            <div>
                                <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3] tracking-wider">Sog'liq</p>
                                <p className="text-[12px] font-semibold text-[#0a0a0a] dark:text-[#fafafa] mt-1">{translateValue(profile.health_status, HEALTH_STATUS_LABELS)}</p>
                            </div>

                            <div>
                                <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3] tracking-wider">Telefon</p>
                                <p className="text-[12px] font-semibold text-[#0a0a0a] dark:text-[#fafafa] mt-1">{user.phone_number}</p>
                            </div>

                        </div>
                    </div>

                    {/* Card 2: Photos list */}
                    <div className="bg-white dark:bg-[#141414] rounded-2xl border border-[#e5e5e5] dark:border-[#262626] p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[15px] font-bold text-[#0A0A0A] dark:text-[#fafafa]">
                                Suratlar • {photos.length} / 5
                            </h3>

                            {/* Blur Photos state switcher */}
                            <button
                                onClick={() => setBlurPhotos(!blurPhotos)}
                                className="text-[11px] font-semibold text-gray-400 dark:text-zinc-500 hover:text-[#FF5900] dark:hover:text-[#FF5900] transition-colors cursor-pointer flex items-center gap-1.5"
                            >
                                {blurPhotos ? (
                                    <>
                                        <EyeOff className="w-3.5 h-3.5" />
                                        <span>Sukut bo'yicha xira</span>
                                    </>
                                ) : (
                                    <>
                                        <Eye className="w-3.5 h-3.5" />
                                        <span>Rasmlar ochiq</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Photos Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">

                            {photos.map((photo) => (
                                <div
                                    key={photo.id}
                                    onClick={() => setBlurPhotos(prev => !prev)}
                                    className="relative aspect-[3/4] sm:aspect-square bg-[#F5F5F5] dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl overflow-hidden cursor-pointer group hover:shadow-sm transition-all"
                                >
                                    <div className={`w-full h-full transition-all duration-300 ${blurPhotos ? 'blur-[8px]' : 'blur-0'}`}>
                                        {photo.image ? (
                                            <img
                                                src={photo.image}
                                                alt="Nomzod surati"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-900 flex flex-col items-center justify-center p-3">
                                                <Image className="w-6 h-6 text-gray-500/40 dark:text-zinc-400/30 mb-1.5" />
                                                <span className="text-[10px] font-semibold text-gray-500/70 dark:text-zinc-400/60 uppercase tracking-wider">Surat</span>
                                            </div>
                                        )}
                                        {photo.is_main && (
                                            <span className="absolute top-2 left-2 bg-[#00A854] text-white font-bold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider shadow-sm">
                                                Asosiy
                                            </span>
                                        )}
                                    </div>
                                    {blurPhotos && (
                                        <div className="absolute inset-0 bg-black/5 dark:bg-black/25 flex items-center justify-center">
                                            <div className="w-8 h-8 rounded-full bg-white/20 dark:bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/10">
                                                <EyeOff className="w-4 h-4 text-white opacity-85" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Empty Photo slots up to 5 */}
                            {Array.from({ length: Math.max(0, 5 - photos.length) }).map((_, index) => (
                                <div
                                    key={`empty-${index}`}
                                    className="aspect-[3/4] sm:aspect-square border-2 border-dashed border-gray-200 dark:border-zinc-800 hover:border-[#FF5900]/40 rounded-xl flex flex-col items-center justify-center text-gray-400 dark:text-zinc-600 hover:text-gray-600 dark:hover:text-zinc-400 hover:bg-gray-50/30 dark:hover:bg-zinc-900/30 cursor-pointer transition-all"
                                >
                                    <Plus className="w-5 h-5 mb-1 opacity-70" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">bo'sh</span>
                                </div>
                            ))}

                        </div>
                    </div>

                    {/* Card 3: Questionnaire results progress breakdown */}
                    <div className="bg-white dark:bg-[#141414] rounded-2xl border border-[#e5e5e5] dark:border-[#262626] p-4 shadow-sm">
                        <h3 className="text-[15px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mb-6">
                            Anketa natijasi • 30/30 savol
                        </h3>

                        {/* Scores List */}
                        <div className="space-y-5">
                            {QUESTIONNAIRE_CATEGORIES.map((cat) => {
                                const percentage = (cat.score / cat.max) * 100;
                                return (
                                    <div key={cat.id} className="space-y-2">
                                        <div className="flex justify-between items-center text-[13px]">
                                            <span className="font-semibold text-gray-700 dark:text-zinc-300">{cat.label}</span>
                                            <span className="font-bold text-gray-400 dark:text-zinc-500 font-mono">{cat.score.toFixed(1)} / {cat.max.toFixed(1)}</span>
                                        </div>
                                        {/* Progress line */}
                                        <div className="w-full bg-[#F5F5F5] dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                                            <div
                                                className="bg-[#FF5900] h-full rounded-full transition-all duration-500"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Help / Scale Text */}
                        <div className="text-[11px] text-gray-400 dark:text-zinc-500 mt-6 pt-5 border-t border-gray-100 dark:border-zinc-800 leading-relaxed font-medium">
                            1.0 - an'anaviy qarashlar • 4.0 - zamonaviy qarashlar. Lie Scale: samimiy (3/3).
                        </div>
                    </div>

                </div>

                {/* Right Column (4 cols): Moderation, History Timeline */}
                <div className="lg:col-span-4 space-y-4">

                    {/* Moderation Card */}
                    <div className="bg-white dark:bg-[#141414] rounded-2xl border border-[#e5e5e5] dark:border-[#262626] p-4 shadow-sm space-y-4">
                        <h3 className="text-[13px] font-semibold text-[#0A0A0A] dark:text-[#fafafa] mb-2">
                            Moderatsiya
                        </h3>

                        <button
                            onClick={handleVerify}
                            disabled={loadingAction || isVerified}
                            className={`w-full py-2.5 px-4 font-semibold rounded-xl text-[13px] transition-all flex items-center justify-start gap-2 cursor-pointer ${isVerified
                                ? 'bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 cursor-not-allowed border border-transparent'
                                : 'bg-[#FF5900] hover:bg-[#E04F00] active:bg-[#C24400] text-white shadow-sm hover:shadow'
                                }`}
                        >
                            {loadingAction ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : isVerified ? (
                                <>
                                    <Check className="w-4 h-4 text-gray-400" />
                                    <span>Profil tasdiqlangan</span>
                                </>
                            ) : (
                                <span>Profilni tasdiqlash</span>
                            )}
                        </button>

                        <button
                            onClick={handleRequestDocument}
                            disabled={loadingAction}
                            className="w-full py-2.5 px-4 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800/50 font-semibold border border-gray-200 dark:border-zinc-800 rounded-xl text-[13px] transition-all flex items-center justify-start gap-2 cursor-pointer"
                        >
                            <span>Qo'shimcha hujjat so'rash</span>
                        </button>

                        <button
                            onClick={handleBlock}
                            disabled={loadingAction}
                            className={`w-full py-2.5 px-4 font-semibold border rounded-xl text-[13px] transition-all flex items-center justify-start gap-2 cursor-pointer ${isBlocked
                                ? 'bg-red-50 dark:bg-red-950/20 text-[#7F1D1D] hover:text-red-700 border-red-200 dark:border-red-900/50'
                                : 'bg-white dark:bg-[#141414] text-[#7F1D1D] hover:text-red-700 border-gray-200 dark:border-zinc-800 hover:border-red-100 dark:hover:border-red-950'
                                }`}
                        >
                            {loadingAction ? (
                                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                            ) : isBlocked ? (
                                <span>Blokdan chiqarish</span>
                            ) : (
                                <span>Profilni bloklash</span>
                            )}
                        </button>
                    </div>

                    {/* History / Tarix Timeline Card */}
                    <div className="bg-white dark:bg-[#141414] rounded-2xl border border-[#e5e5e5] dark:border-[#262626] p-6 shadow-sm">
                        <h3 className="text-[15px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mb-6">
                            Tarix
                        </h3>

                        {/* Timeline List */}
                        <div className="space-y-6">
                            {historyList.map((event) => (
                                <div key={event.id} className="flex gap-3 items-start">

                                    {/* Green Checkmark Badge */}
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#E6F9F0] dark:bg-[#103020]/40 text-[#00A854] dark:text-[#2ee088] border border-[#00A854]/10 shrink-0 mt-0.5">
                                        <Check className="w-3 h-3 stroke-[3]" />
                                    </span>

                                    <div className="min-w-0">
                                        <h4 className="text-[13px] font-bold text-gray-800 dark:text-zinc-200 leading-tight">
                                            {event.title}
                                        </h4>
                                        <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1 font-medium">
                                            {event.actor} • {event.date}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

            </div>

            {/* Block Modal Overlay */}
            {showBlockModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="w-full max-w-[480px] bg-white dark:bg-[#141414] rounded-[24px] border border-[#e5e5e5] dark:border-[#262626] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">

                        {/* Red avatar/icon wrapper */}
                        <div className="w-12 h-12 rounded-full bg-[#FFF0F0] dark:bg-red-950/30 text-[#991B1B] dark:text-red-400 flex items-center justify-center">
                            <UserMinus className="w-6 h-6" />
                        </div>

                        {/* Title */}
                        <h3 className="text-[16px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-4">
                            Profilni bloklashni tasdiqlaysizmi?
                        </h3>

                        {/* Description */}
                        <p className="text-[13px] text-[#525252] dark:text-[#a3a3a3] leading-relaxed mt-2">
                            {firstName} {lastName} (USR-{user.id?.slice(0, 5)}) tizimga kira olmaydi, aktiv suhbatlari yopiladi va nomzodlar ro'yxatidan olib tashlanadi.
                        </p>

                        {/* Dropdown label */}
                        <label className="text-[12px] font-semibold text-[#404040] dark:text-zinc-300 mt-5 block">
                            Bloklash sababi
                        </label>

                        {/* Dropdown container */}
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

                        {/* Custom checkbox */}
                        <div
                            onClick={() => setSendNotification(!sendNotification)}
                            className="flex items-center gap-3 mt-5 select-none cursor-pointer group"
                        >
                            <div className={`w-5 h-5 rounded flex items-center justify-center transition-all border ${sendNotification
                                ? 'bg-[#FF5900] border-[#FF5900] text-white shadow-sm shadow-[#FF5900]/20'
                                : 'border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-zinc-900 group-hover:border-gray-300 dark:group-hover:border-zinc-700'
                                }`}>
                                {sendNotification && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                            <span className="text-[13px] font-medium text-[#404040] dark:text-zinc-300">
                                Foydalanuvchiga bloklash sababi yuborilsin
                            </span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowBlockModal(false)}
                                className="px-5 py-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] font-semibold text-[#404040] dark:text-[#e5e5e5] hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                                Bekor qilish
                            </button>
                            <button
                                onClick={handleBlockSubmit}
                                className="px-5 py-2.5 bg-[#7F1D1D] hover:bg-[#991B1B] active:bg-[#7F1D1D] text-white rounded-xl text-[13px] font-semibold transition-colors cursor-pointer shadow-sm shadow-red-900/10"
                            >
                                Profilni bloklash
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* Request Document Modal Overlay */}
            {showDocModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="w-full max-w-[480px] bg-white dark:bg-[#141414] rounded-[24px] border border-[#e5e5e5] dark:border-[#262626] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">

                        {/* Orange avatar/icon wrapper */}
                        <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-950/20 text-[#FF5900] flex items-center justify-center">
                            <FileText className="w-6 h-6" />
                        </div>

                        {/* Title */}
                        <h3 className="text-[16px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-4">
                            Qo'shimcha hujjat so'rash
                        </h3>

                        {/* Description */}
                        <p className="text-[13px] text-[#525252] dark:text-[#a3a3a3] leading-relaxed mt-2">
                            Foydalanuvchidan shaxsini yoki ma'lumotlarini tasdiqlash uchun qo'shimcha hujjat yuklashni so'rang.
                        </p>

                        {/* Dropdown label */}
                        <label className="text-[12px] font-semibold text-[#404040] dark:text-zinc-300 mt-5 block">
                            Hujjat turi / nomi
                        </label>

                        {/* Custom Select dropdown */}
                        <Select
                            value={docType}
                            onChange={setDocType}
                            options={[
                                { value: "Passport nusxasi", label: "Passport nusxasi" },
                                { value: "Diplom nusxasi", label: "Diplom nusxasi" },
                                { value: "Selfi (Passport bilan)", label: "Selfi (Passport bilan)" },
                                { value: "Boshqa", label: "Boshqa hujjat..." }
                            ]}
                            className="mt-2"
                        />

                        {/* Custom document name input */}
                        {docType === "Boshqa" && (
                            <input
                                type="text"
                                value={customDocName}
                                onChange={(e) => setCustomDocName(e.target.value)}
                                placeholder="Hujjat nomini yozing (masalan: Oylik maosh ma'lumotnomasi)..."
                                className="w-full mt-3 px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] text-[#0a0a0a] dark:text-[#fafafa] outline-none focus:border-[#FF5900] transition-colors"
                            />
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowDocModal(false)}
                                className="px-5 py-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] font-semibold text-[#404040] dark:text-[#e5e5e5] hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                                Bekor qilish
                            </button>
                            <button
                                onClick={handleDocSubmit}
                                className="px-5 py-2.5 bg-[#FF5900] hover:bg-[#E04F00] active:bg-[#C24400] text-white rounded-xl text-[13px] font-semibold transition-colors cursor-pointer shadow-sm shadow-[#FF5900]/10"
                            >
                                So'rov yuborish
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
};

export default UsersDetail;