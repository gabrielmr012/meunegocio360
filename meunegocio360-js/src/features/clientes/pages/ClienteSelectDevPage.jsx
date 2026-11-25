import { useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import ClienteSelect from '../components/ClienteSelect.jsx';

export default function ClienteSelectDevPage() {
  const [cliente, setCliente] = useState(null);

  useEffect(() => {
    document.title = 'Teste do ClienteSelect | MeuNegócio360';
  }, []);

  return (
    <Container className="clientes-page py-4">
      <h1 className="mb-4">Teste do seletor de clientes</h1>
      <ClienteSelect value={cliente} onChange={setCliente} />
      {cliente && (
        <dl className="mt-4">
          <dt>Cliente selecionado</dt>
          <dd>{cliente.nome}</dd>
        </dl>
      )}
    </Container>
  );
}
