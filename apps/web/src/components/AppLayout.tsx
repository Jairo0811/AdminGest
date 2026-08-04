import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Bell,
  Boxes,
  CalendarDays,
  ChevronDown,
  ContactRound,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Sun,
  Target,
  UserCircle,
  UserCog,
  UsersRound,
  X,
} from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { AppResource, hasPermission } from "../auth/permissions";
import { useTheme } from "../theme/useTheme";
import { AppFooter } from "./AppFooter";
import { BrandLogo } from "./BrandLogo";

const navigation: Array<{
  icon: typeof LayoutDashboard;
  label: string;
  to: string;
  resource: AppResource;
}> = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/", resource: "dashboard" },
  { icon: ContactRound, label: "Prospectos", to: "/leads", resource: "leads" },
  { icon: UsersRound, label: "Clientes", to: "/customers", resource: "customers" },
  { icon: Target, label: "Oportunidades", to: "/opportunities", resource: "opportunities" },
  { icon: CalendarDays, label: "Actividades", to: "/activities", resource: "activities" },
  { icon: Boxes, label: "Catálogo", to: "/catalog", resource: "catalog" },
  { icon: FileText, label: "Cotizaciones", to: "/quotes", resource: "quotes" },
  { icon: FolderKanban, label: "Proyectos", to: "/projects", resource: "projects" },
  { icon: BarChart3, label: "Reportes", to: "/reports", resource: "reports" },
];

type SearchResult = {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  path: string;
};

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  occurredAt: string;
  path: string;
};

const SIDEBAR_KEY = "admingest-sidebar-collapsed";

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "Superadministrador",
  ADMIN: "Administrador",
  SALES_MANAGER: "Gerente comercial",
  SALES_REP: "Representante de ventas",
  PROJECT_MANAGER: "Gerente de proyectos",
  VIEWER: "Solo lectura",
};

export function AppLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const workspaceRef = useRef<HTMLElement>(null);

  const visibleNavigation = useMemo(
    () => navigation.filter((item) => hasPermission(user?.role, item.resource)),
    [user?.role],
  );
  const canManageUsers = hasPermission(user?.role, "users");
  const canManageSettings = hasPermission(user?.role, "settings");

  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_KEY) === "true",
  );
  const [search, setSearch] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const searchQuery = useQuery({
    queryKey: ["navigation-search", search],
    queryFn: () =>
      api<SearchResult[]>(
        `/navigation/search?q=${encodeURIComponent(search.trim())}`,
      ),
    enabled: search.trim().length >= 2,
    staleTime: 15_000,
  });

  const notificationsQuery = useQuery({
    queryKey: ["navigation-notifications"],
    queryFn: () => api<NotificationItem[]>("/navigation/notifications"),
    refetchInterval: 60_000,
  });

  const currentLabel = useMemo(() => {
    if (location.pathname.startsWith("/users")) return "Usuarios y roles";
    if (location.pathname.startsWith("/profile")) return "Mi perfil";
    if (location.pathname.startsWith("/settings")) return "Configuración";

    return (
      visibleNavigation.find((item) =>
        item.to === "/"
          ? location.pathname === "/"
          : location.pathname.startsWith(item.to),
      )?.label ?? "AdminGest"
    );
  }, [location.pathname, visibleNavigation]);

  useEffect(() => {
    document.title = `${currentLabel} | AdminGest`;
    workspaceRef.current?.focus({ preventScroll: true });
  }, [currentLabel, location.pathname]);

  useEffect(() => {
    const closeTransientUi = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      setNotificationsOpen(false);
      setProfileOpen(false);
      setSearch("");
    };

    document.addEventListener("keydown", closeTransientUi);
    return () => document.removeEventListener("keydown", closeTransientUi);
  }, []);

  const toggleSidebar = () => {
    setCollapsed((current) => {
      const next = !current;
      localStorage.setItem(SIDEBAR_KEY, String(next));
      return next;
    });
  };

  const goTo = (path: string) => {
    navigate(path);
    setSearch("");
    setNotificationsOpen(false);
    setProfileOpen(false);
    setMenuOpen(false);
  };

  return (
    <div className={collapsed ? "app-shell app-shell--collapsed" : "app-shell"}>
      <a className="skip-link" href="#main-content">Saltar al contenido principal</a>

      <aside
        aria-label="Menú principal"
        className={[
          "sidebar",
          menuOpen ? "open" : "",
          collapsed ? "sidebar--collapsed" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        id="primary-sidebar"
      >
        <div className="brand-row">
          <div className="brand">
            <BrandLogo compact={collapsed} variant="sidebar" />
          </div>
          <button aria-label="Cerrar menú" className="mobile-close" onClick={() => setMenuOpen(false)} type="button">
            <X aria-hidden="true" size={20} />
          </button>
        </div>

        <div className="company-chip" title={user?.company.name}>
          <small>Empresa activa</small>
          <strong>{user?.company.name}</strong>
        </div>

        <nav className="sidebar-nav" aria-label="Navegación principal">
          {visibleNavigation.map(({ icon: Icon, label, to }) => (
            <NavLink
              aria-label={label}
              className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
              end={to === "/"}
              key={to}
              onClick={() => setMenuOpen(false)}
              title={collapsed ? label : undefined}
              to={to}
            >
              <Icon aria-hidden="true" size={19} />
              <span>{label}</span>
            </NavLink>
          ))}

          {canManageUsers && (
            <NavLink className={({ isActive }) => isActive ? "nav-item active" : "nav-item"} onClick={() => setMenuOpen(false)} to="/users">
              <UserCog aria-hidden="true" size={19} />
              <span>Usuarios</span>
            </NavLink>
          )}
        </nav>

        {canManageSettings && (
          <NavLink className="nav-item settings" onClick={() => setMenuOpen(false)} to="/settings">
            <Settings aria-hidden="true" size={19} />
            <span>Configuración</span>
          </NavLink>
        )}

        <button className="nav-item logout" onClick={logout} type="button">
          <LogOut aria-hidden="true" size={19} />
          <span>Cerrar sesión</span>
        </button>
      </aside>

      {menuOpen && <button aria-label="Cerrar menú" className="sidebar-scrim" onClick={() => setMenuOpen(false)} type="button" />}

      <div className="workspace-shell">
        <header className="topbar">
          <button aria-controls="primary-sidebar" aria-expanded={menuOpen} aria-label="Abrir menú" className="menu-button" onClick={() => setMenuOpen(true)} type="button"><Menu aria-hidden="true" size={21} /></button>
          <button aria-label={collapsed ? "Expandir barra lateral" : "Colapsar barra lateral"} className="sidebar-toggle" onClick={toggleSidebar} type="button">
            {collapsed ? <PanelLeftOpen aria-hidden="true" size={19} /> : <PanelLeftClose aria-hidden="true" size={19} />}
          </button>

          <nav aria-label="Ruta de navegación" className="breadcrumbs"><span>AdminGest</span><b aria-hidden="true">/</b><strong aria-current="page">{currentLabel}</strong></nav>

          <div className="global-search" role="search">
            <Search aria-hidden="true" size={18} />
            <input aria-controls="global-search-results" aria-expanded={search.trim().length >= 2} aria-label="Buscar en AdminGest" onChange={(event) => setSearch(event.target.value)} placeholder="Buscar clientes, proyectos..." value={search} />
            {search.trim().length >= 2 && (
              <div aria-live="polite" className="search-results" id="global-search-results" role="region">
                {searchQuery.isLoading ? <div className="popover-state" role="status">Buscando…</div> : searchQuery.data?.length ? searchQuery.data.map((item) => (
                  <button key={`${item.type}-${item.id}`} onClick={() => goTo(item.path)} type="button">
                    <span className="search-result-type">{item.type}</span>
                    <span><strong>{item.title}</strong><small>{item.subtitle}</small></span>
                  </button>
                )) : <div className="popover-state" role="status">No encontramos coincidencias.</div>}
              </div>
            )}
          </div>

          <div className="topbar-spacer" />
          <button aria-label={theme === "dark" ? "Activar tema claro" : "Activar tema oscuro"} className="icon-button" onClick={toggleTheme} type="button">
            {theme === "dark" ? <Sun aria-hidden="true" size={20} /> : <Moon aria-hidden="true" size={20} />}
          </button>

          <div className="topbar-popover-anchor">
            <button aria-controls="notifications-popover" aria-expanded={notificationsOpen} aria-label="Notificaciones" className="icon-button" onClick={() => { setNotificationsOpen((value) => !value); setProfileOpen(false); }} type="button">
              <Bell aria-hidden="true" size={20} />
              {!!notificationsQuery.data?.length && <span aria-hidden="true" className="notification-dot" />}
            </button>
            {notificationsOpen && (
              <div aria-label="Notificaciones" className="topbar-popover notifications-popover" id="notifications-popover" role="region">
                <div className="popover-header"><strong>Notificaciones</strong><span>{notificationsQuery.data?.length ?? 0}</span></div>
                {notificationsQuery.isLoading ? <div className="popover-state" role="status">Cargando…</div> : notificationsQuery.data?.length ? notificationsQuery.data.map((item) => (
                  <button key={item.id} onClick={() => goTo(item.path)} type="button">
                    <span><strong>{item.title}</strong><small>{item.description}</small><time dateTime={item.occurredAt}>{new Date(item.occurredAt).toLocaleString("es-DO")}</time></span>
                  </button>
                )) : <div className="popover-state" role="status">No tienes alertas próximas.</div>}
              </div>
            )}
          </div>

          <div className="topbar-popover-anchor">
            <button aria-controls="profile-popover" aria-expanded={profileOpen} aria-haspopup="menu" aria-label="Abrir menú de usuario" className="user-summary user-summary--button" onClick={() => { setProfileOpen((value) => !value); setNotificationsOpen(false); }} type="button">
              <div aria-hidden="true" className="avatar">{user?.firstName[0]}{user?.lastName[0]}</div>
              <div className="user-summary-copy"><strong>{user?.firstName} {user?.lastName}</strong><small>{user ? (roleLabels[user.role] ?? user.role) : ""}</small></div>
              <ChevronDown aria-hidden="true" size={16} />
            </button>

            {profileOpen && (
              <div aria-label="Menú de usuario" className="topbar-popover profile-popover" id="profile-popover" role="menu">
                <button onClick={() => goTo("/profile")} role="menuitem" type="button"><UserCircle aria-hidden="true" size={18} />Mi perfil</button>
                {canManageUsers && <button onClick={() => goTo("/users")} role="menuitem" type="button"><UserCog aria-hidden="true" size={18} />Usuarios y roles</button>}
                <button onClick={toggleTheme} role="menuitem" type="button">{theme === "dark" ? <Sun aria-hidden="true" size={18} /> : <Moon aria-hidden="true" size={18} />}Cambiar tema</button>
                <button className="danger" onClick={logout} role="menuitem" type="button"><LogOut aria-hidden="true" size={18} />Cerrar sesión</button>
              </div>
            )}
          </div>
        </header>

        <main className="workspace" id="main-content" ref={workspaceRef} tabIndex={-1}><Outlet /></main>
        <AppFooter />
      </div>
    </div>
  );
}
