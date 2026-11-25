import { Navigate } from 'react-router';
import { useAuth } from '../../features/auth/index.js';
import { EmpresaStatus, useEmpresa } from '../../features/empresa/index.js';
import { PERFIS } from '../lib/perfis.js';
import LoadingSpinner from './LoadingSpinner.jsx';
import ErrorScreen from './ErrorScreen.jsx';

export default function RequireEmpresa({ children }) {
  const { usuario } = useAuth();
  const { status, empresa, refetch } = useEmpresa();

  if (status === EmpresaStatus.CARREGANDO) {
    return <LoadingSpinner text="Verificando empresa…" />;
  }

  if (status === EmpresaStatus.ERRO) {
    return (
      <ErrorScreen
        message="Não foi possível carregar os dados da empresa. Tente novamente."
        onRetry={() => refetch()}
      />
    );
  }

  if (status === EmpresaStatus.AUSENTE || !empresa?.ativa) {
    if (usuario?.perfil === PERFIS.ADMIN) {
      return <Navigate to="/empresa/cadastro" replace />;
    }

    return (
      <main className="container min-vh-100 d-flex align-items-center justify-content-center px-3 text-center">
        <div>
          <h1 className="fs-2">Aguardando o cadastro da empresa</h1>
          <p className="text-secondary">
            Fale com o administrador para concluir o cadastro da empresa.
          </p>
        </div>
      </main>
    );
  }

  return children;
}
