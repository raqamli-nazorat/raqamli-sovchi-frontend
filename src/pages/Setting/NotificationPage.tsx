import { useEffect, useState, type ReactNode } from "react";
import { Camera, Bot, Flag, Users, ClipboardList, CalendarDays } from "lucide-react";
import { useHeader } from "../../components/Layout/Layout";

// ── Types ────────────────────────────────────────────────────────────────────
type NotifCategory = "all" | "moderation" | "ai" | "complaint" | "registration";

interface Notification {
    id: string;
    category: Exclude<NotifCategory, "all">;
    icon: "selfie" | "ai" | "complaint" | "registration" | "doc" | "schedule";
    title: string;
    description: string;
    time: string;
    unread: boolean;
}

// ── Icon components ──────────────────────────────────────────────────────────
const NotifIcon = ({ type }: { type: Notification["icon"] }) => {
    const base = "w-9 h-9 rounded-full flex items-center justify-center shrink-0";

    const map: Record<Notification["icon"], { bg: string; icon: ReactNode }> = {
        selfie: { bg: "bg-blue-100 dark:bg-blue-900/30", icon: <Camera className="w-[17px] h-[17px] text-blue-500" strokeWidth={2} /> },
        ai: { bg: "bg-red-100 dark:bg-red-900/30", icon: <Bot className="w-[17px] h-[17px] text-red-500" strokeWidth={2} /> },
        complaint: { bg: "bg-orange-100 dark:bg-orange-900/30", icon: <Flag className="w-[17px] h-[17px] text-orange-500" strokeWidth={2} /> },
        registration: { bg: "bg-green-100 dark:bg-green-900/30", icon: <Users className="w-[17px] h-[17px] text-green-600" strokeWidth={2} /> },
        doc: { bg: "bg-purple-100 dark:bg-purple-900/30", icon: <ClipboardList className="w-[17px] h-[17px] text-purple-500" strokeWidth={2} /> },
        schedule: { bg: "bg-zinc-100 dark:bg-zinc-800", icon: <CalendarDays className="w-[17px] h-[17px] text-zinc-500" strokeWidth={2} /> },
    };

    const { bg, icon } = map[type];
    return <div className={`${base} ${bg}`}>{icon}</div>;
};

// ── Mock data ────────────────────────────────────────────────────────────────
const ALL_NOTIFICATIONS: Notification[] = [
    {
        id: "1",
        category: "moderation",
        icon: "selfie",
        title: "Yangi selfi tekshiruvi",
        description: "Nilufar Anmedova (USR-10455) selfi yukladi — yuz mosligi 71%",
        time: "12 daq oldin",
        unread: true,
    },
    {
        id: "2",
        category: "ai",
        icon: "ai",
        title: "AI: yuqori darajali qoidabuzarlik",
        description: "USR-10511 suhbatda rasm so'radi — xabar bloklandi",
        time: "38 daq oldin",
        unread: true,
    },
    {
        id: "3",
        category: "complaint",
        icon: "complaint",
        title: "Yangi shikoyat",
        description: "USR-10318 → USR-10511 · Odobsiz so'z",
        time: "09:14",
        unread: true,
    },
    {
        id: "4",
        category: "registration",
        icon: "registration",
        title: "412 ta yangi ro'yxatdan o'tish",
        description: "Shu hafta uchun konversiya 57%",
        time: "08:00",
        unread: false,
    },
    {
        id: "5",
        category: "moderation",
        icon: "doc",
        title: "Vakil arizasi kutilmoqda",
        description: "Sevinch Toshpo'latova (USR-10688) — nomzod roziligi kerak",
        time: "Kecha 18:20",
        unread: false,
    },
    {
        id: "6",
        category: "ai",
        icon: "doc",
        title: "Anketa savoli tahrirlandi",
        description: "Din va qadriyatlar · 03-savol (Lie Scale) yangilandi",
        time: "Kecha 15:05",
        unread: false,
    },
    {
        id: "7",
        category: "complaint",
        icon: "schedule",
        title: "Psixolog jadvali to'ldi",
        description: "Sherzod Aliyev · juma kunidagi barcha slotlar band",
        time: "Kecha 11:40",
        unread: false,
    },
    {
        id: "7",
        category: "complaint",
        icon: "schedule",
        title: "Psixolog jadvali to'ldi",
        description: "Sherzod Aliyev · juma kunidagi barcha slotlar band",
        time: "Kecha 11:40",
        unread: false,
    },
    {
        id: "7",
        category: "complaint",
        icon: "schedule",
        title: "Psixolog jadvali to'ldi",
        description: "Sherzod Aliyev · juma kunidagi barcha slotlar band",
        time: "Kecha 11:40",
        unread: false,
    }
];

const TABS: { value: NotifCategory; label: string }[] = [
    { value: "all", label: `Hammasi · ${ALL_NOTIFICATIONS.length}` },
    { value: "moderation", label: `Moderatsiya · ${ALL_NOTIFICATIONS.filter(n => n.category === "moderation").length}` },
    { value: "ai", label: `AI signallari · ${ALL_NOTIFICATIONS.filter(n => n.category === "ai").length}` },
    { value: "complaint", label: `Shikoyatlar · ${ALL_NOTIFICATIONS.filter(n => n.category === "complaint").length}` },
];

// ── Group helpers ─────────────────────────────────────────────────────────────
const isToday = (time: string) => !time.startsWith("Kecha");

// ── Main component ────────────────────────────────────────────────────────────
const NotificationPage = () => {
    const { setHeaderTitle, setHeaderSubtitle } = useHeader();

    useEffect(() => {
        setHeaderTitle("Bildirishnomalar");
        setHeaderSubtitle("Siz qanday bildirishnomalarni qabul qilasiz");
    }, [setHeaderTitle, setHeaderSubtitle]);

    const [activeTab, setActiveTab] = useState<NotifCategory>("all");
    const [notifications, setNotifications] = useState<Notification[]>(ALL_NOTIFICATIONS);

    const filtered =
        activeTab === "all"
            ? notifications
            : notifications.filter((n) => n.category === activeTab);

    const todayItems = filtered.filter((n) => isToday(n.time));
    const yesterdayItems = filtered.filter((n) => !isToday(n.time));

    const unreadCount = notifications.filter((n) => n.unread).length;

    const markAllRead = () =>
        setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));

    const markOneRead = (id: string) =>
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
        );

    return (
        <>
            {/* ── Tab bar + mark-all  (outside any card) ── */}
            <div className="flex items-center justify-between flex-wrap gap-y-2 sticky top-0 z-10 px-4 py-3 bg-[#fafafa]">
                <div className="flex items-center gap-1 flex-wrap">
                    {TABS.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => setActiveTab(tab.value)}
                            className={`px-4 py-2 text-[13px] font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${activeTab === tab.value
                                ? "bg-[#0a0a0a] dark:bg-white text-white dark:text-[#0a0a0a]"
                                : "text-[#737373] dark:text-zinc-400 hover:text-[#0a0a0a] dark:hover:text-white bg-white dark:bg-zinc-800 border border-[#e5e5e5] "
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {unreadCount > 0 && (
                    <button
                        onClick={markAllRead}
                        className="text-[13px] font-medium text-[#0474F3] hover:text-[#023399] transition-colors cursor-pointer whitespace-nowrap"
                    >
                        Hammasini o'qilgan deb belgilash
                    </button>
                )}
            </div>
            
            <div className="p-4 pt-0! space-y-4">

                {/* ── Today card ── */}
                {todayItems.length > 0 && (
                    <div className="bg-white dark:bg-[#141414] rounded-2xl border border-[#e5e5e5] dark:border-[#262626] shadow-sm overflow-hidden">
                        <p className="px-5 pt-4 pb-2 text-[11px] font-bold tracking-widest uppercase text-[#a3a3a3] dark:text-zinc-500">
                            Bugun
                        </p>
                        <div className="divide-y divide-[#f5f5f5] dark:divide-[#262626]">
                            {todayItems.map((notif) => (
                                <NotifRow
                                    key={notif.id}
                                    notif={notif}
                                    onRead={() => markOneRead(notif.id)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Yesterday card ── */}
                {yesterdayItems.length > 0 && (
                    <div className="bg-white dark:bg-[#141414] rounded-2xl border border-[#e5e5e5] dark:border-[#262626] shadow-sm overflow-hidden">
                        <p className="px-5 pt-4 pb-2 text-[11px] font-bold tracking-widest uppercase text-[#a3a3a3] dark:text-zinc-500">
                            Kecha
                        </p>
                        <div className="divide-y divide-[#f5f5f5] dark:divide-[#262626]">
                            {yesterdayItems.map((notif) => (
                                <NotifRow
                                    key={notif.id}
                                    notif={notif}
                                    onRead={() => markOneRead(notif.id)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Empty state ── */}
                {filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <span className="text-4xl mb-3">🔔</span>
                        <p className="text-[14px] font-semibold text-[#0a0a0a] dark:text-white">
                            Bildirishnomalar yo'q
                        </p>
                        <p className="text-[13px] text-[#737373] dark:text-zinc-400 mt-1">
                            Bu bo'limda hali bildirishnomalar mavjud emas
                        </p>
                    </div>
                )}
            </div>
        </>
    );
};

// ── Row component ─────────────────────────────────────────────────────────────
const NotifRow = ({
    notif,
    onRead,
}: {
    notif: Notification;
    onRead: () => void;
}) => (
    <div
        onClick={onRead}
        className={`flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800/50 ${notif.unread ? "bg-[#0474F3]/[0.02] dark:bg-[#0474F3]/[0.04]" : ""
            }`}
    >
        <NotifIcon type={notif.icon} />

        <div className="flex-1 min-w-0">
            <p className={`text-[14px] leading-snug truncate ${notif.unread ? "font-semibold text-[#0a0a0a] dark:text-white" : "font-medium text-[#404040] dark:text-zinc-200"}`}>
                {notif.title}
            </p>
            <p className="text-[12px] text-[#737373] dark:text-zinc-400 mt-0.5 truncate">
                {notif.description}
            </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
            <span className="text-[12px] text-[#a3a3a3] dark:text-zinc-500 whitespace-nowrap">
                {notif.time}
            </span>
            {notif.unread && (
                <span className="w-2 h-2 rounded-full bg-[#0474F3] shrink-0" />
            )}
        </div>
    </div>
);

export default NotificationPage;