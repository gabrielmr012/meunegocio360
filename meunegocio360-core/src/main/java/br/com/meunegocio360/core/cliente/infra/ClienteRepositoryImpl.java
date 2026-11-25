package br.com.meunegocio360.core.cliente.infra;

import br.com.meunegocio360.core.cliente.domain.Cliente;
import br.com.meunegocio360.core.cliente.domain.ClienteRepository;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

@Repository
class ClienteRepositoryImpl implements ClienteRepository {

  private final ClienteJpaRepository jpaRepository;

  ClienteRepositoryImpl(ClienteJpaRepository jpaRepository) {
    this.jpaRepository = jpaRepository;
  }

  @Override
  public Optional<Cliente> findByIdAndEmpresaId(UUID id, UUID empresaId) {
    return jpaRepository.findByIdAndEmpresaId(id, empresaId);
  }

  @Override
  public Optional<Cliente> findByEmpresaIdAndDocumento(UUID empresaId, String documento) {
    return jpaRepository.findByEmpresaIdAndDocumento(empresaId, documento);
  }

  @Override
  public Page<Cliente> pesquisar(
      UUID empresaId, Boolean ativo, String nomeQuery, String documentoQuery, Pageable pageable) {
    return jpaRepository.pesquisar(empresaId, ativo, nomeQuery, documentoQuery, pageable);
  }

  @Override
  public Cliente save(Cliente cliente) {
    return jpaRepository.saveAndFlush(cliente);
  }

  @Override
  public void delete(Cliente cliente) {
    jpaRepository.delete(cliente);
    jpaRepository.flush();
  }
}
