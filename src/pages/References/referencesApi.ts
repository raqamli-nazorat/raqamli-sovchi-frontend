import { axiosAPI } from "../../lib/axiosAPI";

export type RefItem = Record<string, any> & { id: string };

export interface RefApi {
  list: (params?: Record<string, any>) => Promise<RefItem[]>;
  get: (id: string) => Promise<RefItem>;
  create: (data: Record<string, any>) => Promise<RefItem>;
  update: (id: string, data: Record<string, any>) => Promise<RefItem>;
  remove: (id: string) => Promise<void>;
}

// Javob {count,next,previous,results} yoki {success,data:{...}} ko'rinishida
// bo'lishi mumkin — ikkalasini ham qo'llab-quvvatlaymiz.
const unwrap = (res: any) => {
  const payload = res?.data?.data ?? res?.data;
  const results = payload?.results ?? payload;
  if (Array.isArray(results)) {
    const arr = [...results] as any;
    if (payload && typeof payload === "object") {
      if (typeof payload.count === "number") {
        arr.count = payload.count;
      }
      if (payload.next !== undefined) {
        arr.next = payload.next;
      }
    }
    return arr;
  }
  return results;
};

const realApi = (base: string): RefApi => ({
  list: async (params) => {
    const items = unwrap(await axiosAPI.get(base, { params }));
    return Array.isArray(items) ? items : [];
  },
  get: async (id) => unwrap(await axiosAPI.get(`${base}${id}/`)),
  create: async (data) => unwrap(await axiosAPI.post(base, data)),
  update: async (id, data) => unwrap(await axiosAPI.patch(`${base}${id}/`, data)),
  remove: async (id) => {
    await axiosAPI.delete(`${base}${id}/`);
  },
});

// Ma'lumotnomalar bo'limi — backend endpointlariga to'liq ulangan.
// (Manba: /api/schema/ — Raqamli Sovchi API v1)
export const REF_APIS: Record<string, RefApi> = {
  roles: realApi("accounts/roles/"),
  regions: realApi("locations/region/"),
  districts: realApi("locations/district/"),
  "education-levels": realApi("references/education-levels/"),
  nationalities: realApi("references/nationalities/"),
  professions: realApi("references/professions/"),
  sections: realApi("accounts/section-types/"),
  questions: realApi("accounts/questions/"),
};

export const refApiError = (err: any, fallback: string): string => {
  const apiError = err?.response?.data?.error;
  if (apiError) {
    if (apiError.details) {
      if (typeof apiError.details === "object") {
        return Object.values(apiError.details).flat().join(", ");
      }
      return String(apiError.details);
    }
    return apiError.errorMsg || fallback;
  }
  return err?.response?.data?.detail || err?.response?.data?.message || err?.message || fallback;
};
