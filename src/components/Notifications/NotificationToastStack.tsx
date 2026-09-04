import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Bell, X } from "lucide-react";
import type { AppDispatch, RootState } from "../../store";
import { dismissToast } from "../../store/slices/notificationsSlice";
import type { NotificationItem } from "../../lib/notificationsApi";

// Real-time (WS) bildirishnoma kelganda DARHOL ko'rinadigan popup — tab fon/faol
// bo'lishidan qat'i nazar. OS Notification faqat tab FON'da bo'lganda chiqadi
// (useNotificationsRealtime.ts), bu esa aynan shu tabda ochiq turgan foydalanuvchi
// uchun — ikkalasi birga har holatda ko'rinishni ta'minlaydi.
const AUTO_DISMISS_MS = 6000;

const ToastCard = ({
  notif,
  onClose,
  onOpen,
}: {
  notif: NotificationItem;
  onClose: () => void;
  onOpen: () => void;
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(onClose, AUTO_DISMISS_MS);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
    // Faqat mount'da: onClose har renderda yangi funksiya, lekin bitta karta uchun
    // taymer bir marta o'rnatilishi kerak.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      onClick={onOpen}
      className={`w-[340px] max-w-[calc(100vw-2rem)] cursor-pointer rounded-2xl border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#141414] shadow-xl p-4 flex items-start gap-3 transition-all duration-300 ease-out ${
        visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
      }`}
    >
      <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
        <Bell className="w-[17px] h-[17px] text-[#0474F3]" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-semibold text-[#0a0a0a] dark:text-white truncate">
          {notif.title || "Yangi bildirishnoma"}
        </p>
        {notif.message && (
          <p className="text-[12.5px] text-[#737373] dark:text-zinc-400 mt-0.5 line-clamp-2">
            {notif.message}
          </p>
        )}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Yopish"
        className="shrink-0 text-[#a3a3a3] hover:text-[#404040] dark:hover:text-zinc-300 transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" strokeWidth={2} />
      </button>
    </div>
  );
};

/**
 * Ilova bo'ylab bitta joyda (Layout) mount qilinadi. `notifications.toastQueue`
 * ni tinglaydi — WS orqali yangi bildirishnoma kelgan zahoti shu yerda ko'rinadi,
 * foydalanuvchi hech qayerni ochmasa ham.
 */
const NotificationToastStack = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const toastQueue = useSelector((s: RootState) => s.notifications.toastQueue);

  if (toastQueue.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[100] flex flex-col gap-2.5 pointer-events-none">
      {toastQueue.map((n) => (
        <div key={n.id} className="pointer-events-auto">
          <ToastCard
            notif={n}
            onClose={() => dispatch(dismissToast(n.id))}
            onOpen={() => {
              dispatch(dismissToast(n.id));
              navigate("/notification");
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default NotificationToastStack;
