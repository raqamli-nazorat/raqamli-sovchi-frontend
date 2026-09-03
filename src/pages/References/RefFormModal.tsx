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
  // tahrirlash modalida obyekt detali (permissions va h.k.) hali yuklanmoqda
  detailLoading?: boolean;
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
  group_label?: string;
}

// GET /accounts/permissions/ javobi guruhlangan yoki tekis kelishi mumkin
interface PermissionGroupResp {
  model_name: string;
  group_label?: string;
  permissions: Permission[];
}

const ACTION_COLUMNS = [
  { key: "view", label: "Ko'rish" },
  { key: "add", label: "Qo'shish" },
  { key: "change", label: "Tahrirlash" },
  { key: "delete", label: "O'chirish" },
];

// codename'dan amalni aniqlash. Django standarti `view_x/add_x/change_x/delete_x`,
// ammo backendda boshqa nomlanish ham bo'lishi mumkin (create_/edit_/read_ va h.k.).
const ACTION_SYNONYMS: Record<string, string[]> = {
  view: ["view", "read", "list", "see", "retrieve"],
  add: ["add", "create", "new"],
  change: ["change", "edit", "update", "modify"],
  delete: ["delete", "remove", "destroy"],
};

const classifyAction = (codename?: string): string | null => {
  if (!codename) return null;
  const tokens = codename.toLowerCase().split(/[^a-z]+/).filter(Boolean);
  for (const [action, words] of Object.entries(ACTION_SYNONYMS)) {
    if (tokens.some((t) => words.includes(t))) return action;
  }
  return null;
};

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

// Django/allauth ichki modellari — rol ruxsatlari jadvalida ko'rsatilmaydi
const FRAMEWORK_MODELS = new Set([
  "logentry",
  "permission",
  "group",
  "contenttype",
  "session",
  "site",
  "token",
  "tokenproxy",
  "emailaddress",
  "emailconfirmation",
  "socialaccount",
  "socialapp",
  "socialtoken",
]);

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
  detailLoading = false,
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
  const [permData, setPermData] = useState<(Permission | PermissionGroupResp)[]>([]);
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
        // Wrapper bo'lsa payload response.data.data ichida bo'ladi.
        // Javob quyidagi ko'rinishlardan biri bo'lishi mumkin:
        //   massiv:        [{ id, codename, model_name, group_label }]
        //   guruh-massiv:  [{ model_name, group_label, permissions: [...] }]
        //   guruh-obyekt:  { "<model>": { model_name, group_label, permissions: [...] } }
        const data = res.data?.data ?? res.data;
        let arr: unknown[] = [];
        if (Array.isArray(data)) arr = data;
        else if (Array.isArray(data?.results)) arr = data.results;
        else if (data && typeof data === "object") arr = Object.values(data);

        if (arr.length === 0) {
          console.warn(
            "[roles] GET accounts/permissions/ bo'sh yoki kutilmagan formatda javob qaytardi:",
            res.data
          );
        }
        setPermData(arr as (Permission | PermissionGroupResp)[]);
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
  // GET /accounts/permissions/ javobi ikki ko'rinishda bo'lishi mumkin:
  //   guruhlangan: [{ model_name, group_label, permissions: [{id,name,codename,...}] }]
  //   tekis:       [{ id, name, codename, model_name, group_label }]
  // Ikkalasini ham qo'llab-quvvatlaymiz; qatorlar `group_label` bo'yicha birlashtiriladi.
  const permGroups = useMemo(() => {
    // 1. Har qanday shakldan tekis Permission ro'yxatini yig'ib olamiz
    const flat: Permission[] = [];
    for (const entry of permData) {
      if (!entry) continue;
      const nested = (entry as PermissionGroupResp).permissions;
      if (Array.isArray(nested)) {
        for (const p of nested) {
          flat.push({
            ...p,
            model_name: p.model_name ?? (entry as PermissionGroupResp).model_name,
            group_label: p.group_label ?? (entry as PermissionGroupResp).group_label,
          });
        }
      } else {
        flat.push(entry as Permission);
      }
    }

    // 2. group_label (bo'lmasa model_name) bo'yicha guruhlaymiz.
    //    Framework modellari (token, logentry, socialaccount, ...) tashlab yuboriladi.
    const groups = new Map<string, { label: string; actions: Record<string, Permission[]> }>();
    for (const p of flat) {
      const model = (p.model_name || "").toLowerCase();
      if (FRAMEWORK_MODELS.has(model)) continue;
      const label = p.group_label || PERM_GROUP_LABELS[model] || humanize(model) || "Boshqa";
      const action = classifyAction(p.codename);
      if (!action) continue;
      if (!groups.has(label)) groups.set(label, { label, actions: {} });
      const bucket = groups.get(label)!.actions;
      bucket[action] ||= [];
      if (!bucket[action].some((x) => x.id === p.id)) bucket[action].push(p);
    }

    const result = [...groups.values()]
      .filter((g) => Object.keys(g.actions).length > 0)
      .sort((a, b) => a.label.localeCompare(b.label, "uz"));

    if (!permsLoading && permData.length > 0 && result.length === 0) {
      console.warn(
        "[roles] Ruxsatlar keldi, lekin hech biri view/add/change/delete amaliga mos kelmadi. " +
          "Backend codename'larini tekshiring:",
        permData
      );
    }
    return result;
  }, [permData, permsLoading]);

  const checkedIds = (name: string): Set<number> =>
    new Set((values[name] || "").split(",").filter(Boolean).map(Number));

  // Bir katakda bir nechta permission bo'lishi mumkin (masalan user+role bitta
  // "Foydalanuvchilar va rollar" qatoriga birlashganda) — hammasini birga sozlaymiz.
  const cellChecked = (name: string, perms?: Permission[]) => {
    if (!perms || perms.length === 0) return false;
    const set = checkedIds(name);
    return perms.every((p) => set.has(p.id));
  };

  const toggleCell = (name: string, perms: Permission[]) => {
    const set = checkedIds(name);
    const allOn = perms.every((p) => set.has(p.id));
    perms.forEach((p) => (allOn ? set.delete(p.id) : set.add(p.id)));
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
      return (
        <div key={field.name} className="flex flex-col min-h-0 flex-1">
          <div className="overflow-hidden flex flex-col min-h-0 flex-1">
            <div className="grid grid-cols-[1fr_repeat(4,72px)] items-center py-2.5 text-[11px] font-semibold text-[#737373] dark:text-[#a3a3a3] shrink-0">
              <span className="text-[13px] font-semibold text-[#0a0a0a]">Ruxsatlar</span>
              {ACTION_COLUMNS.map((c) => (
                <span key={c.key} className="text-end">
                  {c.label}
                </span>
              ))}
            </div>
            {/* Faqat shu ro'yxat scroll bo'ladi — yuqori qism qotib turadi */}
            <div className="overflow-y-auto min-h-0 flex-1">
              {(permsLoading || detailLoading) && (
                <p className="px-4 py-4 text-[12px] text-[#a3a3a3]">Yuklanmoqda…</p>
              )}
              {!permsLoading && !detailLoading && permGroups.length === 0 && (
                <p className="px-4 py-4 text-[12px] text-[#a3a3a3]">Ruxsatlar topilmadi.</p>
              )}
              {!detailLoading && permGroups.map((g) => (
                <div
                  key={g.label}
                  className="grid grid-cols-[1fr_repeat(4,72px)] items-center py-2.5 border-t border-[#f0f0f0] dark:border-[#262626]"
                >
                  <span className="text-[13px] text-[#0A0A0A] dark:text-[#fafafa]">{g.label}</span>
                  {ACTION_COLUMNS.map((c) => {
                    const perms = g.actions[c.key];
                    return (
                      <span key={c.key} className="flex justify-end">
                        <input
                          type="checkbox"
                          disabled={!perms}
                          checked={cellChecked(field.name, perms)}
                          onChange={() => perms && toggleCell(field.name, perms)}
                          className="w-[18px] h-[18px] rounded-[6px] border-[#d4d4d4] dark:border-zinc-600 accent-[#0474F3] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        />
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
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
          hasPermissions ? "max-w-[680px] h-[85vh]" : "max-w-[460px] max-h-[90vh]"
        } bg-white dark:bg-[#141414] rounded-[20px] border border-[#e5e5e5] dark:border-[#262626] shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col`}
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

        {/* Body — permissions modalida yuqori qism qotib turadi, faqat ro'yxat scroll bo'ladi */}
        <div
          className={`px-6 pb-2 space-y-4 min-h-0 ${
            hasPermissions ? "flex flex-col flex-1 overflow-hidden" : "overflow-y-auto"
          }`}
        >
          {rows}
        </div>

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
              disabled={saving || detailLoading || (isEdit && !dirty)}
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
