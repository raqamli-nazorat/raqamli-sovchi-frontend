import { useState } from "react";

type Severity = "Yuqori" | "O'rta" | "Past";

interface AiSignal {
  id: string;
  user: string;
  signal: string;
  severity: Severity;
  action: string;
  blocked: boolean;
}

// ── Mock ma'lumotlar — AI moderator endpointi tayyor bo'lgach API'ga ulanadi ──
const STATS = [
  { label: "Tekshirilgan xabar (24s)", value: "48 210" },
  { label: "Bloklangan xabar", value: "392" },
  { label: "Ogohlantirish", value: "1 044" },
  { label: "Bloklangan profil", value: "27" },
];

const INITIAL_SIGNALS: AiSignal[] = [
  {
    id: "sig-1",
    user: "USR-10511",
    signal: "«rasm yuborib turing, hech kim ko'rmaydi…»",
    severity: "Yuqori",
    action: "Xabar bloklandi",
    blocked: false,
  },
  {
    id: "sig-2",
    user: "USR-10241",
    signal: "«telefon raqamingizni bering» (3-marta)",
    severity: "O'rta",
    action: "Ogohlantirish",
    blocked: false,
  },
  {
    id: "sig-3",
    user: "USR-10688",
    signal: "Odobsiz so'z aniqlandi",
    severity: "Yuqori",
    action: "Xabar bloklandi",
    blocked: true,
  },
  {
    id: "sig-4",
    user: "USR-10604",
    signal: "Tashqi havola yuborishga urinish",
    severity: "Past",
    action: "Kuzatuvda",
    blocked: false,
  },
  {
    id: "sig-5",
    user: "USR-10318",
    signal: "Moliyaviy taklif belgilari",
    severity: "O'rta",
    action: "Ogohlantirish",
    blocked: false,
  },
];

const severityStyles: Record<Severity, string> = {
  Yuqori: "bg-[#FEF2F2] dark:bg-[#3a1414] text-[#DC2626]",
  "O'rta": "bg-[#FEFCE8] dark:bg-[#332b0d] text-[#A16207]",
  Past: "bg-[#F5F5F5] dark:bg-[#262626] text-[#525252] dark:text-[#A3A3A3]",
};

const AiModeratorPage = () => {
  const [signals, setSignals] = useState<AiSignal[]>(INITIAL_SIGNALS);

  const toggleBlock = (id: string) => {
    setSignals((prev) => prev.map((s) => (s.id === id ? { ...s, blocked: !s.blocked } : s)));
  };

  return (
    <div className="p-6 space-y-6">
      {/* ── Statistika kartalari ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#262626] rounded-2xl p-5"
          >
            <p className="text-[13px] text-[#737373] dark:text-[#A3A3A3]">{stat.label}</p>
            <p className="text-[30px] font-bold text-[#0A0A0A] dark:text-white mt-2 tracking-tight tabular-nums">
              {stat.value}
            </p>
            <p className="text-[12px] text-[#A3A3A3] mt-2">so'nggi 24 soat</p>
          </div>
        ))}
      </div>

      {/* ── Signallar jadvali ── */}
      <div className="bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#262626] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#FAFAFA] dark:bg-[#1c1c1c] border-b border-[#F0F0F0] dark:border-[#262626]">
                <th className="px-6 py-3.5 text-[13px] font-medium text-[#525252] dark:text-[#A3A3A3]">
                  Foydalanuvchi
                </th>
                <th className="px-6 py-3.5 text-[13px] font-medium text-[#525252] dark:text-[#A3A3A3]">Signal</th>
                <th className="px-6 py-3.5 text-[13px] font-medium text-[#525252] dark:text-[#A3A3A3]">Darajasi</th>
                <th className="px-6 py-3.5 text-[13px] font-medium text-[#525252] dark:text-[#A3A3A3]">Chora</th>
                <th className="px-6 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {signals.map((row, idx) => (
                <tr
                  key={row.id}
                  className={
                    idx < signals.length - 1 ? "border-b border-[#F0F0F0] dark:border-[#262626]" : ""
                  }
                >
                  <td className="px-6 py-4 text-[13px] font-medium text-[#404040] dark:text-[#D4D4D4] tabular-nums">
                    {row.user}
                  </td>
                  <td className="px-6 py-4 text-[14px] text-[#404040] dark:text-[#D4D4D4]">{row.signal}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${severityStyles[row.severity]}`}
                    >
                      {row.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[13px] text-[#525252] dark:text-[#A3A3A3]">{row.action}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => toggleBlock(row.id)}
                      className={`text-[13px] font-bold transition-colors cursor-pointer ${
                        row.blocked
                          ? "text-[#404040] dark:text-[#D4D4D4] hover:text-[#0A0A0A] dark:hover:text-white"
                          : "text-[#D32F2F] hover:text-[#B91C1C]"
                      }`}
                    >
                      {row.blocked ? "Blokdan chiqarish" : "Profilni bloklash"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AiModeratorPage;
