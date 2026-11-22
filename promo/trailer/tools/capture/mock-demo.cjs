// Fictitious demo data for the AdminGest trailer (no real people or companies).
const XSS = '';
const now = Date.now();
const day = 86_400_000;
const iso = (offset) => new Date(now + offset * day).toISOString();
const id = (prefix, n) => `${prefix}000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

const user = {
  id: id('u', 1),
  companyId: id('c', 1),
  email: 'ana@demo.example',
  firstName: 'Ana María',
  lastName: 'Rodríguez Peña',
  role: 'ADMIN',
  company: { name: 'Grupo Demo Caribe SRL', currency: 'DOP', timezone: 'America/Santo_Domingo' },
};

const customers = Array.from({ length: 23 }, (_, n) => ({
  id: id('a', n),
  name:
    [
      'Distribuidora Alfa SRL',
      'Constructora Horizonte',
      'Clínica Bienestar Demo',
      'Agroindustrias Norte',
      'Hotel Brisa Demo',
      'Logística Insular',
      'Farmacia Central Demo',
      'Tecnologías Delta',
      'Inmobiliaria Prisma',
      'Café Montaña Demo',
      'Seguros Atlántico Demo',
      'Textiles Quisqueya Demo',
    ][n % 12] + (n >= 12 ? ' II' : ''),
  taxId: n % 3 ? '131245893' : null,
  email: `contacto${n}@cliente${n}.example`,
  phone: '809-555-0101',
  isActive: true,
  createdAt: iso(-n),
}));
const stages = ['Prospección', 'Calificación', 'Propuesta', 'Negociación', 'Ganada', 'Perdida'].map(
  (name, n) => ({
    id: id('s', n),
    name,
    position: n + 1,
    probability: [10, 30, 60, 80, 100, 0][n],
    isWon: n === 4,
    isLost: n === 5,
  }),
);
const opportunities = Array.from({ length: 12 }, (_, n) => ({
  id: id('o', n),
  name: [
    'Implementación de CRM',
    'Renovación de licencias',
    'Consultoría de procesos',
    'Portal de clientes',
    'Capacitación del equipo',
    'Auditoría de inventario',
    'Migración a la nube',
    'Soporte anual',
    'Expansión de sucursales',
    'Automatización de ventas',
    'Plan de mantenimiento',
    'Análisis financiero',
  ][n],
  estimatedValue: 150000 * (n + 1),
  probability: stages[n % 6].probability,
  status: ['OPEN', 'WON', 'LOST'][n % 3],
  customerId: customers[n].id,
  customer: { id: customers[n].id, name: customers[n].name },
  pipelineStage: stages[n % 6],
  pipelineStageId: stages[n % 6].id,
  owner: { id: user.id, firstName: user.firstName, lastName: user.lastName },
  expectedCloseDate: iso(10 + n),
  updatedAt: iso(-n),
}));
const tasks = Array.from({ length: 8 }, (_, n) => ({
  id: id('t', n),
  title: [
    'Levantamiento de requisitos',
    'Diseño de la solución',
    'Configuración del sistema',
    'Migración de datos',
    'Pruebas con usuarios',
    'Capacitación',
    'Puesta en producción',
    'Seguimiento posterior',
  ][n],
  status: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'][n % 4],
  progress: [0, 40, 100, 10][n % 4],
  startDate: iso(-10 + n * 3),
  dueDate: iso(-6 + n * 4),
  parentId: null,
  assignee: { firstName: 'Luis', lastName: 'Gómez' },
}));
const projects = Array.from({ length: 6 }, (_, n) => ({
  id: id('p', n),
  name: [
    'Implementación CRM — Distribuidora Alfa',
    'Modernización de oficinas',
    'Auditoría de procesos',
    'Portal de clientes',
    'Capacitación comercial',
    'Plan de mejora continua',
  ][n],
  status: ['ACTIVE', 'PLANNED', 'COMPLETED', 'ON_HOLD', 'ACTIVE', 'CANCELLED'][n],
  progress: [45, 0, 100, 20, 70, 5][n],
  budget: 1250000 * (n + 1),
  startDate: iso(-30 + n * 5),
  endDate: iso(20 + n * 10),
  customerId: customers[n].id,
  customer: { id: customers[n].id, name: customers[n].name },
  manager: { id: user.id, firstName: 'Ana', lastName: 'Rodríguez' },
  _count: { tasks: n === 0 ? tasks.length : n },
  tasks: n === 0 ? tasks : [],
  updatedAt: iso(-n),
}));
function quoteItems(n) {
  const lines = [
    {
      description: 'Consultoría de procesos (horas)',
      quantity: 12 + n * 2,
      unitPrice: 3500,
      taxRate: 18,
    },
    { description: 'Licencia anual de la plataforma', quantity: 1, unitPrice: 45000, taxRate: 18 },
    { description: 'Capacitación (exenta)', quantity: 1, unitPrice: 8000, taxRate: 0 },
  ];
  return lines.map((l, i) => {
    const gross = l.quantity * l.unitPrice;
    const discountAmount = +(gross * 0.05).toFixed(2);
    const taxAmount = +(((gross - discountAmount) * l.taxRate) / 100).toFixed(2);
    return {
      id: id('i', n * 10 + i),
      description: l.description,
      quantity: String(l.quantity),
      unitPrice: l.unitPrice.toFixed(2),
      taxRate: String(l.taxRate),
      lineTotal: gross.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
    };
  });
}
const quotes = Array.from({ length: 14 }, (_, n) => ({
  id: id('q', n),
  number: `COT-2026-${String(n + 1).padStart(5, '0')}`,
  publicCode: id('f', n),
  status: ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'][n % 5],
  issueDate: iso(-n),
  validUntil: iso(15 - n),
  ...(() => {
    const items = quoteItems(n);
    const sum = (k) => items.reduce((t, i) => t + Number(i[k]), 0);
    const subtotal = sum('lineTotal'),
      discount = sum('discountAmount'),
      tax = sum('taxAmount');
    return {
      subtotal: subtotal.toFixed(2),
      discount: discount.toFixed(2),
      tax: tax.toFixed(2),
      total: (subtotal - discount + tax).toFixed(2),
      items,
      _count: { items: items.length },
    };
  })(),
  notes: null,
  customerId: customers[n].id,
  customer: { ...customers[n] },
  opportunity: null,
}));
const leads = Array.from({ length: 9 }, (_, n) => ({
  id: id('l', n),
  firstName: ['Carlos', 'María', 'José', 'Laura', 'Pedro', 'Carmen', 'Miguel', 'Rosa', 'Luis'][n],
  lastName: ['Pérez', 'Santos', 'Díaz', 'Núñez', 'Reyes', 'Mejía', 'Cruz', 'Vargas', 'Peña'][n],
  companyName: [
    'Equipos Médicos Demo',
    'Panadería La Espiga',
    'Ferretería Oriental',
    'Óptica Visión Demo',
    'Colegio Futuro Demo',
    'Transporte Ágil',
    'Imprenta Color Demo',
    'Gimnasio Activo',
    'Estudio Creativo Demo',
  ][n],
  email: `prospecto${n}@demo.example`,
  status: ['NEW', 'CONTACTED', 'QUALIFIED', 'DISQUALIFIED', 'CONVERTED'][n % 5],
  priority: (n % 3) + 1,
  source: 'Referido',
  createdAt: iso(-n),
}));
const activities = Array.from({ length: 7 }, (_, n) => ({
  id: id('v', n),
  type: ['CALL', 'EMAIL', 'MEETING', 'TASK'][n % 4],
  subject: [
    'Reunión de seguimiento',
    'Enviar propuesta',
    'Llamada de calificación',
    'Presentación del proyecto',
    'Revisión de contrato',
    'Demostración del sistema',
    'Visita al cliente',
  ][n],
  status: n % 2 ? 'COMPLETED' : 'PENDING',
  scheduledAt: iso(n - 2),
  customer: { id: customers[n].id, name: customers[n].name },
  opportunity: { id: opportunities[n].id, name: opportunities[n].name },
  owner: { id: user.id, firstName: 'Ana', lastName: 'Rodríguez' },
}));
const catalog = Array.from({ length: 6 }, (_, n) => ({
  id: id('k', n),
  name: [
    'Licencia anual',
    'Consultoría (hora)',
    'Capacitación',
    'Soporte técnico',
    'Implementación',
    'Mantenimiento',
  ][n],
  type: n % 2 ? 'PRODUCT' : 'SERVICE',
  unitPrice: '35000.00',
  taxRate: n === 3 ? '0' : '18',
  isActive: n !== 5,
}));
const users = ['ADMIN', 'SALES_MANAGER', 'SALES_REP', 'PROJECT_MANAGER', 'VIEWER'].map(
  (role, n) => ({
    id: n === 0 ? user.id : id('u', n + 1),
    companyId: user.companyId,
    email: n === 0 ? user.email : `usuario${n}@demo.example`,
    firstName: ['Ana María', 'Roberto', 'Julia', 'Andrés', 'Patricia'][n],
    lastName: ['Rodríguez Peña', 'Gómez', 'Martínez', 'Herrera', 'Castillo'][n],
    role,
    status: n === 4 ? 'INACTIVE' : 'ACTIVE',
    lastLoginAt: iso(-n),
    createdAt: iso(-30),
  }),
);
const notifications = Array.from({ length: 7 }, (_, n) => ({
  id: id('n', n),
  title: [
    'Actividad asignada',
    'Proyecto asignado',
    'Actividad próxima',
    'Cotización próxima a vencer',
  ][n % 4],
  message: n === 0 ? 'Reunión de seguimiento con Distribuidora Alfa' : `COT-2026-0000${n}`,
  path: ['/activities', '/projects', '/activities', '/quotes'][n % 4],
  eventType: ['ACTIVITY_ASSIGNED', 'PROJECT_ASSIGNED', 'ACTIVITY_DUE', 'QUOTE_EXPIRING'][n % 4],
  readAt: n < 3 ? null : iso(-n),
  createdAt: iso(-n / 4),
}));
const documents = [
  {
    id: id('d', 1),
    title: 'Contrato marco de servicios profesionales 2026–2027 firmado por ambas partes',
    category: 'CONTRACT',
    url: 'https://docs.demo.example/contratos/marco.pdf',
    projectId: projects[0].id,
    customerId: customers[0].id,
    createdAt: iso(-3),
  },
  {
    id: id('d', 2),
    title: 'Propuesta técnica',
    category: 'PROPOSAL',
    url: 'https://docs.demo.example/propuesta.pdf',
    projectId: null,
    customerId: null,
    createdAt: iso(-8),
  },
];
const templates = [
  {
    id: id('w', 1),
    name: 'Implementación de CRM',
    description: 'Fases estándar de una implementación.',
    steps: [
      'Levantamiento',
      'Configuración',
      'Migración de datos',
      'Capacitación',
      'Puesta en producción',
    ],
  },
  {
    id: id('w', 2),
    name: 'Auditoría de procesos',
    description: null,
    steps: ['Entrevistas', 'Informe'],
  },
];
const rules = ['ACTIVITY_ASSIGNED', 'PROJECT_ASSIGNED', 'ACTIVITY_DUE', 'QUOTE_EXPIRING'].map(
  (eventType, n) => ({ eventType, enabled: n !== 2 }),
);
const months = ['jun', 'jul', 'ago', 'sep', 'oct', 'nov'];
const dashboard = {
  metrics: {
    newLeads: { value: 18, variation: 12.5 },
    customers: { value: 23, variation: 4.2 },
    openOpportunities: { value: 12, variation: -8 },
    pipelineValue: { value: 11700000, variation: 15 },
    pendingQuotes: { value: 6, variation: null },
    activeProjects: { value: 2, variation: 0 },
  },
  salesEvolution: months.map((month, n) => ({
    key: `2026-${n + 6}`,
    month,
    value: 400000 * (n + 1),
    wonValue: 150000 * n,
    count: n + 2,
  })),
  opportunitiesByStage: stages.map((stage, n) => ({
    id: stage.id,
    name: stage.name,
    probability: stage.probability,
    count: 6 - n,
    value: 300000 * (6 - n),
  })),
  upcomingActivities: activities.slice(0, 4),
  recentOpportunities: opportunities.slice(0, 5),
};
const company = {
  id: user.companyId,
  name: user.company.name,
  taxId: '131245893',
  email: 'info@demo.example',
  phone: '809-555-0100',
  address: 'Santo Domingo, República Dominicana',
  currency: 'DOP',
  timezone: 'America/Santo_Domingo',
  logoUrl: null,
};
const subscription = {
  status: 'TRIAL',
  trialEndsAt: iso(9),
  currentPeriodEnd: null,
  isUsable: true,
  plan: {
    name: 'Starter',
    code: 'STARTER',
    storageMb: 1024,
    advancedReports: false,
    apiAccess: false,
  },
  usage: { users: 3, customers: 84, projects: 10 },
  limits: { users: 3, customers: 100, projects: 10 },
  remaining: { users: 0, customers: 16, projects: 0 },
  billing: { integrated: false, automaticRenewal: false },
};
const sessions = [
  {
    id: id('x', 1),
    createdAt: iso(-2),
    lastUsedAt: iso(0),
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
  },
  {
    id: id('x', 2),
    createdAt: iso(-5),
    lastUsedAt: iso(-1),
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',
  },
];

function respond(method, path) {
  const clean = path.replace(/^\/api/, '').split('?')[0];
  if (clean === '/auth/refresh' || clean === '/auth/login')
    return { accessToken: 'mock-token', user };
  if (clean === '/auth/me') return user;
  if (clean === '/auth/sessions') return sessions;
  if (method !== 'GET') return { ok: true };
  const table = {
    '/dashboard': dashboard,
    '/customers': customers,
    '/opportunities': opportunities,
    '/opportunities/stages': stages,
    '/projects': projects,
    '/quotes': quotes,
    '/leads': leads,
    '/activities': activities,
    '/catalog': catalog,
    '/users': users,
    '/users/me': users[0],
    '/notifications': notifications,
    '/documents': documents,
    '/workflows/templates': templates,
    '/workflows/rules': rules,
    '/company': company,
    '/subscriptions/current': subscription,
    '/navigation/search': [],
  };
  if (table[clean]) return table[clean];
  const project = projects.find((item) => clean === `/projects/${item.id}`);
  if (project) return project;
  const quote = quotes.find((item) => clean === `/quotes/${item.id}`);
  if (quote) return quote;
  return null;
}

module.exports = { respond, user };
