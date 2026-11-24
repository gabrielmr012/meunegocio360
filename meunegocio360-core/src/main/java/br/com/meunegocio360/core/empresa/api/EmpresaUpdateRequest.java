package br.com.meunegocio360.core.empresa.api;

import br.com.meunegocio360.core.shared.validation.Cnpj;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record EmpresaUpdateRequest(
    @NotBlank @Size(min = 3, max = 150) String razaoSocial,
    @Size(max = 150) String nomeFantasia,
    @NotBlank @Cnpj String cnpj,
    @Email @Size(max = 160) String email,
    @Pattern(regexp = "\\d{10}|\\d{11}", message = "telefone deve ter 10 ou 11 dígitos")
        String telefone,
    @Size(max = 50) String fusoHorario,
    @Pattern(regexp = "BRL", message = "moeda deve ser BRL") String moeda,
    @NotNull Long versao) {}
