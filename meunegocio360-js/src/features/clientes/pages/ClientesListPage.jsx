import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useNavigate } from 'react-router';
import { Alert, Button, Container, Table } from 'react-bootstrap';
import { useBuscaClientes } from '../hooks/useBuscaClientes.js';
import {
  alterarSituacaoCliente,
  excluirCliente,
  getCliente,
} from '../api/clientesApi.js';
import useUrlFilters from '../../../shared/hooks/useUrlFilters.js';
import {
  aplicarMascaraCnpj,
  aplicarMascaraCpf,
  aplicarMascaraTelefone,
} from '../../../shared/lib/formatadores.js';
import ConfirmModal from '../../../shared/ui/ConfirmModal.jsx';
import ErrorAlert from '../../../shared/ui/ErrorAlert.jsx';
import ListToolbar from '../../../shared/ui/ListToolbar.jsx';
import LoadingSpinner from '../../../shared/ui/LoadingSpinner.jsx';
import Paginacao from '../../../shared/ui/Paginacao.jsx';
import StatusBadge from '../../../shared/ui/StatusBadge.jsx';

const CUSTOMER_HAS_HISTORY_MESSAGE =
  'Este cliente possui vendas ou ordens de serviço vinculadas e não pode ser excluído. Você pode inativá-lo.';

export default function ClientesListPage() {
  const { filters, updateFilters, resetFilters } = useUrlFilters();
  const { query, isDebouncing } = useBuscaClientes({
    q: filters.q,
    situacao: filters.situacao,
    page: filters.page,
    size: 10,
  });
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const [notice, setNotice] = useState(location.state?.notice || '');
  const [statusSelection, setStatusSelection] = useState(null);
  const [statusError, setStatusError] = useState(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [deleteSelection, setDeleteSelection] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deferredError, setDeferredError] = useState(null);

  useEffect(() => {
    document.title = 'Clientes | MeuNegócio360';
  }, []);

  useEffect(() => {
    if (!location.state?.notice) return;
    const params = new URLSearchParams(location.search);
    params.set('q', params.get('q') ?? filters.q);
    params.set('situacao', params.get('situacao') ?? filters.situacao);
    params.set('page', params.get('page') ?? String(filters.page));
    navigate(`${location.pathname}?${params.toString()}`, {
      replace: true,
      state: null,
    });
  }, [
    filters.page,
    filters.q,
    filters.situacao,
    location.pathname,
    location.search,
    location.state,
    navigate,
  ]);

  const invalidateClientes = () =>
    queryClient.invalidateQueries({ queryKey: ['clientes'] });

  const handleSituacao = async () => {
    if (!statusSelection) return;
    setStatusBusy(true);
    setStatusError(null);
    setDeferredError(null);
    try {
      const ativo = !statusSelection.ativo;
      await alterarSituacaoCliente(statusSelection.id, {
        ativo,
        versao: statusSelection.versao,
      });
      setStatusSelection(null);
      setNotice(ativo ? 'Cliente reativado.' : 'Cliente inativado.');
      await invalidateClientes();
    } catch (error) {
      setStatusError(error);
      if (error?.code === 'CUSTOMER_NOT_FOUND') {
        setStatusSelection(null);
        setNotice('Este cliente não existe mais.');
        await invalidateClientes();
      }
    } finally {
      setStatusBusy(false);
    }
  };

  const reloadStatusSelection = async () => {
    if (!statusSelection) return;
    setDeferredError(null);
    try {
      const latestCliente = await getCliente(statusSelection.id);
      setStatusSelection(latestCliente);
      setStatusError(null);
      await invalidateClientes();
    } catch (error) {
      setDeferredError(error);
    }
  };

  const handleDelete = async () => {
    if (!deleteSelection) return;
    setDeleteBusy(true);
    setDeleteError(null);
    setDeferredError(null);
    try {
      await excluirCliente(deleteSelection.id);
      setDeleteSelection(null);
      setNotice('Cliente excluído.');
      await invalidateClientes();
    } catch (error) {
      setDeleteError(error);
      if (error?.code === 'CUSTOMER_NOT_FOUND') {
        setDeleteSelection(null);
        setNotice('Este cliente não existe mais.');
        await invalidateClientes();
      }
    } finally {
      setDeleteBusy(false);
    }
  };

  const handleInactivateFromDelete = async () => {
    if (!deleteSelection) return;
    setDeleteBusy(true);
    setDeferredError(null);
    try {
      await alterarSituacaoCliente(deleteSelection.id, {
        ativo: false,
        versao: deleteSelection.versao,
      });
      setDeleteSelection(null);
      setDeleteError(null);
      setNotice('Cliente inativado.');
      await invalidateClientes();
    } catch (error) {
      setDeleteError(error);
      if (error?.code === 'CUSTOMER_NOT_FOUND') {
        setDeleteSelection(null);
        setNotice('Este cliente não existe mais.');
        await invalidateClientes();
      }
    } finally {
      setDeleteBusy(false);
    }
  };

  const reloadDeleteSelection = async () => {
    if (!deleteSelection) return;
    setDeferredError(null);
    try {
      const latestCliente = await getCliente(deleteSelection.id);
      setDeleteSelection(latestCliente);
      setDeleteError(null);
      await invalidateClientes();
    } catch (error) {
      setDeferredError(error);
    }
  };

  const clientes = query.data?.content || [];
  const totalPages = query.data?.totalPages || 0;
  const hasFilters = Boolean(filters.q.trim()) || filters.situacao !== 'ATIVO';
  const isEmpty = !query.isPending && clientes.length === 0;

  useEffect(() => {
    if (!query.data) return;
    const lastPage = Math.max(0, query.data.totalPages - 1);
    if (filters.page > lastPage) updateFilters({ page: lastPage });
  }, [filters.page, query.data, updateFilters]);

  const renderModalError = (error, onRetry) => {
    if (!error) return null;
    if (error.code === 'VERSION_CONFLICT') {
      return (
        <ErrorAlert
          message="Este cliente foi alterado por outra operação. Recarregue os dados antes de continuar."
          onRetry={onRetry}
          retryLabel="Recarregar dados"
        />
      );
    }
    if (error.code === 'CUSTOMER_HAS_HISTORY') {
      return (
        <Alert variant="warning" role="alert">
          {CUSTOMER_HAS_HISTORY_MESSAGE}
        </Alert>
      );
    }
    return (
      <ErrorAlert
        message="Não foi possível concluir a operação. Verifique sua conexão e tente novamente."
        onRetry={onRetry}
      />
    );
  };

  if (
    query.isError &&
    (query.error?.status === 403 || query.error?.code === 'ACCESS_DENIED')
  ) {
    return (
      <Container className="clientes-page py-4">
        <h1>Acesso negado</h1>
        <p>Você não tem permissão para consultar clientes.</p>
      </Container>
    );
  }

  return (
    <Container className="clientes-page py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="mb-1">Clientes</h1>
          <p className="text-secondary mb-0">
            Consulte e mantenha os clientes da empresa.
          </p>
        </div>
        <Button as={Link} to="/clientes/novo" variant="primary">
          Novo cliente
        </Button>
      </div>

      {notice && (
        <Alert variant="success" role="status" dismissible onClose={() => setNotice('')}>
          {notice}
        </Alert>
      )}
      {deferredError && (
        <ErrorAlert
          message="Não foi possível recarregar os dados do cliente."
          onRetry={statusSelection ? reloadStatusSelection : reloadDeleteSelection}
        />
      )}
      {query.isError && (
        <ErrorAlert
          message="Não foi possível carregar os clientes. Verifique sua conexão e tente novamente."
          onRetry={() => query.refetch()}
        />
      )}

      <ListToolbar
        query={filters.q}
        situation={filters.situacao}
        onQueryChange={(q) => updateFilters({ q, page: 0 })}
        onSituationChange={(situacao) => updateFilters({ situacao, page: 0 })}
      />

      {isDebouncing && !query.isError && (
        <p role="status" className="text-secondary">
          Buscando clientes…
        </p>
      )}
      {query.isPending && <LoadingSpinner text="Carregando clientes…" />}

      {!query.isPending && !query.isError && (
        <>
          {isEmpty ? (
            <section className="clientes-empty-state text-center py-5">
              <h2 className="fs-4">
                {hasFilters
                  ? 'Nenhum cliente encontrado para a busca.'
                  : 'Nenhum cliente cadastrado.'}
              </h2>
              {!hasFilters ? (
                <p className="text-secondary">Cadastre o primeiro cliente.</p>
              ) : (
                <Button variant="outline-dark" onClick={resetFilters}>
                  Limpar filtros
                </Button>
              )}
            </section>
          ) : (
            <>
              <div className="table-responsive clientes-table-wrap">
                <Table striped hover className="align-middle mb-0">
                  <caption className="visually-hidden">
                    Clientes cadastrados e ações disponíveis
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Nome</th>
                      <th scope="col">Documento</th>
                      <th scope="col">Telefone</th>
                      <th scope="col">E-mail</th>
                      <th scope="col">Situação</th>
                      <th scope="col">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientes.map((cliente) => (
                      <tr key={cliente.id}>
                        <th scope="row">{cliente.nome}</th>
                        <td>
                          {cliente.tipoPessoa === 'FISICA'
                            ? aplicarMascaraCpf(cliente.documento)
                            : aplicarMascaraCnpj(cliente.documento)}
                        </td>
                        <td>
                          {cliente.telefone
                            ? aplicarMascaraTelefone(cliente.telefone)
                            : '—'}
                        </td>
                        <td>{cliente.email || '—'}</td>
                        <td>
                          <StatusBadge active={cliente.ativo} />
                        </td>
                        <td>
                          <div className="d-flex flex-wrap gap-2 clientes-row-actions">
                            <Button
                              as={Link}
                              to={`/clientes/${cliente.id}`}
                              variant="outline-dark"
                              size="sm"
                            >
                              Editar
                            </Button>
                            <Button
                              variant="outline-dark"
                              size="sm"
                              onClick={() => {
                                setStatusSelection(cliente);
                                setStatusError(null);
                                setDeferredError(null);
                              }}
                            >
                              {cliente.ativo ? 'Inativar' : 'Reativar'}
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => {
                                setDeleteSelection(cliente);
                                setDeleteError(null);
                                setDeferredError(null);
                              }}
                            >
                              Excluir
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mt-3">
                <span aria-live="polite">
                  {query.data.totalElements}{' '}
                  {query.data.totalElements === 1 ? 'cliente' : 'clientes'}
                </span>
                <Paginacao
                  page={filters.page}
                  totalPages={totalPages}
                  onPageChange={(page) => updateFilters({ page })}
                />
              </div>
            </>
          )}
        </>
      )}

      <ConfirmModal
        show={!!statusSelection}
        title={statusSelection?.ativo ? 'Inativar cliente' : 'Reativar cliente'}
        confirmLabel={statusSelection?.ativo ? 'Inativar' : 'Reativar'}
        confirming={statusBusy}
        onCancel={() => {
          if (!statusBusy) setStatusSelection(null);
        }}
        onConfirm={handleSituacao}
      >
        <p>
          Deseja {statusSelection?.ativo ? 'inativar' : 'reativar'} o cliente{' '}
          <strong>{statusSelection?.nome}</strong>?
        </p>
        {renderModalError(
          statusError,
          statusError?.code === 'VERSION_CONFLICT'
            ? reloadStatusSelection
            : handleSituacao,
        )}
      </ConfirmModal>

      <ConfirmModal
        show={!!deleteSelection}
        title="Excluir cliente"
        confirmLabel="Excluir"
        confirming={deleteBusy}
        onCancel={() => {
          if (!deleteBusy) {
            setDeleteSelection(null);
            setDeleteError(null);
          }
        }}
        onConfirm={handleDelete}
      >
        <p>
          Excluir o cliente <strong>{deleteSelection?.nome}</strong>? Esta ação não pode
          ser desfeita.
        </p>
        {renderModalError(
          deleteError,
          deleteError?.code === 'VERSION_CONFLICT' ? reloadDeleteSelection : handleDelete,
        )}
        {deleteError?.code === 'CUSTOMER_HAS_HISTORY' && (
          <Button
            variant="primary"
            className="mt-2"
            onClick={handleInactivateFromDelete}
            disabled={deleteBusy}
          >
            Inativar cliente
          </Button>
        )}
      </ConfirmModal>
    </Container>
  );
}
