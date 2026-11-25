package br.com.meunegocio360.core.cliente.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.text.Normalizer;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

@Entity
@Table(name = "cliente")
public class Cliente {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "empresa_id", nullable = false)
  private UUID empresaId;

  @Column(name = "tipo_pessoa", nullable = false, length = 10)
  @Enumerated(EnumType.STRING)
  private TipoPessoa tipoPessoa;

  @Column(nullable = false, length = 150)
  private String nome;

  @Column(name = "nome_busca", nullable = false, length = 150)
  private String nomeBusca;

  @Column(nullable = false, length = 14)
  private String documento;

  @Column(length = 160)
  private String email;

  @Column(length = 11)
  private String telefone;

  @Column(nullable = false)
  private boolean ativo = true;

  @Column(name = "criado_em", nullable = false)
  private Instant criadoEm;

  @Column(name = "atualizado_em", nullable = false)
  private Instant atualizadoEm;

  @Version
  @Column(nullable = false)
  private long versao;

  protected Cliente() {}

  public Cliente(
      UUID empresaId,
      TipoPessoa tipoPessoa,
      String nome,
      String documento,
      String email,
      String telefone) {
    this.empresaId = empresaId;
    this.tipoPessoa = tipoPessoa;
    this.nome = nome;
    this.nomeBusca = normalizarNome(nome);
    this.documento = documento;
    this.email = email;
    this.telefone = telefone;
  }

  @PrePersist
  void prePersist() {
    Instant agora = Instant.now();
    criadoEm = agora;
    atualizadoEm = agora;
  }

  @PreUpdate
  void preUpdate() {
    atualizadoEm = Instant.now();
  }

  public UUID getId() {
    return id;
  }

  public UUID getEmpresaId() {
    return empresaId;
  }

  public TipoPessoa getTipoPessoa() {
    return tipoPessoa;
  }

  public String getNome() {
    return nome;
  }

  public String getNomeBusca() {
    return nomeBusca;
  }

  public String getDocumento() {
    return documento;
  }

  public String getEmail() {
    return email;
  }

  public String getTelefone() {
    return telefone;
  }

  public boolean isAtivo() {
    return ativo;
  }

  public Instant getCriadoEm() {
    return criadoEm;
  }

  public Instant getAtualizadoEm() {
    return atualizadoEm;
  }

  public long getVersao() {
    return versao;
  }

  public void atualizar(
      TipoPessoa tipoPessoa,
      String nome,
      String documento,
      String email,
      String telefone) {
    this.tipoPessoa = tipoPessoa;
    this.nome = nome;
    this.nomeBusca = normalizarNome(nome);
    this.documento = documento;
    this.email = email;
    this.telefone = telefone;
  }

  public void alterarSituacao(boolean ativo) {
    this.ativo = ativo;
  }

  private static String normalizarNome(String nome) {
    return Normalizer.normalize(nome, Normalizer.Form.NFD)
        .replaceAll("\\p{M}+", "")
        .toLowerCase(Locale.ROOT);
  }
}
