import { apiClient } from '../../../shared/lib/http.js';

export function getEmpresa() {
  return apiClient('/empresa');
}

export function getEmpresasInativas(page = 0, size = 10) {
  return apiClient(`/empresa/inativas?page=${page}&size=${size}`);
}

export function cadastrarEmpresa(body) {
  return apiClient('/empresa', { method: 'POST', body });
}

export function atualizarEmpresa(id, body) {
  return apiClient(`/empresa/${id}`, { method: 'PUT', body });
}

export function alterarSituacaoEmpresa(id, body) {
  return apiClient(`/empresa/${id}/situacao`, { method: 'PATCH', body });
}
