import { createBrowserRouter, RouterProvider } from "react-router-dom";

import {
  LoginPage,
  HomePage,
  UsersPage,
  ProfileModerationPage,
  AiModeratorPage,
  AppealsPage,
  AppealDetailPage,
  UsersDetailPage
} from "./pages";
import Layout from "./components/Layout/Layout";

// ---- ProtectedRoute — keyinroq qo'shiladi ----
//
// import { Navigate } from "react-router-dom";
// import { useSelector } from "react-redux";
//
// const usePermissions = () => {
//   const userPermissions = useSelector((state: any) => state.references.userPermissions);
//   const permSet = new Set((userPermissions ?? []).map((p: any) => p.codename));
//   const has = (codename: string) => permSet.has(codename);
//   const loaded = Array.isArray(userPermissions);
//   return { has, loaded };
// };
//
// const ProtectedRoute = ({
//   children,
//   checkFn,
// }: {
//   children: React.ReactNode;
//   checkFn?: (has: (c: string) => boolean) => boolean;
// }) => {
//   const { has, loaded } = usePermissions();
//   if (!loaded) return null;
//   const allowed = checkFn ? checkFn(has) : false;
//   return allowed ? <>{children}</> : <Navigate to="/" replace />;
// };
//
// ---- RootPage — permission asosida yo'naltiradi ----
//
// const RootPage = () => {
//   const { has, loaded } = usePermissions();
//   if (!loaded) return null;
//   return has("view_dashboard_stats") ? <HomePage /> : <AIChatPage />;
// };

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      // Quyidagi routelar keyinroq ProtectedRoute bilan qo'shiladi:
      //
      // { path: "/reports",         element: <ProtectedRoute checkFn={(has) => has("view_reports")}><Reports /></ProtectedRoute> },
      // { path: "/appeals",         element: <ProtectedRoute checkFn={(has) => has("view_application")}><Appeals /></ProtectedRoute> },
      // { path: "/appeals-history", element: <ProtectedRoute checkFn={(has) => has("view_application")}><AppealsHistory /></ProtectedRoute> },
      // { path: "/customers",       element: <ProtectedRoute checkFn={(has) => has("view_consumer")}><Customers /></ProtectedRoute> },
      // { path: "/references/regions",              element: <ProtectedRoute checkFn={(has) => has("view_region")}><RegionsPage /></ProtectedRoute> },
      // { path: "/references/positions",            element: <ProtectedRoute checkFn={(has) => has("view_position")}><PositionsPage /></ProtectedRoute> },
      // { path: "/references/districts",            element: <ProtectedRoute checkFn={(has) => has("view_district")}><DisrtictsPage /></ProtectedRoute> },
      // { path: "/references/departments",          element: <ProtectedRoute checkFn={(has) => has("view_department")}><DepartmentsPage /></ProtectedRoute> },
      // { path: "/references/responsible-employees",element: <ProtectedRoute checkFn={(has) => has("view_user")}><ResponsibleEmployee /></ProtectedRoute> },
      // { path: "/references/category",             element: <ProtectedRoute checkFn={(has) => has("view_faqcategory")}><Category /></ProtectedRoute> },
      // { path: "/references/faq",                  element: <ProtectedRoute checkFn={(has) => has("view_faq")}><Questions /></ProtectedRoute> },
      // { path: "/references/roles",                element: <ProtectedRoute checkFn={(has) => has("view_role")}><RolesPage /></ProtectedRoute> },
      // { path: "/model-stt",        element: <ModelSTT /> },
      // { path: "/model-tts",        element: <ModelTTS /> },
      // { path: "/ai-chatbot-training", element: <AIChatbotTraining /> },
      // { path: "/quality-control", element: <QualityControl /> },
      // { path: "/ai-complaints",   element: <ProtectedRoute checkFn={(has) => has("view_chaterrorlog")}><AiComplaints /></ProtectedRoute> },
      // { path: "/profile",         element: <ProfilePage /> },
      // { path: "/profile/edit",    element: <ProfileEdit /> },
      // { path: "/settings",        element: <SettingsPage /> },
      // { path: "/help",            element: <HelpPage /> },
      // { path: "/ai-chat",         element: <AIChatPage /> },
      // { path: "/ai-chat/:id",     element: <AIChatPage /> },
      { path: "/users", element: <UsersPage /> },
      { path: "/profile-moderation", element: <ProfileModerationPage /> },
      { path: "/ai-chat", element: <AiModeratorPage /> },
      { path: "/appeals", element: <AppealsPage /> },
      { path: "/appeals/:id", element: <AppealDetailPage /> },
      {
        path: "/users",
        element: <UsersPage />,
      },
      {
        path: "/users/details/:id",
        element: <UsersDetailPage />,
      },
      { path: "/appeals", element: <UsersPage /> },
      { path: "/references/faq", element: <UsersPage /> },
      { path: "/psychologists", element: <UsersPage /> },
      { path: "/settings", element: <UsersPage /> },
    ],
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
]);

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;