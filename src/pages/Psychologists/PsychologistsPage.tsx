import { useState, useEffect } from 'react';
import { Plus, Clock, Star, Check, X } from 'lucide-react';
import { useHeader } from '../../components/Layout/Layout';

export interface Psychologist {
  id: string;
  name: string;
  specialty: string;
  experienceYears: number;
  price: number;
  durationMinutes: number;
  phone?: string;
  nextAvailable: string;
  rating: number;
  sessionCount: number;
  isActive: boolean;
  avatarBg?: string;
  avatarText?: string;
}

const INITIAL_PSYCHOLOGISTS: Psychologist[] = [
  {
    id: "1",
    name: "Dilshod Rasulov",
    specialty: "Oila psixologi",
    experienceYears: 12,
    price: 150000,
    durationMinutes: 50,
    phone: "+998 90 123 45 67",
    nextAvailable: "Bugun 16:00",
    rating: 4.9,
    sessionCount: 148,
    isActive: true,
    avatarBg: "bg-[#E0F2FE] dark:bg-sky-950/40",
    avatarText: "text-[#0284C7] dark:text-sky-400",
  },
  {
    id: "2",
    name: "Nargiza Yo'ldosheva",
    specialty: "Nikohga tayyorgarlik",
    experienceYears: 8,
    price: 120000,
    durationMinutes: 50,
    phone: "+998 91 234 56 78",
    nextAvailable: "Ertaga 10:30",
    rating: 4.8,
    sessionCount: 96,
    isActive: true,
    avatarBg: "bg-[#EDE9FE] dark:bg-purple-950/40",
    avatarText: "text-[#7C3AED] dark:text-purple-400",
  },
  {
    id: "3",
    name: "Sherzod Aliyev",
    specialty: "Kognitiv terapiya, inqiroz",
    experienceYears: 15,
    price: 200000,
    durationMinutes: 60,
    phone: "+998 93 345 67 89",
    nextAvailable: "Juma 14:00",
    rating: 5.0,
    sessionCount: 213,
    isActive: false,
    avatarBg: "bg-[#E6F9F0] dark:bg-[#103020]",
    avatarText: "text-[#00A854] dark:text-[#2ee088]",
  },
];

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

const PsychologistsPage = () => {
  const { setHeaderTitle, setHeaderSubtitle } = useHeader();
  const [psychologists, setPsychologists] = useState<Psychologist[]>(INITIAL_PSYCHOLOGISTS);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [formName, setFormName] = useState("");
  const [formSpecialty, setFormSpecialty] = useState("");
  const [formExperience, setFormExperience] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formDuration, setFormDuration] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);

  useEffect(() => {
    setHeaderTitle("Psixologlar");
    setHeaderSubtitle("Mutaxassislar va suhbatlar");
  }, [setHeaderTitle, setHeaderSubtitle]);

  const activeCount = psychologists.filter((p) => p.isActive).length;
  const totalSessions = psychologists.reduce((sum, p) => sum + p.sessionCount, 0);

  const toggleActiveStatus = (id: string) => {
    setPsychologists((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p))
    );
  };

  const handleOpenAddModal = () => {
    setFormName("");
    setFormSpecialty("");
    setFormExperience("");
    setFormPrice("");
    setFormDuration("");
    setFormPhone("");
    setFormIsActive(true);
    setShowAddModal(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const parsedPrice = parseInt(formPrice.replace(/\D/g, ""), 10) || 150000;
    const parsedExp = parseInt(formExperience.replace(/\D/g, ""), 10) || 5;
    const parsedDuration = parseInt(formDuration.replace(/\D/g, ""), 10) || 50;

    const newPsychologist: Psychologist = {
      id: String(Date.now()),
      name: formName.trim(),
      specialty: formSpecialty.trim() || "Oila psixologi",
      experienceYears: parsedExp,
      price: parsedPrice,
      durationMinutes: parsedDuration,
      phone: formPhone.trim() || "+998 90 000 00 00",
      nextAvailable: "Ertaga 12:00",
      rating: 5.0,
      sessionCount: 0,
      isActive: formIsActive,
      avatarBg: "bg-[#E0F2FE] dark:bg-sky-950/40",
      avatarText: "text-[#0284C7] dark:text-sky-400",
    };

    setPsychologists((prev) => [newPsychologist, ...prev]);
    setShowAddModal(false);
  };

  return (
    <div className="p-4 space-y-4">
      
      {/* ── Top Header Row ── */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-[13px] text-[#737373] dark:text-[#a3a3a3] font-medium">
          {activeCount} ta faol mutaxassis · {totalSessions} ta suhbat
        </p>

        <button
          onClick={handleOpenAddModal}
          className="h-10 px-4 bg-[#0474F3] hover:bg-[#0360cb] active:scale-[0.99] text-white text-[13px] font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Psixolog qo'shish</span>
        </button>
      </div>

      {/* ── Psychologists List ── */}
      <div className="space-y-3.5">
        {psychologists.map((psychologist) => {
          const initials = getInitials(psychologist.name);
          return (
            <div
              key={psychologist.id}
              className="bg-white dark:bg-[#141414] rounded-2xl border border-[#e5e5e5] dark:border-[#262626] p-4 lg:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-xs"
            >
              {/* Left Info: Avatar + Details */}
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-11 h-11 rounded-full ${psychologist.avatarBg || "bg-[#E0F2FE]"} ${psychologist.avatarText || "text-[#0284C7]"} font-bold text-xs flex items-center justify-center shrink-0`}
                >
                  {initials}
                </div>

                <div>
                  <h3 className="text-[14px] font-bold text-[#0A0A0A] dark:text-[#fafafa]">
                    {psychologist.name}
                  </h3>
                  <p className="text-[12px] text-[#737373] dark:text-[#a3a3a3] mt-0.5">
                    {psychologist.specialty} · {psychologist.experienceYears} yil ·{" "}
                    {psychologist.price.toLocaleString("uz-UZ")} so'm / {psychologist.durationMinutes} daqiqa
                  </p>
                </div>
              </div>

              {/* Right Info: Availability + Rating + Action Button */}
              <div className="flex items-center gap-5 sm:gap-6 justify-between sm:justify-end">
                {/* Next available time */}
                <div className="flex items-center gap-1.5 text-[12px] text-[#737373] dark:text-[#a3a3a3] whitespace-nowrap">
                  <Clock className="w-4 h-4 text-[#737373] dark:text-[#a3a3a3]" strokeWidth={2} />
                  <span>{psychologist.nextAvailable}</span>
                </div>

                {/* Rating & Sessions */}
                <div className="text-right shrink-0">
                  <div className="flex items-center justify-end gap-1 text-[13px] font-bold text-[#0474F3]">
                    <Star className="w-3.5 h-3.5 fill-[#0474F3] stroke-[#0474F3]" />
                    <span>{psychologist.rating.toFixed(1)}</span>
                  </div>
                  <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3] mt-0.5">
                    {psychologist.sessionCount} suhbat
                  </p>
                </div>

                {/* Toggle Active Button */}
                <button
                  onClick={() => toggleActiveStatus(psychologist.id)}
                  className={`h-9 px-4 rounded-lg text-[12px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                    psychologist.isActive
                      ? "bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] text-[#0A0A0A] dark:text-[#fafafa] hover:bg-gray-50 dark:hover:bg-zinc-800"
                      : "bg-[#0474F3] hover:bg-[#0360cb] text-white shadow-xs"
                  }`}
                >
                  <Check
                    className={`w-3.5 h-3.5 ${
                      psychologist.isActive ? "text-[#0A0A0A] dark:text-[#fafafa]" : "text-white"
                    }`}
                    strokeWidth={2.5}
                  />
                  <span>{psychologist.isActive ? "O'chirish" : "Yoqish"}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Psixolog qo'shish Modali (Image 2) ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-[560px] bg-white dark:bg-[#141414] rounded-2xl border border-[#e5e5e5] dark:border-[#262626] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[18px] font-bold text-[#0A0A0A] dark:text-[#fafafa]">
                  Psixolog qo'shish
                </h3>
                <p className="text-[12px] text-[#737373] dark:text-[#a3a3a3] mt-1">
                  Mutaxassis platformaga qo'shiladi va foydalanuvchilarga ko'rinadi
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddSubmit} className="space-y-4 mt-5">
              {/* Ism familiya */}
              <div>
                <label className="text-[13px] font-medium text-[#404040] dark:text-zinc-300 block mb-1.5">
                  Ism familiya
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Masalan: Dilshod Rasulov"
                  required
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] text-[#0A0A0A] dark:text-[#fafafa] placeholder:text-[#a3a3a3] outline-none focus:border-[#0474F3] transition-colors"
                />
              </div>

              {/* Mutaxassislik & Tajriba */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[13px] font-medium text-[#404040] dark:text-zinc-300 block mb-1.5">
                    Mutaxassislik
                  </label>
                  <input
                    type="text"
                    value={formSpecialty}
                    onChange={(e) => setFormSpecialty(e.target.value)}
                    placeholder="Oila psixologi"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] text-[#0A0A0A] dark:text-[#fafafa] placeholder:text-[#a3a3a3] outline-none focus:border-[#0474F3] transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[13px] font-medium text-[#404040] dark:text-zinc-300 block mb-1.5">
                    Tajriba
                  </label>
                  <input
                    type="text"
                    value={formExperience}
                    onChange={(e) => setFormExperience(e.target.value)}
                    placeholder="12 yil"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] text-[#0A0A0A] dark:text-[#fafafa] placeholder:text-[#a3a3a3] outline-none focus:border-[#0474F3] transition-colors"
                  />
                </div>
              </div>

              {/* Narx & Sessiya davomiyligi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[13px] font-medium text-[#404040] dark:text-zinc-300 block mb-1.5">
                    Narx
                  </label>
                  <input
                    type="text"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="150 000 so'm"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] text-[#0A0A0A] dark:text-[#fafafa] placeholder:text-[#a3a3a3] outline-none focus:border-[#0474F3] transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[13px] font-medium text-[#404040] dark:text-zinc-300 block mb-1.5">
                    Sessiya davomiyligi
                  </label>
                  <input
                    type="text"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    placeholder="50 daqiqa"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] text-[#0A0A0A] dark:text-[#fafafa] placeholder:text-[#a3a3a3] outline-none focus:border-[#0474F3] transition-colors"
                  />
                </div>
              </div>

              {/* Telefon */}
              <div>
                <label className="text-[13px] font-medium text-[#404040] dark:text-zinc-300 block mb-1.5">
                  Telefon
                </label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+998 __ ___ __ __"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] text-[#0A0A0A] dark:text-[#fafafa] placeholder:text-[#a3a3a3] outline-none focus:border-[#0474F3] transition-colors"
                />
              </div>

              {/* Darhol faollashtirish checkbox */}
              <div
                onClick={() => setFormIsActive(!formIsActive)}
                className="bg-[#F8FAFC] dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl p-3.5 flex items-start gap-3 cursor-pointer select-none"
              >
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center transition-all mt-0.5 ${
                    formIsActive
                      ? "bg-[#0474F3] text-white"
                      : "border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-zinc-800"
                  }`}
                >
                  {formIsActive && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-[#0A0A0A] dark:text-[#fafafa]">
                    Darhol faollashtirish
                  </h4>
                  <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3] mt-0.5">
                    Mutaxassis ro'yxatda darhol ko'rinadi va band qilish ochiladi
                  </p>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-[#262626] rounded-xl text-[13px] font-medium text-[#404040] dark:text-[#e5e5e5] hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Bekor qilish</span>
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0474F3] hover:bg-[#0360cb] active:scale-[0.99] text-white rounded-xl text-[13px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Qo'shish</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default PsychologistsPage;