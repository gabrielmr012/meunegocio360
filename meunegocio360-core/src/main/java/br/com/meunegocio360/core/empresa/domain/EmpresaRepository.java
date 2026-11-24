package br.com.meunegocio360.core.empresa.domain;

import java.util.Optional;
import java.util.UUID;

public interface EmpresaRepository {
  Optional<Empresa> findById(UUID id);

  Optional<Empresa> findByAtivaTrue();

  Optional<Empresa> findByCnpj(String cnpj);

  Empresa save(Empresa empresa);
}
