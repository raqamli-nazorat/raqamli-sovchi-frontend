import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, AlertTriangle } from "lucide-react";
import { axiosAPI } from "../lib/axiosAPI";
import { HugeIcon } from "../components/ui/HugeIcon";
import { AiBrain01FreeIcons, Call02Icon, Shield01Icon, SquareLock01Icon, UserCheck01Icon } from "@hugeicons/core-free-icons";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [blockedTimeLeft, setBlockedTimeLeft] = useState<number>(0);

  const formatTimeLeft = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // const accessToken = localStorage.getItem("access");

  // useEffect(() => {
  //   if (accessToken) {
  //     navigate("/", { replace: true });
  //   }
  // }, [accessToken, navigate]);

  // Extract error from navigation state or URL query parameters (e.g. from Layout redirect)
  useEffect(() => {
    if (location.state?.error) {
      setError(location.state.error);
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }
    const params = new URLSearchParams(location.search);
    const errorParam = params.get("error");
    if (errorParam) {
      setError(errorParam);
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, location.search, navigate, location.pathname]);

  // Check block status on mount
  useEffect(() => {
    const blockedUntilStr = localStorage.getItem("login_blocked_until");
    if (blockedUntilStr) {
      const blockedUntil = parseInt(blockedUntilStr, 10);
      const now = Date.now();
      if (blockedUntil > now) {
        const secondsLeft = Math.ceil((blockedUntil - now) / 1000);
        setBlockedTimeLeft(secondsLeft);
        setError(`Ko'p noto'g'ri urinishlar sababli hisobingiz 15 daqiqaga bloklandi. Qolgan vaqt: ${formatTimeLeft(secondsLeft)}`);
      }
    }
  }, []);

  // Countdown timer when blocked
  useEffect(() => {
    if (blockedTimeLeft <= 0) return;
    const timer = setInterval(() => {
      const blockedUntilStr = localStorage.getItem("login_blocked_until");
      if (blockedUntilStr) {
        const blockedUntil = parseInt(blockedUntilStr, 10);
        const now = Date.now();
        const diff = Math.ceil((blockedUntil - now) / 1000);
        if (diff <= 0) {
          localStorage.removeItem("login_blocked_until");
          localStorage.setItem("login_attempts", "0");
          setBlockedTimeLeft(0);
          setError(null);
        } else {
          setBlockedTimeLeft(diff);
          setError(`Ko'p noto'g'ri urinishlar sababli hisobingiz 15 daqiqaga bloklandi. Qolgan vaqt: ${formatTimeLeft(diff)}`);
        }
      } else {
        setBlockedTimeLeft(0);
        setError(null);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [blockedTimeLeft]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputVal = e.target.value;

    // Allow user to clear
    if (!inputVal) {
      setUsername("");
      return;
    }

    const isDeleting = inputVal.length < username.length;
    let cleaned = inputVal.replace(/\D/g, "");

    // If backspacing and the last char of previous value was a space, delete the character before the space as well
    if (isDeleting && username.endsWith(" ") && username.length - inputVal.length === 1) {
      cleaned = cleaned.slice(0, -1);
    }

    if (cleaned === "") {
      setUsername("");
      return;
    }

    // Ensure it starts with 998
    if (!cleaned.startsWith("998")) {
      if ("998".startsWith(cleaned)) {
        // user is typing the prefix itself
      } else {
        cleaned = "998" + cleaned;
      }
    }

    cleaned = cleaned.slice(0, 12);

    let formatted = "+";
    if (cleaned.length > 0) {
      formatted += cleaned.substring(0, 3);
    }
    if (cleaned.length > 3) {
      formatted += " " + cleaned.substring(3, 5);
    }
    if (cleaned.length > 5) {
      formatted += " " + cleaned.substring(5, 8);
    }
    if (cleaned.length > 8) {
      formatted += " " + cleaned.substring(8, 10);
    }
    if (cleaned.length > 10) {
      formatted += " " + cleaned.substring(10, 12);
    }

    setUsername(formatted);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (blockedTimeLeft > 0) return;
    setLoading(true);
    setError(null);
    try {
      const cleanedUsername = username.replace(/\s+/g, "");
      const res = await axiosAPI.post("accounts/auth/token/", { phone_number: cleanedUsername, password });
      console.log(res);

      if (res.data) {
        const token = res.data.data?.access;
        const refresh = res.data.data?.refresh;
        const user = res.data.data?.user;
        if (token) {
          localStorage.setItem("access", token);
          if (refresh) {
            localStorage.setItem("refresh", refresh);
          }
          if (user) {
            localStorage.setItem("user", JSON.stringify(user));
          }
          
          // Clear login attempt state on success
          localStorage.removeItem("login_attempts");
          localStorage.removeItem("login_blocked_until");

          navigate("/");
          return;
        }
      }
      throw new Error("No token received");
    } catch (err: any) {
      console.error("Login failed:", err);
      const status = err.response?.status;

      if (status === 401) {
        const currentAttempts = parseInt(localStorage.getItem("login_attempts") || "0", 10) + 1;
        localStorage.setItem("login_attempts", currentAttempts.toString());

        if (currentAttempts >= 3) {
          const blockedUntil = Date.now() + 15 * 60 * 1000;
          localStorage.setItem("login_blocked_until", blockedUntil.toString());
          setBlockedTimeLeft(15 * 60);
          setError(`Ko'p noto'g'ri urinishlar sababli hisobingiz 15 daqiqaga bloklandi. Qolgan vaqt: 15:00`);
        } else {
          setError(`Login yoki parol noto'g'ri. Yana ${3 - currentAttempts} ta urinish qoldi. Undan keyin hisob 15 daqiqaga bloklanadi.`);
        }
      } else if (status === 429) {
        setError("Juda ko'p so'rov yuborildi. Iltimos birozdan keyin qayta urinib ko'ring.");
      } else {
        const apiError = err.response?.data?.error;
        let errorMsg = "";
        if (apiError) {
          if (apiError.details) {
            if (typeof apiError.details === "object") {
              errorMsg = Object.values(apiError.details).flat().join(", ");
            } else {
              errorMsg = String(apiError.details);
            }
          } else {
            errorMsg = apiError.errorMsg || "Tizim xatoligi yuz berdi.";
          }
        } else {
          errorMsg = err.response?.data?.detail || err.response?.data?.message || err.message || "Tizim xatoligi yuz berdi.";
        }
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-[#0C0C0C] font-sans">
      {/* ── Left Banner Panel ── */}
      <div className="w-[40%] hidden lg:flex flex-col justify-between bg-[#F5F5F5] dark:bg-[#151515] p-12 border-r border-[#E5E5E5] dark:border-[#262626]">
        {/* Top Logo */}
        <div className="flex items-center gap-3">
          <img src="/Mark.svg" alt="Mark" className="h-8 w-8 object-contain" />
          <span className="text-[15px] text-[#737373] dark:text-[#A3A3A3]">
            Raqamli <strong className="font-bold text-[#0A0A0A] dark:text-white">Sovchi</strong>
          </span>
        </div>

        {/* Center Content */}
        <div className="max-w-[420px] my-auto space-y-8">
          <div className="space-y-3">
            <h2 className="text-[24px] font-bold max-w-[250px] text-[#0A0A0A] dark:text-white leading-[1.2] tracking-tight">
              Raqamli Sovchi boshqaruv paneli
            </h2>
            <p className="text-[14px] text-[#525252] dark:text-[#A3A3A3] leading-relaxed">
              Foydalanuvchilar reyestri, profil moderatsiyasi, AI nazorati va anketa savollarini bitta joydan boshqaring.
            </p>
          </div>

          {/* Feature list items */}
          <div className="space-y-5">
            {/* Item 1 */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-[] text-[#FF5900] flex items-center justify-center shrink-0">
                <HugeIcon icon={Shield01Icon} className="w-5 h-5" strokeWidth={2.3} />
              </div>
              <div>
                <h4 className="text-[13px] font-bold text-[#0A0A0A] dark:text-white">Maxfiy tizim</h4>
                <p className="text-[11px] text-[#737373] dark:text-[#A3A3A3] mt-0.5">Kirish faqat administrator bergan ma'lumotlar bilan</p>
              </div>
            </div>

            {/* Item 2 */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-[] text-[#FF5900] flex items-center justify-center shrink-0">
                <HugeIcon icon={UserCheck01Icon} className="w-5 h-5" strokeWidth={2.3} />
              </div>
              <div>
                <h4 className="text-[13px] font-bold text-[#0A0A0A] dark:text-white">Profil moderatsiyasi</h4>
                <p className="text-[11px] text-[#737373] dark:text-[#A3A3A3] mt-0.5">Selfi va rasm tekshiruvi qo'lda tasdiqlanadi</p>
              </div>
            </div>

            {/* Item 3 */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-[] text-[#FF5900] flex items-center justify-center shrink-0 ">
                <HugeIcon icon={AiBrain01FreeIcons} className="w-5 h-5" strokeWidth={2.3} />
              </div>
              <div>
                <h4 className="text-[13px] font-bold text-[#0A0A0A] dark:text-white">AI nazorati</h4>
                <p className="text-[11px] text-[#737373] dark:text-[#A3A3A3] mt-0.5">Suhbatlardagi qoidabuzarliklar avtomatik aniqlanadi</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="text-[11px] text-[#A3A3A3] dark:text-[#525252]">
          © {new Date().getFullYear()} sovchi.app - Raqamli Sovchi
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="w-full lg:w-[60%] flex flex-col justify-center items-center p-6 bg-white dark:bg-[#0C0C0C]">
        <form onSubmit={handleLogin} className="w-full max-w-[380px] space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-[24px] font-bold text-[#0A0A0A] dark:text-white tracking-tight">Tizimga kirish</h1>
            <p className="text-[13px] text-[#737373] dark:text-[#A3A3A3] mt-1">Login va parolingizni kiriting</p>
          </div>

          <div className="space-y-4">
            {/* Login input */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-[#404040] dark:text-[#A3A3A3]">Telifon raqam</label>
              <div className="relative">
                <HugeIcon icon={Call02Icon} className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373] dark:text-[#A3A3A3]" strokeWidth={3} />
                <input
                  type="text"
                  value={username}
                  onChange={handlePhoneChange}
                  placeholder="+998"
                  className="w-full h-11 pl-10 pr-4 bg-transparent border border-[#E5E5E5] dark:border-[#262626] rounded-lg focus:outline-none focus:border-[#FF5900] text-[13px] text-[#0A0A0A] dark:text-white placeholder-[#A3A3A3] dark:placeholder-[#525252] transition-colors"
                  required
                />
              </div>
            </div>

            {/* Password input */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-[#404040] dark:text-[#A3A3A3]">Parol</label>
              <div className="relative">
                <HugeIcon icon={SquareLock01Icon} className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373] dark:text-[#A3A3A3]" strokeWidth={3} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className={`w-full h-11 pl-10 pr-10 bg-transparent border ${error ? "border-[#EF4444]" : "border-[#E5E5E5] dark:border-[#262626]"
                    } rounded-lg focus:outline-none focus:border-[#FF5900] text-[13px] text-[#0A0A0A] dark:text-white placeholder-[#A3A3A3] dark:placeholder-[#525252] transition-colors`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#737373] dark:text-[#A3A3A3] hover:text-[#0A0A0A] dark:hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" strokeWidth={2.2} />
                  ) : (
                    <Eye className="w-4 h-4" strokeWidth={2.2} />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Error Message Box */}
          {error && (
            <div className="flex items-start gap-3 p-3 bg-[#FFF0F0] dark:bg-[#2C1A1A] border border-[#FFD0D0] dark:border-[#5C2A2A] rounded-lg text-[#D32F2F] dark:text-[#E57373] transition-all">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2.2} />
              <div className="text-xs">
                {error.includes("Login yoki parol noto'g'ri") ? (
                  <>
                    <h5 className="font-bold">Login yoki parol noto'g'ri</h5>
                    <p className="mt-0.5 text-[11px] leading-relaxed">
                      {error.replace("Login yoki parol noto'g'ri. ", "")}
                    </p>
                  </>
                ) : error.includes("bloklandi") ? (
                  <>
                    <h5 className="font-bold">Hisob bloklandi</h5>
                    <p className="mt-0.5 text-[11px] leading-relaxed">
                      {error}
                    </p>
                  </>
                ) : (
                  <>
                    <h5 className="font-bold">Xatolik</h5>
                    <p className="mt-0.5 text-[11px] leading-relaxed">{error}</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Kirish Button */}
          <button
            type="submit"
            disabled={loading || blockedTimeLeft > 0}
            className="w-full h-11 bg-[#FF5900] hover:bg-[#E04F00] active:scale-[0.99] disabled:bg-[#FFA270] text-white font-semibold text-[13px] rounded-lg transition-all flex items-center justify-center cursor-pointer disabled:cursor-default shadow-sm"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              "Kirish"
            )}
          </button>

          {/* Bottom Security Info Box */}
          <div className="flex items-center gap-2.5 px-3.5 py-3 bg-[#F5F5F5] dark:bg-[#151515] rounded-lg text-[#737373] dark:text-[#A3A3A3]">
            <HugeIcon icon={Shield01Icon} className="w-4 h-4 text-[#737373] dark:text-[#A3A3A3]" strokeWidth={2.3} />
            <span className="text-[11px] font-medium">Maxfiy tizim. Barcha kirishlar qayd etiladi.</span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;