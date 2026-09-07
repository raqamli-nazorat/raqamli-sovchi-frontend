import { axiosAPI } from "./axiosAPI";

export interface DashboardTotals {
  users?: {
    value?: number;
    delta_week?: number | null;
  };
  profiles_filled?: {
    value?: number;
    conversion_pct?: number | null;
  };
  active_chats?: {
    value?: number;
  };
  married?: {
    value?: number;
    delta_month?: number | null;
  };
}

export interface DashboardTrend {
  days: string[];
  registrations: number[];
  questionnaires: number[];
  matches: number[];
}

export interface DashboardFunnel {
  registered?: number;
  profile_filled?: number;
  questions_done?: number;
  request_sent?: number;
  chat_started?: number;
}

export interface DashboardTasks {
  profile_moderation?: number;
  ai_signals?: number;
  complaints_open?: number;
}

export interface DashboardSummaryData {
  totals: DashboardTotals;
  trend: DashboardTrend;
  funnel: DashboardFunnel;
  tasks: DashboardTasks;
}

export interface DashboardSummaryResponse {
  data: DashboardSummaryData;
  error: string | null;
  success: boolean;
}

export const getDashboardSummary = async (): Promise<DashboardSummaryData> => {
  const response = await axiosAPI.get<DashboardSummaryResponse>("dashboard/summary/");
  const payload: any = response?.data;
  return payload?.data ?? payload;
};
