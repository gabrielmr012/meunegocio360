package br.com.meunegocio360.core.cliente.api;

import br.com.meunegocio360.core.cliente.domain.TipoPessoa;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record ClienteUpdateRequest(
    @NotNull TipoPessoa tipoPessoa,
    @NotBlank String nome,
    @NotBlank String documento,
    String email,
    String telefone,
    @NotNull @PositiveOrZero Long versao) {}
