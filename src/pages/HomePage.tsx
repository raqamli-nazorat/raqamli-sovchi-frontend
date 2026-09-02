import { useState } from "react";
import { useNavigate } from "react-router-dom";

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

// --- Mock Data ---
const STATS_DATA: StatCardProps[] = [
  {
    title: "Jami foydalanuvchi",
    value: "12 480",
    subtitle: "+412 shu hafta",
    isPositive: true,
  },
  {
    title: "Anketa toʼldirgan",
    value: "7 106",
    subtitle: "57% konversiya",
    isPositive: false,
  },
  {
    title: "Aktiv suhbat",
    value: "318",
    subtitle: "24 soatlik limit",
    isPositive: false,
  },
  {
    title: "Nikohga yetgan",
    value: "164",
    subtitle: "+9 shu oy",
    isPositive: true,
  },
];

const CHART_DATA: Record<
  ChartTabKey,
  {
    title: string;
    tabLabel: string;
    metricLabel: string;
    footerPrefix: string;
    maxScale: number;
    days: DayData[];
  }
> = {
  registration: {
    title: "Ro'yxatdan o'tish · 14 kun",
    tabLabel: "Ro'yxatdan o'tish",
    metricLabel: "yangi ro'yxat",
    footerPrefix: "yangi ro'yxat",
    maxScale: 110,
    days: [
      { day: 16, dateStr: "16-iyul", value: 36, change: "+4%" },
      { day: 17, dateStr: "17-iyul", value: 44, change: "+22%" },
      { day: 18, dateStr: "18-iyul", value: 32, change: "-27%" },
      { day: 19, dateStr: "19-iyul", value: 62, change: "+93%" },
      { day: 20, dateStr: "20-iyul", value: 54, change: "-13%" },
      { day: 21, dateStr: "21-iyul", value: 72, change: "+33%" },
      { day: 22, dateStr: "22-iyul", value: 66, change: "-8%" },
      { day: 23, dateStr: "23-iyul", value: 80, change: "+21%" },
      { day: 24, dateStr: "24-iyul", value: 74, change: "-7%" },
      { day: 25, dateStr: "25-iyul", value: 96, change: "+30%" },
      { day: 26, dateStr: "26-iyul", value: 88, change: "-8%" },
      { day: 27, dateStr: "27-iyul", value: 100, change: "+13%" },
      { day: 28, dateStr: "28-iyul", value: 92, change: "-8%" },
      { day: 29, dateStr: "29-iyul", value: 104, change: "+13%" },
    ],
  },
  questionnaire: {
    title: "Anketa · 14 kun",
    tabLabel: "Anketa",
    metricLabel: "to'ldirilgan anketa",
    footerPrefix: "to'ldirilgan anketa",
    maxScale: 90,
    days: [
      { day: 16, dateStr: "16-iyul", value: 24, change: "+2%" },
      { day: 17, dateStr: "17-iyul", value: 32, change: "+33%" },
      { day: 18, dateStr: "18-iyul", value: 20, change: "-37%" },
      { day: 19, dateStr: "19-iyul", value: 46, change: "+130%" },
      { day: 20, dateStr: "20-iyul", value: 38, change: "-17%" },
      { day: 21, dateStr: "21-iyul", value: 52, change: "+36%" },
      { day: 22, dateStr: "22-iyul", value: 48, change: "-7%" },
      { day: 23, dateStr: "23-iyul", value: 60, change: "+25%" },
      { day: 24, dateStr: "24-iyul", value: 55, change: "-8%" },
      { day: 25, dateStr: "25-iyul", value: 74, change: "+34%" },
      { day: 26, dateStr: "26-iyul", value: 68, change: "-8%" },
      { day: 27, dateStr: "27-iyul", value: 80, change: "+17%" },
      { day: 28, dateStr: "28-iyul", value: 72, change: "-10%" },
      { day: 29, dateStr: "29-iyul", value: 78, change: "+8%" },
    ],
  },
  matches: {
    title: "Mosliklar · 14 kun",
    tabLabel: "Mosliklar",
    metricLabel: "yangi moslik topildi",
    footerPrefix: "yangi moslik topildi",
    maxScale: 60,
    days: [
      { day: 16, dateStr: "16-iyul", value: 10, change: "+1%" },
      { day: 17, dateStr: "17-iyul", value: 14, change: "+40%" },
      { day: 18, dateStr: "18-iyul", value: 11, change: "-21%" },
      { day: 19, dateStr: "19-iyul", value: 18, change: "+63%" },
      { day: 20, dateStr: "20-iyul", value: 15, change: "-16%" },
      { day: 21, dateStr: "21-iyul", value: 22, change: "+46%" },
      { day: 22, dateStr: "22-iyul", value: 19, change: "-13%" },
      { day: 23, dateStr: "23-iyul", value: 25, change: "+31%" },
      { day: 24, dateStr: "24-iyul", value: 21, change: "-16%" },
      { day: 25, dateStr: "25-iyul", value: 29, change: "+38%" },
      { day: 26, dateStr: "26-iyul", value: 26, change: "-10%" },
      { day: 27, dateStr: "27-iyul", value: 33, change: "+26%" },
      { day: 28, dateStr: "28-iyul", value: 28, change: "-15%" },
      { day: 29, dateStr: "29-iyul", value: 32, change: "+14%" },
    ],
  },
};

const FUNNEL_DATA: FunnelStep[] = [
  { label: "Ro'yxatdan o'tdi", count: "12 480", percentage: 100 },
  { label: "Profil to'ldirdi", count: "9 842", percentage: 78.8 },
  { label: "30 savolni tugatdi", count: "7 106", percentage: 56.9 },
  { label: "Taklif yubordi", count: "3 954", percentage: 31.7 },
  { label: "Suhbat boshladi", count: "2 118", percentage: 17.0 },
  { label: "Suhbat tugallandi", count: "2 131", percentage: 24.5 },
];

const TASKS_DATA: TaskItem[] = [
  {
    id: "moderation",
    count: 4,
    title: "Profil moderatsiyasi",
    subtitle: "Selfi va rasm tekshiruvi kutilmoqda",
    link: "/profile-moderation",
    colorClass: "text-[#0474F3] dark:text-[#38bdf8]",
  },
  {
    id: "ai-signals",
    count: 18,
    title: "AI signallari",
    subtitle: "Suhbatlardagi qoidabuzarliklar",
    link: "/ai-chat",
    colorClass: "text-[#7F1D1D] dark:text-[#ef4444]",
  },
  {
    id: "appeals",
    count: 4,
    title: "Shikoyatlar",
    subtitle: "24 soat ichida ko'rilishi shart",
    link: "/appeals",
    colorClass: "text-[#92400E] dark:text-[#fb923c]",
  },
];

const HomePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ChartTabKey>("registration");
  
  // Today is the last item in the 14-day array
  const currentDays = CHART_DATA[activeTab].days;
  const todayIndex = currentDays.length - 1;
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // When hovering, activeDay is the hovered one; otherwise, it's today
  const activeDay = hoveredIndex !== null ? currentDays[hoveredIndex] : currentDays[todayIndex];

  // Calculate max value for relative bar heights
  const maxDayValue = Math.max(...currentDays.map((d) => d.value));

  const tabOptions: { key: ChartTabKey; label: string }[] = [
    { key: "registration", label: "Ro'yxatdan o'tish" },
    { key: "questionnaire", label: "Anketa" },
    { key: "matches", label: "Mosliklar" },
  ];

  return (
    <div className="p-6 space-y-4">
      {/* 1. TOP STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS_DATA.map((stat, idx) => (
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
            <h2 className="text-[15px] md:text-[16px] font-semibold text-[#0A0A0A] dark:text-[#fafafa] tracking-tight">
              {CHART_DATA[activeTab].title}
            </h2>

            {/* Segmented Tab Buttons */}
            <div className="inline-flex items-center bg-[#F3F4F6] dark:bg-[#1c1c1c] p-1 rounded-xl gap-0.5 self-start sm:self-auto border border-neutral-200/50 dark:border-neutral-800">
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
                    className={`px-3.5 py-1.5 rounded-lg text-[12px] md:text-[13px] font-medium transition-all duration-150 cursor-pointer ${
                      isActive
                        ? "bg-[#0A0A0A] text-white dark:bg-white dark:text-[#0A0A0A] shadow-xs font-semibold"
                        : "text-[#737373] hover:text-[#0A0A0A] dark:text-[#a3a3a3] dark:hover:text-white"
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
            {/* 14 Bar Columns with Tooltip & Hover interaction */}
            <div 
              style={{ display: "grid", gridTemplateColumns: "repeat(14, minmax(0, 1fr))" }}
              className="gap-1.5 sm:gap-2 md:gap-3 items-end h-[210px] w-full relative"
            >
              {currentDays.map((item, index) => {
                const isToday = index === todayIndex;
                const isHovered = hoveredIndex === index;
                
                // Height calculation: scale with min 20% to max 95%
                const heightPercentage = Math.round((item.value / maxDayValue) * 85 + 15);

                return (
                  <div
                    key={item.day}
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
                        className={`w-full max-w-[42px] rounded-lg transition-all duration-200 ${
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
                      className={`mt-3 text-[11px] md:text-[12px] font-medium transition-colors ${
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
          </div>

          {/* Footer Summary of selected / hovered bar */}
          <div className="mt-4 pt-3 border-t border-[#f0f0f0] dark:border-[#202020] flex items-center justify-between text-[12px] md:text-[13px] text-[#737373] dark:text-[#a3a3a3]">
            <div>
              Tanlangan kun:{" "}
              <span className="font-semibold text-[#0A0A0A] dark:text-[#fafafa]">
                {activeDay.dateStr}
              </span>{" "}
              ·{" "}
              <span className="font-semibold text-[#0A0A0A] dark:text-[#fafafa]">
                {activeDay.value} ta {CHART_DATA[activeTab].footerPrefix}
              </span>
              {activeDay.change && (
                <span className="ml-2 text-[11px] font-medium text-emerald-500">
                  ({activeDay.change})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Funnel Card (col-span-4) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#141414] border border-[#e5e5e5] dark:border-[#262626] rounded-xl p-4.5 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-[15px] md:text-[16px] font-semibold text-[#0A0A0A] dark:text-[#fafafa] tracking-tight mb-5">
              Anketa to'ldirish voronkasi
            </h2>

            {/* 5 Funnel Stages */}
            <div className="space-y-4 md:space-y-5">
              {FUNNEL_DATA.map((step, idx) => (
                <div key={idx} className="group">
                  {/* Step Name & Value */}
                  <div className="flex items-center justify-between text-[13px] mb-1.5">
                    <span className="text-[#525252] dark:text-[#a3a3a3] font-medium group-hover:text-[#0A0A0A] dark:group-hover:text-white transition-colors">
                      {step.label}
                    </span>
                    <span className="text-[#0A0A0A] dark:text-[#fafafa] font-semibold tracking-tight">
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
        <h2 className="text-[14px] md:text-[15px] font-semibold text-[#0A0A0A] dark:text-[#fafafa] tracking-tight mb-4">
          Navbatdagi vazifalar
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 md:gap-4">
          {TASKS_DATA.map((task) => (
            <div
              key={task.id}
              onClick={() => navigate(task.link)}
              className="border border-[#e5e5e5] dark:border-[#262626] rounded-xl p-4 md:p-5 transition-all duration-200 cursor-pointer bg-white dark:bg-[#141414]"
            >
              {/* Big metric count */}
              <div className={`text-[24px] md:text-[26px] font-bold leading-none ${task.colorClass}`}>
                {task.count}
              </div>

              {/* Title */}
              <div className="mt-3 text-[13px] md:text-[14px] font-semibold text-[#0A0A0A] dark:text-[#fafafa]">
                {task.title}
              </div>

              {/* Subtitle / Description */}
              <div className="mt-1 text-[11px] md:text-[12px] text-[#737373] dark:text-[#a3a3a3] leading-normal">
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