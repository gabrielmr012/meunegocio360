import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router';
import { Button, Container } from 'react-bootstrap';
import { atualizarCliente, cadastrarCliente, getCliente } from '../api/clientesApi.js';
import ClienteForm from '../components/ClienteForm.jsx';
import ErrorAlert from '../../../shared/ui/ErrorAlert.jsx';
import LoadingSpinner from '../../../shared/ui/LoadingSpinner.jsx';

export default function ClienteFormPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const clienteQuery = useQuery({
    queryKey: ['cliente', id],
    queryFn: () => getCliente(id),
    enabled: isEditing,
  });

  useEffect(() => {
    document.title = `${isEditing ? 'Editar cliente' : 'Novo cliente'} | MeuNegócio360`;
  }, [isEditing]);

  const handleSave = async (values) => {
    const result = isEditing
      ? await atualizarCliente(id, { ...values, versao: clienteQuery.data.versao })
      : await cadastrarCliente(values);
    if (isEditing) queryClient.setQueryData(['cliente', id], result);
    await queryClient.invalidateQueries({ queryKey: ['clientes'] });
    const filters = new URLSearchParams({
      q: result.nome,
      situacao: result.ativo ? 'ATIVO' : 'INATIVO',
      page: '0',
    });
    navigate(`/clientes?${filters.toString()}`, {
      replace: true,
      state: {
        notice: isEditing
          ? 'Cliente atualizado com sucesso.'
          : 'Cliente cadastrado com sucesso.',
      },
    });
  };

  const handleReload = async () => {
    const result = await clienteQuery.refetch();
    if (result.error) throw result.error;
    return result.data;
  };

  if (isEditing && clienteQuery.isPending) {
    return <LoadingSpinner text="Carregando cliente…" />;
  }

  if (isEditing && clienteQuery.isError) {
    if (clienteQuery.error?.code === 'CUSTOMER_NOT_FOUND') {
      return (
        <Container className="clientes-page py-4">
          <h1>Cliente não encontrado</h1>
          <p>Este cliente não está disponível nesta empresa.</p>
          <Button as={Link} to="/clientes" variant="primary">
            Voltar para clientes
          </Button>
        </Container>
      );
    }
    if (
      clienteQuery.error?.status === 403 ||
      clienteQuery.error?.code === 'ACCESS_DENIED'
    ) {
      return (
        <Container className="clientes-page py-4">
          <h1>Acesso negado</h1>
          <p>Você não tem permissão para consultar clientes.</p>
          <Button as={Link} to="/" variant="primary">
            Voltar para o início
          </Button>
        </Container>
      );
    }
    return (
      <Container className="clientes-page py-4">
        <h1>Não foi possível carregar o cliente</h1>
        <ErrorAlert
          message="Verifique sua conexão e tente novamente."
          onRetry={() => clienteQuery.refetch()}
        />
        <Button as={Link} to="/clientes" variant="outline-dark">
          Voltar para clientes
        </Button>
      </Container>
    );
  }

  const cliente = isEditing ? clienteQuery.data : null;

  return (
    <Container className="clientes-page py-4">
      <h1 className="mb-4">{isEditing ? 'Editar cliente' : 'Novo cliente'}</h1>
      <ClienteForm cliente={cliente} onSave={handleSave} onReload={handleReload} />
    </Container>
  );
}
