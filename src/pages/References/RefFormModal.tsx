import { useEffect, useMemo, useState } from "react";
import { X, Save, Trash2 } from "lucide-react";
import Select from "../../components/ui/Select";
import { axiosAPI } from "../../lib/axiosAPI";
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
  // faqat tahrirlash rejimida — chapdagi qizil "O'chirish" tugmasi
  onDelete?: () => void;
}

interface Permission {
  id: number;
  name: string;
  codename: string;
  model_name: string;
}

const ACTION_COLUMNS = [
  { key: "view", label: "Ko'rish" },
  { key: "add", label: "Qo'shish" },
  { key: "change", label: "Tahrirlash" },
  { key: "delete", label: "O'chirish" },
];

// model_name → o'zbekcha guruh nomi. Backend model nomlariga qarab to'ldiriladi;
// mos kelmaganlari model_name'ning o'zidan chiroyli ko'rinishda chiqadi.
const PERM_GROUP_LABELS: Record<string, string> = {
  dashboard: "Boshqaruv paneli",
  reference: "Ma'lumotnomalar",
  consumer: "Iste'molchilar",
  detection: "Aniqlangan holatlar",
  employee: "Xodimlar",
  user: "Foydalanuvchilar va rollar",
  role: "Foydalanuvchilar va rollar",
  report: "Hisobotlar va eksport",
};

const humanize = (s: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/[_-]+/g, " ") : s;

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
  onDelete,
}: RefFormModalProps) => {
  const isEdit = !!onDelete;

  const [values, setValues] = useState<Record<string, string>>(() => ({
    ...emptyValues(fields),
    ...initialValues,
  }));
  const [validationError, setValidationError] = useState<string | null>(null);
  const [loadedOptions, setLoadedOptions] = useState<
    Record<string, { value: string; label: string }[]>
  >({});

  const hasPermissions = fields.some((f) => f.type === "permissions");
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permsLoading, setPermsLoading] = useState(false);

  const baseline = useMemo(
    () => JSON.stringify({ ...emptyValues(fields), ...initialValues }),
    [fields, initialValues]
  );
  const dirty = JSON.stringify(values) !== baseline;

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

  useEffect(() => {
    if (!hasPermissions) return;
    setPermsLoading(true);
    axiosAPI
      .get("accounts/permissions/")
      .then((res) => {
        const data = res.data?.data ?? res.data;
        setPermissions(Array.isArray(data) ? data : data?.results ?? []);
      })
      .catch((err) => console.error("Failed to load permissions:", err))
      .finally(() => setPermsLoading(false));
  }, [hasPermissions]);

  const setValue = (name: string, value: string) =>
    setValues((prev) => ({ ...prev, [name]: value }));

  const selectOptions = (field: RefField): { value: string; label: string }[] => {
    if (field.staticOptions) return field.staticOptions;
    if (field.optionsFromSlug) return loadedOptions[field.optionsFromSlug] || [];
    return [];
  };

  // ── Ruxsatlar jadvali ──
  const permGroups = useMemo(() => {
    const map = new Map<string, Record<string, Permission>>();
    for (const p of permissions) {
      const action = ACTION_COLUMNS.find((c) => p.codename?.startsWith(`${c.key}_`))?.key;
      if (!action) continue;
      if (!map.has(p.model_name)) map.set(p.model_name, {});
      map.get(p.model_name)![action] = p;
    }
    return [...map.entries()].map(([model, actions]) => ({
      model,
      label: PERM_GROUP_LABELS[model] || humanize(model),
      actions,
    }));
  }, [permissions]);

  const checkedIds = (name: string): Set<number> =>
    new Set((values[name] || "").split(",").filter(Boolean).map(Number));

  const togglePerm = (name: string, id: number) => {
    const set = checkedIds(name);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    setValue(name, [...set].join(","));
  };

  const handleSubmit = () => {
    const missing = fields.find(
      (f) => f.required && f.type !== "permissions" && !values[f.name]?.trim()
    );
    if (missing) {
      setValidationError(`"${missing.label}" maydonini to'ldiring.`);
      return;
    }
    setValidationError(null);
    onSubmit(values);
  };

  // ── Bitta maydon ──
  const renderField = (field: RefField) => {
    if (field.type === "permissions") {
      const checked = checkedIds(field.name);
      return (
        <div key={field.name}>
          <p className="text-[13px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mb-1">
            {field.label}
          </p>
          <div className="border border-[#f0f0f0] dark:border-[#262626] rounded-xl overflow-hidden">
            <div className="grid grid-cols-[1fr_repeat(4,72px)] items-center px-4 py-2.5 bg-[#FAFAFA] dark:bg-[#1c1c1c] text-[11px] font-semibold text-[#737373] dark:text-[#a3a3a3]">
              <span />
              {ACTION_COLUMNS.map((c) => (
                <span key={c.key} className="text-center">
                  {c.label}
                </span>
              ))}
            </div>
            {permsLoading && (
              <p className="px-4 py-4 text-[12px] text-[#a3a3a3]">Yuklanmoqda…</p>
            )}
            {!permsLoading && permGroups.length === 0 && (
              <p className="px-4 py-4 text-[12px] text-[#a3a3a3]">Ruxsatlar topilmadi.</p>
            )}
            {permGroups.map((g) => (
              <div
                key={g.model}
                className="grid grid-cols-[1fr_repeat(4,72px)] items-center px-4 py-2.5 border-t border-[#f0f0f0] dark:border-[#262626]"
              >
                <span className="text-[13px] text-[#0A0A0A] dark:text-[#fafafa]">{g.label}</span>
                {ACTION_COLUMNS.map((c) => {
                  const perm = g.actions[c.key];
                  return (
                    <span key={c.key} className="flex justify-center">
                      <input
                        type="checkbox"
                        disabled={!perm}
                        checked={!!perm && checked.has(perm.id)}
                        onChange={() => perm && togglePerm(field.name, perm.id)}
                        className="w-[18px] h-[18px] rounded-[6px] border-[#d4d4d4] dark:border-zinc-600 accent-[#0474F3] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      />
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div key={field.name}>
        <label className="text-[12px] font-medium text-[#737373] dark:text-zinc-400 block mb-1.5">
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
            className="w-full h-11 px-3.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] text-[#0a0a0a] dark:text-[#fafafa] outline-none focus:border-[#0474F3] transition-colors"
          />
        )}
      </div>
    );
  };

  // ── Maydonlarni chizish: ketma-ket span'lilar bitta qatorga ──
  const rows: React.ReactNode[] = [];
  for (let i = 0; i < fields.length; ) {
    const f = fields[i];
    if (f.span) {
      const group: RefField[] = [];
      while (i < fields.length && fields[i].span) group.push(fields[i++]);
      rows.push(
        <div key={`row-${group[0].name}`} className="grid grid-cols-3 gap-3">
          {group.map(renderField)}
        </div>
      );
    } else {
      rows.push(renderField(f));
      i++;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        className={`w-full ${
          hasPermissions ? "max-w-[680px]" : "max-w-[460px]"
        } bg-white dark:bg-[#141414] rounded-[20px] border border-[#e5e5e5] dark:border-[#262626] shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          <h3 className="text-[17px] font-bold text-[#0A0A0A] dark:text-[#fafafa]">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-2 space-y-4 overflow-y-auto min-h-0">{rows}</div>

        {hint && <p className="text-[12px] text-[#737373] dark:text-[#a3a3a3] px-6 mt-3">{hint}</p>}
        {(validationError || error) && (
          <p className="text-[12px] text-[#D32F2F] px-6 mt-3">{validationError || error}</p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 pt-4 pb-6 shrink-0">
          {onDelete ? (
            <button
              onClick={onDelete}
              className="px-4 py-2.5 flex items-center gap-2 bg-[#DC2626] hover:bg-[#B91C1C] active:bg-[#7F1D1D] text-white rounded-xl text-[13px] font-semibold transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4 shrink-0" strokeWidth={2} />
              O'chirish
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 flex items-center gap-2 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] font-semibold text-[#404040] dark:text-[#e5e5e5] hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 shrink-0" strokeWidth={2} />
              Bekor qilish
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || (isEdit && !dirty)}
              className="px-5 py-2.5 flex items-center gap-2 bg-[#0474F3] hover:bg-[#023399] active:bg-[#0474F3] disabled:bg-[#E5E5E5] disabled:text-[#a3a3a3] dark:disabled:bg-zinc-800 disabled:cursor-not-allowed text-white rounded-xl text-[13px] font-semibold transition-colors cursor-pointer shadow-sm"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4 shrink-0" strokeWidth={2} />
              )}
              Saqlash
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefFormModal;
