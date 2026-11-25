package br.com.meunegocio360.core.cliente.api;

import br.com.meunegocio360.core.cliente.domain.TipoPessoa;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ClienteRequest(
    @NotNull TipoPessoa tipoPessoa,
    @NotBlank String nome,
    @NotBlank String documento,
    String email,
    String telefone) {}
