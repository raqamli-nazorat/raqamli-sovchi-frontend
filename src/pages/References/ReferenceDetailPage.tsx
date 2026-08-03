import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Trash2 } from "lucide-react";
import { useHeader } from "../../components/Layout/Layout";
import { REF_APIS, refApiError, type RefItem } from "./referencesApi";
import { REF_CONFIGS, fmtDateTime, shortId, type RefCtx } from "./referencesConfig";
import RefFormModal from "./RefFormModal";

const ReferenceDetailPage = () => {
  const { entity, id } = useParams<{ entity: string; id: string }>();
  const navigate = useNavigate();
  const { setHeaderTitle, setHeaderSubtitle } = useHeader();

  const config = entity ? REF_CONFIGS[entity] : undefined;
  const api = entity ? REF_APIS[entity] : undefined;

  const [item, setItem] = useState<RefItem | null>(null);
  const [ctx, setCtx] = useState<RefCtx>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!config || !api || !id) return;
    setLoading(true);
    setError(null);
    try {
      const relatedSlugs = config.relatedSlugs || [];
      const [detail, ...related] = await Promise.all([
        api.get(id),
        ...relatedSlugs.map((slug) => REF_APIS[slug].list()),
      ]);
      const nextCtx: RefCtx = {};
      relatedSlugs.forEach((slug, idx) => {
        nextCtx[slug] = related[idx];
      });
      setItem(detail);
      setCtx(nextCtx);
    } catch (err: any) {
      console.error(`References (${config.slug}) detail fetch error:`, err);
      setError(refApiError(err, "Ma'lumotni yuklashda xatolik yuz berdi."));
    } finally {
      setLoading(false);
    }
  }, [entity, id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!config) return;
    setHeaderTitle(config.cardTitle);
    if (item) {
      setHeaderSubtitle(
        config.headerSubtitleOf ? config.headerSubtitleOf(item, ctx) : config.titleOf(item)
      );
    }
  }, [entity, item, ctx, setHeaderTitle, setHeaderSubtitle]);

  if (!config || !api) {
    return (
      <div className="p-6">
        <div className="bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#262626] rounded-2xl p-10 text-center">
          <p className="text-[14px] font-semibold text-[#0A0A0A] dark:text-white">Bo'lim topilmadi</p>
        </div>
      </div>
    );
  }

  const backToList = () => navigate(`/references/${config.slug}`);

  const handleEdit = async (values: Record<string, string>) => {
    if (!item) return;
    setSaving(true);
    setSaveError(null);
    try {
      const payload = config.toPayload ? config.toPayload(values) : { ...values };
      await api.update(item.id, payload);
      setShowEditModal(false);
      await load();
    } catch (err: any) {
      console.error(`References (${config.slug}) update error:`, err);
      setSaveError(refApiError(err, "Saqlashda xatolik yuz berdi."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.remove(item.id);
      backToList();
    } catch (err: any) {
      console.error(`References (${config.slug}) delete error:`, err);
      setDeleteError(refApiError(err, "O'chirishda xatolik yuz berdi."));
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-60px)] flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-4 border-[#FF5900] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500 dark:text-zinc-400 font-medium">Ma'lumot yuklanmoqda...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="p-6">
        <div className="bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#262626] rounded-2xl p-10 text-center">
          <p className="text-[14px] font-semibold text-[#D32F2F]">Xatolik</p>
          <p className="text-[13px] text-[#737373] dark:text-[#A3A3A3] mt-1">
            {error || "Yozuv topilmadi."}
          </p>
          <button
            onClick={backToList}
            className="mt-4 h-10 px-4 bg-[#FF5900] hover:bg-[#E04F00] text-white text-[13px] font-semibold rounded-lg transition-colors cursor-pointer"
          >
            {config.plural} ro'yxatiga qaytish
          </button>
        </div>
      </div>
    );
  }

  const cantDelete = config.cantDeleteReason ? config.cantDeleteReason(item) : null;
  const childRows = config.childList ? config.childList.rows(item, ctx) : [];

  return (
    <div className="p-6 space-y-4">
      {/* ── Orqaga ── */}
      <button
        onClick={backToList}
        className="flex items-center gap-1.5 text-[13px] font-medium text-[#525252] dark:text-[#A3A3A3] hover:text-[#0A0A0A] dark:hover:text-white transition-colors cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" /> {config.plural} ro'yxatiga qaytish
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* ── Chap: asosiy ma'lumot ── */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white dark:bg-[#141414] rounded-2xl border border-[#e5e5e5] dark:border-[#262626] p-6">
            <h2 className="text-[20px] font-bold text-[#0A0A0A] dark:text-[#fafafa] leading-snug">
              {config.titleOf(item)}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-5 mt-5">
              {config.detailFields.map((field) => (
                <div key={field.label}>
                  <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3] tracking-wider">
                    {field.label}
                  </p>
                  <p className="text-[13px] font-semibold text-[#0a0a0a] dark:text-[#fafafa] mt-1">
                    {field.value(item, ctx)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {config.childList && (
            <div className="bg-white dark:bg-[#141414] rounded-2xl border border-[#e5e5e5] dark:border-[#262626] p-6">
              <h3 className="text-[15px] font-bold text-[#0A0A0A] dark:text-[#fafafa]">
                {config.childList.title(item, ctx)}
              </h3>
              {childRows.length === 0 ? (
                <p className="text-[13px] text-[#737373] dark:text-[#A3A3A3] mt-4">
                  Hozircha yozuvlar yo'q.
                </p>
              ) : (
                <div className="mt-2 divide-y divide-[#F5F5F5] dark:divide-[#262626]">
                  {childRows.map((row, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-4 py-3">
                      <span className="text-[13.5px] font-medium text-[#0A0A0A] dark:text-[#fafafa] truncate">
                        {row.left}
                      </span>
                      <span className="text-[13px] text-[#737373] dark:text-[#A3A3A3] tabular-nums shrink-0">
                        {row.right}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── O'ng: amallar + texnik ma'lumot ── */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-[#141414] rounded-2xl border border-[#e5e5e5] dark:border-[#262626] p-6 space-y-3">
            <h3 className="text-[15px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mb-1">Amallar</h3>
            <button
              onClick={() => {
                setSaveError(null);
                setShowEditModal(true);
              }}
              className="w-full py-2.5 px-4 bg-[#FF5900] hover:bg-[#E04F00] active:bg-[#C24400] text-white font-semibold rounded-xl text-[13px] transition-all cursor-pointer"
            >
              Tahrirlash
            </button>
            <button
              onClick={() => {
                setDeleteError(null);
                setShowDeleteModal(true);
              }}
              disabled={!!cantDelete}
              className="w-full py-2.5 px-4 bg-white dark:bg-transparent border border-[#FECACA] dark:border-[#7F1D1D] text-[#D32F2F] hover:bg-[#FFF5F5] dark:hover:bg-red-950/20 disabled:opacity-50 disabled:cursor-not-allowed font-semibold rounded-xl text-[13px] transition-all cursor-pointer"
            >
              O'chirish
            </button>
            <p className="text-[12px] text-[#737373] dark:text-[#A3A3A3] leading-relaxed">
              {cantDelete || config.deleteNote(item, ctx)}
            </p>
          </div>

          <div className="bg-white dark:bg-[#141414] rounded-2xl border border-[#e5e5e5] dark:border-[#262626] p-6">
            <h3 className="text-[15px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mb-4">
              Texnik ma'lumot
            </h3>
            <div className="space-y-3 text-[13px]">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[#737373] dark:text-[#A3A3A3]">ID</span>
                <span
                  className="font-medium text-[#0A0A0A] dark:text-[#fafafa] font-mono text-[12px]"
                  title={item.id}
                >
                  {shortId(item.id)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[#737373] dark:text-[#A3A3A3]">Yaratilgan</span>
                <span className="font-medium text-[#0A0A0A] dark:text-[#fafafa]">
                  {fmtDateTime(item.created_at)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[#737373] dark:text-[#A3A3A3]">Yangilangan</span>
                <span className="font-medium text-[#0A0A0A] dark:text-[#fafafa]">
                  {fmtDateTime(item.updated_at)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tahrirlash modali ── */}
      {showEditModal && (
        <RefFormModal
          title={`${config.singular}ni tahrirlash`}
          hint={config.formHint}
          fields={config.fields}
          ctx={ctx}
          initialValues={config.toFormValues ? config.toFormValues(item) : { ...item } as any}
          saving={saving}
          error={saveError}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleEdit}
        />
      )}

      {/* ── O'chirish tasdiqlash modali ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-[440px] bg-white dark:bg-[#141414] rounded-[24px] border border-[#e5e5e5] dark:border-[#262626] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-[#FFF0F0] dark:bg-red-950/30 text-[#991B1B] dark:text-red-400 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-[16px] font-bold text-[#0A0A0A] dark:text-[#fafafa] mt-4">
              O'chirishni tasdiqlaysizmi?
            </h3>
            <p className="text-[13px] text-[#525252] dark:text-[#a3a3a3] leading-relaxed mt-2">
              «{config.titleOf(item)}» o'chiriladi. {config.deleteNote(item, ctx)} Bu amalni ortga
              qaytarib bo'lmaydi.
            </p>
            {deleteError && <p className="text-[12px] text-[#D32F2F] mt-3">{deleteError}</p>}
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-5 py-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] font-semibold text-[#404040] dark:text-[#e5e5e5] hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-5 py-2.5 bg-[#7F1D1D] hover:bg-[#991B1B] disabled:opacity-70 text-white rounded-xl text-[13px] font-semibold transition-colors cursor-pointer flex items-center gap-2"
              >
                {deleting && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                O'chirish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferenceDetailPage;
