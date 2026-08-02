import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import { AppResource, hasPermission } from "./auth/permissions";
import { AppLayout } from "./components/AppLayout";
import { BrandLogo } from "./components/BrandLogo";
import { ActivitiesPage } from "./pages/ActivitiesPage";
import { CatalogPage } from "./pages/CatalogPage";
import { CustomersPage } from "./pages/CustomersPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { LeadsPage } from "./pages/LeadsPage";
import { LoginPage } from "./pages/LoginPage";
import { OpportunitiesPage } from "./pages/OpportunitiesPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { QuoteVerificationPage } from "./pages/QuoteVerificationPage";
import { QuotesPage } from "./pages/QuotesPage";
import { ReportsPage } from "./pages/ReportsPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { SettingsPage } from "./pages/SettingsPage";
import { UsersPage } from "./pages/UsersPage";

function ProtectedLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loader">
        <BrandLogo compact variant="loader" />
        <p>Cargando AdminGest…</p>
      </div>
    );
  }

  return user ? <AppLayout /> : <Navigate replace to="/login" />;
}

function PermissionRoute({
  children,
  resource,
}: {
  children: ReactNode;
  resource: AppResource;
}) {
  const { user } = useAuth();
  return hasPermission(user?.role, resource) ? children : <Navigate replace to="/" />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<LoginPage />} path="/login" />
      <Route element={<ForgotPasswordPage />} path="/forgot-password" />
      <Route element={<ResetPasswordPage />} path="/reset-password" />
      <Route element={<QuoteVerificationPage />} path="/verify/quote/:publicCode" />
      <Route element={<ProtectedLayout />}>
        <Route element={<DashboardPage />} index />
        <Route element={<PermissionRoute resource="leads"><LeadsPage /></PermissionRoute>} path="leads" />
        <Route element={<PermissionRoute resource="customers"><CustomersPage /></PermissionRoute>} path="customers" />
        <Route element={<PermissionRoute resource="opportunities"><OpportunitiesPage /></PermissionRoute>} path="opportunities" />
        <Route element={<PermissionRoute resource="activities"><ActivitiesPage /></PermissionRoute>} path="activities" />
        <Route element={<PermissionRoute resource="catalog"><CatalogPage /></PermissionRoute>} path="catalog" />
        <Route element={<PermissionRoute resource="quotes"><QuotesPage /></PermissionRoute>} path="quotes" />
        <Route element={<PermissionRoute resource="projects"><ProjectsPage /></PermissionRoute>} path="projects" />
        <Route element={<PermissionRoute resource="reports"><ReportsPage /></PermissionRoute>} path="reports" />
        <Route element={<PermissionRoute resource="users"><UsersPage /></PermissionRoute>} path="users" />
        <Route element={<ProfilePage />} path="profile" />
        <Route element={<PermissionRoute resource="settings"><SettingsPage /></PermissionRoute>} path="settings" />
      </Route>
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  );
}
