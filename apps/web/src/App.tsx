import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import { AppLayout } from "./components/AppLayout";
import { BrandLogo } from "./components/BrandLogo";
import { ActivitiesPage } from "./pages/ActivitiesPage";
import { CatalogPage } from "./pages/CatalogPage";
import { CustomersPage } from "./pages/CustomersPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LeadsPage } from "./pages/LeadsPage";
import { LoginPage } from "./pages/LoginPage";
import { OpportunitiesPage } from "./pages/OpportunitiesPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { QuotesPage } from "./pages/QuotesPage";
import { ReportsPage } from "./pages/ReportsPage";
import { SettingsPage } from "./pages/SettingsPage";

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

export default function App() {
  return (
    <Routes>
      <Route element={<LoginPage />} path="/login" />
      <Route element={<ProtectedLayout />}>
        <Route element={<DashboardPage />} index />
        <Route element={<LeadsPage />} path="leads" />
        <Route element={<CustomersPage />} path="customers" />
        <Route element={<OpportunitiesPage />} path="opportunities" />
        <Route element={<ActivitiesPage />} path="activities" />
        <Route element={<CatalogPage />} path="catalog" />
        <Route element={<QuotesPage />} path="quotes" />
        <Route element={<ProjectsPage />} path="projects" />
        <Route element={<ReportsPage />} path="reports" />
        <Route element={<SettingsPage />} path="settings" />
      </Route>
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  );
}
