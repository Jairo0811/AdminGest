import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ContactRound,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Search,
  Settings,
  Target,
  UsersRound,
} from 'lucide-react';

const navigation = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
  { icon: ContactRound, label: 'Prospectos' },
  { icon: UsersRound, label: 'Clientes' },
  { icon: Target, label: 'Oportunidades' },
  { icon: CalendarDays, label: 'Actividades' },
  { icon: FileText, label: 'Cotizaciones' },
  { icon: FolderKanban, label: 'Proyectos' },
  { icon: BarChart3, label: 'Reportes' },
];

const metrics = [
  { label: 'Prospectos nuevos', value: '24', detail: '+12% este mes', icon: ContactRound },
  { label: 'Oportunidades abiertas', value: '18', detail: 'RD$ 1.8M estimados', icon: Target },
  { label: 'Cotizaciones pendientes', value: '7', detail: '3 vencen esta semana', icon: FileText },
  { label: 'Conversión mensual', value: '31%', detail: '+4.2% vs. mes anterior', icon: CircleDollarSign },
];

const opportunities = [
  { name: 'Portal corporativo', customer: 'Grupo Horizonte', stage: 'Propuesta', amount: 'RD$ 280,000' },
  { name: 'Implementación CRM', customer: 'Caribe Servicios', stage: 'Negociación', amount: 'RD$ 450,000' },
  { name: 'Consultoría tecnológica', customer: 'Nova Solutions', stage: 'Reunión', amount: 'RD$ 120,000' },
];

export default function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">AG</span>
          <span>Admin<span>Gest</span></span>
        </div>

        <nav className="sidebar-nav" aria-label="Navegación principal">
          {navigation.map(({ icon: Icon, label, active }) => (
            <button className={active ? 'nav-item active' : 'nav-item'} key={label} type="button">
              <Icon size={19} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <button className="nav-item settings" type="button">
          <Settings size={19} />
          <span>Configuración</span>
        </button>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">CRM empresarial</p>
            <h1>Buenos días, Jairo</h1>
          </div>

          <div className="topbar-actions">
            <label className="search-box">
              <Search size={18} />
              <input aria-label="Buscar" placeholder="Buscar prospectos, clientes..." />
            </label>
            <button className="icon-button" aria-label="Notificaciones" type="button">
              <Bell size={20} />
              <span className="notification-dot" />
            </button>
            <div className="avatar" aria-label="Perfil de usuario">JM</div>
          </div>
        </header>

        <section className="metrics" aria-label="Indicadores principales">
          {metrics.map(({ label, value, detail, icon: Icon }) => (
            <article className="metric-card" key={label}>
              <div className="metric-icon"><Icon size={21} /></div>
              <div>
                <p>{label}</p>
                <strong>{value}</strong>
                <small>{detail}</small>
              </div>
            </article>
          ))}
        </section>

        <section className="dashboard-grid">
          <article className="panel opportunities-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Pipeline comercial</p>
                <h2>Oportunidades recientes</h2>
              </div>
              <button className="link-button" type="button">Ver todas <ChevronRight size={17} /></button>
            </div>

            <div className="opportunity-list">
              {opportunities.map((opportunity) => (
                <div className="opportunity-row" key={opportunity.name}>
                  <div className="opportunity-icon"><BriefcaseBusiness size={19} /></div>
                  <div className="opportunity-main">
                    <strong>{opportunity.name}</strong>
                    <span>{opportunity.customer}</span>
                  </div>
                  <span className="stage">{opportunity.stage}</span>
                  <strong className="amount">{opportunity.amount}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="panel activities-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Agenda</p>
                <h2>Próximas actividades</h2>
              </div>
            </div>

            <div className="activity-list">
              <div className="activity-item">
                <CalendarDays size={18} />
                <div><strong>Reunión con Grupo Horizonte</strong><span>Hoy · 10:30 a. m.</span></div>
              </div>
              <div className="activity-item">
                <ContactRound size={18} />
                <div><strong>Llamar a Caribe Servicios</strong><span>Hoy · 2:00 p. m.</span></div>
              </div>
              <div className="activity-item completed">
                <CheckCircle2 size={18} />
                <div><strong>Enviar propuesta comercial</strong><span>Completada</span></div>
              </div>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
