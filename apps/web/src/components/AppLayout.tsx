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
  UsersRound,
  X,
} from "lucide-react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../theme/useTheme";
import { BrandLogo } from "./BrandLogo";

const navigation = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/" },
  { icon: ContactRound, label: "Prospectos", to: "/leads" },
  { icon: UsersRound, label: "Clientes", to: "/customers" },
  { icon: Target, label: "Oportunidades", to: "/opportunities" },
  { icon: CalendarDays, label: "Actividades", to: "/activities" },
  { icon: Boxes, label: "Catálogo", to: "/catalog" },
  { icon: FileText, label: "Cotizaciones", to: "/quotes" },
  { icon: FolderKanban, label: "Proyectos", to: "/projects" },
  { icon: BarChart3, label: "Reportes", to: "/reports" },
];

interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  path: string;
}

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  description: string;
  occurredAt: string;
  path: string;
}

const SIDEBAR_KEY = "admingest-sidebar-collapsed";

export function AppLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const shellRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_KEY) === "true",
  );
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    const closePanels = (event: MouseEvent) => {
      if (!shellRef.current?.contains(event.target as Node)) return;
      const target = event.target as HTMLElement;
      if (!target.closest(".topbar-popover-anchor")) {
        setNotificationsOpen(false);
        setProfileOpen(false);
      }
    };

    document.addEventListener("click", closePanels);
    return () => document.removeEventListener("click", closePanels);
  }, []);

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
    const route = navigation.find((item) =>
      item.to === "/"
        ? location.pathname === "/"
        : location.pathname.startsWith(item.to),
    );
    if (location.pathname.startsWith("/settings")) return "Configuración";
    return route?.label ?? "AdminGest";
  }, [location.pathname]);

  const goTo = (path: string) => {
    navigate(path);
    setSearch("");
    setSearchOpen(false);
    setNotificationsOpen(false);
    setProfileOpen(false);
  };

  return (
    <div
      className={collapsed ? "app-shell app-shell--collapsed" : "app-shell"}
      ref={shellRef}
    >
      <aside
        className={[
          "sidebar",
          menuOpen ? "open" : "",
          collapsed ? "sidebar--collapsed" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="brand-row">
          <div className="brand">
            <BrandLogo compact={collapsed} variant="sidebar" />
          </div>

          <button
            aria-label="Cerrar menú"
            className="mobile-close"
            onClick={() => setMenuOpen(false)}
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <div className="company-chip" title={user?.company.name}>
          <small>Empresa activa</small>
          <strong>{user?.company.name}</strong>
        </div>

        <nav className="sidebar-nav" aria-label="Navegación principal">
          {navigation.map(({ icon: Icon, label, to }) => (
            <NavLink
              aria-label={label}
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
              end={to === "/"}
              key={to}
              onClick={() => setMenuOpen(false)}
              title={collapsed ? label : undefined}
              to={to}
            >
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <NavLink
          aria-label="Configuración"
          className="nav-item settings"
          title={collapsed ? "Configuración" : undefined}
          to="/settings"
        >
          <Settings size={19} />
          <span>Configuración</span>
        </NavLink>

        <button
          aria-label="Cerrar sesión"
          className="nav-item logout"
          onClick={logout}
          title={collapsed ? "Cerrar sesión" : undefined}
          type="button"
        >
          <LogOut size={19} />
          <span>Cerrar sesión</span>
        </button>
      </aside>

      {menuOpen && (
        <button
          aria-label="Cerrar menú"
          className="sidebar-scrim"
          onClick={() => setMenuOpen(false)}
          type="button"
        />
      )}

      <div className="workspace-shell">
        <header className="topbar">
          <button
            aria-label="Abrir menú"
            className="menu-button"
            onClick={() => setMenuOpen(true)}
            type="button"
          >
            <Menu size={21} />
          </button>

          <button
            aria-label={collapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
            className="sidebar-toggle"
            onClick={() => setCollapsed((value) => !value)}
            type="button"
          >
            {collapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
          </button>

          <div className="breadcrumbs" aria-label="Ruta de navegación">
            <span>AdminGest</span>
            <b>/</b>
            <strong>{currentLabel}</strong>
          </div>

          <div className="global-search">
            <Search size={18} />
            <input
              aria-label="Buscar en AdminGest"
              onChange={(event) => {
                setSearch(event.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Buscar clientes, proyectos, oportunidades..."
              value={search}
            />
            {searchOpen && search.trim().length >= 2 && (
              <div className="search-results">
                {searchQuery.isLoading ? (
                  <div className="popover-state">Buscando…</div>
                ) : searchQuery.data?.length ? (
                  searchQuery.data.map((item) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      onClick={() => goTo(item.path)}
                      type="button"
                    >
                      <span className="search-result-type">{item.type}</span>
                      <span>
                        <strong>{item.title}</strong>
                        <small>{item.subtitle}</small>
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="popover-state">No encontramos coincidencias.</div>
                )}
              </div>
            )}
          </div>

          <div className="topbar-spacer" />

          <button
            aria-label={
              theme === "dark" ? "Activar tema claro" : "Activar tema oscuro"
            }
            className="icon-button"
            onClick={toggleTheme}
            title={theme === "dark" ? "Tema claro" : "Tema oscuro"}
            type="button"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <div className="topbar-popover-anchor">
            <button
              aria-expanded={notificationsOpen}
              aria-label="Notificaciones"
              className="icon-button"
              onClick={(event) => {
                event.stopPropagation();
                setNotificationsOpen((value) => !value);
                setProfileOpen(false);
              }}
              type="button"
            >
              <Bell size={20} />
              {!!notificationsQuery.data?.length && <span className="notification-dot" />}
            </button>

            {notificationsOpen && (
              <div className="topbar-popover notifications-popover">
                <div className="popover-header">
                  <div>
                    <small>Centro de actividad</small>
                    <strong>Notificaciones</strong>
                  </div>
                  <span>{notificationsQuery.data?.length ?? 0}</span>
                </div>
                <div className="notification-list">
                  {notificationsQuery.isLoading ? (
                    <div className="popover-state">Cargando notificaciones…</div>
                  ) : notificationsQuery.data?.length ? (
                    notificationsQuery.data.map((item) => (
                      <button key={item.id} onClick={() => goTo(item.path)} type="button">
                        <span className={`notification-icon notification-icon--${item.type}`}>
                          <Bell size={15} />
                        </span>
                        <span>
                          <strong>{item.title}</strong>
                          <small>{item.description}</small>
                          <time>
                            {new Intl.DateTimeFormat("es-DO", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            }).format(new Date(item.occurredAt))}
                          </time>
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="popover-state">No tienes alertas próximas.</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="topbar-popover-anchor">
            <button
              aria-expanded={profileOpen}
              className="user-summary user-summary--button"
              onClick={(event) => {
                event.stopPropagation();
                setProfileOpen((value) => !value);
                setNotificationsOpen(false);
              }}
              type="button"
            >
              <div className="avatar">
                {user?.firstName[0]}
                {user?.lastName[0]}
              </div>
              <div>
                <strong>
                  {user?.firstName} {user?.lastName}
                </strong>
                <small>{user?.role.replaceAll("_", " ")}</small>
              </div>
              <ChevronDown size={16} />
            </button>

            {profileOpen && (
              <div className="topbar-popover profile-popover">
                <button onClick={() => goTo("/settings")} type="button">
                  <UserCircle size={18} /> Mi perfil y empresa
                </button>
                <button onClick={toggleTheme} type="button">
                  {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                  {theme === "dark" ? "Tema claro" : "Tema oscuro"}
                </button>
                <button className="danger" onClick={logout} type="button">
                  <LogOut size={18} /> Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="workspace">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
