package br.com.meunegocio360.core.empresa.application;

import br.com.meunegocio360.core.empresa.api.EmpresaRequest;
import br.com.meunegocio360.core.empresa.api.EmpresaSituacaoRequest;
import br.com.meunegocio360.core.empresa.api.EmpresaUpdateRequest;
import br.com.meunegocio360.core.empresa.domain.Empresa;
import br.com.meunegocio360.core.empresa.domain.EmpresaRepository;
import java.time.DateTimeException;
import java.time.ZoneId;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class EmpresaService {

  private final EmpresaRepository empresaRepository;

  public EmpresaService(EmpresaRepository empresaRepository) {
    this.empresaRepository = empresaRepository;
  }

  public Empresa consultar() {
    return empresaRepository.findByAtivaTrue().orElseThrow(CompanyNotRegisteredException::new);
  }

  @Transactional
  public Empresa cadastrar(EmpresaRequest request) {
    if (empresaRepository.findByAtivaTrue().isPresent()) {
      throw new CompanyAlreadyActiveException();
    }
    if (empresaRepository.findByCnpj(request.cnpj()).isPresent()) {
      throw new CompanyCnpjDuplicateException();
    }

    Empresa empresa =
        new Empresa(
            trim(request.razaoSocial()),
            nullIfBlank(request.nomeFantasia()),
            request.cnpj(),
            nullIfBlank(request.email()),
            nullIfBlank(request.telefone()),
            validarTimezone(request.fusoHorario()),
            request.moeda() == null ? "BRL" : request.moeda());
    return salvarTraduzindoIntegridade(empresa);
  }

  @Transactional
  public Empresa atualizar(UUID id, EmpresaUpdateRequest request) {
    Empresa empresa =
        empresaRepository.findById(id).orElseThrow(CompanyNotRegisteredException::new);
    if (request.versao() != empresa.getVersao()) {
      throw new VersionConflictException();
    }
    if (!request.cnpj().equals(empresa.getCnpj())
        && empresaRepository.findByCnpj(request.cnpj()).isPresent()) {
      throw new CompanyCnpjDuplicateException();
    }

    empresa.atualizar(
        trim(request.razaoSocial()),
        nullIfBlank(request.nomeFantasia()),
        request.cnpj(),
        nullIfBlank(request.email()),
        nullIfBlank(request.telefone()),
        validarTimezone(request.fusoHorario()),
        request.moeda() == null ? "BRL" : request.moeda());
    return salvarTraduzindoIntegridade(empresa);
  }

  @Transactional
  public Empresa alterarSituacao(UUID id, EmpresaSituacaoRequest request) {
    Empresa empresa =
        empresaRepository.findById(id).orElseThrow(CompanyNotRegisteredException::new);
    if (request.versao() != empresa.getVersao()) {
      throw new VersionConflictException();
    }
    if (request.ativa() && !empresa.isAtiva()) {
      if (empresaRepository.findByAtivaTrue().isPresent()) {
        throw new CompanyAlreadyActiveException();
      }
    }
    empresa.alterarSituacao(request.ativa());
    return salvarTraduzindoIntegridade(empresa);
  }

  private Empresa salvarTraduzindoIntegridade(Empresa empresa) {
    try {
      return empresaRepository.save(empresa);
    } catch (ObjectOptimisticLockingFailureException ex) {
      throw new VersionConflictException();
    } catch (DataIntegrityViolationException ex) {
      String texto = ex.getMostSpecificCause().getMessage();
      if (texto != null && texto.contains("uk_empresa_ativa_unica")) {
        throw new CompanyAlreadyActiveException();
      }
      if (texto != null && texto.contains("uk_empresa_cnpj")) {
        throw new CompanyCnpjDuplicateException();
      }
      throw ex;
    }
  }

  private String trim(String value) {
    return value == null ? null : value.trim();
  }

  private String nullIfBlank(String value) {
    if (value == null) {
      return null;
    }
    String trimmed = value.trim();
    return trimmed.isEmpty() ? null : trimmed;
  }

  private String validarTimezone(String value) {
    String timezone = value == null || value.isBlank() ? "America/Sao_Paulo" : value.trim();
    try {
      ZoneId.of(timezone);
    } catch (DateTimeException ex) {
      throw new ValidationException("fusoHorario", "fuso horário IANA inválido");
    }
    return timezone;
  }

  public static class CompanyNotRegisteredException extends RuntimeException {}

  public static class CompanyCnpjDuplicateException extends RuntimeException {}

  public static class CompanyAlreadyActiveException extends RuntimeException {}

  public static class CompanyNotActiveException extends RuntimeException {}

  public static class VersionConflictException extends RuntimeException {}

  public static class ValidationException extends RuntimeException {
    private final String field;

    public ValidationException(String field, String message) {
      super(message);
      this.field = field;
    }

    public String getField() {
      return field;
    }
  }
}
