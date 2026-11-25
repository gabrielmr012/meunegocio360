package br.com.meunegocio360.core.empresa.api;

import java.util.List;

public record EmpresaPageResponse(
    List<EmpresaResponse> content, int page, int size, long totalElements, int totalPages) {}
