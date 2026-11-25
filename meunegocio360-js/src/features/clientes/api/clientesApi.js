import { apiClient } from '../../../shared/lib/http.js';

export function getClientes({ q = '', situacao = 'ATIVO', page = 0, size = 10 } = {}) {
  const params = new URLSearchParams({
    q,
    situacao,
    page: String(page),
    size: String(size),
    sort: 'nome',
  });
  return apiClient(`/clientes?${params.toString()}`);
}

export function getCliente(id) {
  return apiClient(`/clientes/${id}`);
}

export function cadastrarCliente(body) {
  return apiClient('/clientes', { method: 'POST', body });
}

export function atualizarCliente(id, body) {
  return apiClient(`/clientes/${id}`, { method: 'PUT', body });
}

export function alterarSituacaoCliente(id, body) {
  return apiClient(`/clientes/${id}/situacao`, { method: 'PATCH', body });
}

export function excluirCliente(id) {
  return apiClient(`/clientes/${id}`, { method: 'DELETE' });
}
