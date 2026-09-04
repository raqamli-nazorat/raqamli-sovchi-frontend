import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
    Bell,
    BellOff,
    Bot,
    CalendarDays,
    Camera,
    ClipboardList,
    Flag,
    RefreshCw,
    Users,
} from "lucide-react";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { useHeader } from "../../components/Layout/Layout";
import type { AppDispatch, RootState } from "../../store";
import {
    fetchNotifications,
    markAllNotificationsRead,
    markNotificationRead,
    resetNotifications,
} from "../../store/slices/notificationsSlice";
import type { NotificationItem } from "../../lib/notificationsApi";

// ── Icon tanlash ─────────────────────────────────────────────────────────────
type IconKind = "selfie" | "ai" | "complaint" | "registration" | "doc" | "schedule" | "default";

const ICON_MAP: Record<IconKind, { bg: string; icon: ReactNode }> = {
    selfie: { bg: "bg-blue-100 dark:bg-blue-900/30", icon: <Camera className="w-[17px] h-[17px] text-blue-500" strokeWidth={2} /> },
    ai: { bg: "bg-red-100 dark:bg-red-900/30", icon: <Bot className="w-[17px] h-[17px] text-red-500" strokeWidth={2} /> },
    complaint: { bg: "bg-orange-100 dark:bg-orange-900/30", icon: <Flag className="w-[17px] h-[17px] text-orange-500" strokeWidth={2} /> },
    registration: { bg: "bg-green-100 dark:bg-green-900/30", icon: <Users className="w-[17px] h-[17px] text-green-600" strokeWidth={2} /> },
    doc: { bg: "bg-purple-100 dark:bg-purple-900/30", icon: <ClipboardList className="w-[17px] h-[17px] text-purple-500" strokeWidth={2} /> },
    schedule: { bg: "bg-zinc-100 dark:bg-zinc-800", icon: <CalendarDays className="w-[17px] h-[17px] text-zinc-500" strokeWidth={2} /> },
    default: { bg: "bg-blue-100 dark:bg-blue-900/30", icon: <Bell className="w-[17px] h-[17px] text-blue-500" strokeWidth={2} /> },
};

// extra_data ichida tur ko'rsatilgan bo'lsa mos ikonka, aks holda umumiy qo'ng'iroq.
const iconKindOf = (n: NotificationItem): IconKind => {
    const raw =
        n.extra_data && typeof n.extra_data === "object"
            ? (n.extra_data as Record<string, unknown>)
            : {};
    const key = String(raw.type ?? raw.category ?? raw.kind ?? "").toLowerCase();
    if (key.includes("selfie") || key.includes("photo") || key.includes("moderation")) return "selfie";
    if (key.includes("ai")) return "ai";
    if (key.includes("complaint") || key.includes("shikoyat") || key.includes("appeal")) return "complaint";
    if (key.includes("regist") || key.includes("signup")) return "registration";
    if (key.includes("question") || key.includes("anketa") || key.includes("doc")) return "doc";
    if (key.includes("schedule") || key.includes("jadval")) return "schedule";
    return "default";
};

const NotifIcon = ({ kind }: { kind: IconKind }) => {
    const { bg, icon } = ICON_MAP[kind];
    return (
        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${bg}`}>
            {icon}
        </div>
    );
};

// ── Sana yorliqlari ──────────────────────────────────────────────────────────
const groupLabel = (iso: string): string => {
    const d = dayjs(iso);
    if (!d.isValid()) return "Boshqa";
    if (d.isSame(dayjs(), "day")) return "Bugun";
    if (d.isSame(dayjs().subtract(1, "day"), "day")) return "Kecha";
    return d.format("DD.MM.YYYY");
};

const timeLabel = (iso: string): string => {
    const d = dayjs(iso);
    if (!d.isValid()) return "";
    if (d.isSame(dayjs(), "day") || d.isSame(dayjs().subtract(1, "day"), "day")) {
        return d.format("HH:mm");
    }
    return d.format("DD.MM.YYYY HH:mm");
};

// ── Main component ───────────────────────────────────────────────────────────
const NotificationPage = () => {
    const { setHeaderTitle, setHeaderSubtitle } = useHeader();
    const dispatch = useDispatch<AppDispatch>();

    const {
        items,
        total,
        unreadCount,
        hasMore,
        page,
        listLoading,
        listLoadingMore,
        listError,
        markingAll,
    } = useSelector((s: RootState) => s.notifications);

    const [tab, setTab] = useState<"all" | "unread">("all");

    useEffect(() => {
        setHeaderTitle("Bildirishnomalar");
        setHeaderSubtitle("Platforma bildirishnomalari");
    }, [setHeaderTitle, setHeaderSubtitle]);

    // count/ SO'RALMAYDI: unreadCount Navbar'dagi useNotificationsRealtime orqali
    // allaqachon Redux'da bor (mount + WS push bilan tirik saqlanadi) — bu sahifa
    // Layout'ning ichki route'i, Navbar undan OLDIN mount bo'ladi.
    useEffect(() => {
        dispatch(resetNotifications());
        dispatch(fetchNotifications({ page: 1 }));
    }, [dispatch]);

    // Ro'yxat allaqachon server tomonida filtrlangan (?is_read=false) — client-side filtr YO'Q.
    const groups = useMemo(() => {
        const order: string[] = [];
        const map: Record<string, NotificationItem[]> = {};
        for (const n of items) {
            const label = groupLabel(n.created_at);
            if (!map[label]) {
                map[label] = [];
                order.push(label);
            }
            map[label].push(n);
        }
        return order.map((label) => ({ label, items: map[label] }));
    }, [items]);

    // Har tab bosilganda API'ga so'rov ketadi (bir xil tab qayta bosilsa ham).
    // count/ SHART EMAS: "unread" tab uchun fetchNotifications({isRead:false})ning
    // o'zi paginatsiya count'idan unreadCount'ni aniq qiladi (extraReducers'da).
    const loadTab = (t: "all" | "unread") => {
        setTab(t);
        dispatch(resetNotifications());
        dispatch(fetchNotifications({ page: 1, isRead: t === "unread" ? false : undefined }));
    };

    const reload = () => loadTab(tab);

    // "Hammasini o'qilgan" — o'nlab qatorga tegadi, shuning uchun serverdan qayta
    // yuklaymiz. count/ shart emas: markAllNotificationsRead.fulfilled unreadCount'ni
    // 0'ga allaqachon o'rnatadi. Bitta qatorni o'qilgan qilishda esa optimistik reducer
    // yetarli (ro'yxat joyida qoladi, yuklangan sahifalar yo'qolmaydi).
    const afterMarkAll = () => {
        dispatch(resetNotifications());
        dispatch(fetchNotifications({ page: 1, isRead: tab === "unread" ? false : undefined }));
    };

    const TABS = [
        { value: "all" as const, label: `Hammasi · ${total}` },
        { value: "unread" as const, label: `O'qilmagan · ${unreadCount}` },
    ];

    return (
        <>
            {/* ── Tab bar + mark-all ── */}
            <div className="flex items-center justify-between flex-wrap gap-y-2 sticky top-0 z-10 px-4 py-3 bg-[#fafafa] dark:bg-[#0a0a0a]">
                <div className="flex items-center gap-1 flex-wrap">
                    {TABS.map((t) => (
                        <button
                            key={t.value}
                            onClick={() => loadTab(t.value)}
                            className={`px-4 py-2 text-[13px] font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${tab === t.value
                                ? "bg-[#0a0a0a] dark:bg-white text-white dark:text-[#0a0a0a]"
                                : "text-[#737373] dark:text-zinc-400 hover:text-[#0a0a0a] dark:hover:text-white bg-white dark:bg-zinc-800 border border-[#e5e5e5] dark:border-[#262626]"
                                }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {unreadCount > 0 && (
                    <button
                        onClick={() => {
                            dispatch(markAllNotificationsRead()).finally(afterMarkAll);
                        }}
                        disabled={markingAll}
                        className="text-[13px] font-medium text-[#0474F3] hover:text-[#023399] disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
                    >
                        Hammasini o'qilgan deb belgilash
                    </button>
                )}
            </div>

            <div className="p-4 pt-0! space-y-4">
                {/* ── Skeleton ── */}
                {listLoading && items.length === 0 && (
                    <div className="bg-white dark:bg-[#141414] rounded-2xl border border-[#e5e5e5] dark:border-[#262626] overflow-hidden divide-y divide-[#f5f5f5] dark:divide-[#262626]">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                                <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-zinc-800 shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3.5 w-1/3 bg-gray-200 dark:bg-zinc-800 rounded" />
                                    <div className="h-3 w-2/3 bg-gray-200 dark:bg-zinc-800 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Xatolik ── */}
                {listError && items.length === 0 && !listLoading && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <BellOff className="w-8 h-8 text-[#a3a3a3] mb-3" strokeWidth={1.5} />
                        <p className="text-[14px] font-semibold text-[#0a0a0a] dark:text-white">
                            Bildirishnomalarni yuklab bo'lmadi
                        </p>
                        <p className="text-[13px] text-[#737373] dark:text-zinc-400 mt-1">{listError}</p>
                        <button
                            onClick={reload}
                            className="mt-4 h-10 px-4 inline-flex items-center gap-2 bg-[#0474F3] hover:bg-[#023399] text-white text-[13px] font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                            <RefreshCw className="w-4 h-4" strokeWidth={2.2} /> Qayta urinish
                        </button>
                    </div>
                )}

                {/* ── Ro'yxat ── */}
                {!listError &&
                    groups.map((group) => (
                        <div
                            key={group.label}
                            className="bg-white dark:bg-[#141414] rounded-2xl border border-[#e5e5e5] dark:border-[#262626] shadow-sm overflow-hidden"
                        >
                            <p className="px-5 pt-4 pb-2 text-[11px] font-bold tracking-widest uppercase text-[#a3a3a3] dark:text-zinc-500">
                                {group.label}
                            </p>
                            <div className="divide-y divide-[#f5f5f5] dark:divide-[#262626]">
                                {group.items.map((notif) => (
                                    <NotifRow
                                        key={notif.id}
                                        notif={notif}
                                        onRead={() => {
                                            if (notif.is_read) return;
                                            dispatch(markNotificationRead(notif.id));
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}

                {/* ── Ko'proq yuklash ── */}
                {!listError && hasMore && items.length > 0 && (
                    <div className="flex justify-center">
                        <button
                            onClick={() =>
                                dispatch(
                                    fetchNotifications({
                                        page: page + 1,
                                        isRead: tab === "unread" ? false : undefined,
                                    })
                                )
                            }
                            disabled={listLoadingMore}
                            className="h-10 px-5 inline-flex items-center gap-2 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-lg text-[13px] font-semibold text-[#404040] dark:text-[#e5e5e5] hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors cursor-pointer"
                        >
                            {listLoadingMore ? (
                                <span className="w-4 h-4 border-2 border-[#0474F3] border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <RefreshCw className="w-4 h-4" strokeWidth={2.2} />
                            )}
                            Ko'proq yuklash
                        </button>
                    </div>
                )}

                {/* ── Bo'sh holat ── */}
                {!listLoading && !listError && items.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <span className="text-4xl mb-3">🔔</span>
                        <p className="text-[14px] font-semibold text-[#0a0a0a] dark:text-white">
                            {tab === "unread" ? "O'qilmagan bildirishnoma yo'q" : "Bildirishnomalar yo'q"}
                        </p>
                        <p className="text-[13px] text-[#737373] dark:text-zinc-400 mt-1">
                            Yangi bildirishnomalar shu yerda ko'rinadi
                        </p>
                    </div>
                )}
            </div>
        </>
    );
};

// ── Row ──────────────────────────────────────────────────────────────────────
const NotifRow = ({ notif, onRead }: { notif: NotificationItem; onRead: () => void }) => (
    <div
        onClick={onRead}
        className={`flex items-center gap-4 px-5 py-4 transition-colors ${notif.is_read
            ? ""
            : "bg-[#0474F3]/[0.02] dark:bg-[#0474F3]/[0.04] cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50"
            }`}
    >
        <NotifIcon kind={iconKindOf(notif)} />

        <div className="flex-1 min-w-0">
            <p
                className={`text-[14px] leading-snug truncate ${notif.is_read
                    ? "font-medium text-[#404040] dark:text-zinc-200"
                    : "font-semibold text-[#0a0a0a] dark:text-white"
                    }`}
            >
                {notif.title}
            </p>
            {notif.message && (
                <p className="text-[12px] text-[#737373] dark:text-zinc-400 mt-0.5 truncate">
                    {notif.message}
                </p>
            )}
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
            <span className="text-[12px] text-[#a3a3a3] dark:text-zinc-500 whitespace-nowrap tabular-nums">
                {timeLabel(notif.created_at)}
            </span>
            {!notif.is_read && <span className="w-2 h-2 rounded-full bg-[#0474F3] shrink-0" />}
        </div>
    </div>
);

export default NotificationPage;
