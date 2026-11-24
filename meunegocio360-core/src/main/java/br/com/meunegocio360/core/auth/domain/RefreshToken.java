package br.com.meunegocio360.core.auth.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "refresh_token")
public class RefreshToken {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(nullable = false)
  private UUID usuarioId;

  @Column(nullable = false)
  private UUID familiaId;

  @Column(nullable = false, length = 64)
  private String tokenHash;

  @Column(nullable = false)
  private Instant expiraEm;

  private Instant revogadoEm;

  @Column(nullable = false)
  private Instant criadoEm;

  @Column(nullable = false)
  private Instant atualizadoEm;

  @Version
  @Column(nullable = false)
  private long versao;

  protected RefreshToken() {}

  public RefreshToken(UUID usuarioId, UUID familiaId, String tokenHash, Instant expiraEm) {
    this.usuarioId = usuarioId;
    this.familiaId = familiaId;
    this.tokenHash = tokenHash;
    this.expiraEm = expiraEm;
  }

  @PrePersist
  void prePersist() {
    this.criadoEm = Instant.now();
    this.atualizadoEm = this.criadoEm;
  }

  @PreUpdate
  void preUpdate() {
    this.atualizadoEm = Instant.now();
  }

  public void revogar(Instant agora) {
    this.revogadoEm = agora;
  }

  public boolean isExpirado(Instant agora) {
    return !agora.isBefore(expiraEm);
  }

  public boolean isRevogado() {
    return revogadoEm != null;
  }

  public UUID getId() {
    return id;
  }

  public UUID getUsuarioId() {
    return usuarioId;
  }

  public UUID getFamiliaId() {
    return familiaId;
  }

  public String getTokenHash() {
    return tokenHash;
  }

  public Instant getExpiraEm() {
    return expiraEm;
  }

  public Instant getRevogadoEm() {
    return revogadoEm;
  }

  public Instant getCriadoEm() {
    return criadoEm;
  }
}
