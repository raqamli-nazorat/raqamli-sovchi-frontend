import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, AlertCircle } from "lucide-react";
import {
  getDashboardSummary,
  type DashboardSummaryData,
} from "../lib/dashboardApi";

// --- Types ---
type ChartTabKey = "registration" | "questionnaire" | "matches";

interface DayData {
  day: number;
  dateStr: string;
  value: number;
  change?: string;
}

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  isPositive?: boolean;
}

interface FunnelStep {
  label: string;
  count: string;
  percentage: number; // 0 - 100
}

interface TaskItem {
  id: string;
  count: number | string;
  title: string;
  subtitle: string;
  link: string;
  colorClass: string;
}

const MONTH_MAP: Record<string, string> = {
  "01": "yan",
  "02": "fev",
  "03": "mar",
  "04": "apr",
  "05": "may",
  "06": "iyun",
  "07": "iyul",
  "08": "avg",
  "09": "sen",
  "10": "okt",
  "11": "noy",
  "12": "dek",
};

const formatTrendDay = (dateStr: string) => {
  const parts = (dateStr || "").split("-");
  if (parts.length === 3) {
    const day = parseInt(parts[2], 10);
    const m = MONTH_MAP[parts[1]] || parts[1];
    return { day, dateStr: `${day}-${m}` };
  }
  return { day: 0, dateStr };
};

const formatNumber = (num?: number | null): string => {
  if (num === null || num === undefined) return "0";
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

const TAB_CONFIG: Record<
  ChartTabKey,
  {
    titlePrefix: string;
    tabLabel: string;
    metricLabel: string;
    footerPrefix: string;
  }
> = {
  registration: {
    titlePrefix: "Ro'yxatdan o'tish",
    tabLabel: "Ro'yxatdan o'tish",
    metricLabel: "yangi ro'yxat",
    footerPrefix: "yangi ro'yxat",
  },
  questionnaire: {
    titlePrefix: "Anketa",
    tabLabel: "Anketa",
    metricLabel: "to'ldirilgan anketa",
    footerPrefix: "to'ldirilgan anketa",
  },
  matches: {
    titlePrefix: "Mosliklar",
    tabLabel: "Mosliklar",
    metricLabel: "yangi moslik topildi",
    footerPrefix: "yangi moslik topildi",
  },
};

const HomePage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardSummaryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<ChartTabKey>("registration");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const loadSummary = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const summary = await getDashboardSummary();
      setData(summary);
    } catch (err: any) {
      console.error("Dashboard summary load error:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Boshqaruv paneli ma'lumotlarini yuklashda xatolik yuz berdi"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  // --- 1. STATS CARDS DATA ---
  const usersCount = data?.totals?.users?.value ?? 0;
  const usersDelta = data?.totals?.users?.delta_week ?? null;
  const usersSubtitle =
    usersDelta === null || usersDelta === undefined
      ? "0 shu hafta"
      : usersDelta > 0
      ? `+${formatNumber(usersDelta)} shu hafta`
      : `${formatNumber(usersDelta)} shu hafta`;

  const profilesCount = data?.totals?.profiles_filled?.value ?? 0;
  const conversionPct = data?.totals?.profiles_filled?.conversion_pct ?? 0;
  const conversionSubtitle = `${conversionPct}% konversiya`;

  const activeChatsCount = data?.totals?.active_chats?.value ?? 0;

  const marriedCount = data?.totals?.married?.value ?? 0;
  const marriedDelta = data?.totals?.married?.delta_month ?? null;
  const marriedSubtitle =
    marriedDelta === null || marriedDelta === undefined
      ? "0 shu oy"
      : marriedDelta > 0
      ? `+${formatNumber(marriedDelta)} shu oy`
      : `${formatNumber(marriedDelta)} shu oy`;

  const statsData: StatCardProps[] = [
    {
      title: "Jami foydalanuvchi",
      value: formatNumber(usersCount),
      subtitle: usersSubtitle,
      isPositive: (usersDelta ?? 0) > 0,
    },
    {
      title: "Anketa toʼldirgan",
      value: formatNumber(profilesCount),
      subtitle: conversionSubtitle,
      isPositive: false,
    },
    {
      title: "Aktiv suhbat",
      value: formatNumber(activeChatsCount),
      subtitle: "24 soatlik limit",
      isPositive: false,
    },
    {
      title: "Nikohga yetgan",
      value: formatNumber(marriedCount),
      subtitle: marriedSubtitle,
      isPositive: (marriedDelta ?? 0) > 0,
    },
  ];

  // --- 2. 14-DAY TREND CHART DATA ---
  const trendDays = data?.trend?.days || [];
  const getValuesByTab = (tab: ChartTabKey): number[] => {
    if (!data?.trend) return [];
    if (tab === "registration") return data.trend.registrations || [];
    if (tab === "questionnaire") return data.trend.questionnaires || [];
    return data.trend.matches || [];
  };

  const currentValues = getValuesByTab(activeTab);

  const currentDays: DayData[] = trendDays.map((dateStr, idx) => {
    const { day, dateStr: formattedDate } = formatTrendDay(dateStr);
    const value = currentValues[idx] ?? 0;
    let change: string | undefined;

    if (idx > 0) {
      const prev = currentValues[idx - 1] ?? 0;
      if (prev === 0) {
        if (value > 0) change = `+${value}`;
      } else {
        const pct = Math.round(((value - prev) / prev) * 100);
        change = pct > 0 ? `+${pct}%` : `${pct}%`;
      }
    }

    return {
      day,
      dateStr: formattedDate,
      value,
      change,
    };
  });

  const todayIndex = currentDays.length > 0 ? currentDays.length - 1 : 0;
  const activeDay =
    hoveredIndex !== null && currentDays[hoveredIndex]
      ? currentDays[hoveredIndex]
      : currentDays[todayIndex] || { day: 0, dateStr: "-", value: 0 };

  const maxDayValue = Math.max(...currentDays.map((d) => d.value), 0);

  const tabOptions: { key: ChartTabKey; label: string }[] = [
    { key: "registration", label: TAB_CONFIG.registration.tabLabel },
    { key: "questionnaire", label: TAB_CONFIG.questionnaire.tabLabel },
    { key: "matches", label: TAB_CONFIG.matches.tabLabel },
  ];

  const chartTitle = `${TAB_CONFIG[activeTab].titlePrefix} · ${
    currentDays.length || 14
  } kun`;

  // --- 3. FUNNEL DATA ---
  const regCount = data?.funnel?.registered ?? 0;
  const profileFilledCount = data?.funnel?.profile_filled ?? 0;
  const questionsDoneCount = data?.funnel?.questions_done ?? 0;
  const requestSentCount = data?.funnel?.request_sent ?? 0;
  const chatStartedCount = data?.funnel?.chat_started ?? 0;

  const calcPercentage = (count: number, base: number): number => {
    if (!base || base <= 0) return 0;
    const pct = (count / base) * 100;
    return Math.min(100, Math.round(pct * 10) / 10);
  };

  const funnelSteps: FunnelStep[] = [
    {
      label: "Ro'yxatdan o'tdi",
      count: formatNumber(regCount),
      percentage: regCount > 0 ? 100 : 0,
    },
    {
      label: "Profil to'ldirdi",
      count: formatNumber(profileFilledCount),
      percentage: calcPercentage(profileFilledCount, regCount),
    },
    {
      label: "30 savolni tugatdi",
      count: formatNumber(questionsDoneCount),
      percentage: calcPercentage(questionsDoneCount, regCount),
    },
    {
      label: "Taklif yubordi",
      count: formatNumber(requestSentCount),
      percentage: calcPercentage(requestSentCount, regCount),
    },
    {
      label: "Suhbat boshladi",
      count: formatNumber(chatStartedCount),
      percentage: calcPercentage(chatStartedCount, regCount),
    },
  ];

  // --- 4. TASKS DATA ---
  const tasksData: TaskItem[] = [
    {
      id: "moderation",
      count: data?.tasks?.profile_moderation ?? 0,
      title: "Profil moderatsiyasi",
      subtitle: "Selfi va rasm tekshiruvi kutilmoqda",
      link: "/profile-moderation",
      colorClass: "text-[#0474F3] dark:text-[#38bdf8]",
    },
    {
      id: "ai-signals",
      count: data?.tasks?.ai_signals ?? 0,
      title: "AI signallari",
      subtitle: "Suhbatlardagi qoidabuzarliklar",
      link: "/ai-chat",
      colorClass: "text-[#7F1D1D] dark:text-[#ef4444]",
    },
    {
      id: "appeals",
      count: data?.tasks?.complaints_open ?? 0,
      title: "Shikoyatlar",
      subtitle: "24 soat ichida ko'rilishi shart",
      link: "/appeals",
      colorClass: "text-[#92400E] dark:text-[#fb923c]",
    },
  ];

  return (
    <div className="p-6 space-y-4">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl p-4 flex items-center justify-between gap-3 text-red-700 dark:text-red-300 text-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => loadSummary(true)}
            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-xs transition-colors flex items-center gap-1.5 cursor-pointer flex-shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Qayta urinish</span>
          </button>
        </div>
      )}

      {/* 1. TOP STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading && !data
          ? Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-[#141414] border border-[#e5e5e5] dark:border-[#262626] rounded-xl px-4 py-3 shadow-xs flex flex-col justify-between max-h-27 animate-pulse"
              >
                <div>
                  <div className="h-3 w-28 bg-gray-200 dark:bg-gray-800 rounded mb-2.5" />
                  <div className="h-7 w-20 bg-gray-200 dark:bg-gray-800 rounded" />
                </div>
                <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded mt-3" />
              </div>
            ))
          : statsData.map((stat, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-[#141414] border border-[#e5e5e5] dark:border-[#262626] rounded-xl px-4 py-3 shadow-xs flex flex-col justify-between max-h-27"
              >
                <div>
                  <span className="text-[12px] font-medium text-[#737373] dark:text-[#a3a3a3]">
                    {stat.title}
                  </span>
                  <div className="mt-1.5 text-[26px] font-bold tracking-tight text-[#0A0A0A] dark:text-[#fafafa] leading-none">
                    {stat.value}
                  </div>
                </div>
                <div className="mt-3 flex items-center text-[11px] font-medium">
                  {stat.isPositive ? (
                    <span className="text-[#047857] dark:text-[#34d399] flex items-center gap-1 font-semibold">
                      {stat.subtitle}
                    </span>
                  ) : (
                    <span className="text-[#737373] dark:text-[#a3a3a3]">
                      {stat.subtitle}
                    </span>
                  )}
                </div>
              </div>
            ))}
      </div>

      {/* 2. MIDDLE SECTION: 14-DAY BAR CHART & FUNNEL */}
      <div className="grid grid-cols-1 lg:grid-cols-13 gap-4 items-stretch">
        {/* LEFT: 14-Day Bar Chart Card (col-span-8) */}
        <div className="lg:col-span-8 bg-white dark:bg-[#141414] border border-[#e5e5e5] dark:border-[#262626] rounded-xl p-4.5 shadow-xs flex flex-col justify-between">
          {/* Header & Tabs */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-3 pb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-[13px] font-semibold text-[#0A0A0A] dark:text-[#fafafa] tracking-tight">
                {chartTitle}
              </h2>
              {refreshing && (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0070F3]" />
              )}
            </div>

            {/* Segmented Tab Buttons */}
            <div className="inline-flex items-center gap-1.5 self-start sm:self-auto">
              {tabOptions.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.key);
                      setHoveredIndex(null);
                    }}
                    className={`px-3 h-[25px] rounded-md text-[11px] font-semibold transition-all duration-150 cursor-pointer ${
                      isActive
                        ? "bg-[#0A0A0A] text-white dark:bg-white dark:text-[#0A0A0A] shadow-xs font-semibold"
                        : "bg-[#F5F5F5] text-[#525252] hover:text-[#0A0A0A] dark:text-[#a3a3a3] dark:hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chart Content Area */}
          <div className="pt-8 pb-2">
            {loading && !data ? (
              <div className="h-[210px] w-full flex items-end justify-between gap-2 animate-pulse">
                {Array.from({ length: 14 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gray-200 dark:bg-gray-800 rounded-t-md"
                    style={{ height: `${20 + ((i * 17) % 75)}%` }}
                  />
                ))}
              </div>
            ) : currentDays.length === 0 ? (
              <div className="h-[210px] w-full flex items-center justify-center text-sm text-[#737373] dark:text-[#a3a3a3]">
                Ma'lumotlar mavjud emas
              </div>
            ) : (
              /* Bar Columns with Tooltip & Hover interaction */
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${currentDays.length}, minmax(0, 1fr))`,
                }}
                className="gap-1.5 sm:gap-2 md:gap-3 items-end h-[210px] w-full relative"
              >
                {currentDays.map((item, index) => {
                  const isToday = index === todayIndex;
                  const isHovered = hoveredIndex === index;

                  // Height calculation: scale zero values as thin bar, positive scaled between 15% and 95%
                  const heightPercentage =
                    maxDayValue === 0
                      ? 5
                      : item.value === 0
                      ? 5
                      : Math.max(
                          12,
                          Math.round((item.value / maxDayValue) * 85 + 10)
                        );

                  return (
                    <div
                      key={`${item.dateStr}-${index}`}
                      className="flex flex-col items-center h-full justify-end group relative cursor-pointer"
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      {/* Hover Floating Tooltip - ONLY shows on hover */}
                      {isHovered && (
                        <div className="absolute -top-12 z-20 pointer-events-none flex flex-col items-center animate-in fade-in zoom-in-95 duration-150">
                          <div className="bg-[#0A0A0A] dark:bg-white text-white dark:text-[#0A0A0A] text-[11px] font-semibold py-1 px-2.5 rounded-lg shadow-lg whitespace-nowrap flex items-center gap-1.5">
                            <span>{item.dateStr}:</span>
                            <span className="text-[#38bdf8] dark:text-[#0070F3] font-bold">
                              {item.value}
                            </span>
                          </div>
                          <div className="w-2 h-1 border-x-4 border-x-transparent border-t-4 border-t-[#0A0A0A] dark:border-t-white" />
                        </div>
                      )}

                      {/* Bar Cylinder */}
                      <div className="w-full flex justify-center items-end h-full">
                        <div
                          style={{ height: `${heightPercentage}%` }}
                          className={`w-full max-w-[42px] rounded-t-md transition-all duration-200 ${
                            isHovered
                              ? "bg-[#0070F3] shadow-md shadow-[#0070F3]/30 scale-[1.03]"
                              : isToday
                              ? "bg-[#0070F3]"
                              : "bg-[#E5E7EB] dark:bg-[#262626] group-hover:bg-[#0070F3]/80"
                          }`}
                        />
                      </div>

                      {/* Day Label */}
                      <span
                        className={`mt-3 text-[10px] transition-colors ${
                          isHovered || (hoveredIndex === null && isToday)
                            ? "text-[#0A0A0A] dark:text-white font-bold"
                            : "text-[#a3a3a3] dark:text-[#737373] group-hover:text-[#0A0A0A] dark:group-hover:text-white"
                        }`}
                      >
                        {item.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Summary of selected / hovered bar */}
          <div className="flex items-center justify-between text-[12px] text-[#737373] dark:text-[#a3a3a3] pt-2">
            <div>
              Tanlangan kun:{" "}
              <span className="text-[#0A0A0A] dark:text-[#fafafa] font-medium">
                {activeDay.dateStr}
              </span>{" "}
              ·{" "}
              <span className="text-[#0A0A0A] dark:text-[#fafafa] font-medium">
                {activeDay.value} ta {TAB_CONFIG[activeTab].footerPrefix}
              </span>
              {activeDay.change && (
                <span className="ml-1 text-[#047857] dark:text-[#34d399] font-medium">
                  ({activeDay.change})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Funnel Card (col-span-5) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#141414] border border-[#e5e5e5] dark:border-[#262626] rounded-xl p-4.5 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-[13px] font-semibold text-[#0A0A0A] dark:text-[#fafafa] tracking-tight mb-5">
              Anketa to'ldirish voronkasi
            </h2>

            {/* Funnel Stages */}
            <div className="space-y-4">
              {loading && !data
                ? Array.from({ length: 5 }).map((_, idx) => (
                    <div key={idx} className="animate-pulse space-y-1.5">
                      <div className="flex justify-between">
                        <div className="h-3 w-28 bg-gray-200 dark:bg-gray-800 rounded" />
                        <div className="h-3 w-10 bg-gray-200 dark:bg-gray-800 rounded" />
                      </div>
                      <div className="w-full bg-[#f3f4f6] dark:bg-[#202020] h-2.5 rounded-full" />
                    </div>
                  ))
                : funnelSteps.map((step, idx) => (
                    <div key={idx} className="group">
                      {/* Step Name & Value */}
                      <div className="flex items-center justify-between text-[12px] mb-1.5">
                        <span className="text-[#404040] dark:text-[#a3a3a3] group-hover:text-[#0A0A0A] dark:group-hover:text-white transition-colors">
                          {step.label}
                        </span>
                        <span className="text-[#404040] dark:text-[#fafafa] tracking-tight font-medium">
                          {step.count}
                        </span>
                      </div>

                      {/* Funnel Progress Bar */}
                      <div className="w-full bg-[#f3f4f6] dark:bg-[#202020] h-2.5 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${step.percentage}%` }}
                          className="bg-[#0070F3] h-full rounded-full transition-all duration-500 ease-out group-hover:brightness-110"
                        />
                      </div>
                    </div>
                  ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM SECTION: NAVBATDAGI VAZIFALAR */}
      <div className="bg-white dark:bg-[#141414] border border-[#e5e5e5] dark:border-[#262626] rounded-xl p-4.5 shadow-xs">
        <h2 className="text-[13px] font-semibold text-[#0A0A0A] dark:text-[#fafafa] tracking-tight mb-4">
          Navbatdagi vazifalar
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 md:gap-4">
          {loading && !data
            ? Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="border border-[#e5e5e5] dark:border-[#262626] rounded-xl p-4 md:p-5 bg-white dark:bg-[#141414] animate-pulse"
                >
                  <div className="h-6 w-12 bg-gray-200 dark:bg-gray-800 rounded mb-3" />
                  <div className="h-3.5 w-32 bg-gray-200 dark:bg-gray-800 rounded mb-2" />
                  <div className="h-3 w-44 bg-gray-200 dark:bg-gray-800 rounded" />
                </div>
              ))
            : tasksData.map((task) => (
                <div
                  key={task.id}
                  onClick={() => navigate(task.link)}
                  className="border border-[#e5e5e5] dark:border-[#262626] rounded-xl p-4 md:p-5 transition-all duration-200 cursor-pointer bg-white dark:bg-[#141414] hover:border-[#0070F3]/40 hover:shadow-xs"
                >
                  {/* Big metric count */}
                  <div
                    className={`text-[22px] font-bold leading-none ${task.colorClass}`}
                  >
                    {task.count}
                  </div>

                  {/* Title */}
                  <div className="mt-3 text-[12px] font-semibold text-[#0A0A0A] dark:text-[#fafafa]">
                    {task.title}
                  </div>

                  {/* Subtitle / Description */}
                  <div className="mt-1 text-[11px] text-[#737373] dark:text-[#a3a3a3] leading-normal">
                    {task.subtitle}
                  </div>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;