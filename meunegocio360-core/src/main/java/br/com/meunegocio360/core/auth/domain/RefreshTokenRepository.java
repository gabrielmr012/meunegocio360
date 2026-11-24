package br.com.meunegocio360.core.auth.domain;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository {
  Optional<RefreshToken> findByTokenHash(String tokenHash);

  Optional<RefreshToken> findByTokenHashForUpdate(String tokenHash);

  List<RefreshToken> findByFamiliaId(UUID familiaId);

  List<RefreshToken> findByFamiliaIdForUpdate(UUID familiaId);

  List<RefreshToken> findByUsuarioIdForUpdate(UUID usuarioId);

  RefreshToken save(RefreshToken refreshToken);

  void deleteAllByExpiraEmBefore(Instant dataLimite);

  void deleteAllByUsuarioId(UUID usuarioId);
}
