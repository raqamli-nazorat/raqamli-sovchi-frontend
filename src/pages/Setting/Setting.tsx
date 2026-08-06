import { useEffect, useState } from "react";
import { useHeader } from "../../components/Layout/Layout";

// ---------- Toggle Switch ----------
interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
}
const Toggle = ({ checked, onChange }: ToggleProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-[28px] w-[52px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
      checked ? "bg-[#0474F3]" : "bg-[#d4d4d4] dark:bg-zinc-600"
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-[24px] w-[24px] rounded-full bg-white shadow-md transform transition-transform duration-200 ${
        checked ? "translate-x-[24px]" : "translate-x-0"
      }`}
    />
  </button>
);

// ---------- Radio Option ----------
interface RadioOptionProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: () => void;
}
const RadioOption = ({ label, checked, onChange }: RadioOptionProps) => (
  <label
    onClick={onChange}
    className={`flex items-center gap-3.5 w-full px-4 py-3.5 rounded-xl border-2 cursor-pointer transition-all duration-150 select-none ${
      checked
        ? "border-[#0474F3] bg-[#0474F3]/5 dark:bg-[#0474F3]/10"
        : "border-[#e5e5e5] dark:border-[#262626] hover:border-gray-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900/50"
    }`}
  >
    <span
      className={`flex items-center justify-center w-5 h-5 rounded-full border-2 shrink-0 transition-colors ${
        checked ? "border-[#0474F3]" : "border-[#d4d4d4] dark:border-zinc-600"
      }`}
    >
      {checked && (
        <span className="w-2.5 h-2.5 rounded-full bg-[#0474F3]" />
      )}
    </span>
    <span className={`text-[14px] font-medium ${checked ? "text-[#0474F3]" : "text-[#0a0a0a] dark:text-[#fafafa]"}`}>
      {label}
    </span>
  </label>
);

// ---------- Main Settings Page ----------
const CHAT_DURATIONS = [
  { value: "24", label: "24 soat (bir kunlik chat)" },
  { value: "72", label: "72 soat" },
  { value: "unlimited", label: "Cheklanmagan" },
] as const;

const Setting = () => {
  const { setHeaderTitle, setHeaderSubtitle } = useHeader();

  useEffect(() => {
    setHeaderTitle("Sozlamalar");
    setHeaderSubtitle("Platforma konfiguratsiyasi");
  }, [setHeaderTitle, setHeaderSubtitle]);

  const [platformSettings, setPlatformSettings] = useState({
    screenshotBlock: true,
    blurPhotos: true,
    foreignUsers: true,
    honestyOath: true,
    voiceIntro: false,
  });

  const [chatDuration, setChatDuration] = useState<"24" | "72" | "unlimited">("24");

  const togglePlatform = (key: keyof typeof platformSettings) => {
    setPlatformSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const platformItems: {
    key: keyof typeof platformSettings;
    label: string;
    description: string;
  }[] = [
    {
      key: "screenshotBlock",
      label: "Skrinshotni bloklash",
      description: "Ilovada ekrandan rasm olish taqiqlanadi",
    },
    {
      key: "blurPhotos",
      label: "Suratlar sukut bo'yicha xira",
      description: "Foydalanuvchi ruxsat bergach ochiladi",
    },
    {
      key: "foreignUsers",
      label: "Xorijdagi foydalanuvchilar",
      description: "Geolokatsiya cheklovi olib tashlanadi",
    },
    {
      key: "honestyOath",
      label: "Majburiy halollik qasami",
      description: "Ro'yxatdan o'tishda raqamli rozilik",
    },
    {
      key: "voiceIntro",
      label: "Ovozli tanishtiruv majburiy",
      description: "Anketa yakunida talab qilinadi",
    },
  ];

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ── Left: Platform Settings ── */}
        <div className="bg-white dark:bg-[#141414] rounded-2xl border border-[#e5e5e5] dark:border-[#262626] shadow-sm">
          <div className="px-6 pt-5 pb-4 border-b border-[#f5f5f5] dark:border-[#262626]">
            <h2 className="text-[15px] font-bold text-[#0a0a0a] dark:text-[#fafafa]">
              Platforma sozlamalari
            </h2>
          </div>
          <div className="px-6 py-4 space-y-0 divide-y divide-[#f5f5f5] dark:divide-[#262626]">
            {platformItems.map((item) => (
              <div
                key={item.key}
                className="flex items-center gap-4 py-4 first:pt-2 last:pb-2"
              >
                <Toggle
                  checked={platformSettings[item.key]}
                  onChange={() => togglePlatform(item.key)}
                />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[14px] font-semibold text-[#0a0a0a] dark:text-[#fafafa]">
                    {item.label}
                  </span>
                  <span className="text-[12px] text-[#737373] dark:text-zinc-400 leading-relaxed">
                    {item.description}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Chat Duration ── */}
        <div className="bg-white dark:bg-[#141414] rounded-2xl border border-[#e5e5e5] dark:border-[#262626] shadow-sm h-fit">
          <div className="px-6 pt-5 pb-4 border-b border-[#f5f5f5] dark:border-[#262626]">
            <h2 className="text-[15px] font-bold text-[#0a0a0a] dark:text-[#fafafa]">
              Chat muddati
            </h2>
          </div>
          <div className="px-6 py-5 space-y-2.5">
            {CHAT_DURATIONS.map((opt) => (
              <RadioOption
                key={opt.value}
                label={opt.label}
                checked={chatDuration === opt.value}
                onChange={() => setChatDuration(opt.value)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Setting;