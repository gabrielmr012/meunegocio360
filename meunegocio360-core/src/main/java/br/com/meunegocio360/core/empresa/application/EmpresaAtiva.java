package br.com.meunegocio360.core.empresa.application;

import br.com.meunegocio360.core.empresa.domain.Empresa;
import br.com.meunegocio360.core.empresa.domain.EmpresaRepository;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class EmpresaAtiva {

  private final EmpresaRepository empresaRepository;

  public EmpresaAtiva(EmpresaRepository empresaRepository) {
    this.empresaRepository = empresaRepository;
  }

  public Empresa resolver() {
    return empresaRepository
        .findByAtivaTrue()
        .orElseThrow(EmpresaService.CompanyNotActiveException::new);
  }

  public UUID resolverId() {
    return resolver().getId();
  }
}
