// ============================================================
// LoginPage — tela /login
// ============================================================
import { useEffect } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../hooks/AuthContext.jsx';
import LoginForm from '../components/LoginForm.jsx';

export default function LoginPage() {
  const { status } = useAuth();

  useEffect(() => {
    document.title = 'Entrar | MeuNegócio360';
  }, []);

  // Se já está autenticado, redireciona para /
  if (status === 'autenticado') {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="container min-vh-100 d-flex align-items-center justify-content-center px-3 py-4">
      <div className="w-100">
        <LoginForm />
      </div>
    </main>
  );
}
