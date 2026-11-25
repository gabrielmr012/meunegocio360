import { useEffect, useState } from 'react';
import { Alert, Button, Container } from 'react-bootstrap';
import { useQueryClient } from '@tanstack/react-query';
import { AuthStatus, useAuth } from '../../auth/index.js';
import { PERFIS } from '../../../shared/lib/perfis.js';
import {
  aplicarMascaraCnpj,
  aplicarMascaraTelefone,
} from '../../../shared/lib/formatadores.js';
import ConfirmModal from '../../../shared/ui/ConfirmModal.jsx';
import ErrorAlert from '../../../shared/ui/ErrorAlert.jsx';
import EmpresaForm from '../components/EmpresaForm.jsx';
import { useEmpresa } from '../hooks/EmpresaContext.jsx';
import { atualizarEmpresa, alterarSituacaoEmpresa } from '../api/empresaApi.js';

export default function EmpresaPage() {
  const { usuario, status: authStatus } = useAuth();
  const { empresa, setEmpresa, refetch } = useEmpresa();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [success, setSuccess] = useState('');
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalSituacao, setModalSituacao] = useState(false);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [lastOperation, setLastOperation] = useState(null);

  useEffect(() => {
    document.title = 'Empresa | MeuNegócio360';
  }, []);

  if (authStatus !== AuthStatus.AUTENTICADO || !empresa) return null;

  const isAdmin = usuario?.perfil === PERFIS.ADMIN;

  const handleUpdate = async (values) => {
    setSubmitting(true);
    setServerError(null);
    setSuccess('');
    try {
      const updated = await atualizarEmpresa(empresa.id, values);
      setEmpresa(updated);
      queryClient.setQueryData(['empresa-ativa'], updated);
      setSuccess('Dados da empresa atualizados.');
      setEditing(false);
    } catch (error) {
      setServerError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSituacao = async () => {
    setModalSubmitting(true);
    setLastOperation('situacao');
    setServerError(null);
    try {
      const updated = await alterarSituacaoEmpresa(empresa.id, {
        ativa: false,
        versao: empresa.versao,
      });
      setEmpresa(updated);
      await queryClient.invalidateQueries({ queryKey: ['empresas-inativas'] });
      await refetch();
      setModalSituacao(false);
    } catch (error) {
      setServerError(error);
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleReativar = async () => {
    setSubmitting(true);
    setLastOperation('reativar');
    setServerError(null);
    try {
      const updated = await alterarSituacaoEmpresa(empresa.id, {
        ativa: true,
        versao: empresa.versao,
      });
      setEmpresa(updated);
      await refetch();
      setSuccess('Empresa reativada com sucesso.');
    } catch (error) {
      setServerError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReloadAfterConflict = async () => {
    const result = await refetch();
    if (result.data) {
      setEmpresa(result.data);
      setServerError(null);
    }
  };

  if (editing && isAdmin) {
    return (
      <Container className="empresa-page py-4">
        <h1 className="mb-4">Editar empresa</h1>
        {success && (
          <Alert role="status" variant="success">
            {success}
          </Alert>
        )}
        <EmpresaForm
          empresa={empresa}
          onSubmit={handleUpdate}
          submitting={submitting}
          serverError={serverError}
          onServerErrorCleared={handleReloadAfterConflict}
        />
        <Button
          variant="outline-dark"
          className="mt-3"
          onClick={() => {
            setEditing(false);
            setServerError(null);
          }}
        >
          Cancelar edição
        </Button>
      </Container>
    );
  }

  return (
    <Container className="empresa-page py-4">
      <h1 className="mb-4">Empresa</h1>
      {success && (
        <Alert role="status" variant="success">
          {success}
        </Alert>
      )}
      {serverError && (
        <ErrorAlert
          message={
            serverError.code === 'VERSION_CONFLICT'
              ? 'Esta empresa foi alterada por outra operação. Recarregue os dados antes de tentar novamente.'
              : serverError.code === 'COMPANY_ALREADY_ACTIVE'
                ? 'Já existe uma empresa ativa. Inative-a antes de cadastrar ou reativar outra.'
                : serverError.code === 'ACCESS_DENIED'
                  ? 'Você não tem permissão para alterar os dados da empresa.'
                  : 'Não foi possível alterar os dados da empresa. Tente novamente.'
          }
          onRetry={
            serverError.code === 'VERSION_CONFLICT'
              ? handleReloadAfterConflict
              : serverError.code === 'COMPANY_ALREADY_ACTIVE'
                ? handleReloadAfterConflict
                : lastOperation === 'situacao'
                  ? handleSituacao
                  : undefined
          }
          retryLabel={
            serverError.code === 'VERSION_CONFLICT' ||
            serverError.code === 'COMPANY_ALREADY_ACTIVE'
              ? 'Recarregar dados'
              : 'Tentar novamente'
          }
        />
      )}

      <dl className="row">
        <dt className="col-sm-4">Razão social</dt>
        <dd className="col-sm-8">{empresa.razaoSocial}</dd>
        <dt className="col-sm-4">Nome fantasia</dt>
        <dd className="col-sm-8">{empresa.nomeFantasia || '—'}</dd>
        <dt className="col-sm-4">CNPJ</dt>
        <dd className="col-sm-8">{aplicarMascaraCnpj(empresa.cnpj)}</dd>
        <dt className="col-sm-4">E-mail</dt>
        <dd className="col-sm-8">{empresa.email || '—'}</dd>
        <dt className="col-sm-4">Telefone</dt>
        <dd className="col-sm-8">
          {empresa.telefone ? aplicarMascaraTelefone(empresa.telefone) : '—'}
        </dd>
        <dt className="col-sm-4">Fuso horário</dt>
        <dd className="col-sm-8">{empresa.fusoHorario}</dd>
        <dt className="col-sm-4">Moeda</dt>
        <dd className="col-sm-8">{empresa.moeda}</dd>
      </dl>

      {isAdmin && (
        <div className="d-flex flex-wrap gap-2">
          {empresa.ativa ? (
            <>
              <Button variant="primary" onClick={() => setEditing(true)}>
                Editar
              </Button>
              <Button variant="outline-dark" onClick={() => setModalSituacao(true)}>
                Inativar
              </Button>
            </>
          ) : (
            <Button variant="primary" onClick={handleReativar} disabled={submitting}>
              {submitting ? 'Reativando…' : 'Reativar'}
            </Button>
          )}
        </div>
      )}

      <ConfirmModal
        show={modalSituacao}
        title="Inativar empresa"
        confirmLabel="Inativar"
        confirming={modalSubmitting}
        onCancel={() => setModalSituacao(false)}
        onConfirm={handleSituacao}
      >
        Ao inativar a empresa, não será possível cadastrar clientes, fornecedores,
        produtos nem vendas até que uma empresa seja ativada.
      </ConfirmModal>
    </Container>
  );
}
