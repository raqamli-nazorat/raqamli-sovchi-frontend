import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  ComplaintListItem,
  ComplaintDetail,
  ComplaintReason,
  ComplaintStatus,
} from "../../lib/complaintsApi";
import { COMPLAINT_REASON_MAP } from "../../lib/complaintsApi";
import dayjs from "dayjs";

export type AppealStatus = "pending" | "approved" | "rejected" | "in_review";

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
  raw?: ComplaintListItem | ComplaintDetail;
}

interface IState {
  items: Appeal[];
  totalCount: number;
  pendingCount: number;
  loading: boolean;
  error: string | null;
}

export const mapComplaintToAppeal = (item: ComplaintListItem | ComplaintDetail): Appeal => {
  const fromName =
    item.from_user_info?.full_name ||
    (item.from_user_info?.profile_info
      ? `${item.from_user_info.profile_info.first_name || ""} ${item.from_user_info.profile_info.last_name || ""}`.trim()
      : "") ||
    item.from_user_info?.phone_number ||
    "Foydalanuvchi";

  const fromUser = item.from_user_info?.display_id || item.from_user_info?.phone_number || "-";

  const toName =
    item.to_user_info?.full_name ||
    (item.to_user_info?.profile_info
      ? `${item.to_user_info.profile_info.first_name || ""} ${item.to_user_info.profile_info.last_name || ""}`.trim()
      : "") ||
    item.to_user_info?.phone_number ||
    "Foydalanuvchi";

  const toUser = item.to_user_info?.display_id || item.to_user_info?.phone_number || "-";

  const tag = item.reason_label || COMPLAINT_REASON_MAP[item.reason as ComplaintReason] || item.reason || "Shikoyat";

  const description =
    (item as ComplaintDetail).message ||
    "Shikoyat yuborilgan.";

  const time = item.created_at
    ? dayjs(item.created_at).format("DD.MM.YYYY HH:mm")
    : dayjs().format("DD.MM.YYYY HH:mm");

  const status = (item.status === "in_review" ? "pending" : item.status) as AppealStatus;

  const detail = item as ComplaintDetail;
  const moderator =
    detail.resolved_by_info?.full_name ||
    (detail.resolved_by_info?.profile_info
      ? `${detail.resolved_by_info.profile_info.first_name || ""} ${detail.resolved_by_info.profile_info.last_name || ""}`.trim()
      : "") ||
    undefined;

  const resolvedAt = detail.resolved_at
    ? dayjs(detail.resolved_at).format("DD.MM.YYYY HH:mm")
    : undefined;

  return {
    id: String(item.id),
    fromUser,
    fromName,
    toUser,
    toName,
    tag,
    description,
    time,
    status,
    moderator,
    resolvedAt,
    rejectReason: detail.admin_note || undefined,
    raw: item,
  };
};

const initialState: IState = {
  items: [],
  totalCount: 0,
  pendingCount: 0,
  loading: false,
  error: null,
};

const appealsSlice = createSlice({
  name: "appealsSlice",
  initialState,
  reducers: {
    setComplaints: (
      state,
      { payload }: PayloadAction<{ items: ComplaintListItem[]; count?: number }>
    ) => {
      state.items = payload.items.map(mapComplaintToAppeal);
      state.totalCount = payload.count ?? payload.items.length;
      state.pendingCount = state.items.filter(
        (a) => a.status === "pending" || a.status === "in_review"
      ).length;
    },
    upsertComplaintDetail: (state, { payload }: PayloadAction<ComplaintDetail>) => {
      const appeal = mapComplaintToAppeal(payload);
      const idx = state.items.findIndex((a) => a.id === appeal.id);
      if (idx >= 0) {
        state.items[idx] = { ...state.items[idx], ...appeal };
      } else {
        state.items.unshift(appeal);
      }
      state.pendingCount = state.items.filter(
        (a) => a.status === "pending" || a.status === "in_review"
      ).length;
    },
    approveAppeal: (
      state,
      { payload }: PayloadAction<{ id: string; moderator?: string; resolvedAt?: string }>
    ) => {
      const item = state.items.find((a) => a.id === payload.id);
      if (item) {
        item.status = "approved";
        item.moderator = payload.moderator || "Admin";
        item.resolvedAt = payload.resolvedAt || dayjs().format("DD.MM.YYYY HH:mm");
      }
      state.pendingCount = state.items.filter(
        (a) => a.status === "pending" || a.status === "in_review"
      ).length;
    },
    rejectAppeal: (
      state,
      { payload }: PayloadAction<{ id: string; reason: string; moderator?: string; resolvedAt?: string }>
    ) => {
      const item = state.items.find((a) => a.id === payload.id);
      if (item) {
        item.status = "rejected";
        item.rejectReason = payload.reason;
        item.moderator = payload.moderator || "Admin";
        item.resolvedAt = payload.resolvedAt || dayjs().format("DD.MM.YYYY HH:mm");
      }
      state.pendingCount = state.items.filter(
        (a) => a.status === "pending" || a.status === "in_review"
      ).length;
    },
  },
});

export const {
  setComplaints,
  upsertComplaintDetail,
  approveAppeal,
  rejectAppeal,
} = appealsSlice.actions;

export default appealsSlice.reducer;
