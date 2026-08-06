import dayjs from "dayjs";
import type { RefCtx } from "./referencesConfig";

export interface OrderingOption {
  value: string;
  label: string;
}

const DATE_ORDERING_OPTIONS: OrderingOption[] = [
  { value: "-created_at", label: "Yangi yaratilgan" },
  { value: "created_at", label: "Eski yaratilgan" },
  { value: "-updated_at", label: "Yangi yangilangan" },
  { value: "updated_at", label: "Eski yangilangan" },
];

const NAME_ORDERING_OPTIONS: OrderingOption[] = [
  { value: "name", label: "Nomi (A→Z)" },
  { value: "-name", label: "Nomi (Z→A)" },
];

// NOTE: backend `ordering` values below (districts_count, questions_count, order, ...) are
// placeholders picked to match the Figma copy. Backend field/param names will be confirmed
// and adjusted later — the important part for now is that a request goes out with a sensible key.
export const ORDERING_OPTIONS: Record<string, OrderingOption[]> = {
  roles: [...NAME_ORDERING_OPTIONS, ...DATE_ORDERING_OPTIONS],
  regions: [
    { value: "-districts_count", label: "Tumanlar soni (ko'p→kam)" },
    { value: "districts_count", label: "Tumanlar soni (kam→ko'p)" },
    ...NAME_ORDERING_OPTIONS,
    ...DATE_ORDERING_OPTIONS,
  ],
  districts: [...NAME_ORDERING_OPTIONS, ...DATE_ORDERING_OPTIONS],
  "education-levels": [...NAME_ORDERING_OPTIONS, ...DATE_ORDERING_OPTIONS],
  nationalities: [...NAME_ORDERING_OPTIONS, ...DATE_ORDERING_OPTIONS],
  professions: [...NAME_ORDERING_OPTIONS, ...DATE_ORDERING_OPTIONS],
  sections: [
    { value: "-questions_count", label: "Savollar soni (ko'p→kam)" },
    { value: "questions_count", label: "Savollar soni (kam→ko'p)" },
    ...NAME_ORDERING_OPTIONS,
    ...DATE_ORDERING_OPTIONS,
  ],
  questions: [
    { value: "order", label: "Tartib (1→30)" },
    { value: "-order", label: "Tartib (30→1)" },
    ...DATE_ORDERING_OPTIONS,
  ],
};

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

  if (entity === "roles" && filters.is_default) {
    chips.push({ keys: ["is_default"], label: `Asosiy rol: ${boolLabel(filters.is_default)}` });
  }

  if (entity === "regions") {
    const text = fmtRangeChip("Tumanlar soni", filters.districts_count_min, filters.districts_count_max);
    if (text) chips.push({ keys: ["districts_count_min", "districts_count_max"], label: text });
  }

  if (entity === "districts" && filters.region) {
    chips.push({ keys: ["region"], label: `Viloyat: ${namesFromIds(filters.region, ctx.regions)}` });
  }

  if (entity === "sections") {
    const text = fmtRangeChip("Savollar soni", filters.questions_count_min, filters.questions_count_max);
    if (text) chips.push({ keys: ["questions_count_min", "questions_count_max"], label: text });
    if (filters.has_no_questions === "true") {
      chips.push({ keys: ["has_no_questions"], label: "Faqat savolsiz bo'limlar" });
    }
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
    const orderText = fmtRangeChip("Tartib", filters.order_min, filters.order_max);
    if (orderText) chips.push({ keys: ["order_min", "order_max"], label: orderText });
  }

  addDate("created_at", "Yaratilgan");
  addDate("updated_at", "Yangilangan");

  if (filters.ordering) {
    const opt = ORDERING_OPTIONS[entity]?.find((o) => o.value === filters.ordering);
    if (opt) chips.push({ keys: ["ordering"], label: `Saralash: ${opt.label}` });
  }

  return chips;
};