import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Appeal } from "../../store/slices/appealsSlice";
import {
  DashboardSquare01FreeIcons,
  AiBrain01FreeIcons,
  Task01FreeIcons,
  Settings01FreeIcons,
  MoreHorizontalFreeIcons,
  ArrowLeft01FreeIcons,
  ArrowRight01FreeIcons,
  ArrowDown01Icon,
  ArrowUp01Icon,
  UserCheck01Icon,
  Flag02Icon,
  StethoscopeIcon,
  UserGroupIcon,
  LibraryIcon,
  SidebarLeft01Icon,
} from "@hugeicons/core-free-icons";
import { HugeIcon } from "./HugeIcon";

interface MenuChild {
  label: string;
  path: string;
}

interface MenuItem {
  label: string;
  path: string;
  icon: typeof DashboardSquare01FreeIcons;
  badge: number | null;
  end: boolean;
  children?: MenuChild[];
}

const REFERENCE_CHILDREN: MenuChild[] = [
  { label: "Rollar", path: "/references/roles" },
  { label: "Viloyatlar", path: "/references/regions" },
  { label: "Tumanlar", path: "/references/districts" },
  { label: "Ta'lim darajasi", path: "/references/education-levels" },
  { label: "Millatlar", path: "/references/nationalities" },
  { label: "Kasblar", path: "/references/professions" },
  { label: "Savol bo'limlari", path: "/references/sections" },
  { label: "Savollar", path: "/references/questions" },
];

const MENU_GROUPS: { label: string; items: MenuItem[] }[] = [
  {
    label: "UMUMIY",
    items: [
      { label: "Boshqaruv paneli", path: "/", icon: DashboardSquare01FreeIcons, badge: null, end: true },
      { label: "Foydalanuvchilar", path: "/users", icon: UserGroupIcon, badge: 12480, end: false },
    ],
  },
  {
    label: "NAZORAT",
    items: [
      // { label: "Profil moderatsiyasi", path: "/profile-moderation", icon: UserCheck01Icon, badge: 4, end: false },
      { label: "AI moderator", path: "/ai-chat", icon: AiBrain01FreeIcons, badge: 18, end: false },
      { label: "Shikoyatlar", path: "/appeals", icon: Flag02Icon, badge: 4, end: false },
    ],
  },
  {
    label: "KONTENT",
    items: [
      { label: "Anketa savollari", path: "/questions", icon: Task01FreeIcons, badge: null, end: false },
      { label: "Psixologlar", path: "/psychologists", icon: StethoscopeIcon, badge: 3, end: false },
      {
        label: "Ma'lumotnomalar",
        path: "/references",
        icon: LibraryIcon,
        badge: null,
        end: false,
        children: REFERENCE_CHILDREN,
      },
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
  const navigate = useNavigate();
  const [refsOpen, setRefsOpen] = useState(location.pathname.startsWith("/references"));
  const appealsInReviewCount = useSelector(
    (state: any) => state.appeals.items.filter((a: Appeal) => a.status === "in_review").length
  );

  const badgeFor = (item: { path: string; badge: number | null }) => {
    if (item.path === "/appeals") return appealsInReviewCount > 0 ? appealsInReviewCount : null;
    return item.badge;
  };

  const currentUser = useSelector((state: any) => state.references.currentUser)

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
      <style>{`
        /* Default color for all paths of active icons is blue */
        .active-icon path {
          stroke: #0084FF !important;
        }
      `}</style>

      {/* ── Logo ── */}
      <div className="flex items-center justify-between w-full px-4">
        <div className="flex items-center gap-1.5 py-3.25">
          <img src="/Mark.svg" alt="Mark" className="object-contain h-8 w-8" />
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-[16px] font-extrabold text-gray-900 dark:text-white leading-tight truncate">
                <span className="font-medium! text-[#737373]!">Raqamli</span> Sovchi
              </p>
            </div>
          )}
        </div>
        {!collapsed && (
          <button onClick={onToggle} className="overflow-hidden cursor-pointer">
            <HugeIcon icon={SidebarLeft01Icon} size={16} strokeWidth={2.5} className="shrink-0 text-[#a3a3a3]" />
          </button>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-5" onClick={() => { collapsed !== false && onToggle() }}>
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
                const badge = badgeFor(item);

                // ── Bolali element (Ma'lumotnomalar) — ochiladigan submenu ──
                if (item.children) {
                  const rowClass = `
                    w-full flex items-center gap-3 rounded-lg px-3 py-2.5
                    text-[13px] font-semibold group relative cursor-pointer
                    ${active
                      ? "bg-[#F5F5F5] dark:bg-[#171717] text-[#0A0A0A] dark:text-[#0A0A0A]"
                      : "text-[#525252] dark:text-[#525252] hover:bg-[#F5F5F5] dark:hover:bg-[#171717] hover:text-[#0A0A0A] dark:hover:text-[#0A0A0A]"
                    }
                    ${collapsed ? "justify-center" : ""}
                  `;

                  return (
                    <li key={item.path}>
                      {collapsed ? (
                        <NavLink to={item.children[0].path} title={item.label} className={rowClass} onClick={(e) => e.stopPropagation()}>
                          <HugeiconsIcon
                            icon={item.icon}
                            size={18}
                            strokeWidth={2.3}
                            className={`shrink-0 ${active ? "active-icon" : "text-[#525252] dark:text-[#525252]"}`}
                          />
                        </NavLink>
                      ) : (
                        <>
                          <button onClick={(e) => { e.stopPropagation(); setRefsOpen((v) => !v) }} className={rowClass}>
                            <HugeiconsIcon
                              icon={item.icon}
                              size={18}
                              strokeWidth={2.3}
                              className={`shrink-0 ${active ? "active-icon" : "text-[#525252] dark:text-[#525252]"}`}
                            />
                            <span className="flex-1 truncate text-left">{item.label}</span>
                            <HugeiconsIcon
                              icon={refsOpen ? ArrowUp01Icon : ArrowDown01Icon}
                              size={14}
                              strokeWidth={2}
                              className="shrink-0 text-[#A3A3A3]"
                            />
                          </button>
                          {refsOpen && (
                            <ul className="mt-0.5 space-y-0.5">
                              {item.children.map((child) => {
                                const childActive = location.pathname.startsWith(child.path);
                                return (
                                  <li key={child.path}>
                                    <NavLink
                                      to={child.path}
                                      className={`
                                        flex items-center rounded-lg pl-11 pr-3 py-2
                                        text-[13px] font-medium
                                        ${childActive
                                          ? "bg-[#F5F5F5] dark:bg-[#171717] text-[#0A0A0A] dark:text-white font-semibold"
                                          : "text-[#737373] dark:text-[#737373] hover:bg-[#F5F5F5] dark:hover:bg-[#171717] hover:text-[#0A0A0A] dark:hover:text-white"
                                        }
                                      `}
                                    >
                                      <span className="truncate">{child.label}</span>
                                    </NavLink>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </>
                      )}
                    </li>
                  );
                }

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
                      onClick={(e) => e.stopPropagation()}
                    >
                      <HugeiconsIcon
                        icon={item.icon}
                        size={18}
                        strokeWidth={2.3}
                        className={`shrink-0 ${active ? "active-icon active-" + item.path.replace(/[^a-zA-Z0-9]/g, "-") : "text-[#525252] dark:text-[#525252]"}`}
                      />
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          {badge !== null && (
                            <span className={`rounded-xl py-0.5 px-1.5 text-[11px] bg-[#f5f5f5] font-semibold ${active ? "bg-[#0474F3]! dark:bg-[#0474F3]! text-white" : "text-[#737373] dark:text-[#a3a3a3]"} tabular-nums`}>
                              {formatBadge(badge as number)}
                            </span>
                          )}
                        </>
                      )}
                      {/* Collapsed badge dot */}
                      {collapsed && badge !== null && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#0474F3] rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                          {(badge as number) > 9 ? "9+" : badge}
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
          onClick={() => navigate("/profile")}
          className={`flex items-center gap-2.5 rounded-xl px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/60 cursor-pointer transition-colors ${collapsed ? "justify-center" : ""}`}
        >
          {currentUser?.main_photo || currentUser?.photo_url || currentUser?.profile_info?.main_photo ? (
            <img
              src={currentUser?.main_photo || currentUser?.photo_url || currentUser?.profile_info?.main_photo}
              alt={currentUser?.full_name || "User"}
              className="w-8 h-8 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                {currentUser?.full_name?.split(" ").map((i: string) => i?.slice(0, 1)).join("") || "US"}
              </span>
            </div>
          )}
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-gray-800 dark:text-gray-200 truncate leading-tight">
                  {currentUser?.full_name || currentUser?.profile_info?.first_name + " " + currentUser?.profile_info?.last_name}
                </p>
                <p className="text-[10px] text-gray-400 truncate">{currentUser?.role_info?.name || currentUser?.role}</p>
              </div>
              <button className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <HugeiconsIcon icon={MoreHorizontalFreeIcons} size={14} strokeWidth={2} />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
