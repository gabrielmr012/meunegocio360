package br.com.meunegocio360.core.cliente.api;

import java.util.List;

public record ClientePageResponse(
    List<ClienteResponse> content, int page, int size, long totalElements, int totalPages) {}
