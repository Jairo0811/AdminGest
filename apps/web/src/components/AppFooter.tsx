export function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <span>
        © {currentYear} AdminGest · Gestión Empresarial Inteligente
      </span>
    </footer>
  );
}