import { useState } from 'react';
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
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { BrandLogo } from './BrandLogo';

const navigation = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
  { icon: ContactRound, label: 'Prospectos', to: '/leads' },
  { icon: UsersRound, label: 'Clientes', to: '/customers' },
  { icon: Target, label: 'Oportunidades', to: '/opportunities' },
  { icon: CalendarDays, label: 'Actividades', to: '/activities' },
  { icon: Boxes, label: 'Catálogo', to: '/catalog' },
  { icon: FileText, label: 'Cotizaciones', to: '/quotes' },
  { icon: FolderKanban, label: 'Proyectos', to: '/projects' },
  { icon: BarChart3, label: 'Reportes', to: '/reports' },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-shell">
      <aside className={menuOpen ? 'sidebar open' : 'sidebar'}>
        <div className="brand-row">
          <div className="brand">
            <BrandLogo inverse />
          </div>
          <button className="mobile-close" onClick={() => setMenuOpen(false)} type="button">
            <X size={20} />
          </button>
        </div>
        <div className="company-chip">
          <small>Empresa activa</small>
          <strong>{user?.company.name}</strong>
        </div>
        <nav className="sidebar-nav" aria-label="Navegación principal">
          {navigation.map(({ icon: Icon, label, to }) => (
            <NavLink
              className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
              end={to === '/'}
              key={to}
              onClick={() => setMenuOpen(false)}
              to={to}
            >
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <NavLink className="nav-item settings" to="/settings">
          <Settings size={19} />
          <span>Configuración</span>
        </NavLink>
        <button className="nav-item logout" onClick={logout} type="button">
          <LogOut size={19} />
          <span>Cerrar sesión</span>
        </button>
      </aside>
      {menuOpen && <button className="sidebar-scrim" onClick={() => setMenuOpen(false)} type="button" />}

      <div className="workspace-shell">
        <header className="topbar">
          <button className="menu-button" onClick={() => setMenuOpen(true)} type="button">
            <Menu size={21} />
          </button>
          <div className="topbar-spacer" />
          <button className="icon-button" aria-label="Notificaciones" type="button">
            <Bell size={20} />
            <span className="notification-dot" />
          </button>
          <div className="user-summary">
            <div className="avatar">
              {user?.firstName[0]}{user?.lastName[0]}
            </div>
            <div>
              <strong>{user?.firstName} {user?.lastName}</strong>
              <small>{user?.role.replaceAll('_', ' ')}</small>
            </div>
          </div>
        </header>
        <main className="workspace">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
