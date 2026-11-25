package br.com.meunegocio360.core.cliente.domain;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ClienteRepository {
  Optional<Cliente> findByIdAndEmpresaId(UUID id, UUID empresaId);

  Optional<Cliente> findByEmpresaIdAndDocumento(UUID empresaId, String documento);

  Page<Cliente> pesquisar(
      UUID empresaId, Boolean ativo, String nomeQuery, String documentoQuery, Pageable pageable);

  Cliente save(Cliente cliente);

  void delete(Cliente cliente);
}
