import { useLocation, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01FreeIcons, Notification02Icon } from "@hugeicons/core-free-icons";
import type { Appeal } from "../../store/slices/appealsSlice";

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Boshqaruv paneli", subtitle: "Umumiy holat va navbatdagi vazifalar" },
  "/users": { title: "Foydalanuvchilar", subtitle: "Kelin, kuyov va vakillar reyestri" },
  "/appeals": { title: "Shikoyatlar", subtitle: "Foydalanuvchi murojaatlari" },
  "/ai-chat": { title: "AI moderator", subtitle: "Suhbatlardagi qoidabuzarlik signallari" },
  "/settings": { title: "Sozlamalar", subtitle: "Platforma qoidalari va rollar" },
  "/psychologists": { title: "Psixologlar", subtitle: "Mutaxassislar va suhbatlar" },
  "/profile-moderation": { title: "Profil moderatsiyasi", subtitle: "Selfi tasdiqlash va rasm tekshiruvi" },
};

const getPageInfo = (pathname: string, appeal?: Appeal) => {
  if (pathname.startsWith("/appeals/")) {
    return {
      title: "Shikoyat tafsiloti",
      subtitle: appeal ? `${appeal.id} · ${appeal.tag} · ${appeal.time}` : "Shikoyat bo'yicha batafsil",
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
  const notificationCount = 26;

  return (
    <header className="h-15 shrink-0 flex items-center justify-between bg-white dark:bg-[#141414] border-b border-[#e5e5e5] dark:border-[#262626] px-6 gap-4">
      {/* Left – Page title */}
      <div className="flex flex-col justify-center min-w-0">
        <h1 className="text-[16px] font-semibold text-[#0A0A0A] dark:text-[#fafafa] leading-tight truncate">
          {displayTitle}
        </h1>
        {displaySubtitle && (
          <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3] leading-tight truncate">{displaySubtitle}</p>
        )}
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
            className="h-9 pl-9 pr-4 rounded-lg border border-[#e5e5e5] dark:border-[#262626] text-[13px] text-[#737373] dark:text-[#a3a3a3] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF5900]/20 focus:border-[#FF5900] transition-all w-[220px]"
          />
        </div>

        {/* Notification button */}
        <button className="relative flex items-center cursor-pointer gap-2 h-9 px-3 rounded-lg border border-[#e5e5e5] dark:border-[#262626] text-[#404040] dark:text-[#a3a3a3] transition-all">
          <HugeiconsIcon
            icon={Notification02Icon}
            size={16}
            strokeWidth={2.5}
          />
          <span className="text-[12px] font-medium">Bildirishnomalar</span>
          <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#FF5900] text-white text-[10px] font-bold">
            {notificationCount}
          </span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;