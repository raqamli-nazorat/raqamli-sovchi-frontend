import { useEffect, useState } from "react";
import { X, Check } from "lucide-react";
import Select from "../../components/ui/Select";
import { DatePicker } from "../../components/ui/DatePicker";
import SegmentedControl from "../../components/ui/SegmentedControl";
import { REF_APIS } from "./referencesApi";
import dayjs from "dayjs";

interface RefFilterModalProps {
  entity: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (filters: Record<string, any>) => void;
  // filtrlarni bekor qiladi, lekin modalni ochiq qoldiradi
  onClear?: () => void;
  initialFilters?: Record<string, any>;
}

const parseDate = (val: any): Date | null => {
  if (!val) return null;
  if (val instanceof Date) return val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

const normalizeMulti = (val: any): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string" && val) return val.split(",");
  return [];
};

const HA_YOQ_SEGMENTED = [
  { value: "", label: "Hammasi" },
  { value: "true", label: "Ha" },
  { value: "false", label: "Yo'q" },
];

// Sana maydonlari uchun default oraliq — joriy yil boshidan oxirigacha
const startOfYear = () => dayjs().startOf("year").toDate();
const endOfYear = () => dayjs().endOf("year").toDate();

const buildValues = (initial: Record<string, any>): Record<string, any> => ({
  created_at_after:
    parseDate(initial.start_date || initial.created_at_after || initial.created_at__gte) ||
    startOfYear(),
  created_at_before:
    parseDate(initial.end_date || initial.created_at_before || initial.created_at__lte) ||
    endOfYear(),
  updated_at_after:
    parseDate(initial.updated_at_after || initial.updated_at__gte) || startOfYear(),
  updated_at_before:
    parseDate(initial.updated_at_before || initial.updated_at__lte) || endOfYear(),
  // districts
  region: normalizeMulti(initial.region),
  // sections
  questions_count_min: initial.questions_count_min || "",
  questions_count_max: initial.questions_count_max || "",
  // questions
  section: normalizeMulti(initial.section),
  target_gender: initial.target_gender || "",
  is_trap_question: initial.is_trap_question || "",
});

const RefFilterModal = ({
  entity,
  isOpen,
  onClose,
  onSubmit,
  onClear,
  initialFilters = {},
}: RefFilterModalProps) => {
  const [values, setValues] = useState<Record<string, any>>(() => buildValues(initialFilters));

  const [regions, setRegions] = useState<{ value: string; label: string }[]>([]);
  const [sections, setSections] = useState<{ value: string; label: string }[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setValues(buildValues(initialFilters));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    const fetchSelectOptions = async () => {
      setLoadingOptions(true);
      try {
        if (entity === "districts") {
          const list = await REF_APIS.regions.list();
          setRegions(list.map((r) => ({ value: String(r.id), label: r.name || String(r.id) })));
        } else if (entity === "questions") {
          const list = await REF_APIS.sections.list();
          setSections(list.map((s) => ({ value: String(s.id), label: s.name || String(s.id) })));
        }
      } catch (err) {
        console.error("Error loading filter dropdown options:", err);
      } finally {
        setLoadingOptions(false);
      }
    };

    if (isOpen) {
      fetchSelectOptions();
    }
  }, [entity, isOpen]);

  if (!isOpen) return null;

  const setVal = (key: string, val: any) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleClear = () => {
    setValues(buildValues({}));
    // Barcha filtrlarni bekor qilib, ro'yxatni yangilaymiz — modal ochiq qoladi
    onClear?.();
  };

  const handleApply = () => {
    const params: Record<string, any> = {};

    if (values.created_at_after) {
      params.start_date = dayjs(values.created_at_after).format("YYYY-MM-DD");
    }
    if (values.created_at_before) {
      params.end_date = dayjs(values.created_at_before).format("YYYY-MM-DD");
    }
    // NOTE: "Yangilangan sana" / "Savollar soni" — backendda hali yo'q, keyin qo'shiladi.
    if (values.updated_at_after) {
      const formatted = dayjs(values.updated_at_after).format("YYYY-MM-DD");
      params.updated_at_after = formatted;
      params.updated_at__gte = formatted;
    }
    if (values.updated_at_before) {
      const formatted = dayjs(values.updated_at_before).format("YYYY-MM-DD");
      params.updated_at_before = formatted;
      params.updated_at__lte = formatted;
    }

    if (entity === "districts" && values.region.length > 0) {
      params.region = values.region.join(",");
    }

    if (entity === "sections") {
      if (values.questions_count_min !== "") params.questions_count_min = values.questions_count_min;
      if (values.questions_count_max !== "") params.questions_count_max = values.questions_count_max;
    }

    if (entity === "questions") {
      if (values.section.length > 0) params.section = values.section.join(",");
      if (values.target_gender) params.target_gender = values.target_gender;
      if (values.is_trap_question) params.is_trap_question = values.is_trap_question;
    }

    onSubmit(params);
  };

  const sectionLabel = (text: string) => (
    <p className="text-[12px] font-semibold text-[#737373] dark:text-zinc-400 mt-1">
      {text}
    </p>
  );

  const numberRangeInput = (key: string, placeholder: string) => (
    <input
      type="number"
      value={values[key]}
      onChange={(e) => setVal(key, e.target.value)}
      placeholder={placeholder}
      className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] text-[#0a0a0a] dark:text-[#fafafa] outline-none focus:border-[#0474F3] transition-colors"
    />
  );

  const dateRangeBlock = (afterKey: string, beforeKey: string, label: string) => (
    <div>
      {sectionLabel(label)}
      <div className="grid grid-cols-2 gap-3 mt-2">
        <DatePicker
          prefixLabel="dan"
          showTime
          value={values[afterKey]}
          onChange={(d: Date | null) => setVal(afterKey, d)}
          widthClass="w-full"
          placeholder="01.01.2026 00:00"
        />
        <DatePicker
          prefixLabel="gacha"
          showTime
          value={values[beforeKey]}
          onChange={(d: Date | null) => setVal(beforeKey, d)}
          widthClass="w-full"
          placeholder="31.12.2026 23:59"
        />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/40">
      <div className="w-full max-w-[550px] bg-white dark:bg-[#141414] sm:rounded-[20px] rounded-t-[20px] border border-[#e5e5e5] dark:border-[#262626] shadow-2xl animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 shrink-0">
          <span className="text-[16px] font-bold text-[#0A0A0A] dark:text-[#fafafa]">
            Filtr
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto px-6 pb-1 space-y-5 min-h-0">
          {/* Districts — Viloyat */}
          {entity === "districts" && (
            <div>
              {sectionLabel("Viloyat")}
              <div className="mt-2">
                <Select
                  multiple
                  value={values.region}
                  onChange={(v) => setVal("region", v)}
                  placeholder={loadingOptions ? "Yuklanmoqda..." : "Viloyatni tanlang..."}
                  options={regions}
                />
              </div>
            </div>
          )}

          {/* Sections — Savollar soni (backendda keyin qo'shiladi) */}
          {entity === "sections" && (
            <div>
              {sectionLabel("Savollar soni")}
              <div className="grid grid-cols-2 gap-3 mt-2">
                {numberRangeInput("questions_count_min", "0")}
                {numberRangeInput("questions_count_max", "30")}
              </div>
            </div>
          )}

          {/* Questions */}
          {entity === "questions" && (
            <>
              <div>
                {sectionLabel("Bo'lim")}
                <div className="mt-2">
                  <Select
                    multiple
                    value={values.section}
                    onChange={(v) => setVal("section", v)}
                    placeholder={loadingOptions ? "Yuklanmoqda..." : "Bo'limni tanlang..."}
                    options={sections}
                  />
                </div>
              </div>

              <div>
                {sectionLabel("Kimga")}
                <div className="mt-2">
                  <SegmentedControl
                    value={values.target_gender}
                    onChange={(v) => setVal("target_gender", v)}
                    options={[
                      { value: "", label: "Hammaga" },
                      { value: "groom", label: "Kuyov" },
                      { value: "bride", label: "Kelin" },
                    ]}
                  />
                </div>
              </div>

              <div>
                {sectionLabel("Tuzoq savol")}
                <div className="mt-2">
                  <SegmentedControl
                    value={values.is_trap_question}
                    onChange={(v) => setVal("is_trap_question", v)}
                    options={HA_YOQ_SEGMENTED}
                  />
                </div>
              </div>
            </>
          )}

          {/* Sana oraliqlari — barcha bo'limlar uchun.
              "Yangilangan sana" backendda hali yo'q, keyin qo'shiladi. */}
          {dateRangeBlock("created_at_after", "created_at_before", "Yaratilgan sana")}
          {dateRangeBlock("updated_at_after", "updated_at_before", "Yangilangan sana")}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 pt-2 pb-5 shrink-0">
          <button
            onClick={handleClear}
            className="px-5 py-2.5 flex items-center gap-2 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] font-semibold text-[#404040] dark:text-[#e5e5e5] hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <img src="/icon1.svg" alt="" className="w-4 h-4 shrink-0" />
            Tozalash
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 flex items-center gap-2 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] font-semibold text-[#404040] dark:text-[#e5e5e5] hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 shrink-0" strokeWidth={2} />
              Bekor qilish
            </button>
            <button
              onClick={handleApply}
              className="px-5 py-2.5 flex items-center gap-2 bg-[#0474F3] hover:bg-[#023399] active:bg-[#0474F3] text-white rounded-xl text-[13px] font-semibold transition-colors cursor-pointer shadow-sm"
            >
              <Check className="w-4 h-4 shrink-0" strokeWidth={2} />
              Qo'llash
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefFilterModal;
