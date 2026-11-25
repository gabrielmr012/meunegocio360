package br.com.meunegocio360.core.cliente.infra;

import br.com.meunegocio360.core.cliente.domain.Cliente;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface ClienteJpaRepository extends JpaRepository<Cliente, UUID> {

  Optional<Cliente> findByIdAndEmpresaId(UUID id, UUID empresaId);

  Optional<Cliente> findByEmpresaIdAndDocumento(UUID empresaId, String documento);

  @Query(
      value =
          """
          select c from Cliente c
          where c.empresaId = :empresaId
            and (:ativo is null or c.ativo = :ativo)
            and (
              :nomeQuery is null
              or c.nomeBusca like concat('%', :nomeQuery, '%')
              or (:documentoQuery <> '' and c.documento like concat('%', :documentoQuery, '%'))
            )
          """,
      countQuery =
          """
          select count(c) from Cliente c
          where c.empresaId = :empresaId
            and (:ativo is null or c.ativo = :ativo)
            and (
              :nomeQuery is null
              or c.nomeBusca like concat('%', :nomeQuery, '%')
              or (:documentoQuery <> '' and c.documento like concat('%', :documentoQuery, '%'))
            )
          """)
  Page<Cliente> pesquisar(
      @Param("empresaId") UUID empresaId,
      @Param("ativo") Boolean ativo,
      @Param("nomeQuery") String nomeQuery,
      @Param("documentoQuery") String documentoQuery,
      Pageable pageable);
}
