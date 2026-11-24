package br.com.meunegocio360.core.empresa.domain;

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
@Table(name = "empresa")
public class Empresa {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "razao_social", nullable = false, length = 150)
  private String razaoSocial;

  @Column(name = "nome_fantasia", length = 150)
  private String nomeFantasia;

  @Column(nullable = false, length = 14)
  private String cnpj;

  @Column(length = 160)
  private String email;

  @Column(length = 11)
  private String telefone;

  @Column(name = "fuso_horario", nullable = false, length = 50)
  private String fusoHorario = "America/Sao_Paulo";

  @Column(nullable = false, length = 3)
  private String moeda = "BRL";

  @Column(nullable = false)
  private boolean ativa = true;

  @Column(nullable = false)
  private Instant criadoEm;

  @Column(nullable = false)
  private Instant atualizadoEm;

  @Version
  @Column(nullable = false)
  private long versao;

  protected Empresa() {}

  public Empresa(
      String razaoSocial,
      String nomeFantasia,
      String cnpj,
      String email,
      String telefone,
      String fusoHorario,
      String moeda) {
    this.razaoSocial = razaoSocial;
    this.nomeFantasia = nomeFantasia;
    this.cnpj = cnpj;
    this.email = email;
    this.telefone = telefone;
    this.fusoHorario = fusoHorario;
    this.moeda = moeda;
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

  public String getRazaoSocial() {
    return razaoSocial;
  }

  public String getNomeFantasia() {
    return nomeFantasia;
  }

  public String getCnpj() {
    return cnpj;
  }

  public String getEmail() {
    return email;
  }

  public String getTelefone() {
    return telefone;
  }

  public String getFusoHorario() {
    return fusoHorario;
  }

  public String getMoeda() {
    return moeda;
  }

  public boolean isAtiva() {
    return ativa;
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
      String razaoSocial,
      String nomeFantasia,
      String cnpj,
      String email,
      String telefone,
      String fusoHorario,
      String moeda) {
    this.razaoSocial = razaoSocial;
    this.nomeFantasia = nomeFantasia;
    this.cnpj = cnpj;
    this.email = email;
    this.telefone = telefone;
    this.fusoHorario = fusoHorario;
    this.moeda = moeda;
  }

  public void alterarSituacao(boolean ativa) {
    this.ativa = ativa;
  }
}
