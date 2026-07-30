import { NavLink, useLocation } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DashboardSquare01FreeIcons,
  AiBrain01FreeIcons,
  Task01FreeIcons,
  Settings01FreeIcons,
  MoreHorizontalFreeIcons,
  ArrowLeft01FreeIcons,
  ArrowRight01FreeIcons,
  UserCheck01Icon,
  Flag02Icon,
  StethoscopeIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";

const MENU_GROUPS = [
  {
    label: "UMUMIY",
    items: [
      { label: "Boshqaruv paneli", path: "/", icon: DashboardSquare01FreeIcons, badge: null, end: true },
      { label: "Foydalanuvchilar", path: "/customers", icon: UserGroupIcon, badge: 12480, end: false },
    ],
  },
  {
    label: "NAZORAT",
    items: [
      { label: "Profil moderatsiyasi", path: "/profile-moderation", icon: UserCheck01Icon, badge: 4, end: false },
      { label: "AI moderator", path: "/ai-chat", icon: AiBrain01FreeIcons, badge: 18, end: false },
      { label: "Shikoyatlar", path: "/appeals", icon: Flag02Icon, badge: 4, end: false },
    ],
  },
  {
    label: "KONTENT",
    items: [
      { label: "Anketa savollari", path: "/references/faq", icon: Task01FreeIcons, badge: 30, end: false },
      { label: "Psixologlar", path: "/psychologists", icon: StethoscopeIcon, badge: 3, end: false },
      { label: "Sozlamalar", path: "/settings", icon: Settings01FreeIcons, badge: null, end: false },
    ],
  },
];

const formatBadge = (n: number): string => {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar = ({ collapsed, onToggle }: SidebarProps) => {
  const location = useLocation();

  return (
    <aside
      className={`
        flex flex-col h-screen shrink-0
        bg-white dark:bg-[#141414]
        border-r border-[#e5e5e5] dark:border-[#262626]
        transition-all duration-300 ease-in-out
        ${collapsed ? "w-[72px]" : "w-[240px]"}
      `}
    >
      {/* ── Logo ── */}
      <div className="flex items-center gap-3 px-4 py-3.25">
        <img src="/Mark.svg" alt="Mark" className="object-contain h-8 w-8" />
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-[13px] font-bold text-gray-900 dark:text-white leading-tight truncate">
              Raqamli Sovchi
            </p>
            <p className="text-[11px] text-gray-400 leading-tight">Admin panel</p>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
        {MENU_GROUPS.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="text-[10px] font-semibold text-[#A3A3A3] dark:text-[#A3A3A3] tracking-widest px-3 mb-1 uppercase">
                {group.label}
              </p>
            )}
            {collapsed && <div className="h-px bg-gray-100 dark:bg-gray-800 mx-2 mb-2" />}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = item.end
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path) && item.path !== "/";
                const exactRoot = item.path === "/" && location.pathname === "/";
                const active = isActive || exactRoot;

                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.end}
                      title={collapsed ? item.label : undefined}
                      className={`
                        flex items-center gap-3 rounded-lg px-3 py-2.5
                        text-[13px] font-semibold group relative
                        ${active
                          ? "bg-[#F5F5F5] dark:bg-[#171717] text-[#0A0A0A] dark:text-[#0A0A0A]"
                          : "text-[#525252] dark:text-[#525252] hover:bg-[#F5F5F5] dark:hover:bg-[#171717] hover:text-[#0A0A0A] dark:hover:text-[#0A0A0A]"
                        }
                        ${collapsed ? "justify-center" : ""}
                      `}
                    >
                      <HugeiconsIcon
                        icon={item.icon}
                        size={18}
                        strokeWidth={2.3}
                        className={`shrink-0 ${active ? "text-[#FF5900] dark:text-[#FF5900]" : "text-[#525252] dark:text-[#525252]"}`}
                      />
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.badge !== null && (
                            <span className={`rounded-xl py-0.5 px-1.5 text-[11px] bg-[#f5f5f5] font-semibold ${active ? "bg-[#FF5900] dark:bg-[#FF5900] text-white" : "text-[#737373] dark:text-[#a3a3a3]"} tabular-nums`}>
                              {formatBadge(item.badge as number)}
                            </span>
                          )}
                        </>
                      )}
                      {/* Collapsed badge dot */}
                      {collapsed && item.badge !== null && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#FF5900] rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                          {(item.badge as number) > 9 ? "9+" : item.badge}
                        </span>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── User + toggle ── */}
      <div className="border-t border-gray-100 dark:border-gray-800 p-3 space-y-1">
        {/* User row */}
        <div
          className={`flex items-center gap-2.5 rounded-xl px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/60 cursor-pointer transition-colors ${collapsed ? "justify-center" : ""}`}
        >
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">AM</span>
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-gray-800 dark:text-gray-200 truncate leading-tight">
                  A. Muxtorov
                </p>
                <p className="text-[10px] text-gray-400 truncate">Super admin</p>
              </div>
              <button className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <HugeiconsIcon icon={MoreHorizontalFreeIcons} size={14} strokeWidth={2} />
              </button>
            </>
          )}
        </div>

        {/* Collapse button */}
        <button
          onClick={onToggle}
          className={`
            w-full flex items-center gap-2 rounded-xl py-2
            text-[11px] font-medium text-gray-400
            hover:text-gray-600 dark:hover:text-gray-300
            hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors
            ${collapsed ? "justify-center" : "justify-center"}
          `}
        >
          <HugeiconsIcon
            icon={collapsed ? ArrowRight01FreeIcons : ArrowLeft01FreeIcons}
            size={14}
            strokeWidth={2}
          />
          {!collapsed && <span>Yig'ish</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
