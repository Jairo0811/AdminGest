import {
  BarChart3,
  BriefcaseBusiness,
  CheckSquare2,
  ContactRound,
  FolderKanban,
  TrendingUp,
} from 'lucide-react';

const modules = [
  { icon: ContactRound, title: 'CRM', description: 'Prospectos, clientes y seguimiento comercial.' },
  { icon: FolderKanban, title: 'Proyectos', description: 'Planificación, alcance, recursos y cronogramas.' },
  { icon: CheckSquare2, title: 'Tareas', description: 'Responsables, prioridades y fechas límite.' },
  { icon: BriefcaseBusiness, title: 'Administración', description: 'Operaciones empresariales centralizadas.' },
  { icon: BarChart3, title: 'Reportes', description: 'Indicadores útiles para tomar decisiones.' },
];

export default function App() {
  return (
    <main>
      <section className="hero">
        <nav className="nav">
          <div className="brand">
            <span className="brand-mark">AG</span>
            <span>Admin<span>Gest</span></span>
          </div>
          <span className="phase">Fase 0 · Base técnica</span>
        </nav>

        <div className="hero-content">
          <div>
            <p className="eyebrow">CRM + Gestión de proyectos + Administración empresarial</p>
            <h1>La gestión inteligente para tu empresa.</h1>
            <p className="lead">
              AdminGest centraliza clientes, proyectos, tareas, ventas y reportes en una plataforma modular preparada para crecer.
            </p>
            <div className="actions">
              <button type="button">Explorar módulos</button>
              <a href="http://localhost:3000/docs">Ver documentación API</a>
            </div>
          </div>

          <div className="project-card">
            <div className="card-header">
              <TrendingUp size={20} />
              <strong>Proyecto AdminGest</strong>
              <span>76%</span>
            </div>
            <div className="gantt">
              <div><span>Arquitectura</span><i style={{ width: '88%' }} /></div>
              <div><span>Frontend</span><i style={{ width: '62%' }} /></div>
              <div><span>Backend</span><i style={{ width: '55%' }} /></div>
              <div><span>Integración</span><i style={{ width: '28%' }} /></div>
            </div>
          </div>
        </div>
      </section>

      <section className="modules">
        {modules.map(({ icon: Icon, title, description }) => (
          <article key={title}>
            <Icon />
            <h2>{title}</h2>
            <p>{description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
