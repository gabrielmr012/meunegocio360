import { Link } from 'react-router';
import { useAuth } from '../../features/auth/index.js';

export default function RequireRole({ allowed, children }) {
  const { usuario } = useAuth();

  if (!allowed.includes(usuario?.perfil)) {
    return (
      <main className="container min-vh-100 d-flex flex-column align-items-center justify-content-center px-3 text-center">
        <h1 className="fs-2">Acesso negado</h1>
        <p className="text-secondary">Você não tem permissão para acessar esta página.</p>
        <Link to="/" className="btn btn-primary">
          Voltar para o início
        </Link>
      </main>
    );
  }

  return children;
}
