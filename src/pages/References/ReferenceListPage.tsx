import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Plus, RefreshCw, Search, SlidersHorizontal, X } from "lucide-react";
import { useHeader } from "../../components/Layout/Layout";
import { axiosAPI } from "../../lib/axiosAPI";
import { REF_APIS, refApiError, type RefItem } from "./referencesApi";
import { REF_CONFIGS, type RefCtx } from "./referencesConfig";
import { getFilterChips } from "./referencesFilterMeta";
import RefFormModal from "./RefFormModal";
import RefFilterModal from "./RefFilterModal";
import RefDeleteModal from "./RefDeleteModal";

const ReferenceListPage = () => {
  const { entity } = useParams<{ entity: string }>();
  const { setHeaderTitle, setHeaderSubtitle } = useHeader();

  const config = entity ? REF_CONFIGS[entity] : undefined;
  const api = entity ? REF_APIS[entity] : undefined;

  const [items, setItems] = useState<RefItem[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [ctx, setCtx] = useState<RefCtx>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editItem, setEditItem] = useState<RefItem | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteItem, setDeleteItem] = useState<RefItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, any>>({});

  const isLoadingRef = useRef(false);

  const loadPage = useCallback(async (pageNum: number, searchQuery: string, currentFilters: Record<string, any> = {}) => {
    if (!config || !api) return;
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);
    try {
      const params: Record<string, any> = { page: pageNum, ...currentFilters };
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const list = await api.list(params) as any;

      if (pageNum === 1) {
        setItems(list);
      } else {
        const hasDuplicates = list.some((item: any) =>
          items.some((existing) => existing.id === item.id)
        );
        if (hasDuplicates || list.length === 0) {
          setHasMore(false);
          return;
        }
        setItems((prev) => [...prev, ...list]);
      }

      if (list && typeof list === "object" && "count" in list) {
        setTotalCount(list.count);
      } else {
        setTotalCount(pageNum === 1 ? list.length : null);
      }

      if (list && typeof list === "object" && "next" in list) {
        setHasMore(!!list.next);
      } else if (list && typeof list === "object" && "count" in list) {
        const currentTotal = (pageNum === 1 ? 0 : items.length) + list.length;
        setHasMore(currentTotal < list.count);
      } else {
        if (list.length < 10 || list.length % 10 !== 0) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      }
      setPage(pageNum);
    } catch (err: any) {
      console.error(`References (${config.slug}) fetch error:`, err);
      setError(refApiError(err, "Ma'lumotlarni yuklashda xatolik yuz berdi."));
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isLoadingRef.current = false;
    }
  }, [config, api]);

  useEffect(() => {
    setSearch("");
    setActiveSearch("");
    setHasMore(true);
    setShowFormModal(false);
    setEditItem(null);
    setDeleteItem(null);
    setShowFilterModal(false);
    setFilters({});
    setTotalCount(null);
    isLoadingRef.current = false;
    loadPage(1, "", {});
  }, [loadPage]);

  // Loaded purely so filter chips can show readable names instead of raw ids
  // (e.g. "Viloyat: Toshkent shahri" instead of "Viloyat: 3").
  useEffect(() => {
    const loadCtxData = async () => {
      try {
        if (entity === "districts") {
          const list = await REF_APIS.regions.list();
          setCtx((c) => ({ ...c, regions: list }));
        } else if (entity === "questions") {
          const list = await REF_APIS.sections.list();
          setCtx((c) => ({ ...c, sections: list }));
        }
      } catch (err) {
        console.error("Error loading reference context:", err);
      }
    };
    loadCtxData();
  }, [entity]);

  useEffect(() => {
    if (!config) return;
    setHeaderTitle("Ma'lumotnomalar");
    setHeaderSubtitle(config.subtitle);
  }, [entity, config, setHeaderTitle, setHeaderSubtitle]);

  if (!config || !api) {
    return (
      <div className="p-6">
        <div className="bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#262626] rounded-2xl p-10 text-center">
          <p className="text-[14px] font-semibold text-[#0A0A0A] dark:text-white">Bo'lim topilmadi</p>
        </div>
      </div>
    );
  }

  const openCreate = () => {
    setEditItem(null);
    setSaveError(null);
    setShowFormModal(true);
  };

  const openEdit = (item: RefItem) => {
    setEditItem(item);
    setSaveError(null);
    setShowFormModal(true);
  };

  const handleSave = async (values: Record<string, string>) => {
    setSaving(true);
    setSaveError(null);
    try {
      const payload = config.toPayload ? config.toPayload(values) : { ...values };

      if (config.slug === "questions") {
        const { options, ...questionPayload } = payload;
        if (editItem) {
          await api.update(editItem.id, questionPayload);
          if (options) {
            await axiosAPI.patch("accounts/options/bulk/", {
              question_id: editItem.id,
              options,
            });
          }
        } else {
          const created = await api.create(questionPayload);
          if (created && created.id && options) {
            await axiosAPI.post("accounts/options/bulk/", {
              question_id: created.id,
              options,
            });
          }
        }
      } else if (editItem) {
        await api.update(editItem.id, payload);
      } else {
        await api.create(payload);
      }

      setShowFormModal(false);
      setEditItem(null);
      setHasMore(true);
      await loadPage(1, activeSearch, filters);
    } catch (err: any) {
      console.error(`References (${config.slug}) save error:`, err);
      setSaveError(refApiError(err, "Saqlashda xatolik yuz berdi."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.remove(deleteItem.id);
      setDeleteItem(null);
      setHasMore(true);
      await loadPage(1, activeSearch, filters);
    } catch (err: any) {
      console.error(`References (${config.slug}) delete error:`, err);
      setDeleteError(refApiError(err, "O'chirishda xatolik yuz berdi."));
    } finally {
      setDeleting(false);
    }
  };

  const handleSearchSubmit = () => {
    setActiveSearch(search);
    setHasMore(true);
    loadPage(1, search, filters);
  };

  const handleFilterSubmit = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
    setShowFilterModal(false);
    setHasMore(true);
    loadPage(1, activeSearch, newFilters);
  };

  const handleRemoveChip = (keys: string[]) => {
    const newFilters = { ...filters };
    keys.forEach((k) => delete newFilters[k]);
    setFilters(newFilters);
    setHasMore(true);
    loadPage(1, activeSearch, newFilters);
  };

  const handleClearAllFilters = () => {
    setFilters({});
    setHasMore(true);
    loadPage(1, activeSearch, {});
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    if (loading || loadingMore || !hasMore) return;
    const threshold = 50;
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    if (isNearBottom) {
      loadPage(page + 1, activeSearch, filters);
    }
  };

  const filterChips = entity ? getFilterChips(entity, filters, ctx) : [];
  const hasActiveFilters = filterChips.length > 0;
  const resultCount = totalCount ?? items.length;

  return (
    <div className="p-4 space-y-4">
      {/* ── Qidiruv + Qo'shish ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearchSubmit();
          }}
          className="relative w-full max-w-[400px]"
        >
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737373] pointer-events-none stroke-[2.5]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              const val = e.target.value;
              setSearch(val);
              if (!val.trim()) {
                setActiveSearch("");
                setHasMore(true);
                loadPage(1, "", filters);
              }
            }}
            placeholder={config.searchPlaceholder}
            className="w-full h-10 pl-9 pr-4 bg-white dark:bg-[#141414] rounded-lg border border-[#e5e5e5] dark:border-[#262626] text-[13px] text-[#0a0a0a] dark:text-[#fafafa] placeholder:text-[#a3a3a3] dark:placeholder:text-[#525252] focus:outline-none focus:border-[#0474F3] transition-colors"
          />
        </form>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setShowFilterModal(true);
            }}
            className="relative h-10 px-4 flex items-center gap-1.5 bg-white hover:bg-[#f5f5f5] active:scale-[0.99] text-[#0a0a0a] dark:text-[#fafafa] border border-[#e5e5e5] dark:border-[#262626] rounded-lg transition-all cursor-pointer text-[13px] font-semibold"
          >
            <SlidersHorizontal className="w-4 h-4" /> Filter
            {hasActiveFilters && (
              <span className="absolute top-1.5 right-1.5 w-[7px] h-[7px] bg-[#EF4444] rounded-full" />
            )}
          </button>
          <button
            onClick={openCreate}
            className="h-10 px-4 flex items-center gap-1.5 bg-[#0474F3] hover:bg-[#042480] active:scale-[0.99] text-white text-[13px] font-semibold rounded-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" /> Qo'shish
          </button>
        </div>
      </div>

      {/* ── Faol filtrlar qatori ── */}
      {hasActiveFilters && (
        <div className="flex items-center flex-wrap gap-2">
          <span className="text-[13px] text-[#737373] dark:text-[#A3A3A3]">
            {resultCount} ta natija
          </span>
          {filterChips.map((chip) => (
            <span
              key={chip.keys.join("|")}
              className="inline-flex items-center gap-1 pl-3 pr-2 py-1.5 bg-[#0474F3]/10 text-[#0474F3] text-[12.5px] font-medium rounded-full"
            >
              {chip.label}
              <button
                type="button"
                onClick={() => handleRemoveChip(chip.keys)}
                className="p-0.5 hover:text-[#023399] transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={handleClearAllFilters}
            className="text-[13px] font-semibold text-[#0474F3] hover:text-[#023399] transition-colors cursor-pointer"
          >
            Tozalash
          </button>
        </div>
      )}

      {/* ── Jadval ── */}
      <div
        onScroll={handleScroll}
        className="bg-white dark:bg-[#141414] rounded-xl border border-[#E5E5E5] dark:border-[#262626] overflow-y-auto max-h-[calc(100vh-150px)]"
      >
        {/* Sarlavhalar */}
        <div className="hidden md:flex items-center bg-[#FAFAFA] dark:bg-[#202020] px-6 py-3.5 border-b border-[#F5F5F5] dark:border-[#262626] text-[11px] font-semibold text-[#737373] dark:text-[#A3A3A3] tracking-wider gap-4 sticky top-0 z-10">
          <div className="w-[32px]">#</div>
          {config.columns.map((col) => (
            <div key={col.header} className={col.width ? `${col.width} shrink-0` : "flex-1 min-w-0"}>
              {col.header}
            </div>
          ))}
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
              onClick={() => loadPage(1, activeSearch, filters)}
              className="mt-4 h-10 px-4 inline-flex items-center gap-2 bg-[#0474F3] hover:bg-[#042480] text-white text-[13px] font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" strokeWidth={2.2} /> Qayta urinish
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-[14px] font-semibold text-[#0A0A0A] dark:text-white">
              {activeSearch ? "Natija topilmadi" : `${config.plural} ro'yxati bo'sh`}
            </p>
            <p className="text-[13px] text-[#737373] dark:text-[#A3A3A3] mt-1">
              {activeSearch
                ? `«${activeSearch}» bo'yicha hech narsa topilmadi.`
                : "Yangi yozuv qo'shish uchun «Qo'shish» tugmasini bosing."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#F5F5F5] dark:divide-[#262626]">
            {items.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => openEdit(item)}
                className="flex flex-col md:flex-row md:items-center px-6 py-4.5 gap-1 md:gap-4 hover:bg-gray-50/50 dark:hover:bg-zinc-900/30 transition-colors cursor-pointer"
              >
                <div className="w-[32px] text-[13px] text-[#A3A3A3] tabular-nums hidden md:block">
                  {idx + 1}
                </div>
                {config.columns.map((col, colIdx) => (
                  <div
                    key={col.header}
                    className={`${col.width ? `${col.width} shrink-0` : "flex-1 min-w-0"} text-[13.5px] font-semibold text-[#0A0A0A] dark:text-white truncate`}
                    title={col.value(item, ctx)}
                  >
                    {colIdx > 0 && (
                      <span className="md:hidden text-gray-400 mr-2 text-[11px] uppercase">
                        {col.header}:
                      </span>
                    )}
                    {col.value(item, ctx)}
                  </div>
                ))}
              </div>
            ))}
            {loadingMore && (
              <div className="flex items-center justify-center py-4.5 gap-2 border-t border-[#F5F5F5] dark:border-[#262626]">
                <div className="w-4 h-4 border-2 border-[#0474F3] border-t-transparent rounded-full animate-spin" />
                <span className="text-[12px] text-gray-500 dark:text-zinc-400 font-medium">Yuklanmoqda...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {showFormModal && (
        <RefFormModal
          title={editItem ? config.singular : config.formTitle}
          hint={editItem ? undefined : config.formHint}
          fields={config.fields}
          ctx={ctx}
          initialValues={
            editItem
              ? config.toFormValues
                ? config.toFormValues(editItem)
                : ({ ...editItem } as Record<string, string>)
              : undefined
          }
          saving={saving}
          error={saveError}
          onClose={() => {
            setShowFormModal(false);
            setEditItem(null);
          }}
          onSubmit={handleSave}
          onDelete={
            editItem
              ? () => {
                  setShowFormModal(false);
                  setDeleteError(null);
                  setDeleteItem(editItem);
                }
              : undefined
          }
        />
      )}

      {deleteItem && (
        <RefDeleteModal
          name={config.titleOf(deleteItem)}
          noun={config.deleteNoun}
          note={config.deleteNote(deleteItem, ctx)}
          blockReason={config.cantDeleteReason ? config.cantDeleteReason(deleteItem) : null}
          deleting={deleting}
          error={deleteError}
          onClose={() => setDeleteItem(null)}
          onConfirm={handleDelete}
        />
      )}

      {entity && (
        <RefFilterModal
          entity={entity}
          isOpen={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          onSubmit={handleFilterSubmit}
          onClear={handleClearAllFilters}
          initialFilters={filters}
        />
      )}
    </div>
  );
};

export default ReferenceListPage;