import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type AppealStatus = "in_review" | "approved" | "rejected";

export interface ChatMessage {
  side: "left" | "right";
  text: string;
  time: string;
  flagged?: boolean;
}

export interface AppealDetailAnalysis {
  level: string;
  warnings: string;
  reports: string;
  advice: string;
}

export interface AppealDetailProfile {
  status: string;
  registered: string;
  questionnaire: string;
  aiSignals: string;
}

export interface Appeal {
  id: string;
  fromUser: string;
  fromName: string;
  toUser: string;
  toName: string;
  tag: string;
  description: string;
  time: string;
  status: AppealStatus;
  moderator?: string;
  resolvedAt?: string;
  rejectReason?: string;
  chat?: ChatMessage[];
  analysis?: AppealDetailAnalysis;
  profile?: AppealDetailProfile;
}

interface IState {
  items: Appeal[];
}

const DEFAULT_CHAT: ChatMessage[] = [
  { side: "left", text: "Assalomu alaykum. Taklifingiz uchun rahmat.", time: "09:02" },
  { side: "right", text: "Va alaykum assalom. Vaqtingiz bo'lsa tanishsak.", time: "09:04" },
  { side: "left", text: "Rasmingizni yuboring, hech kim ko'rmaydi.", time: "09:09", flagged: true },
  { side: "right", text: "Bunday so'rovga javob bermayman.", time: "09:12" },
];

const DEFAULT_ANALYSIS: AppealDetailAnalysis = {
  level: "Yuqori",
  warnings: "2 marta",
  reports: "3 ta",
  advice: "Profilni bloklash",
};

const DEFAULT_PROFILE: AppealDetailProfile = {
  status: "Bloklangan",
  registered: "02.02.2026",
  questionnaire: "30/30 · 100%",
  aiSignals: "4 ta",
};

const initialState: IState = {
  items: [
    {
      id: "1",
      fromUser: "USR-10318",
      fromName: "Mohira Rasulova",
      toUser: "USR-10511",
      toName: "Bekzod Qodirov",
      tag: "Odobsiz so'z",
      description: "Suhbatda haqoratli iboralar ishlatilgan. Chat tarixi ilova qilindi.",
      time: "12.03.2026 09:14",
      status: "in_review",
      chat: DEFAULT_CHAT,
      analysis: DEFAULT_ANALYSIS,
      profile: DEFAULT_PROFILE,
    },
    {
      id: "2",
      fromUser: "USR-10455",
      fromName: "Nilufar Ergasheva",
      toUser: "USR-10241",
      toName: "Jasur Toshmatov",
      tag: "Soxta profil",
      description: "Rasmlar boshqa shaxsga tegishli bo'lishi mumkin.",
      time: "11.03.2026 18:22",
      status: "in_review",
      chat: [
        { side: "left", text: "Salom! Profilingiz juda yoqdi.", time: "14:20" },
        { side: "right", text: "Rahmat. Rasmlaringiz o'zingizga tegishlimi?", time: "14:25" },
        { side: "left", text: "Albatta o'zimniki, shubha qilmang.", time: "14:31", flagged: true },
      ],
      analysis: { level: "O'rta", warnings: "1 marta", reports: "2 ta", advice: "Qo'shimcha tekshirish" },
      profile: { status: "Faol", registered: "15.03.2026", questionnaire: "24/30 · 80%", aiSignals: "2 ta" },
    },
    {
      id: "3",
      fromUser: "USR-10604",
      fromName: "Dilnoza Karimova",
      toUser: "USR-10688",
      toName: "Sardor Aliyev",
      tag: "Nikoh niyati yo'q",
      description: "Foydalanuvchi maqsadi anketaga mos emas.",
      time: "11.03.2026 15:47",
      status: "approved",
      moderator: "A. Muxtorov",
      resolvedAt: "11.03.2026 16:30",
      chat: [
        { side: "left", text: "Assalomu alaykum, tanishsak bo'ladimi?", time: "11:05" },
        { side: "right", text: "Men bu yerda shunchaki do'st izlayapman.", time: "11:12", flagged: true },
      ],
      analysis: { level: "Past", warnings: "0 marta", reports: "1 ta", advice: "Ogohlantirish yuborish" },
      profile: { status: "Faol", registered: "28.04.2026", questionnaire: "30/30 · 100%", aiSignals: "1 ta" },
    },
    {
      id: "4",
      fromUser: "USR-10688",
      fromName: "Sardor Aliyev",
      toUser: "USR-10402",
      toName: "Kamola Yusupova",
      tag: "Firibgarlik",
      description: "Moliya yoki moddiy yordam so'rash holati.",
      time: "10.03.2026 20:05",
      status: "rejected",
      moderator: "A. Muxtorov",
      resolvedAt: "12.03.2026 10:02",
      rejectReason: "Shikoyat asossiz: suhbat tarixida haqoratli ibora topilmadi, keltirilgan skrinshot boshqa foydalanuvchiga tegishli.",
      chat: [
        { side: "left", text: "Uchrashishdan oldin bitta iltimosim bor edi.", time: "18:40" },
        { side: "right", text: "Qanday iltimos?", time: "18:42" },
        { side: "left", text: "Kartamga ozgina pul tashlab tura olasizmi?", time: "18:45", flagged: true },
      ],
      analysis: { level: "Yuqori", warnings: "3 marta", reports: "5 ta", advice: "Profilni bloklash" },
      profile: { status: "Kuzatuvda", registered: "09.01.2026", questionnaire: "27/30 · 90%", aiSignals: "6 ta" },
    },
    {
      id: "5",
      fromUser: "USR-10241",
      fromName: "Jasur Toshmatov",
      toUser: "USR-10517",
      toName: "Malika Nazarova",
      tag: "Spam va reklama",
      description: "Tijoriy xabarlar va begona havolalar yuborilgan.",
      time: "10.03.2026 11:30",
      status: "approved",
      moderator: "A. Muxtorov",
      resolvedAt: "10.03.2026 12:15",
      chat: DEFAULT_CHAT,
      analysis: DEFAULT_ANALYSIS,
      profile: DEFAULT_PROFILE,
    },
    {
      id: "6",
      fromUser: "USR-10402",
      fromName: "Kamola Yusupova",
      toUser: "USR-10733",
      toName: "Otabek Rahimov",
      tag: "Noto'g'ri ma'lumot",
      description: "Yoshi va kasbi haqida noto'g'ri ma'lumot berilgan degan da'vo.",
      time: "09.03.2026 16:58",
      status: "rejected",
      moderator: "A. Muxtorov",
      resolvedAt: "09.03.2026 17:30",
      rejectReason: "Ma'lumotlar qayta tekshirildi va tasdiqlandi, qoidabuzarlik topilmadi.",
      chat: DEFAULT_CHAT,
      analysis: DEFAULT_ANALYSIS,
      profile: DEFAULT_PROFILE,
    },
    {
      id: "7",
      fromUser: "USR-10517",
      fromName: "Malika Nazarova",
      toUser: "USR-10318",
      toName: "Mohira Rasulova",
      tag: "Haqorat va tahdid",
      description: "Shaxsiy xabarlarda nomaqbul muloqot va tahdid ohangi.",
      time: "09.03.2026 08:12",
      status: "in_review",
      chat: DEFAULT_CHAT,
      analysis: DEFAULT_ANALYSIS,
      profile: DEFAULT_PROFILE,
    },
    {
      id: "7",
      fromUser: "USR-10517",
      fromName: "Malika Nazarova",
      toUser: "USR-10318",
      toName: "Mohira Rasulova",
      tag: "Haqorat va tahdid",
      description: "Shaxsiy xabarlarda nomaqbul muloqot va tahdid ohangi.",
      time: "09.03.2026 08:12",
      status: "in_review",
      chat: DEFAULT_CHAT,
      analysis: DEFAULT_ANALYSIS,
      profile: DEFAULT_PROFILE,
    },
    {
      id: "7",
      fromUser: "USR-10517",
      fromName: "Malika Nazarova",
      toUser: "USR-10318",
      toName: "Mohira Rasulova",
      tag: "Haqorat va tahdid",
      description: "Shaxsiy xabarlarda nomaqbul muloqot va tahdid ohangi.",
      time: "09.03.2026 08:12",
      status: "in_review",
      chat: DEFAULT_CHAT,
      analysis: DEFAULT_ANALYSIS,
      profile: DEFAULT_PROFILE,
    },
    {
      id: "7",
      fromUser: "USR-10517",
      fromName: "Malika Nazarova",
      toUser: "USR-10318",
      toName: "Mohira Rasulova",
      tag: "Haqorat va tahdid",
      description: "Shaxsiy xabarlarda nomaqbul muloqot va tahdid ohangi.",
      time: "09.03.2026 08:12",
      status: "in_review",
      chat: DEFAULT_CHAT,
      analysis: DEFAULT_ANALYSIS,
      profile: DEFAULT_PROFILE,
    },
    {
      id: "7",
      fromUser: "USR-10517",
      fromName: "Malika Nazarova",
      toUser: "USR-10318",
      toName: "Mohira Rasulova",
      tag: "Haqorat va tahdid",
      description: "Shaxsiy xabarlarda nomaqbul muloqot va tahdid ohangi.",
      time: "09.03.2026 08:12",
      status: "in_review",
      chat: DEFAULT_CHAT,
      analysis: DEFAULT_ANALYSIS,
      profile: DEFAULT_PROFILE,
    },
    {
      id: "7",
      fromUser: "USR-10517",
      fromName: "Malika Nazarova",
      toUser: "USR-10318",
      toName: "Mohira Rasulova",
      tag: "Haqorat va tahdid",
      description: "Shaxsiy xabarlarda nomaqbul muloqot va tahdid ohangi.",
      time: "09.03.2026 08:12",
      status: "in_review",
      chat: DEFAULT_CHAT,
      analysis: DEFAULT_ANALYSIS,
      profile: DEFAULT_PROFILE,
    },
    {
      id: "7",
      fromUser: "USR-10517",
      fromName: "Malika Nazarova",
      toUser: "USR-10318",
      toName: "Mohira Rasulova",
      tag: "Haqorat va tahdid",
      description: "Shaxsiy xabarlarda nomaqbul muloqot va tahdid ohangi.",
      time: "09.03.2026 08:12",
      status: "in_review",
      chat: DEFAULT_CHAT,
      analysis: DEFAULT_ANALYSIS,
      profile: DEFAULT_PROFILE,
    },
    {
      id: "7",
      fromUser: "USR-10517",
      fromName: "Malika Nazarova",
      toUser: "USR-10318",
      toName: "Mohira Rasulova",
      tag: "Haqorat va tahdid",
      description: "Shaxsiy xabarlarda nomaqbul muloqot va tahdid ohangi.",
      time: "09.03.2026 08:12",
      status: "in_review",
      chat: DEFAULT_CHAT,
      analysis: DEFAULT_ANALYSIS,
      profile: DEFAULT_PROFILE,
    },
    {
      id: "7",
      fromUser: "USR-10517",
      fromName: "Malika Nazarova",
      toUser: "USR-10318",
      toName: "Mohira Rasulova",
      tag: "Haqorat va tahdid",
      description: "Shaxsiy xabarlarda nomaqbul muloqot va tahdid ohangi.",
      time: "09.03.2026 08:12",
      status: "in_review",
      chat: DEFAULT_CHAT,
      analysis: DEFAULT_ANALYSIS,
      profile: DEFAULT_PROFILE,
    },
    {
      id: "7",
      fromUser: "USR-10517",
      fromName: "Malika Nazarova",
      toUser: "USR-10318",
      toName: "Mohira Rasulova",
      tag: "Haqorat va tahdid",
      description: "Shaxsiy xabarlarda nomaqbul muloqot va tahdid ohangi.",
      time: "09.03.2026 08:12",
      status: "in_review",
      chat: DEFAULT_CHAT,
      analysis: DEFAULT_ANALYSIS,
      profile: DEFAULT_PROFILE,
    },
  ],
};

const appealsSlice = createSlice({
  name: "appealsSlice",
  initialState,
  reducers: {
    approveAppeal: (state, { payload }: PayloadAction<{ id: string; moderator?: string; resolvedAt?: string }>) => {
      const item = state.items.find((a) => a.id === payload.id);
      if (item) {
        item.status = "approved";
        item.moderator = payload.moderator || "A. Muxtorov";
        item.resolvedAt = payload.resolvedAt || "12.03.2026 10:02";
      }
    },
    rejectAppeal: (
      state,
      { payload }: PayloadAction<{ id: string; reason: string; moderator?: string; resolvedAt?: string }>
    ) => {
      const item = state.items.find((a) => a.id === payload.id);
      if (item) {
        item.status = "rejected";
        item.rejectReason = payload.reason;
        item.moderator = payload.moderator || "A. Muxtorov";
        item.resolvedAt = payload.resolvedAt || "12.03.2026 10:02";
      }
    },
  },
});

export const { approveAppeal, rejectAppeal } = appealsSlice.actions;

export default appealsSlice.reducer;
