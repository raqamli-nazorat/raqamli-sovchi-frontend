import { useState, useEffect, useCallback } from "react";
import { ChevronDown, Plus, X} from "lucide-react";
import { REF_APIS, refApiError } from "../References/referencesApi";
import { useHeader } from "../../components/Layout/Layout";
import Select from "../../components/ui/Select";
import { axiosAPI } from "../../lib/axiosAPI";

// Gender constants
const GENDER_OPTIONS = [
  { value: "groom", label: "Kuyov anketasi" },
  { value: "bride", label: "Kelin anketasi" },
  { value: "all", label: "Hammaga" },
];

const GENDER_LABELS: Record<string, string> = {
  all: "Hammaga",
  groom: "Kuyov",
  bride: "Kelin",
};

interface OptionItem {
  id?: string;
  option_letter: string;
  text: string;
  weight: number;
}

interface Question {
  id: string;
  text: string;
  section: string;
  section_info?: { id: string; name: string };
  target_gender: string;
  is_trap_question: boolean;
  order: number;
  options_info?: OptionItem[];
  options?: OptionItem[];
  created_at?: string;
  updated_at?: string;
}

interface Section {
  id: string;
  name: string;
  code: string;
  count?: number;
}

const AQuestions = () => {
  const { setHeaderSubtitle } = useHeader();

  // State
  const [sections, setSections] = useState<Section[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active filters
  const [activeSectionId, setActiveSectionId] = useState<string>("");
  const [activeGender, setActiveGender] = useState<"groom" | "bride">("groom");

  // Expanded question state (accordion)
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [modalSectionId, setModalSectionId] = useState("");
  const [modalGender, setModalGender] = useState("");
  const [modalText, setModalText] = useState("");
  const [isTrap, setIsTrap] = useState(false);

  // Option states in Modal
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [weightA, setWeightA] = useState<number | "">(1);
  const [weightB, setWeightB] = useState<number | "">(2);
  const [weightC, setWeightC] = useState<number | "">(3);
  const [weightD, setWeightD] = useState<number | "">(4);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load sections (sidebar)
  const loadSections = useCallback(async (isInitial = false) => {
    if (isInitial) {
      setLoading(true);
    }
    setError(null);
    try {
      const secList = (await REF_APIS.sections.list()) as Section[];
      setSections(secList);

      if (secList.length > 0 && isInitial) {
        setActiveSectionId(secList[0].id);
      }
    } catch (err: any) {
      console.error("Failed to load sections data:", err);
      if (isInitial) {
        setError(refApiError(err, "Bo'limlarni yuklashda xatolik yuz berdi."));
      }
    } finally {
      if (isInitial) {
        setLoading(false);
      }
    }
  }, []);

  // Load questions for active section
  const loadQuestions = useCallback(async () => {
    if (!activeSectionId) return;
    setLoadingQuestions(true);
    try {
      let page = 1;
      let allQuestions: Question[] = [];
      let hasMore = true;

      while (hasMore && page <= 50) {
        const qList = (await REF_APIS.questions.list({
          section: activeSectionId,
          page: page,
        })) as Question[];

        if (Array.isArray(qList)) {
          allQuestions = [...allQuestions, ...qList];

          const listObj = qList as any;
          if (listObj && typeof listObj === "object" && "next" in listObj) {
            hasMore = !!listObj.next;
          } else if (listObj && typeof listObj === "object" && "count" in listObj) {
            hasMore = allQuestions.length < listObj.count;
          } else {
            hasMore = qList.length > 0 && qList.length >= 6;
          }
        } else {
          hasMore = false;
        }

        if (hasMore) {
          page++;
        }
      }

      setQuestions(allQuestions);
    } catch (err) {
      console.error("Failed to load questions list:", err);
    } finally {
      setLoadingQuestions(false);
    }
  }, [activeSectionId]);

  // Initial mount load (1 sections list request)
  useEffect(() => {
    loadSections(true);
  }, [loadSections]);

  // Load questions when section changes
  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // Set Subtitle dynamically in Navbar
  useEffect(() => {
    const totalQuestions = sections.reduce((sum, s) => sum + (s.count || 0), 0);
    const totalSections = sections.length;
    setHeaderSubtitle(
      `${totalQuestions} savol · ${totalSections} bo'lim · Lie Scale nazorati`
    );
  }, [sections, setHeaderSubtitle]);

  // Helper to open modal for creation
  const handleOpenAddModal = () => {
    setEditingQuestion(null);
    setModalSectionId(activeSectionId);
    setModalGender(activeGender);
    setModalText("");
    setIsTrap(false);
    setOptionA("");
    setOptionB("");
    setOptionC("");
    setOptionD("");
    setWeightA(1);
    setWeightB(2);
    setWeightC(3);
    setWeightD(4);
    setSaveError(null);
    setShowModal(true);
  };

  // Save Savol (Create or Update)
  const handleSaveQuestion = async () => {
    if (!modalSectionId) {
      setSaveError("Bo'limni tanlang.");
      return;
    }
    if (!modalGender) {
      setSaveError("Anketa turini tanlang.");
      return;
    }
    if (!modalText.trim()) {
      setSaveError("Savol matnini kiriting.");
      return;
    }
    if (!optionA.trim() || !optionB.trim() || !optionC.trim() || !optionD.trim()) {
      setSaveError("Barcha javob variantlarini to'ldiring.");
      return;
    }

    setSaving(true);
    setSaveError(null);

    // Calculate maximum order to place this question at the end
    const sectionQuestions = questions.filter((q) => (q.section_info?.id || q.section) === modalSectionId);
    const maxOrder = sectionQuestions.reduce((max, q) => Math.max(max, q.order || 0), 0);
    const nextOrder = editingQuestion ? (editingQuestion.order ?? 1) : maxOrder + 1;

    const payload = {
      section: modalSectionId,
      text: modalText.trim(),
      target_gender: modalGender,
      is_trap_question: isTrap,
      order: nextOrder,
    };

    try {
      if (editingQuestion) {
        await REF_APIS.questions.update(editingQuestion.id, payload);
      } else {
        const createdQuestion = await REF_APIS.questions.create(payload);
        if (createdQuestion && createdQuestion.id) {
          const optionsPayload = {
            question_id: createdQuestion.id,
            options: [
              { option_letter: "A", text: optionA.trim(), weight: Number(weightA) },
              { option_letter: "B", text: optionB.trim(), weight: Number(weightB) },
              { option_letter: "C", text: optionC.trim(), weight: Number(weightC) },
              { option_letter: "D", text: optionD.trim(), weight: Number(weightD) },
            ],
          };
          await axiosAPI.post("accounts/options/bulk/", optionsPayload);
        }
      }
      setShowModal(false);
      await Promise.all([loadQuestions(), loadSections()]);
    } catch (err: any) {
      console.error("Save question error:", err);
      setSaveError(refApiError(err, "Saqlashda xatolik yuz berdi."));
    } finally {
      setSaving(false);
    }
  };

  // Filtered Questions for local display (based on section and gender)
  const filteredQuestions = questions.filter((q) => {
    const isSectionMatch = (q.section_info?.id || q.section) === activeSectionId;
    const qGender = q.target_gender?.toLowerCase();
    const activeG = activeGender.toLowerCase();
    return isSectionMatch && (qGender === activeG || qGender === "all");
  });

  const activeSection = sections.find((s) => s.id === activeSectionId);

  return (
    <div className="p-4 space-y-4">
      {loading && (
        <div className="h-[calc(100vh-120px)] flex flex-col items-center justify-center gap-4">
          <div className="w-8 h-8 border-4 border-[#0474F3] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-zinc-400 font-medium">Yuklanmoqda...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#262626] rounded-2xl p-10 text-center">
          <p className="text-[14px] font-semibold text-[#D32F2F]">Xatolik</p>
          <p className="text-[13px] text-[#737373] dark:text-[#A3A3A3] mt-1">{error}</p>
          <button
            onClick={() => loadSections(true)}
            className="mt-4 h-10 px-4 bg-[#0474F3] hover:bg-[#042480] text-white text-[13px] font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Qayta urinish
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* ── Chap Sidebar: Bo'limlar listi ── */}
          <div className="lg:col-span-3 bg-white dark:bg-[#141414] rounded-2xl border border-[#E5E5E5] dark:border-[#262626] p-3 space-y-1">
            {sections.map((sec) => {
              const active = sec.id === activeSectionId;
              const count = sec.count ?? 0;
              return (
                <div
                  key={sec.id}
                  onClick={() => {
                    setActiveSectionId(sec.id);
                    setExpandedQuestionId(null);
                  }}
                  className={`flex items-center justify-between px-3.5 py-3 text-[#0a0a0a] font-semibold rounded-xl transition-all cursor-pointer ${active
                    ? "bg-[#f5f5f5]"
                    : "hover:bg-gray-50/50 dark:hover:bg-zinc-900/30"
                    }`}
                >
                  <span className="text-[13.5px] truncate">{sec.name}</span>
                  <span className="text-xs text-[#6B6B6B]">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>

          {/* ── O'ng: Savollar ro'yxati ── */}
          <div className="lg:col-span-9 space-y-4">
            {/* Header: gender selector tabs + add question button */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex bg-[#F5F5F5] dark:bg-zinc-900/50 p-1 rounded-xl">
                <button
                  onClick={() => {
                    setActiveGender("groom");
                    setExpandedQuestionId(null);
                  }}
                  className={`px-4 py-2 text-[13px] font-semibold rounded-lg transition-all cursor-pointer ${activeGender === "groom"
                    ? "bg-white dark:bg-zinc-800 text-[#0A0A0A] dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-zinc-400 hover:text-gray-700"
                    }`}
                >
                  Kuyov anketasi
                </button>
                <button
                  onClick={() => {
                    setActiveGender("bride");
                    setExpandedQuestionId(null);
                  }}
                  className={`px-4 py-2 text-[13px] font-semibold rounded-lg transition-all cursor-pointer ${activeGender === "bride"
                    ? "bg-white dark:bg-zinc-800 text-[#0A0A0A] dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-zinc-400 hover:text-gray-700"
                    }`}
                >
                  Kelin anketasi
                </button>
              </div>

              <button
                onClick={handleOpenAddModal}
                className="h-10 px-4 flex items-center gap-1.5 bg-[#0474F3] hover:bg-[#042480] active:scale-[0.99] text-white text-[13px] font-semibold rounded-lg transition-all cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" /> Savol qo'shish
              </button>
            </div>

            {/* Questions list loader */}
            {loadingQuestions ? (
              <div className="bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#262626] rounded-2xl p-10 flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-[#0474F3] border-t-transparent rounded-full animate-spin" />
                <span className="text-[12px] text-gray-400 font-medium">Savollar yuklanmoqda...</span>
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#262626] rounded-2xl p-10 text-center">
                <p className="text-[14px] font-semibold text-[#0A0A0A] dark:text-white">
                  Bu bo'limda anketaga tegishli savollar mavjud emas
                </p>
                <p className="text-[13px] text-[#737373] dark:text-[#A3A3A3] mt-1">
                  Yangi savol yaratish uchun «Savol qo'shish» tugmasini bosing.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[calc(100vh-160px)] overflow-y-auto">
                {filteredQuestions.map((q, idx) => {
                  const expanded = expandedQuestionId === q.id;
                  const opts = q.options_info || q.options || [];
                  const displayIndex = String(idx + 1).padStart(2, "0");

                  return (
                    <div
                      key={q.id}
                      onClick={() => setExpandedQuestionId(expanded ? null : q.id)}
                      className={`bg-white dark:bg-[#141414] rounded-2xl border transition-all cursor-pointer p-5 hover:shadow-sm ${expanded
                        ? "border-[#0474F3] ring-0.75 ring-[#0474F3]"
                        : "border-[#E5E5E5] dark:border-[#262626]"
                        }`}
                    >
                      <div className="flex items-start justify-between gap-4 w-full">
                        <div className="flex items-start gap-3 w-full">
                          <span className="text-[14.5px] font-bold text-[#0474F3] tabular-nums">
                            {displayIndex}
                          </span>
                          <div className="space-y-1 flex items-start justify-between gap-3 w-full">
                            <h3 className="text-[14.5px] font-semibold text-[#0A0A0A] dark:text-[#fafafa] leading-snug">
                              {q.text}
                            </h3>
                            {q.is_trap_question && (
                              <span className="shrink-0 bg-[#FFFBEB] dark:bg-amber-950/20 text-[#92400E] px-2 py-0.5 rounded-xl text-[9.5px] font-bold uppercase tracking-wide">
                                Lie Scale
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <ChevronDown
                            className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${expanded ? "rotate-180" : ""
                              }`}
                          />
                        </div>
                      </div>

                      {/* Accordion options list */}
                      <div
                        className={`grid transition-all duration-300 ease-in-out ${expanded
                          ? "grid-rows-[1fr] opacity-100"
                          : "grid-rows-[0fr] opacity-0 pointer-events-none"
                          }`}
                      >
                        <div className="overflow-hidden">
                          <div className="pl-7">
                            {opts.map((o) => (
                              <div
                                key={o.option_letter}
                                className="flex items-start justify-between gap-4 py-0.75 text-[13.5px]"
                              >
                                <div className="flex items-start gap-2.5">
                                  <span className="font-semibold text-gray-400 dark:text-zinc-500 shrink-0 w-4">
                                    {o.option_letter}
                                  </span>
                                  <span className="text-[#404040] dark:text-[#E5E5E5] leading-relaxed">
                                    {o.text}
                                  </span>
                                </div>
                                <span className="text-[10px] text-[#6B6B6B] dark:text-zinc-500 font-medium whitespace-nowrap pt-0.5">
                                  ball {o.weight}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Savol qo'shish / tahrirlash modali ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
          <div className="w-full max-w-[640px] bg-white dark:bg-[#141414] rounded-[24px] border border-[#e5e5e5] dark:border-[#262626] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[16px] font-bold text-[#0A0A0A] dark:text-[#fafafa]">
                  {editingQuestion ? "Savolni tahrirlash" : "Yangi savol qo'shish"}
                </h3>
                <p className="text-[12px] text-gray-400 dark:text-zinc-500 mt-1">
                  {GENDER_LABELS[modalGender] || "Kuyov"} anketasi · {activeSection?.name || "Bo'lim"}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <div className="mt-5 space-y-1 max-h-[65vh] overflow-y-auto pr-1">
              {/* Dropdowns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-semibold text-[#404040] dark:text-zinc-300">
                    Bo'lim
                  </label>
                  <Select
                    value={modalSectionId}
                    onChange={(v) => setModalSectionId(v)}
                    options={[
                      ...sections.map((s) => ({ value: s.id, label: s.name })),
                    ]}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-semibold text-[#404040] dark:text-zinc-300">
                    Anketa turi
                  </label>
                  <Select
                    value={modalGender}
                    onChange={(v) => setModalGender(v)}
                    options={GENDER_OPTIONS}
                  />
                </div>
              </div>

              {/* Text */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-[#404040] dark:text-zinc-300">
                  Savol matni
                </label>
                <textarea
                  value={modalText}
                  onChange={(e) => setModalText(e.target.value)}
                  placeholder="Masalan: Ibodatlar intizomi va e'tiqodiy muhit borasidagi amaliy holatingiz?"
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] text-[#0a0a0a] dark:text-[#fafafa] outline-none focus:border-[#0474F3] transition-colors resize-none"
                />
              </div>

              {/* Options & Weights */}
              <div className="space-y-3">
                <label className="text-[12px] font-semibold text-[#404040] dark:text-zinc-300 block">
                  Javob variantlari va ballar
                </label>

                {/* Option A */}
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-zinc-800 text-[13px] font-bold text-gray-500 dark:text-zinc-400 rounded-lg shrink-0">
                    A
                  </span>
                  <input
                    type="text"
                    value={optionA}
                    onChange={(e) => setOptionA(e.target.value)}
                    placeholder="Variant matni..."
                    className="flex-1 px-3.5 py-2 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13.5px] text-[#0a0a0a] dark:text-[#fafafa] outline-none focus:border-[#0474F3] transition-colors"
                  />
                  <div className="flex items-center gap-1.5 px-3 h-10 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl focus-within:border-[#0474F3] transition-colors shrink-0">
                    <span className="text-[13px] font-semibold text-[#0a0a0a] dark:text-[#fafafa] select-none">
                      ball
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={weightA}
                      onChange={(e) => {
                        const valStr = e.target.value;
                        if (valStr === "") {
                          setWeightA("");
                          return;
                        }
                        const val = parseInt(valStr, 10);
                        if (!isNaN(val) && val >= 1 && val <= 10) {
                          setWeightA(val);
                        }
                      }}
                      className="w-[20px] text-right bg-transparent border-0 outline-none text-[13px] font-semibold text-[#0a0a0a] dark:text-[#fafafa] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>

                {/* Option B */}
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-zinc-800 text-[13px] font-bold text-gray-500 dark:text-zinc-400 rounded-lg shrink-0">
                    B
                  </span>
                  <input
                    type="text"
                    value={optionB}
                    onChange={(e) => setOptionB(e.target.value)}
                    placeholder="Variant matni..."
                    className="flex-1 px-3.5 py-2 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13.5px] text-[#0a0a0a] dark:text-[#fafafa] outline-none focus:border-[#0474F3] transition-colors"
                  />
                  <div className="flex items-center gap-1.5 px-3 h-10 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl focus-within:border-[#0474F3] transition-colors shrink-0">
                    <span className="text-[13px] font-semibold text-[#0a0a0a] dark:text-[#fafafa] select-none">
                      ball
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={weightB}
                      onChange={(e) => {
                        const valStr = e.target.value;
                        if (valStr === "") {
                          setWeightB("");
                          return;
                        }
                        const val = parseInt(valStr, 10);
                        if (!isNaN(val) && val >= 1 && val <= 10) {
                          setWeightB(val);
                        }
                      }}
                      className="w-[20px] text-right bg-transparent border-0 outline-none text-[13px] font-semibold text-[#0a0a0a] dark:text-[#fafafa] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>

                {/* Option C */}
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-zinc-800 text-[13px] font-bold text-gray-500 dark:text-zinc-400 rounded-lg shrink-0">
                    C
                  </span>
                  <input
                    type="text"
                    value={optionC}
                    onChange={(e) => setOptionC(e.target.value)}
                    placeholder="Variant matni..."
                    className="flex-1 px-3.5 py-2 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13.5px] text-[#0a0a0a] dark:text-[#fafafa] outline-none focus:border-[#0474F3] transition-colors"
                  />
                  <div className="flex items-center gap-1.5 px-3 h-10 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl focus-within:border-[#0474F3] transition-colors shrink-0">
                    <span className="text-[13px] font-semibold text-[#0a0a0a] dark:text-[#fafafa] select-none">
                      ball
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={weightC}
                      onChange={(e) => {
                        const valStr = e.target.value;
                        if (valStr === "") {
                          setWeightC("");
                          return;
                        }
                        const val = parseInt(valStr, 10);
                        if (!isNaN(val) && val >= 1 && val <= 10) {
                          setWeightC(val);
                        }
                      }}
                      className="w-[20px] text-right bg-transparent border-0 outline-none text-[13px] font-semibold text-[#0a0a0a] dark:text-[#fafafa] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>

                {/* Option D */}
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-zinc-800 text-[13px] font-bold text-gray-500 dark:text-zinc-400 rounded-lg shrink-0">
                    D
                  </span>
                  <input
                    type="text"
                    value={optionD}
                    onChange={(e) => setOptionD(e.target.value)}
                    placeholder="Variant matni..."
                    className="flex-1 px-3.5 py-2 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13.5px] text-[#0a0a0a] dark:text-[#fafafa] outline-none focus:border-[#0474F3] transition-colors"
                  />
                  <div className="flex items-center gap-1.5 px-3 h-10 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl focus-within:border-[#0474F3] transition-colors shrink-0">
                    <span className="text-[13px] font-semibold text-[#0a0a0a] dark:text-[#fafafa] select-none">
                      ball
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={weightD}
                      onChange={(e) => {
                        const valStr = e.target.value;
                        if (valStr === "") {
                          setWeightD("");
                          return;
                        }
                        const val = parseInt(valStr, 10);
                        if (!isNaN(val) && val >= 1 && val <= 10) {
                          setWeightD(val);
                        }
                      }}
                      className="w-[20px] text-right bg-transparent border-0 outline-none text-[13px] font-semibold text-[#0a0a0a] dark:text-[#fafafa] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>
              </div>

              {/* Lie Scale card */}
              <label className="flex items-start gap-3 p-4 bg-[#FFFBEB] dark:bg-amber-950/10 border border-[#FEF3C7] dark:border-amber-950/20 rounded-[16px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isTrap}
                  onChange={(e) => setIsTrap(e.target.checked)}
                  className="w-4.5 h-4.5 mt-0.5 rounded border-[#e5e5e5] text-[#0474F3] focus:ring-[#0474F3] cursor-pointer"
                />
                <div className="space-y-0.5">
                  <span className="text-[13px] font-bold text-amber-800 dark:text-amber-400">
                    Lie Scale (samimiylik) savoli
                  </span>
                  <p className="text-[11.5px] text-amber-700/80 dark:text-amber-500">
                    Moslik ballariga qo'shilmaydi, faqat samimiylikni tekshiradi
                  </p>
                </div>
              </label>
            </div>

            {saveError && (
              <p className="text-[12px] text-[#D32F2F] mt-3 font-medium">{saveError}</p>
            )}

            {/* Modal Actions Footer */}
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] font-semibold text-[#404040] dark:text-[#e5e5e5] hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleSaveQuestion}
                disabled={saving}
                className="px-5 py-2.5 bg-[#0474F3] hover:bg-[#023399] active:bg-[#0474F3] disabled:bg-[#4599f8] text-white rounded-xl text-[13px] font-semibold transition-colors cursor-pointer disabled:cursor-default shadow-sm flex items-center gap-2"
              >
                {saving && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                Savolni saqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AQuestions;