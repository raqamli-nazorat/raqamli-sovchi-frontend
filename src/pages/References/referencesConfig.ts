import dayjs from "dayjs";
import type { RefItem } from "./referencesApi";

// Bog'liq ro'yxatlar: masalan regions sahifasi tuman sonini ko'rsatish uchun
// districts ro'yxatini ham yuklaydi
export type RefCtx = Record<string, RefItem[]>;

export interface RefField {
  name: string;
  label: string;
  type: "text" | "number" | "select";
  required?: boolean;
  placeholder?: string;
  // select variantlari: statik yoki bog'liq entity ro'yxatidan (id/name)
  staticOptions?: { value: string; label: string }[];
  optionsFromSlug?: string;
}

export interface RefColumn {
  header: string;
  width?: string; // masalan "w-[160px]"; berilmasa flex-1
  value: (item: RefItem, ctx: RefCtx) => string;
}

export interface RefEntityConfig {
  slug: string;
  singular: string;
  plural: string;
  subtitle: string;
  cardTitle: string;
  searchPlaceholder: string;
  searchKeys: string[];
  relatedSlugs?: string[];
  columns: RefColumn[];
  formTitle: string;
  formHint?: string;
  fields: RefField[];
  toPayload?: (values: Record<string, string>) => Record<string, any>;
  toFormValues?: (item: RefItem) => Record<string, string>;
  titleOf: (item: RefItem) => string;
  headerSubtitleOf?: (item: RefItem, ctx: RefCtx) => string;
  detailFields: { label: string; value: (item: RefItem, ctx: RefCtx) => string }[];
  childList?: {
    title: (item: RefItem, ctx: RefCtx) => string;
    rows: (item: RefItem, ctx: RefCtx) => { left: string; right: string }[];
  };
  deleteNote: (item: RefItem, ctx: RefCtx) => string;
  // null — o'chirish mumkin; string — nima uchun mumkin emasligi
  cantDeleteReason?: (item: RefItem) => string | null;
}

export const fmtDate = (iso?: string) => (iso ? dayjs(iso).format("DD.MM.YYYY") : "—");
export const fmtDateTime = (iso?: string) => (iso ? dayjs(iso).format("DD.MM.YYYY HH:mm") : "—");
export const shortId = (id?: string) =>
  id && id.length > 12 ? `${id.slice(0, 4)}…${id.slice(-4)}` : id || "—";

const boolLabel = (v: any) => (v ? "Ha" : "Yo'q");

const GENDER_LABELS: Record<string, string> = {
  ALL: "Hammaga",
  GROOM: "Kuyov",
  BRIDE: "Kelin",
};

const HA_YOQ_OPTIONS = [
  { value: "false", label: "Yo'q" },
  { value: "true", label: "Ha" },
];

const districtsOfRegion = (regionId: string, ctx: RefCtx) =>
  (ctx.districts || []).filter((d) => d.region_info?.id === regionId);

const questionsOfSection = (sectionId: string, ctx: RefCtx) =>
  (ctx.questions || [])
    .filter((q) => q.section === sectionId)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

const sectionName = (sectionId: string, ctx: RefCtx) =>
  (ctx.sections || []).find((s) => s.id === sectionId)?.name || "—";

// Oddiy "faqat nom" ma'lumotnomalar uchun umumiy qolip
const simpleNameConfig = (
  base: Pick<
    RefEntityConfig,
    "slug" | "singular" | "plural" | "subtitle" | "searchPlaceholder"
  > & { formTitle: string; deleteNoteText: string }
): RefEntityConfig => ({
  slug: base.slug,
  singular: base.singular,
  plural: base.plural,
  subtitle: base.subtitle,
  cardTitle: `${base.singular} kartasi`,
  searchPlaceholder: base.searchPlaceholder,
  searchKeys: ["name"],
  columns: [
    { header: "Nomi", value: (i) => i.name || "—" },
    { header: "Yaratilgan", width: "w-[160px]", value: (i) => fmtDate(i.created_at) },
  ],
  formTitle: base.formTitle,
  formHint: "Nom takrorlanmasligi kerak.",
  fields: [{ name: "name", label: "Nomi", type: "text", required: true }],
  titleOf: (i) => i.name || "—",
  detailFields: [{ label: "Nomi", value: (i) => i.name || "—" }],
  deleteNote: () => base.deleteNoteText,
});

export const REF_CONFIGS: Record<string, RefEntityConfig> = {
  roles: {
    slug: "roles",
    singular: "Rol",
    plural: "Rollar",
    subtitle: "tizim rollari",
    cardTitle: "Rol kartasi",
    searchPlaceholder: "Rol nomi bo'yicha qidirish...",
    searchKeys: ["name"],
    columns: [
      { header: "Nomi", value: (i) => i.name || "—" },
      { header: "Asosiy rol", width: "w-[180px]", value: (i) => boolLabel(i.is_default) },
      { header: "Yaratilgan", width: "w-[160px]", value: (i) => fmtDate(i.created_at) },
    ],
    formTitle: "Yangi rol",
    fields: [
      { name: "name", label: "Nomi", type: "text", required: true },
      { name: "is_default", label: "Asosiy rol", type: "select", staticOptions: HA_YOQ_OPTIONS },
    ],
    toPayload: (v) => ({ name: v.name.trim(), is_default: v.is_default === "true" }),
    toFormValues: (i) => ({ name: i.name || "", is_default: String(!!i.is_default) }),
    titleOf: (i) => i.name || "—",
    detailFields: [
      { label: "Nomi", value: (i) => i.name || "—" },
      { label: "Asosiy rol", value: (i) => boolLabel(i.is_default) },
    ],
    deleteNote: () => "Rol o'chirilsa, unga biriktirilgan foydalanuvchilar rolsiz qoladi.",
    cantDeleteReason: (i) =>
      i.is_default ? "Asosiy rolni o'chirib bo'lmaydi. Avval boshqa rolni asosiy qiling." : null,
  },

  regions: {
    slug: "regions",
    singular: "Viloyat",
    plural: "Viloyatlar",
    subtitle: "hududiy bo'linish",
    cardTitle: "Viloyat kartasi",
    searchPlaceholder: "Viloyat nomi yoki kodi...",
    searchKeys: ["name", "code"],
    relatedSlugs: ["districts"],
    columns: [
      { header: "Nomi", value: (i) => i.name || "—" },
      { header: "Kodi", width: "w-[140px]", value: (i) => (i.code != null ? String(i.code) : "—") },
      {
        header: "Tumanlar",
        width: "w-[140px]",
        value: (i, ctx) => String(districtsOfRegion(i.id, ctx).length),
      },
      { header: "Yaratilgan", width: "w-[160px]", value: (i) => fmtDate(i.created_at) },
    ],
    formTitle: "Yangi viloyat",
    formHint: "Kodi ixtiyoriy — keyin ham qo'shsa bo'ladi.",
    fields: [
      { name: "name", label: "Nomi", type: "text", required: true },
      { name: "code", label: "Kodi", type: "number" },
    ],
    toPayload: (v) => ({ name: v.name.trim(), code: v.code === "" ? null : Number(v.code) }),
    toFormValues: (i) => ({ name: i.name || "", code: i.code != null ? String(i.code) : "" }),
    titleOf: (i) => i.name || "—",
    detailFields: [
      { label: "Nomi", value: (i) => i.name || "—" },
      { label: "Kodi", value: (i) => (i.code != null ? String(i.code) : "—") },
      { label: "Tumanlar", value: (i, ctx) => `${districtsOfRegion(i.id, ctx).length} ta` },
    ],
    childList: {
      title: (i, ctx) => `Tumanlar · ${districtsOfRegion(i.id, ctx).length} ta`,
      rows: (i, ctx) =>
        districtsOfRegion(i.id, ctx).map((d) => ({
          left: d.name,
          right: d.code != null ? String(d.code) : "—",
        })),
    },
    deleteNote: (i, ctx) =>
      `Viloyatni o'chirish uning ${districtsOfRegion(i.id, ctx).length} ta tumanini ham o'chiradi.`,
  },

  districts: {
    slug: "districts",
    singular: "Tuman",
    plural: "Tumanlar",
    subtitle: "viloyatga bog'liq",
    cardTitle: "Tuman kartasi",
    searchPlaceholder: "Tuman nomi yoki kodi...",
    searchKeys: ["name", "code"],
    relatedSlugs: ["regions"],
    columns: [
      { header: "Nomi", value: (i) => i.name || "—" },
      { header: "Kodi", width: "w-[140px]", value: (i) => (i.code != null ? String(i.code) : "—") },
      { header: "Viloyat", width: "w-[200px]", value: (i) => i.region_info?.name || "—" },
      { header: "Yaratilgan", width: "w-[160px]", value: (i) => fmtDate(i.created_at) },
    ],
    formTitle: "Yangi tuman",
    fields: [
      { name: "name", label: "Nomi", type: "text", required: true },
      { name: "code", label: "Kodi", type: "number" },
      { name: "region", label: "Viloyat", type: "select", required: true, optionsFromSlug: "regions" },
    ],
    toPayload: (v) => ({
      name: v.name.trim(),
      code: v.code === "" ? null : Number(v.code),
      region: v.region,
    }),
    toFormValues: (i) => ({
      name: i.name || "",
      code: i.code != null ? String(i.code) : "",
      region: i.region_info?.id || "",
    }),
    titleOf: (i) => i.name || "—",
    detailFields: [
      { label: "Nomi", value: (i) => i.name || "—" },
      { label: "Kodi", value: (i) => (i.code != null ? String(i.code) : "—") },
      { label: "Viloyat", value: (i) => i.region_info?.name || "—" },
    ],
    deleteNote: () => "Tuman o'chirilsa, unga bog'langan profillar hududsiz qoladi.",
  },

  "education-levels": simpleNameConfig({
    slug: "education-levels",
    singular: "Ta'lim darajasi",
    plural: "Ta'lim darajalari",
    subtitle: "Ta'lim darajasi",
    searchPlaceholder: "Daraja nomi...",
    formTitle: "Yangi ta'lim darajasi",
    deleteNoteText: "Daraja o'chirilsa, uni tanlagan profillarda bu maydon bo'sh qoladi.",
  }),

  nationalities: simpleNameConfig({
    slug: "nationalities",
    singular: "Millat",
    plural: "Millatlar",
    subtitle: "Millatlar",
    searchPlaceholder: "Millat nomi...",
    formTitle: "Yangi millat",
    deleteNoteText: "Millat o'chirilsa, uni tanlagan profillarda bu maydon bo'sh qoladi.",
  }),

  professions: simpleNameConfig({
    slug: "professions",
    singular: "Kasb",
    plural: "Kasblar",
    subtitle: "Kasblar",
    searchPlaceholder: "Kasb nomi...",
    formTitle: "Yangi kasb",
    deleteNoteText: "Kasb o'chirilsa, uni tanlagan profillarda bu maydon bo'sh qoladi.",
  }),

  sections: {
    slug: "sections",
    singular: "Savol bo'limi",
    plural: "Savol bo'limlari",
    subtitle: "SectionType",
    cardTitle: "Savol bo'limi",
    searchPlaceholder: "Bo'lim nomi...",
    searchKeys: ["name"],
    relatedSlugs: ["questions"],
    columns: [
      { header: "Nomi", value: (i) => i.name || "—" },
      {
        header: "Savollar",
        width: "w-[140px]",
        value: (i, ctx) => String(questionsOfSection(i.id, ctx).length),
      },
      { header: "Yaratilgan", width: "w-[160px]", value: (i) => fmtDate(i.created_at) },
    ],
    formTitle: "Yangi savol bo'limi",
    formHint: "Bo'lim yaratilgach, unga savollar qo'shasiz.",
    fields: [{ name: "name", label: "Nomi", type: "text", required: true }],
    titleOf: (i) => i.name || "—",
    detailFields: [
      { label: "Nomi", value: (i) => i.name || "—" },
      { label: "Savollar", value: (i, ctx) => `${questionsOfSection(i.id, ctx).length} ta` },
      {
        label: "Tuzoq savollar",
        value: (i, ctx) =>
          `${questionsOfSection(i.id, ctx).filter((q) => q.is_trap_question).length} ta`,
      },
    ],
    childList: {
      title: (i, ctx) => `Savollar · ${questionsOfSection(i.id, ctx).length} ta`,
      rows: (i, ctx) =>
        questionsOfSection(i.id, ctx).map((q) => ({
          left: q.text,
          right: `${q.order}-tartib`,
        })),
    },
    deleteNote: (i, ctx) =>
      `Bo'limni o'chirish uning ${questionsOfSection(i.id, ctx).length} ta savolini ham o'chiradi.`,
  },

  questions: {
    slug: "questions",
    singular: "Savol",
    plural: "Savollar",
    subtitle: "anketa savollari",
    cardTitle: "Savol kartasi",
    searchPlaceholder: "Savol matni bo'yicha...",
    searchKeys: ["text"],
    relatedSlugs: ["sections"],
    columns: [
      { header: "Savol matni", value: (i) => i.text || "—" },
      { header: "Bo'lim", width: "w-[200px]", value: (i, ctx) => sectionName(i.section, ctx) },
      {
        header: "Kimga",
        width: "w-[120px]",
        value: (i) => GENDER_LABELS[i.target_gender] || i.target_gender || "—",
      },
      { header: "Tuzoq", width: "w-[100px]", value: (i) => boolLabel(i.is_trap_question) },
      { header: "Tartib", width: "w-[100px]", value: (i) => String(i.order ?? "—") },
    ],
    formTitle: "Yangi savol",
    fields: [
      { name: "section", label: "Bo'lim", type: "select", required: true, optionsFromSlug: "sections" },
      { name: "text", label: "Savol matni", type: "text", required: true, placeholder: "Savolni kiriting..." },
      {
        name: "target_gender",
        label: "Kimga",
        type: "select",
        staticOptions: [
          { value: "ALL", label: "Hammaga" },
          { value: "GROOM", label: "Kuyov" },
          { value: "BRIDE", label: "Kelin" },
        ],
      },
      { name: "is_trap_question", label: "Tuzoq savol", type: "select", staticOptions: HA_YOQ_OPTIONS },
      { name: "order", label: "Tartib", type: "number", required: true },
      { name: "option_a", label: "A varianti", type: "text", required: true, placeholder: "Variant matni..." },
      { name: "option_b", label: "B varianti", type: "text", required: true, placeholder: "Variant matni..." },
      { name: "option_c", label: "C varianti", type: "text", required: true, placeholder: "Variant matni..." },
      { name: "option_d", label: "D varianti", type: "text", required: true, placeholder: "Variant matni..." },
    ],
    toPayload: (v) => ({
      section: v.section,
      text: v.text.trim(),
      target_gender: v.target_gender || "ALL",
      is_trap_question: v.is_trap_question === "true",
      order: Number(v.order),
      options: [
        { option_letter: "A", text: v.option_a.trim(), weight: 4 },
        { option_letter: "B", text: v.option_b.trim(), weight: 3 },
        { option_letter: "C", text: v.option_c.trim(), weight: 2 },
        { option_letter: "D", text: v.option_d.trim(), weight: 1 },
      ],
    }),
    toFormValues: (i) => {
      const opt = (letter: string) =>
        (i.options || []).find((o: any) => o.option_letter === letter)?.text || "";
      return {
        section: i.section || "",
        text: i.text || "",
        target_gender: i.target_gender || "ALL",
        is_trap_question: String(!!i.is_trap_question),
        order: i.order != null ? String(i.order) : "",
        option_a: opt("A"),
        option_b: opt("B"),
        option_c: opt("C"),
        option_d: opt("D"),
      };
    },
    titleOf: (i) => i.text || "—",
    headerSubtitleOf: (i, ctx) => `${i.order}-savol · ${sectionName(i.section, ctx)}`,
    detailFields: [
      { label: "Bo'lim", value: (i, ctx) => sectionName(i.section, ctx) },
      { label: "Kimga", value: (i) => GENDER_LABELS[i.target_gender] || i.target_gender || "—" },
      { label: "Tuzoq savol", value: (i) => boolLabel(i.is_trap_question) },
      { label: "Tartib", value: (i) => String(i.order ?? "—") },
    ],
    childList: {
      title: (i) => `Javob variantlari · ${(i.options || []).length} ta`,
      rows: (i) =>
        (i.options || []).map((o: any) => ({
          left: `${o.option_letter} · ${o.text}`,
          right: `vazn ${o.weight}`,
        })),
    },
    deleteNote: (i) =>
      `Savolni o'chirish uning ${(i.options || []).length} ta variantini va berilgan javoblarni ham o'chiradi.`,
  },
};
