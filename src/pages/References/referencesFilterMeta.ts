import dayjs from "dayjs";
import type { RefCtx } from "./referencesConfig";

export const GENDER_LABELS: Record<string, string> = {
  all: "Hammaga",
  groom: "Kuyov",
  bride: "Kelin",
};

const boolLabel = (v: string) => (v === "true" ? "Ha" : "Yo'q");

const fmtDateRangeChip = (label: string, after?: string, before?: string): string | null => {
  if (!after && !before) return null;
  if (after && before) {
    const a = dayjs(after);
    const b = dayjs(before);
    if (a.format("MM-DD") === "01-01" && b.format("MM-DD") === "12-31" && a.year() === b.year()) {
      return `${label}: ${a.year()}`;
    }
    return `${label}: ${a.format("DD.MM.YYYY")} - ${b.format("DD.MM.YYYY")}`;
  }
  if (after) return `${label}: ${dayjs(after).format("DD.MM.YYYY")} dan`;
  return `${label}: ${dayjs(before).format("DD.MM.YYYY")} gacha`;
};

const fmtRangeChip = (label: string, min?: string, max?: string): string | null => {
  if (!min && !max) return null;
  if (min && max) return `${label}: ${min} - ${max}`;
  if (min) return `${label}: ${min} dan`;
  return `${label}: ${max} gacha`;
};

const namesFromIds = (ids: string, list: any[] | undefined): string =>
  ids
    .split(",")
    .filter(Boolean)
    .map((id) => list?.find((i) => String(i.id) === id)?.name || id)
    .join(", ");

export interface FilterChip {
  // filter object keys removed together when this chip's × is clicked
  keys: string[];
  label: string;
}

// Builds the list of "N ta natija · chip · chip · Tozalash" pills shown on the list page,
// mirroring the Figma header row. `ctx` is used to resolve id → name for multi-select filters
// (Bo'lim / Viloyat) so chips show readable names instead of raw ids.
export const getFilterChips = (
  entity: string,
  filters: Record<string, any>,
  ctx: RefCtx
): FilterChip[] => {
  const chips: FilterChip[] = [];

  const addDate = (prefix: "created_at" | "updated_at", label: string) => {
    const isCreated = prefix === "created_at";
    const after = filters[isCreated ? "start_date" : `${prefix}_after`];
    const before = filters[isCreated ? "end_date" : `${prefix}_before`];
    const text = fmtDateRangeChip(label, after, before);
    if (text) {
      chips.push({
        keys: isCreated
          ? ["start_date", "end_date"]
          : [`${prefix}_after`, `${prefix}_before`, `${prefix}__gte`, `${prefix}__lte`],
        label: text,
      });
    }
  };

  if (entity === "districts" && filters.region) {
    chips.push({ keys: ["region"], label: `Viloyat: ${namesFromIds(filters.region, ctx.regions)}` });
  }

  if (entity === "sections") {
    const text = fmtRangeChip("Savollar soni", filters.questions_count_min, filters.questions_count_max);
    if (text) chips.push({ keys: ["questions_count_min", "questions_count_max"], label: text });
  }

  if (entity === "questions") {
    if (filters.section) {
      chips.push({ keys: ["section"], label: `Bo'lim: ${namesFromIds(filters.section, ctx.sections)}` });
    }
    if (filters.target_gender) {
      chips.push({
        keys: ["target_gender"],
        label: `Kimga: ${GENDER_LABELS[filters.target_gender] || filters.target_gender}`,
      });
    }
    if (filters.is_trap_question) {
      chips.push({
        keys: ["is_trap_question"],
        label: `Tuzoq savol: ${boolLabel(filters.is_trap_question)}`,
      });
    }
  }

  addDate("created_at", "Yaratilgan");
  addDate("updated_at", "Yangilangan");

  return chips;
};
