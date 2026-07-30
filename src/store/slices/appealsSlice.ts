import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type AppealStatus = "new" | "reviewed" | "closed";
export type TagTone = "red" | "yellow" | "gray";

export interface Appeal {
  id: string; // REP-2291
  fromUser: string; // USR-10318
  fromName: string;
  toUser: string;
  toName: string;
  tag: string;
  tagTone: TagTone;
  description: string;
  time: string;
  status: AppealStatus;
}

interface IState {
  items: Appeal[];
}

// ── Mock ma'lumotlar — backend'da shikoyatlar endpointi tayyor bo'lgach,
//    API javobiga almashtiriladi ──
const initialState: IState = {
  items: [
    {
      id: "REP-2291",
      fromUser: "USR-10318",
      fromName: "Mohira Rasulova",
      toUser: "USR-10511",
      toName: "Bekzod Qodirov",
      tag: "Odobsiz so'z",
      tagTone: "red",
      description: "Suhbatda haqoratli iboralar ishlatilgan. Chat tarixi ilova qilindi.",
      time: "09:14",
      status: "new",
    },
    {
      id: "REP-2292",
      fromUser: "USR-10455",
      fromName: "Gulnora Karimova",
      toUser: "USR-10241",
      toName: "Jasur Toshmatov",
      tag: "Soxta profil",
      tagTone: "yellow",
      description: "Rasmlar boshqa shaxsga tegishli bo'lishi mumkin.",
      time: "Kecha",
      status: "new",
    },
    {
      id: "REP-2293",
      fromUser: "USR-10604",
      fromName: "Malika Yusupova",
      toUser: "USR-10688",
      toName: "Sardor Aliyev",
      tag: "Nikoh niyati yo'q",
      tagTone: "gray",
      description: "Foydalanuvchi maqsadi anketaga mos emas.",
      time: "Kecha",
      status: "new",
    },
    {
      id: "REP-2294",
      fromUser: "USR-10688",
      fromName: "Sardor Aliyev",
      toUser: "USR-10402",
      toName: "Nodira Islomova",
      tag: "Firibgarlik",
      tagTone: "red",
      description: "Pul so'rash holati qayd etilgan.",
      time: "2 kun",
      status: "new",
    },
  ],
};

const appealsSlice = createSlice({
  name: "appealsSlice",
  initialState,
  reducers: {
    markReviewed: (state, { payload }: PayloadAction<string>) => {
      const item = state.items.find((a) => a.id === payload);
      if (item && item.status === "new") {
        item.status = "reviewed";
      }
    },
    closeAppeal: (state, { payload }: PayloadAction<string>) => {
      const item = state.items.find((a) => a.id === payload);
      if (item) {
        item.status = "closed";
      }
    },
  },
});

export const { markReviewed, closeAppeal } = appealsSlice.actions;

export default appealsSlice.reducer;
