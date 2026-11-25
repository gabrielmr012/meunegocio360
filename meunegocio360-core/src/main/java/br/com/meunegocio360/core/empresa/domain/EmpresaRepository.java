package br.com.meunegocio360.core.empresa.domain;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface EmpresaRepository {
  Optional<Empresa> findById(UUID id);

  Optional<Empresa> findByAtivaTrue();

  Optional<Empresa> findByCnpj(String cnpj);

  Page<Empresa> findInativas(Pageable pageable);

  Empresa save(Empresa empresa);
}
