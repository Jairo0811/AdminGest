import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { useAuth } from './context/AuthContext';
import { ActivitiesPage } from './pages/ActivitiesPage';
import { AuthPage } from './pages/AuthPage';
import { CustomersPage } from './pages/CustomersPage';
import { DashboardPage } from './pages/DashboardPage';
import { LeadsPage } from './pages/LeadsPage';
import { OperationsPage } from './pages/OperationsPage';
import { OpportunitiesPage } from './pages/OpportunitiesPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { QuotesPage } from './pages/QuotesPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  const { session } = useAuth();

  return (
    <BrowserRouter>
      {!session ? (
        <Routes>
          <Route path="*" element={<AuthPage />} />
        </Routes>
      ) : (
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="prospectos" element={<LeadsPage />} />
            <Route path="clientes" element={<CustomersPage />} />
            <Route path="oportunidades" element={<OpportunitiesPage />} />
            <Route path="actividades" element={<ActivitiesPage />} />
            <Route path="cotizaciones" element={<QuotesPage />} />
            <Route path="proyectos" element={<ProjectsPage />} />
            <Route path="operaciones" element={<OperationsPage />} />
            <Route path="reportes" element={<ReportsPage />} />
            <Route path="configuracion" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </BrowserRouter>
  );
}
