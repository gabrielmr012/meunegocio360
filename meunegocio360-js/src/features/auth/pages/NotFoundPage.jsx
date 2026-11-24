// ============================================================
// NotFoundPage — página 404
// ============================================================
import { useEffect } from 'react';
import { Link } from 'react-router';

export default function NotFoundPage() {
  useEffect(() => {
    document.title = 'Página não encontrada | MeuNegócio360';
  }, []);

  return (
    <main className="min-vh-100 d-flex flex-column align-items-center justify-content-center px-3 text-center">
      <h1 className="display-4 fw-bold">404</h1>
      <p className="fs-5 text-secondary mb-4">Página não encontrada.</p>
      <Link to="/" className="btn btn-primary not-found-home">
        Voltar para o início
      </Link>
    </main>
  );
}
