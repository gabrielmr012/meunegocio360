package br.com.meunegocio360.core.auth.infra;

import br.com.meunegocio360.core.auth.domain.Usuario;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UsuarioJpaRepository extends JpaRepository<Usuario, UUID> {
  Optional<Usuario> findByEmailIgnoreCase(String email);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select u from Usuario u where lower(u.email) = lower(:email)")
  Optional<Usuario> findByEmailIgnoreCaseForUpdate(@Param("email") String email);
}
