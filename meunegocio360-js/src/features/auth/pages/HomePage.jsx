// ============================================================
// HomePage — página inicial protegida (provisória)
// ============================================================
import { useEffect } from 'react';
import { Button } from 'react-bootstrap';
import { useAuth } from '../hooks/AuthContext.jsx';

export default function HomePage() {
  const { usuario, logout } = useAuth();

  useEffect(() => {
    document.title = 'Início | MeuNegócio360';
  }, []);

  return (
    <main className="min-vh-100 d-flex flex-column">
      {/* Cabeçalho provisório */}
      <header className="bg-primary text-dark py-3 px-4 d-flex align-items-center justify-content-between">
        <span className="brand-wordmark fw-semibold fs-4">MeuNegócio360</span>
        <span className="small">{usuario?.perfil}</span>
      </header>

      <div className="container mt-5">
        <h1 className="fs-2 mb-3">Olá, {usuario?.nome || 'Usuário'}!</h1>
        <p className="text-secondary mb-4">
          Você está autenticado como <strong>{usuario?.email}</strong>.
        </p>

        <Button variant="outline-dark" onClick={logout} className="home-logout">
          Sair
        </Button>
      </div>
    </main>
  );
}
