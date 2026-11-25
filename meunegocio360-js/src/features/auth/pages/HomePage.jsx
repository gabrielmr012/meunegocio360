// ============================================================
// HomePage — início da aplicação autenticada
// ============================================================
import { useEffect, useState } from 'react';
import { Alert } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '../hooks/AuthContext.jsx';

export default function HomePage() {
  const { usuario } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [notice, setNotice] = useState(location.state?.notice || '');

  useEffect(() => {
    document.title = 'Início | MeuNegócio360';
  }, []);

  useEffect(() => {
    if (location.state?.notice) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  return (
    <div className="container py-5">
      {notice && (
        <Alert variant="success" role="status" dismissible onClose={() => setNotice('')}>
          {notice}
        </Alert>
      )}
      <main>
        <h1 className="fs-2 mb-3">Olá, {usuario?.nome || 'Usuário'}!</h1>
        <p className="text-secondary mb-4">
          Você está autenticado como <strong>{usuario?.email}</strong>. Use o menu para
          acessar os dados da sua empresa.
        </p>
      </main>
    </div>
  );
}
