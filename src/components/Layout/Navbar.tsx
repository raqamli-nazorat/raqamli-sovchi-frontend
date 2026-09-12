import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01FreeIcons, Notification02Icon } from "@hugeicons/core-free-icons";
import type { Appeal } from "../../store/slices/appealsSlice";
import type { RootState } from "../../store";
import { useNotificationsRealtime } from "../../hooks/useNotificationsRealtime";

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Boshqaruv paneli", subtitle: "" },
  "/users": { title: "Foydalanuvchilar", subtitle: "" },
  "/appeals": { title: "Shikoyatlar", subtitle: "" },
  "/ai-chat": { title: "AI moderator", subtitle: "" },
  "/settings": { title: "Sozlamalar", subtitle: "" },
  "/psychologists": { title: "Psixologlar", subtitle: "" },
  "/profile-moderation": { title: "Profil moderatsiyasi", subtitle: "" },
  "/questions": { title: "Anketa savollari", subtitle: "" },
  "/profile": { title: "Mening profilim", subtitle: "" },
};

const getPageInfo = (pathname: string, appeal?: Appeal) => {
  if (pathname.startsWith("/appeals/")) {
    return {
      title: "Shikoyat tafsiloti",
      subtitle: "",
    };
  }
  // Ma'lumotnomalar sahifalari aniq sarlavhani useHeader orqali o'zi o'rnatadi
  if (pathname.startsWith("/references")) {
    return { title: "Ma'lumotnomalar", subtitle: "" };
  }
  return PAGE_TITLES[pathname] ?? { title: "Sahifa", subtitle: "" };
};

interface NavbarProps {
  collapsed: boolean;
  onToggle: () => void;
  title?: string;
  subtitle?: string;
}

const Navbar = ({ collapsed: _collapsed, onToggle: _onToggle, title: customTitle, subtitle: customSubtitle }: NavbarProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Redux orqali joriy shikoyatni topish (Asadbek varianti)
  const appealId = location.pathname.startsWith("/appeals/")
    ? location.pathname.split("/")[2]
    : undefined;

  const appeal: Appeal | undefined = useSelector((state: any) =>
    appealId ? state.appeals?.items?.find((a: Appeal) => a.id === appealId) : undefined
  );


  // URL query params orqali search boshqaruvi (main varianti)
  const { title: routeTitle, subtitle: routeSubtitle } = getPageInfo(location.pathname, appeal);

  const displayTitle = customTitle ?? routeTitle;
  const displaySubtitle = customSubtitle ?? routeSubtitle;

  const [searchParams, setSearchParams] = useSearchParams();
  const searchValue = searchParams.get("search") || "";

  // ── O'qilmagan bildirishnomalar soni + real-time ──
  // Real-time WebSocket (ticket bilan) orqali yangi bildirishnomalar push qilinadi.
  // count endpointi FAQAT: birinchi mount + WS o'lik holatda tab qayta faollashganda
  // (60s throttle) chaqiriladi. Interval / polling YO'Q.
  useNotificationsRealtime();
  const notificationCount = useSelector((s: RootState) => s.notifications.unreadCount);

  return (
    <header className="h-15 shrink-0 flex items-center justify-between bg-[#9BC8FB] border-b border-[#86BCF9]/60 px-6 gap-4">
      {/* Left – Page title */}
      <div className="flex flex-col justify-center min-w-0">
        <h1 className="text-[16px] font-semibold text-[#0A0A0A] leading-tight truncate">
          {displayTitle}
        </h1>
      </div>

      {/* Right – Search + Notification */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Search */}
        <div className="relative">
          <HugeiconsIcon
            icon={Search01FreeIcons}
            size={14}
            strokeWidth={3}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373] pointer-events-none"
          />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => {
              const val = e.target.value;
              setSearchParams((prev) => {
                if (val) {
                  prev.set("search", val);
                } else {
                  prev.delete("search");
                }
                return prev;
              });
            }}
            placeholder="Foydalanuvchi, ID, telefon..."
            className="h-9.5 pl-9 pr-4 rounded-xl bg-white border border-transparent text-[13px] text-[#0A0A0A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0474F3]/20 transition-all w-[260px] shadow-xs"
          />
        </div>

        {/* Notification button */}
        <button
          onClick={() => navigate("/notification")}
          className="relative flex items-center cursor-pointer gap-2 h-9.5 px-3.5 rounded-xl bg-white border border-transparent text-[#0A0A0A] transition-all hover:bg-white/90 shadow-xs"
        >
          <HugeiconsIcon
            icon={Notification02Icon}
            size={16}
            strokeWidth={2.5}
            className="text-[#0A0A0A]"
          />
          <span className="text-[12px] font-medium text-[#0A0A0A]">Bildirishnomalar</span>
          {notificationCount > 0 && (
            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#0474F3] text-white text-[10px] font-bold">
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

export default Navbar;