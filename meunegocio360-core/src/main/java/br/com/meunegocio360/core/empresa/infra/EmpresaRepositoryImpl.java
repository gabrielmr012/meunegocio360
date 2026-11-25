package br.com.meunegocio360.core.empresa.infra;

import br.com.meunegocio360.core.empresa.domain.Empresa;
import br.com.meunegocio360.core.empresa.domain.EmpresaRepository;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

@Repository
class EmpresaRepositoryImpl implements EmpresaRepository {

  private final EmpresaJpaRepository jpaRepository;

  EmpresaRepositoryImpl(EmpresaJpaRepository jpaRepository) {
    this.jpaRepository = jpaRepository;
  }

  @Override
  public Optional<Empresa> findById(UUID id) {
    return jpaRepository.findById(id);
  }

  @Override
  public Optional<Empresa> findByAtivaTrue() {
    return jpaRepository.findByAtivaTrue();
  }

  @Override
  public Optional<Empresa> findByCnpj(String cnpj) {
    return jpaRepository.findByCnpj(cnpj);
  }

  @Override
  public Page<Empresa> findInativas(Pageable pageable) {
    return jpaRepository.findByAtivaFalse(pageable);
  }

  @Override
  public Empresa save(Empresa empresa) {
    return jpaRepository.saveAndFlush(empresa);
  }
}
