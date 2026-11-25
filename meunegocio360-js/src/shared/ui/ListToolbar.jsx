import { Form } from 'react-bootstrap';

export default function ListToolbar({
  query,
  situation,
  onQueryChange,
  onSituationChange,
}) {
  return (
    <div className="row g-3 align-items-end clientes-toolbar">
      <Form.Group className="col-md-8" controlId="clientes-busca">
        <Form.Label>Buscar por nome ou documento</Form.Label>
        <Form.Control
          type="search"
          value={query}
          maxLength={150}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Digite o nome, CPF ou CNPJ"
        />
      </Form.Group>
      <Form.Group className="col-md-4" controlId="clientes-situacao">
        <Form.Label>Situação</Form.Label>
        <Form.Select
          value={situation}
          onChange={(event) => onSituationChange(event.target.value)}
        >
          <option value="ATIVO">Ativos</option>
          <option value="INATIVO">Inativos</option>
          <option value="TODOS">Todos</option>
        </Form.Select>
      </Form.Group>
    </div>
  );
}
