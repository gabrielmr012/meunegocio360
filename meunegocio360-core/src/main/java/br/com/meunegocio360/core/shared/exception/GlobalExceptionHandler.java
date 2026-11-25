package br.com.meunegocio360.core.shared.exception;

import br.com.meunegocio360.core.auth.application.AuthService.AccountLockedException;
import br.com.meunegocio360.core.auth.application.AuthService.InvalidCredentialsException;
import br.com.meunegocio360.core.auth.application.AuthService.InvalidRefreshTokenException;
import br.com.meunegocio360.core.cliente.application.ClienteService;
import br.com.meunegocio360.core.empresa.application.EmpresaService;
import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

@RestControllerAdvice
public class GlobalExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
  private static final String COOKIE_NAME = "mn360_refresh";
  private final boolean cookieSecure;

  public GlobalExceptionHandler(@Value("${app.auth.cookie.secure}") boolean cookieSecure) {
    this.cookieSecure = cookieSecure;
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ProblemDetail> handleValidation(
      MethodArgumentNotValidException ex, WebRequest request) {
    List<FieldErrorBean> errors =
        ex.getBindingResult().getFieldErrors().stream()
            .map(fe -> new FieldErrorBean(fe.getField(), fe.getDefaultMessage()))
            .toList();

    ProblemDetail problem =
        createProblem(
            HttpStatus.BAD_REQUEST,
            "https://meunegocio360.com.br/problemas/validacao",
            "Dados inválidos",
            "Um ou mais campos são inválidos.",
            request,
            "VALIDATION_ERROR");
    problem.setProperty("errors", errors);
    return ResponseEntity.badRequest().body(problem);
  }

  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ResponseEntity<ProblemDetail> handleMalformedJson(
      HttpMessageNotReadableException ex, WebRequest request) {
    ProblemDetail problem =
        createProblem(
            HttpStatus.BAD_REQUEST,
            "https://meunegocio360.com.br/problemas/validacao",
            "Dados inválidos",
            "JSON malformado ou tipo incompatível.",
            request,
            "VALIDATION_ERROR");
    return ResponseEntity.badRequest().body(problem);
  }

  @ExceptionHandler(InvalidCredentialsException.class)
  public ResponseEntity<ProblemDetail> handleInvalidCredentials(
      InvalidCredentialsException ex, WebRequest request) {
    ProblemDetail problem =
        createProblem(
            HttpStatus.UNAUTHORIZED,
            "https://meunegocio360.com.br/problemas/credenciais-invalidas",
            "Credenciais inválidas",
            "E-mail ou senha inválidos.",
            request,
            "INVALID_CREDENTIALS");
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(problem);
  }

  @ExceptionHandler(InvalidRefreshTokenException.class)
  public ResponseEntity<ProblemDetail> handleInvalidRefreshToken(
      InvalidRefreshTokenException ex, WebRequest request) {
    ProblemDetail problem =
        createProblem(
            HttpStatus.UNAUTHORIZED,
            "https://meunegocio360.com.br/problemas/refresh-token-invalido",
            "Refresh token inválido",
            "Refresh token inválido, expirado ou revogado.",
            request,
            "INVALID_REFRESH_TOKEN");

    String expiredCookie =
        org.springframework.http.ResponseCookie.from(COOKIE_NAME, "")
            .httpOnly(true)
            .secure(cookieSecure)
            .sameSite("Strict")
            .path("/api/v1/auth")
            .maxAge(0)
            .build()
            .toString();
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
        .header(HttpHeaders.SET_COOKIE, expiredCookie)
        .body(problem);
  }

  @ExceptionHandler(BadCredentialsException.class)
  public ResponseEntity<ProblemDetail> handleBadCredentials(
      BadCredentialsException ex, WebRequest request) {
    ProblemDetail problem =
        createProblem(
            HttpStatus.UNAUTHORIZED,
            "https://meunegocio360.com.br/problemas/nao-autorizado",
            "Não autenticado",
            "Token de acesso ausente, inválido ou expirado.",
            request,
            "UNAUTHORIZED");
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
        .header(HttpHeaders.WWW_AUTHENTICATE, "Bearer")
        .body(problem);
  }

  @ExceptionHandler(AccountLockedException.class)
  public ResponseEntity<ProblemDetail> handleAccountLocked(
      AccountLockedException ex, WebRequest request) {
    long retryAfter =
        Math.max(0, Duration.between(Instant.now(), ex.getBloqueadoAte()).getSeconds());

    ProblemDetail problem =
        createProblem(
            HttpStatus.TOO_MANY_REQUESTS,
            "https://meunegocio360.com.br/problemas/conta-bloqueada",
            "Conta temporariamente bloqueada",
            "Conta temporariamente bloqueada por tentativas excessivas.",
            request,
            "ACCOUNT_TEMPORARILY_LOCKED");
    return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
        .header(HttpHeaders.RETRY_AFTER, String.valueOf(retryAfter))
        .body(problem);
  }

  @ExceptionHandler(EmpresaService.CompanyNotRegisteredException.class)
  public ResponseEntity<ProblemDetail> handleCompanyNotRegistered(
      EmpresaService.CompanyNotRegisteredException ex, WebRequest request) {
    ProblemDetail problem =
        createProblem(
            HttpStatus.NOT_FOUND,
            "https://meunegocio360.com.br/problemas/empresa-nao-cadastrada",
            "Empresa não cadastrada",
            "Nenhuma empresa ativa está cadastrada.",
            request,
            "COMPANY_NOT_REGISTERED");
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(problem);
  }

  @ExceptionHandler(EmpresaService.CompanyCnpjDuplicateException.class)
  public ResponseEntity<ProblemDetail> handleCnpjDuplicate(
      EmpresaService.CompanyCnpjDuplicateException ex, WebRequest request) {
    ProblemDetail problem =
        createProblem(
            HttpStatus.CONFLICT,
            "https://meunegocio360.com.br/problemas/cnpj-duplicado",
            "CNPJ já cadastrado",
            "Já existe uma empresa cadastrada com este CNPJ.",
            request,
            "COMPANY_CNPJ_DUPLICATE");
    return ResponseEntity.status(HttpStatus.CONFLICT).body(problem);
  }

  @ExceptionHandler(EmpresaService.CompanyAlreadyActiveException.class)
  public ResponseEntity<ProblemDetail> handleCompanyAlreadyActive(
      EmpresaService.CompanyAlreadyActiveException ex, WebRequest request) {
    ProblemDetail problem =
        createProblem(
            HttpStatus.CONFLICT,
            "https://meunegocio360.com.br/problemas/empresa-ja-ativa",
            "Empresa já ativa",
            "Só pode existir uma empresa ativa.",
            request,
            "COMPANY_ALREADY_ACTIVE");
    return ResponseEntity.status(HttpStatus.CONFLICT).body(problem);
  }

  @ExceptionHandler(EmpresaService.VersionConflictException.class)
  public ResponseEntity<ProblemDetail> handleVersionConflict(
      EmpresaService.VersionConflictException ex, WebRequest request) {
    ProblemDetail problem =
        createProblem(
            HttpStatus.CONFLICT,
            "https://meunegocio360.com.br/problemas/versao-desatualizada",
            "Versão desatualizada",
            "A empresa foi alterada por outra operação.",
            request,
            "VERSION_CONFLICT");
    return ResponseEntity.status(HttpStatus.CONFLICT).body(problem);
  }

  @ExceptionHandler(EmpresaService.CompanyNotActiveException.class)
  public ResponseEntity<ProblemDetail> handleCompanyNotActive(
      EmpresaService.CompanyNotActiveException ex, WebRequest request) {
    ProblemDetail problem =
        createProblem(
            HttpStatus.UNPROCESSABLE_ENTITY,
            "https://meunegocio360.com.br/problemas/empresa-nao-ativa",
            "Empresa não ativa",
            "É necessário existir uma empresa ativa.",
            request,
            "COMPANY_NOT_ACTIVE");
    return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(problem);
  }

  @ExceptionHandler(EmpresaService.ValidationException.class)
  public ResponseEntity<ProblemDetail> handleCompanyValidation(
      EmpresaService.ValidationException ex, WebRequest request) {
    ProblemDetail problem =
        createProblem(
            HttpStatus.BAD_REQUEST,
            "https://meunegocio360.com.br/problemas/validacao",
            "Dados inválidos",
            "Um ou mais campos são inválidos.",
            request,
            "VALIDATION_ERROR");
    problem.setProperty("errors", List.of(new FieldErrorBean(ex.getField(), ex.getMessage())));
    return ResponseEntity.badRequest().body(problem);
  }

  @ExceptionHandler(ClienteService.ValidationException.class)
  public ResponseEntity<ProblemDetail> handleCustomerValidation(
      ClienteService.ValidationException ex, WebRequest request) {
    ProblemDetail problem =
        createProblem(
            HttpStatus.BAD_REQUEST,
            "https://meunegocio360.com.br/problemas/validacao",
            "Dados inválidos",
            "Um ou mais campos são inválidos.",
            request,
            "VALIDATION_ERROR");
    problem.setProperty("errors", List.of(new FieldErrorBean(ex.getField(), ex.getMessage())));
    return ResponseEntity.badRequest().body(problem);
  }

  @ExceptionHandler(ClienteService.CustomerDocumentDuplicateException.class)
  public ResponseEntity<ProblemDetail> handleCustomerDocumentDuplicate(
      ClienteService.CustomerDocumentDuplicateException ex, WebRequest request) {
    ProblemDetail problem =
        createProblem(
            HttpStatus.CONFLICT,
            "https://meunegocio360.com.br/problemas/documento-cliente-duplicado",
            "Documento já cadastrado",
            "Já existe um cliente com este documento nesta empresa; ele pode estar inativo.",
            request,
            "CUSTOMER_DOCUMENT_DUPLICATE");
    return ResponseEntity.status(HttpStatus.CONFLICT).body(problem);
  }

  @ExceptionHandler(ClienteService.CustomerNotFoundException.class)
  public ResponseEntity<ProblemDetail> handleCustomerNotFound(
      ClienteService.CustomerNotFoundException ex, WebRequest request) {
    ProblemDetail problem =
        createProblem(
            HttpStatus.NOT_FOUND,
            "https://meunegocio360.com.br/problemas/cliente-nao-encontrado",
            "Cliente não encontrado",
            "O cliente não existe na empresa ativa.",
            request,
            "CUSTOMER_NOT_FOUND");
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(problem);
  }

  @ExceptionHandler(ClienteService.CustomerHasHistoryException.class)
  public ResponseEntity<ProblemDetail> handleCustomerHasHistory(
      ClienteService.CustomerHasHistoryException ex, WebRequest request) {
    ProblemDetail problem =
        createProblem(
            HttpStatus.UNPROCESSABLE_ENTITY,
            "https://meunegocio360.com.br/problemas/cliente-com-historico",
            "Cliente com histórico",
            "O cliente possui vendas ou ordens de serviço vinculadas e não pode ser excluído. "
                + "Inative o cliente.",
            request,
            "CUSTOMER_HAS_HISTORY");
    return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(problem);
  }

  @ExceptionHandler(ClienteService.VersionConflictException.class)
  public ResponseEntity<ProblemDetail> handleCustomerVersionConflict(
      ClienteService.VersionConflictException ex, WebRequest request) {
    ProblemDetail problem =
        createProblem(
            HttpStatus.CONFLICT,
            "https://meunegocio360.com.br/problemas/versao-desatualizada",
            "Versão desatualizada",
            "O cliente foi alterado por outra operação.",
            request,
            "VERSION_CONFLICT");
    return ResponseEntity.status(HttpStatus.CONFLICT).body(problem);
  }

  @ExceptionHandler(AccessDeniedException.class)
  public ResponseEntity<ProblemDetail> handleAccessDenied(
      AccessDeniedException ex, WebRequest request) {
    ProblemDetail problem =
        createProblem(
            HttpStatus.FORBIDDEN,
            "https://meunegocio360.com.br/problemas/acesso-negado",
            "Acesso negado",
            "O perfil autenticado não possui permissão para esta operação.",
            request,
            "ACCESS_DENIED");
    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(problem);
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ProblemDetail> handleUnexpected(Exception ex, WebRequest request) {
    log.error("Erro interno inesperado. Tipo: {}", ex.getClass().getSimpleName());
    ProblemDetail problem =
        createProblem(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "https://meunegocio360.com.br/problemas/erro-interno",
            "Erro interno",
            "Ocorreu um erro inesperado.",
            request,
            "INTERNAL_ERROR");
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(problem);
  }

  public String buildUnauthorized(
      jakarta.servlet.http.HttpServletRequest request,
      org.springframework.security.core.AuthenticationException authException) {
    ProblemDetail problem =
        createProblem(
            HttpStatus.UNAUTHORIZED,
            "https://meunegocio360.com.br/problemas/nao-autorizado",
            "Não autenticado",
            "Token de acesso ausente, inválido ou expirado.",
            request,
            "UNAUTHORIZED");
    problem.setProperty("traceId", resolveTraceId());
    return toJson(problem);
  }

  public String buildForbiddenOrigin(jakarta.servlet.http.HttpServletRequest request) {
    ProblemDetail problem =
        createProblem(
            HttpStatus.FORBIDDEN,
            "https://meunegocio360.com.br/problemas/origem-nao-permitida",
            "Origem não permitida",
            "Origem não permitida.",
            request,
            "ORIGIN_NOT_ALLOWED");
    problem.setProperty("traceId", resolveTraceId());
    return toJson(problem);
  }

  public String buildAccessDenied(jakarta.servlet.http.HttpServletRequest request) {
    ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.FORBIDDEN);
    problem.setType(URI.create("https://meunegocio360.com.br/problemas/acesso-negado"));
    problem.setTitle("Acesso negado");
    problem.setDetail("O perfil autenticado não possui permissão para esta operação.");
    problem.setInstance(URI.create(request.getRequestURI()));
    problem.setProperty("code", "ACCESS_DENIED");
    problem.setProperty("traceId", resolveTraceId());
    return toJson(problem);
  }

  private ProblemDetail createProblem(
      HttpStatusCode status,
      String type,
      String title,
      String detail,
      WebRequest request,
      String code) {
    ProblemDetail problem = ProblemDetail.forStatus(status);
    problem.setType(URI.create(type));
    problem.setTitle(title);
    problem.setDetail(detail);
    problem.setInstance(URI.create(request.getDescription(false).replace("uri=", "")));
    problem.setProperty("code", code);
    problem.setProperty("traceId", resolveTraceId());
    return problem;
  }

  private ProblemDetail createProblem(
      HttpStatusCode status,
      String type,
      String title,
      String detail,
      jakarta.servlet.http.HttpServletRequest request,
      String code) {
    ProblemDetail problem = ProblemDetail.forStatus(status);
    problem.setType(URI.create(type));
    problem.setTitle(title);
    problem.setDetail(detail);
    problem.setInstance(URI.create(request.getRequestURI()));
    problem.setProperty("code", code);
    return problem;
  }

  private String resolveTraceId() {
    return Optional.ofNullable(MDC.get("traceId")).orElse("unknown");
  }

  private String toJson(ProblemDetail problem) {
    try {
      Map<String, Object> body = new LinkedHashMap<>();
      body.put("type", problem.getType().toString());
      body.put("title", problem.getTitle());
      body.put("status", problem.getStatus());
      body.put("detail", problem.getDetail());
      body.put("instance", problem.getInstance().toString());
      if (problem.getProperties() != null) {
        body.putAll(problem.getProperties());
      }
      return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(body);
    } catch (Exception e) {
      return "{\"title\":\"Erro interno\",\"status\":500}";
    }
  }

  private record FieldErrorBean(String field, String message) {}
}
