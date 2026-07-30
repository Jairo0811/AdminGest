import {
  BarChart3,
  Bell,
  Boxes,
  CalendarDays,
  ContactRound,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Target,
  UsersRound,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navigation = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
  { icon: ContactRound, label: 'Prospectos', to: '/prospectos' },
  { icon: UsersRound, label: 'Clientes', to: '/clientes' },
  { icon: Target, label: 'Oportunidades', to: '/oportunidades' },
  { icon: CalendarDays, label: 'Actividades', to: '/actividades' },
  { icon: FileText, label: 'Cotizaciones', to: '/cotizaciones' },
  { icon: FolderKanban, label: 'Proyectos', to: '/proyectos' },
  { icon: Boxes, label: 'Operaciones', to: '/operaciones' },
  { icon: BarChart3, label: 'Reportes', to: '/reportes' },
];

const titles: Record<string, string> = {
  '/': 'Resumen ejecutivo',
  '/prospectos': 'Gestión de prospectos',
  '/clientes': 'Cartera de clientes',
  '/oportunidades': 'Pipeline comercial',
  '/actividades': 'Agenda y seguimiento',
  '/cotizaciones': 'Cotizaciones',
  '/proyectos': 'Proyectos y tareas',
  '/operaciones': 'Compras, inventario y gastos',
  '/reportes': 'Reportes de gestión',
  '/configuracion': 'Configuración',
};

export function Layout() {
  const { session, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const initials = `${session?.user.firstName[0] ?? ''}${session?.user.lastName[0] ?? ''}`;

  return (
    <div className="app-shell">
      <button className="mobile-menu" type="button" onClick={() => setOpen(true)} aria-label="Abrir menú">
        <Menu size={22} />
      </button>
      {open && <button className="sidebar-scrim" onClick={() => setOpen(false)} aria-label="Cerrar menú" />}
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="sidebar-head">
          <div className="brand">
            <span className="brand-mark">AG</span>
            <span>Admin<span>Gest</span></span>
          </div>
          <button className="sidebar-close" type="button" onClick={() => setOpen(false)} aria-label="Cerrar">
            <X size={21} />
          </button>
        </div>

        <div className="company-chip">
          <span>Espacio de trabajo</span>
          <strong>{session?.user.companyName ?? 'Mi empresa'}</strong>
        </div>

        <nav className="sidebar-nav" aria-label="Navegación principal">
          {navigation.map(({ icon: Icon, label, to }) => (
            <NavLink
              className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setOpen(false)}
            >
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <NavLink className="nav-item" to="/configuracion" onClick={() => setOpen(false)}>
            <Settings size={19} />
            <span>Configuración</span>
          </NavLink>
          <button className="nav-item" type="button" onClick={logout}>
            <LogOut size={19} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">AdminGest</p>
            <h1>{titles[location.pathname] ?? 'Gestión empresarial'}</h1>
          </div>
          <div className="topbar-actions">
            <button className="icon-button" aria-label="Notificaciones" type="button">
              <Bell size={20} />
              <span className="notification-dot" />
            </button>
            <div className="profile-summary">
              <div className="avatar">{initials.toUpperCase()}</div>
              <div>
                <strong>{session?.user.firstName} {session?.user.lastName}</strong>
                <span>{session?.user.role.replaceAll('_', ' ')}</span>
              </div>
            </div>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
