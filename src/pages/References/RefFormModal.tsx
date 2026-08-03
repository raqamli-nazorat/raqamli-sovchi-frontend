import { useEffect, useState } from "react";
import { X } from "lucide-react";
import Select from "../../components/ui/Select";
import { REF_APIS } from "./referencesApi";
import type { RefCtx, RefField } from "./referencesConfig";

interface RefFormModalProps {
  title: string;
  hint?: string;
  fields: RefField[];
  ctx: RefCtx;
  initialValues?: Record<string, string>;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (values: Record<string, string>) => void;
}

const emptyValues = (fields: RefField[]) => {
  const values: Record<string, string> = {};
  for (const f of fields) {
    values[f.name] = f.type === "select" ? f.staticOptions?.[0]?.value ?? "" : "";
  }
  return values;
};

const RefFormModal = ({
  title,
  hint,
  fields,
  initialValues,
  saving,
  error,
  onClose,
  onSubmit,
}: RefFormModalProps) => {
  const [values, setValues] = useState<Record<string, string>>(() => ({
    ...emptyValues(fields),
    ...initialValues,
  }));
  const [validationError, setValidationError] = useState<string | null>(null);
  const [loadedOptions, setLoadedOptions] = useState<Record<string, { value: string; label: string }[]>>({});

  useEffect(() => {
    const loadOptions = async () => {
      const selectFields = fields.filter((f) => f.type === "select" && f.optionsFromSlug);
      for (const f of selectFields) {
        const slug = f.optionsFromSlug!;
        try {
          const list = await REF_APIS[slug].list();
          const opts = list.map((item) => ({
            value: item.id,
            label: item.name || item.text || item.id,
          }));
          setLoadedOptions((prev) => ({ ...prev, [slug]: opts }));
        } catch (err) {
          console.error(`Failed to load options for slug ${slug}:`, err);
        }
      }
    };
    loadOptions();
  }, [fields]);

  const setValue = (name: string, value: string) =>
    setValues((prev) => ({ ...prev, [name]: value }));

  const selectOptions = (field: RefField): { value: string; label: string }[] => {
    if (field.staticOptions) return field.staticOptions;
    if (field.optionsFromSlug) {
      return loadedOptions[field.optionsFromSlug] || [];
    }
    return [];
  };

  const handleSubmit = () => {
    const missing = fields.find((f) => f.required && !values[f.name]?.trim());
    if (missing) {
      setValidationError(`"${missing.label}" maydonini to'ldiring.`);
      return;
    }
    setValidationError(null);
    onSubmit(values);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-[560px] bg-white dark:bg-[#141414] rounded-[24px] border border-[#e5e5e5] dark:border-[#262626] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <h3 className="text-[16px] font-bold text-[#0A0A0A] dark:text-[#fafafa]">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {fields.map((field) => (
            <div key={field.name}>
              <label className="text-[12px] font-semibold text-[#404040] dark:text-zinc-300 block mb-2">
                {field.label}
              </label>
              {field.type === "select" ? (
                <Select
                  value={values[field.name] || ""}
                  onChange={(v) => setValue(field.name, v)}
                  options={selectOptions(field)}
                />
              ) : (
                <input
                  type={field.type === "number" ? "number" : "text"}
                  value={values[field.name] || ""}
                  onChange={(e) => setValue(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] text-[#0a0a0a] dark:text-[#fafafa] outline-none focus:border-[#0474F3] transition-colors"
                />
              )}
            </div>
          ))}
        </div>

        {hint && (
          <p className="text-[12px] text-[#737373] dark:text-[#a3a3a3] mt-3">{hint}</p>
        )}

        {(validationError || error) && (
          <p className="text-[12px] text-[#D32F2F] mt-3">{validationError || error}</p>
        )}

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] font-semibold text-[#404040] dark:text-[#e5e5e5] hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Bekor qilish
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2.5 bg-[#0474F3] hover:bg-[#023399] active:bg-[#0474F3] disabled:bg-[#4599f8] text-white rounded-xl text-[13px] font-semibold transition-colors cursor-pointer disabled:cursor-default shadow-sm flex items-center gap-2"
          >
            {saving && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Saqlash
          </button>
        </div>
      </div>
    </div>
  );
};

export default RefFormModal;
