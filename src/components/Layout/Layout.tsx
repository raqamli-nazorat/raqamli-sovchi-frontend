import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../ui/Sidebar";
import Navbar from "./Navbar";
import { axiosAPI } from "../../lib/axiosAPI";
import { useDispatch } from "react-redux";
import { setCurrentUser } from "../../store/slices/referencesSlice";

const Layout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const isRedirectingWithError = useRef(false);

  const accessToken = localStorage.getItem("access");
  const user = localStorage.getItem("user");
  
  useEffect(() => {
    if (!accessToken && !isRedirectingWithError.current) {
      navigate("/login", { replace: true });
    }
  }, [accessToken, navigate]);

  // ---- API so'rovlar keyinroq qo'shiladi ----
  
  // const getUserRolePermissions = async (roleId: string, userPermissionsInfo = []) => {
  //   try {
  //     const res = await axiosAPI.get(`/hr/structure/roles/${roleId}/`);
  //     if (res.status === 200) {
  //       const rolePermissions = res.data?.data?.permissions_info || [];
  //       dispatch(setUserPermissions([...rolePermissions, ...userPermissionsInfo]));
  //     }
  //   } catch (err) {
  //     console.error(err);
  //     dispatch(setUserPermissions([...userPermissionsInfo]));
  //   }
  // };
  //

  const getCurrentUser = async () => {
    setLoading(true);
    try {
      const res = await axiosAPI.get(`accounts/users/me/`);
      if (res.data && res.data.success === false) {
        throw { response: res };
      }
      if (res.status === 200) {
        const userData = res.data?.data;
        dispatch(setCurrentUser(userData));
        // const roleId = userData?.role_info?.id;
        // const userPermissionsInfo = userData?.user_permissions_info || [];
        
        // if (roleId) {
        //   await getUserRolePermissions(roleId, userPermissionsInfo);
        // } else {
        //   dispatch(setUserPermissions([...userPermissionsInfo]));
        // }
      }
    } catch (err: any) {
      console.error(err);
      isRedirectingWithError.current = true;
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
          errorMsg = apiError.errorMsg || "Foydalanuvchi profili topilmadi.";
        }
      } else {
        errorMsg = err.response?.data?.detail || err.response?.data?.message || err.message || "Foydalanuvchi profili topilmadi.";
      }

      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      dispatch(setCurrentUser(null));
      navigate("/login", { replace: true, state: { error: errorMsg } });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (accessToken) {
      getCurrentUser();
    }
  }, [accessToken]);
  
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F5F5] dark:bg-[#0a0a0a]">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((v) => !v)} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((v) => !v)} />
        <main className="flex-1 overflow-y-auto bg-[#F5F5F5] dark:bg-[#0a0a0a]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
