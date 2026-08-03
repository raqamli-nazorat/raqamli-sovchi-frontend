import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronRight, Plus, RefreshCw, Search } from "lucide-react";
import { useHeader } from "../../components/Layout/Layout";
import { REF_APIS, refApiError, type RefItem } from "./referencesApi";
import { REF_CONFIGS, type RefCtx } from "./referencesConfig";
import RefFormModal from "./RefFormModal";

const ReferenceListPage = () => {
  const { entity } = useParams<{ entity: string }>();
  const navigate = useNavigate();
  const { setHeaderTitle, setHeaderSubtitle } = useHeader();

  const config = entity ? REF_CONFIGS[entity] : undefined;
  const api = entity ? REF_APIS[entity] : undefined;

  const [items, setItems] = useState<RefItem[]>([]);
  const [ctx, setCtx] = useState<RefCtx>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!config || !api) return;
    setLoading(true);
    setError(null);
    try {
      const relatedSlugs = config.relatedSlugs || [];
      const [list, ...related] = await Promise.all([
        api.list(),
        ...relatedSlugs.map((slug) => REF_APIS[slug].list()),
      ]);
      const nextCtx: RefCtx = {};
      relatedSlugs.forEach((slug, idx) => {
        nextCtx[slug] = related[idx];
      });
      setItems(list);
      setCtx(nextCtx);
    } catch (err: any) {
      console.error(`References (${config.slug}) fetch error:`, err);
      setError(refApiError(err, "Ma'lumotlarni yuklashda xatolik yuz berdi."));
    } finally {
      setLoading(false);
    }
  }, [entity]);

  useEffect(() => {
    setSearch("");
    setShowModal(false);
    load();
  }, [load]);

  useEffect(() => {
    if (!config) return;
    setHeaderTitle("Ma'lumotnomalar");
    setHeaderSubtitle(`${config.plural} · ${config.subtitle}`);
  }, [entity, setHeaderTitle, setHeaderSubtitle]);

  const filtered = useMemo(() => {
    if (!config || !search.trim()) return items;
    const q = search.trim().toLowerCase();
    return items.filter((item) =>
      config.searchKeys.some((key) => String(item[key] ?? "").toLowerCase().includes(q))
    );
  }, [items, search, config]);

  if (!config || !api) {
    return (
      <div className="p-6">
        <div className="bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#262626] rounded-2xl p-10 text-center">
          <p className="text-[14px] font-semibold text-[#0A0A0A] dark:text-white">Bo'lim topilmadi</p>
        </div>
      </div>
    );
  }

  const handleCreate = async (values: Record<string, string>) => {
    setSaving(true);
    setSaveError(null);
    try {
      const payload = config.toPayload ? config.toPayload(values) : { ...values };
      await api.create(payload);
      setShowModal(false);
      await load();
    } catch (err: any) {
      console.error(`References (${config.slug}) create error:`, err);
      setSaveError(refApiError(err, "Saqlashda xatolik yuz berdi."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      {/* ── Qidiruv + Qo'shish ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative w-full max-w-[400px]">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737373] pointer-events-none stroke-[2.5]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={config.searchPlaceholder}
            className="w-full h-10 pl-9 pr-4 bg-white dark:bg-[#141414] rounded-lg border border-[#e5e5e5] dark:border-[#262626] text-[13px] text-[#0a0a0a] dark:text-[#fafafa] placeholder:text-[#a3a3a3] dark:placeholder:text-[#525252] focus:outline-none focus:border-[#FF5900] transition-colors"
          />
        </div>
        <button
          onClick={() => {
            setSaveError(null);
            setShowModal(true);
          }}
          className="h-10 px-4 flex items-center gap-1.5 bg-[#FF5900] hover:bg-[#E04F00] active:scale-[0.99] text-white text-[13px] font-semibold rounded-lg transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" /> Qo'shish
        </button>
      </div>

      {/* ── Jadval ── */}
      <div className="bg-white dark:bg-[#141414] rounded-xl border border-[#E5E5E5] dark:border-[#262626] overflow-hidden">
        {/* Sarlavhalar */}
        <div className="hidden md:flex items-center bg-[#FAFAFA] dark:bg-[#202020] px-6 py-3.5 border-b border-[#F5F5F5] dark:border-[#262626] text-[11px] font-semibold text-[#737373] dark:text-[#A3A3A3] tracking-wider gap-4">
          <div className="w-[32px]">#</div>
          {config.columns.map((col) => (
            <div key={col.header} className={col.width ? `${col.width} shrink-0` : "flex-1 min-w-0"}>
              {col.header}
            </div>
          ))}
          <div className="w-[24px]" />
        </div>

        {loading ? (
          <div className="divide-y divide-[#F5F5F5] dark:divide-[#262626]">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center px-6 py-4.5 animate-pulse gap-4">
                <div className="w-[32px] h-4 bg-gray-200 dark:bg-zinc-800 rounded" />
                <div className="flex-1 h-4 bg-gray-200 dark:bg-zinc-800 rounded" />
                {config.columns.slice(1).map((col) => (
                  <div
                    key={col.header}
                    className={`${col.width || "w-[140px]"} h-4 bg-gray-200 dark:bg-zinc-800 rounded hidden md:block shrink-0`}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-10 text-center">
            <p className="text-[14px] font-semibold text-[#D32F2F]">Xatolik</p>
            <p className="text-[13px] text-[#737373] dark:text-[#A3A3A3] mt-1">{error}</p>
            <button
              onClick={load}
              className="mt-4 h-10 px-4 inline-flex items-center gap-2 bg-[#FF5900] hover:bg-[#E04F00] text-white text-[13px] font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" strokeWidth={2.2} /> Qayta urinish
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-[14px] font-semibold text-[#0A0A0A] dark:text-white">
              {search ? "Natija topilmadi" : `${config.plural} ro'yxati bo'sh`}
            </p>
            <p className="text-[13px] text-[#737373] dark:text-[#A3A3A3] mt-1">
              {search
                ? `«${search}» bo'yicha hech narsa topilmadi.`
                : "Yangi yozuv qo'shish uchun «Qo'shish» tugmasini bosing."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#F5F5F5] dark:divide-[#262626]">
            {filtered.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => navigate(`/references/${config.slug}/${item.id}`)}
                className="flex flex-col md:flex-row md:items-center px-6 py-4.5 gap-1 md:gap-4 hover:bg-gray-50/50 dark:hover:bg-zinc-900/30 transition-colors cursor-pointer"
              >
                <div className="w-[32px] text-[13px] text-[#A3A3A3] tabular-nums hidden md:block">
                  {idx + 1}
                </div>
                {config.columns.map((col, colIdx) => (
                  <div
                    key={col.header}
                    className={`${col.width ? `md:${col.width} md:shrink-0` : "flex-1 min-w-0"} text-[13.5px] ${
                      colIdx === 0
                        ? "font-semibold text-[#0A0A0A] dark:text-white truncate"
                        : "text-[#404040] dark:text-[#D4D4D4]"
                    }`}
                  >
                    {colIdx > 0 && (
                      <span className="md:hidden text-gray-400 mr-2 text-[11px] uppercase">
                        {col.header}:
                      </span>
                    )}
                    {col.value(item, ctx)}
                  </div>
                ))}
                <div className="w-[24px] hidden md:flex items-center justify-end text-gray-400">
                  <ChevronRight size={16} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <RefFormModal
          title={config.formTitle}
          hint={config.formHint}
          fields={config.fields}
          ctx={ctx}
          saving={saving}
          error={saveError}
          onClose={() => setShowModal(false)}
          onSubmit={handleCreate}
        />
      )}
    </div>
  );
};

export default ReferenceListPage;
