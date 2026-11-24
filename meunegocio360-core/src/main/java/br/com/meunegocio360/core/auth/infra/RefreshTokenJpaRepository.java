package br.com.meunegocio360.core.auth.infra;

import br.com.meunegocio360.core.auth.domain.RefreshToken;
import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RefreshTokenJpaRepository extends JpaRepository<RefreshToken, UUID> {

  Optional<RefreshToken> findByTokenHash(String tokenHash);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select r from RefreshToken r where r.tokenHash = :tokenHash")
  Optional<RefreshToken> findByTokenHashForUpdate(@Param("tokenHash") String tokenHash);

  List<RefreshToken> findByFamiliaId(UUID familiaId);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select r from RefreshToken r where r.familiaId = :familiaId order by r.id")
  List<RefreshToken> findByFamiliaIdForUpdate(@Param("familiaId") UUID familiaId);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select r from RefreshToken r where r.usuarioId = :usuarioId order by r.id")
  List<RefreshToken> findByUsuarioIdForUpdate(@Param("usuarioId") UUID usuarioId);

  @Modifying
  @Query(
      "delete from RefreshToken r "
          + "where r.expiraEm < :dataLimite or r.revogadoEm < :dataLimite")
  void deleteAllByExpiraEmBefore(@Param("dataLimite") Instant dataLimite);

  @Modifying
  @Query("delete from RefreshToken r where r.usuarioId = :usuarioId")
  void deleteAllByUsuarioId(@Param("usuarioId") UUID usuarioId);
}
