import { axiosAPI } from "./axiosAPI";

export interface PsychologistItem {
  id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  specialization: string;
  experience_years: number;
  price: number;
  session_duration_minutes: number;
  bio?: string | null;
  photo?: string | null;
  is_available: boolean;
  rating?: number | null;
  consultations_count?: number;
  next_session_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PaginatedPsychologistList {
  count: number;
  next: string | null;
  previous: string | null;
  results: PsychologistItem[];
}

export interface CreatePsychologistPayload {
  first_name: string;
  last_name: string;
  phone_number: string;
  specialization: string;
  experience_years: number;
  price: number;
  session_duration_minutes: number;
  bio?: string;
  photo?: File | string | null;
  is_available?: boolean;
}

export interface PatchPsychologistPayload {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  specialization?: string;
  experience_years?: number;
  price?: number;
  session_duration_minutes?: number;
  bio?: string;
  photo?: File | string | null;
  is_available?: boolean;
}

export interface PsychologistListParams {
  page?: number;
  page_size?: number;
  search?: string;
  is_available?: boolean;
  ordering?: string;
  [key: string]: any;
}

const unwrap = (res: any) => {
  const payload = res?.data?.data ?? res?.data;
  return payload;
};

const buildFormData = (payload: Record<string, any>): FormData => {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (typeof value === "boolean") {
        formData.append(key, String(value));
      } else if (typeof value === "number") {
        formData.append(key, String(value));
      } else if (value instanceof File) {
        formData.append(key, value);
      } else if (typeof value === "string") {
        formData.append(key, value);
      }
    }
  });
  return formData;
};

export const psychologistsApi = {
  // GET /api/v1/psychologists/
  list: async (params?: PsychologistListParams): Promise<PaginatedPsychologistList> => {
    const cleanParams: Record<string, any> = {};
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") {
          cleanParams[k] = v;
        }
      });
    }
    const res = await axiosAPI.get("psychologists/", { params: cleanParams });
    const payload = unwrap(res);

    if (Array.isArray(payload)) {
      return {
        count: payload.length,
        next: null,
        previous: null,
        results: payload,
      };
    }

    if (payload && Array.isArray(payload.results)) {
      return {
        count: payload.count ?? payload.results.length,
        next: payload.next ?? null,
        previous: payload.previous ?? null,
        results: payload.results,
      };
    }

    return {
      count: 0,
      next: null,
      previous: null,
      results: [],
    };
  },

  // GET /api/v1/psychologists/{id}/
  get: async (id: string): Promise<PsychologistItem> => {
    const res = await axiosAPI.get(`psychologists/${id}/`);
    return unwrap(res);
  },

  // POST /api/v1/psychologists/
  create: async (data: CreatePsychologistPayload): Promise<PsychologistItem> => {
    const hasFile = data.photo instanceof File;
    const body = hasFile ? buildFormData(data) : data;
    const headers = hasFile ? { "Content-Type": "multipart/form-data" } : undefined;
    const res = await axiosAPI.post("psychologists/", body, { headers });
    return unwrap(res);
  },

  // PUT /api/v1/psychologists/{id}/
  update: async (id: string, data: Partial<CreatePsychologistPayload>): Promise<PsychologistItem> => {
    const hasFile = data.photo instanceof File;
    const body = hasFile ? buildFormData(data) : data;
    const headers = hasFile ? { "Content-Type": "multipart/form-data" } : undefined;
    const res = await axiosAPI.put(`psychologists/${id}/`, body, { headers });
    return unwrap(res);
  },

  // PATCH /api/v1/psychologists/{id}/
  patch: async (id: string, data: PatchPsychologistPayload): Promise<PsychologistItem> => {
    const hasFile = data.photo instanceof File;
    const body = hasFile ? buildFormData(data) : data;
    const headers = hasFile ? { "Content-Type": "multipart/form-data" } : undefined;
    const res = await axiosAPI.patch(`psychologists/${id}/`, body, { headers });
    return unwrap(res);
  },

  // DELETE /api/v1/psychologists/{id}/
  delete: async (id: string): Promise<void> => {
    await axiosAPI.delete(`psychologists/${id}/`);
  },
};
