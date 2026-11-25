package br.com.meunegocio360.core.cliente.api;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record ClienteSituacaoRequest(
    @NotNull Boolean ativo, @NotNull @PositiveOrZero Long versao) {}
