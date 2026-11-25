import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { Button, Container, Pagination, Spinner, Table } from 'react-bootstrap';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthStatus, useAuth } from '../../auth/index.js';
import LoadingSpinner from '../../../shared/ui/LoadingSpinner.jsx';
import ErrorScreen from '../../../shared/ui/ErrorScreen.jsx';
import ErrorAlert from '../../../shared/ui/ErrorAlert.jsx';
import EmpresaForm from '../components/EmpresaForm.jsx';
import { EmpresaStatus, useEmpresa } from '../hooks/EmpresaContext.jsx';
import {
  alterarSituacaoEmpresa,
  cadastrarEmpresa,
  getEmpresasInativas,
} from '../api/empresaApi.js';
import { aplicarMascaraCnpj } from '../../../shared/lib/formatadores.js';

const EMPRESAS_POR_PAGINA = 10;

function getPage(searchParams) {
  const parsedPage = Number(searchParams.get('page'));
  return Number.isInteger(parsedPage) && parsedPage >= 0 ? parsedPage : 0;
}

export default function EmpresaCadastroPage() {
  const { status: authStatus } = useAuth();
  const { status, empresa, setEmpresa, refetch } = useEmpresa();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [reactivatingId, setReactivatingId] = useState(null);
  const [failedReactivation, setFailedReactivation] = useState(null);
  const [completionInProgress, setCompletionInProgress] = useState(false);
  const page = getPage(searchParams);
  const empresasInativasQuery = useQuery({
    queryKey: ['empresas-inativas', page, EMPRESAS_POR_PAGINA],
    queryFn: () => getEmpresasInativas(page, EMPRESAS_POR_PAGINA),
    enabled:
      authStatus === AuthStatus.AUTENTICADO &&
      status === EmpresaStatus.AUSENTE &&
      !empresa,
  });
  const empresasInativas = empresasInativasQuery.data;
  const isPageOutOfRange =
    empresasInativas &&
    page > 0 &&
    (empresasInativas.totalPages === 0 || page >= empresasInativas.totalPages);

  useEffect(() => {
    document.title = 'Cadastre sua empresa | MeuNegócio360';
  }, []);

  useEffect(() => {
    if (isPageOutOfRange) {
      setSearchParams(
        { page: String(Math.max(0, empresasInativas.totalPages - 1)) },
        { replace: true },
      );
    }
  }, [empresasInativas, isPageOutOfRange, setSearchParams]);

  const [formError, setFormError] = useState(null);
  const [reactivationError, setReactivationError] = useState(null);

  if (authStatus !== AuthStatus.AUTENTICADO) {
    return <LoadingSpinner text="Verificando sessão…" />;
  }

  if (status === EmpresaStatus.CARREGANDO) {
    return <LoadingSpinner text="Verificando empresa…" />;
  }

  if (status === EmpresaStatus.ERRO) {
    return (
      <ErrorScreen
        message="Não foi possível verificar os dados da empresa. Tente novamente."
        onRetry={() => refetch()}
      />
    );
  }

  if ((empresa || status === EmpresaStatus.ATIVA) && !completionInProgress) {
    return <Navigate to="/empresa" replace />;
  }

  const handleSubmit = async (values) => {
    setSubmitting(true);
    setFormError(null);
    try {
      const saved = await cadastrarEmpresa(values);
      setCompletionInProgress(true);
      setEmpresa(saved);
      navigate('/', {
        replace: true,
        state: { notice: 'Empresa cadastrada com sucesso.' },
      });
    } catch (error) {
      setFormError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReativar = async (empresaInativa) => {
    setReactivatingId(empresaInativa.id);
    setFailedReactivation(null);
    setReactivationError(null);
    try {
      const ativa = await alterarSituacaoEmpresa(empresaInativa.id, {
        ativa: true,
        versao: empresaInativa.versao,
      });
      setCompletionInProgress(true);
      setEmpresa(ativa);
      await queryClient.invalidateQueries({ queryKey: ['empresas-inativas'] });
      navigate('/', {
        replace: true,
        state: { notice: 'Empresa reativada com sucesso.' },
      });
    } catch (error) {
      setFailedReactivation(empresaInativa);
      setReactivationError(error);
      if (error?.code === 'VERSION_CONFLICT') {
        await empresasInativasQuery.refetch();
      }
    } finally {
      setReactivatingId(null);
    }
  };

  return (
    <main>
      <Container className="empresa-page py-5">
        <h1 className="mb-4">Cadastre sua empresa</h1>

        {reactivationError?.code === 'COMPANY_ALREADY_ACTIVE' && (
          <ErrorAlert
            message="Já existe uma empresa ativa. Inative-a antes de cadastrar ou reativar outra."
            onRetry={async () => {
              const result = await refetch();
              if (result.data) {
                setEmpresa(result.data);
                setReactivationError(null);
              }
            }}
            retryLabel="Recarregar dados"
          />
        )}
        {reactivationError?.code === 'VERSION_CONFLICT' && (
          <ErrorAlert
            message="Esta empresa foi alterada por outra operação. Os dados da lista foram atualizados; tente novamente."
            onRetry={async () => {
              const result = await empresasInativasQuery.refetch();
              if (!result.error) setReactivationError(null);
            }}
            retryLabel="Recarregar dados"
          />
        )}
        {reactivationError &&
          !['COMPANY_ALREADY_ACTIVE', 'VERSION_CONFLICT'].includes(
            reactivationError.code,
          ) && (
            <ErrorAlert
              message="Não foi possível reativar a empresa. Tente novamente."
              onRetry={() =>
                failedReactivation
                  ? handleReativar(failedReactivation)
                  : empresasInativasQuery.refetch()
              }
            />
          )}

        <section aria-labelledby="empresas-inativas-titulo" className="mb-5">
          <h2 id="empresas-inativas-titulo" className="fs-4">
            Empresas inativas
          </h2>
          {empresasInativasQuery.isPending && (
            <div role="status" className="d-flex align-items-center gap-2">
              <Spinner size="sm" aria-hidden="true" />
              <span>Carregando empresas inativas…</span>
            </div>
          )}
          {empresasInativasQuery.isError && (
            <ErrorAlert
              message="Não foi possível carregar as empresas inativas."
              onRetry={() => empresasInativasQuery.refetch()}
            />
          )}
          {empresasInativas && empresasInativas.totalElements === 0 && (
            <p className="text-secondary">Não há empresas inativas para reativar.</p>
          )}
          {empresasInativas?.content?.length > 0 && (
            <>
              <Table responsive bordered hover>
                <caption className="visually-hidden">
                  Empresas inativas disponíveis para reativação
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Razão social</th>
                    <th scope="col">Nome fantasia</th>
                    <th scope="col">CNPJ</th>
                    <th scope="col">
                      <span className="visually-hidden">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {empresasInativas.content.map((empresaInativa) => (
                    <tr key={empresaInativa.id}>
                      <td>{empresaInativa.razaoSocial}</td>
                      <td>{empresaInativa.nomeFantasia || '—'}</td>
                      <td>{aplicarMascaraCnpj(empresaInativa.cnpj)}</td>
                      <td>
                        <Button
                          variant="outline-dark"
                          size="sm"
                          className="empresa-reactivate"
                          onClick={() => handleReativar(empresaInativa)}
                          disabled={reactivatingId !== null}
                        >
                          {reactivatingId === empresaInativa.id
                            ? 'Reativando…'
                            : 'Reativar'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {empresasInativas.totalPages > 1 && (
                <Pagination
                  aria-label="Paginação de empresas inativas"
                  className="align-items-center"
                >
                  <Pagination.Prev
                    aria-label="Página anterior"
                    disabled={page === 0}
                    onClick={() =>
                      setSearchParams({ page: String(Math.max(0, page - 1)) })
                    }
                  />
                  <Pagination.Item active aria-current="page">
                    {page + 1} de {empresasInativas.totalPages}
                  </Pagination.Item>
                  <Pagination.Next
                    aria-label="Próxima página"
                    disabled={page + 1 >= empresasInativas.totalPages}
                    onClick={() =>
                      setSearchParams({
                        page: String(Math.min(empresasInativas.totalPages - 1, page + 1)),
                      })
                    }
                  />
                </Pagination>
              )}
            </>
          )}
        </section>

        <h2 className="fs-4 mb-3">Cadastrar uma nova empresa</h2>
        <EmpresaForm
          onSubmit={handleSubmit}
          submitting={submitting}
          serverError={formError}
          onServerErrorCleared={async () => {
            const result = await refetch();
            if (result.data) setFormError(null);
          }}
        />
      </Container>
    </main>
  );
}
