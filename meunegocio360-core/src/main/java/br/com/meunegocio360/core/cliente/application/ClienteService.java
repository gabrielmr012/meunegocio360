package br.com.meunegocio360.core.cliente.application;

import br.com.meunegocio360.core.cliente.api.ClienteRequest;
import br.com.meunegocio360.core.cliente.api.ClienteSituacaoRequest;
import br.com.meunegocio360.core.cliente.api.ClienteUpdateRequest;
import br.com.meunegocio360.core.cliente.domain.Cliente;
import br.com.meunegocio360.core.cliente.domain.ClienteRepository;
import br.com.meunegocio360.core.cliente.domain.TipoPessoa;
import br.com.meunegocio360.core.cliente.domain.VerificadorVinculoCliente;
import br.com.meunegocio360.core.empresa.application.EmpresaAtiva;
import br.com.meunegocio360.core.shared.validation.DocumentoValidator;
import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ClienteService {

  private static final Pattern EMAIL_PATTERN =
      Pattern.compile(
          "^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$");

  private final ClienteRepository clienteRepository;
  private final EmpresaAtiva empresaAtiva;
  private final List<VerificadorVinculoCliente> verificadoresVinculo;

  public ClienteService(
      ClienteRepository clienteRepository,
      EmpresaAtiva empresaAtiva,
      List<VerificadorVinculoCliente> verificadoresVinculo) {
    this.clienteRepository = clienteRepository;
    this.empresaAtiva = empresaAtiva;
    this.verificadoresVinculo = verificadoresVinculo;
  }

  @Transactional
  public Cliente cadastrar(ClienteRequest request) {
    UUID empresaId = empresaAtiva.resolverId();
    DadosCliente dados = validarDados(request.tipoPessoa(), request.nome(), request.documento(),
        request.email(), request.telefone());
    if (clienteRepository.findByEmpresaIdAndDocumento(empresaId, dados.documento()).isPresent()) {
      throw new CustomerDocumentDuplicateException();
    }

    return salvarTraduzindoIntegridade(
        new Cliente(
            empresaId,
            dados.tipoPessoa(),
            dados.nome(),
            dados.documento(),
            dados.email(),
            dados.telefone()));
  }

  public Page<Cliente> listar(String q, String situacao, int page, int size, String sort) {
    UUID empresaId = empresaAtiva.resolverId();
    if (page < 0) {
      throw new ValidationException("page", "deve ser maior ou igual a zero");
    }
    if (size < 1 || size > 100) {
      throw new ValidationException("size", "deve estar entre 1 e 100");
    }

    Boolean ativo = resolverSituacao(situacao);
    String busca = q == null ? null : q.trim();
    if (busca != null && busca.length() > 150) {
      throw new ValidationException("q", "deve conter no máximo 150 caracteres");
    }
    if (busca != null && busca.isEmpty()) {
      busca = null;
    }

    String documentoQuery = DocumentoValidator.somenteDigitos(busca);
    String nomeQuery =
        busca == null
            ? null
            : Normalizer.normalize(busca, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT);
    Sort pageableSort = resolverOrdenacao(sort);
    return clienteRepository.pesquisar(
        empresaId,
        ativo,
        nomeQuery,
        documentoQuery,
        PageRequest.of(page, size, pageableSort));
  }

  public Cliente consultar(UUID id) {
    UUID empresaId = empresaAtiva.resolverId();
    return buscarNaEmpresa(id, empresaId);
  }

  @Transactional
  public Cliente atualizar(UUID id, ClienteUpdateRequest request) {
    UUID empresaId = empresaAtiva.resolverId();
    Cliente cliente = buscarNaEmpresa(id, empresaId);
    validarVersao(cliente, request.versao());

    DadosCliente dados = validarDados(request.tipoPessoa(), request.nome(), request.documento(),
        request.email(), request.telefone());
    clienteRepository
        .findByEmpresaIdAndDocumento(empresaId, dados.documento())
        .filter(outro -> !outro.getId().equals(cliente.getId()))
        .ifPresent(ignored -> {
          throw new CustomerDocumentDuplicateException();
        });

    cliente.atualizar(
        dados.tipoPessoa(), dados.nome(), dados.documento(), dados.email(), dados.telefone());
    return salvarTraduzindoIntegridade(cliente);
  }

  @Transactional
  public Cliente alterarSituacao(UUID id, ClienteSituacaoRequest request) {
    UUID empresaId = empresaAtiva.resolverId();
    Cliente cliente = buscarNaEmpresa(id, empresaId);
    validarVersao(cliente, request.versao());
    cliente.alterarSituacao(request.ativo());
    return salvarTraduzindoIntegridade(cliente);
  }

  @Transactional
  public void excluir(UUID id) {
    UUID empresaId = empresaAtiva.resolverId();
    Cliente cliente = buscarNaEmpresa(id, empresaId);
    if (verificadoresVinculo.stream().anyMatch(verificador -> verificador.possuiVinculo(id))) {
      throw new CustomerHasHistoryException();
    }
    clienteRepository.delete(cliente);
  }

  private Cliente buscarNaEmpresa(UUID id, UUID empresaId) {
    return clienteRepository
        .findByIdAndEmpresaId(id, empresaId)
        .orElseThrow(CustomerNotFoundException::new);
  }

  private void validarVersao(Cliente cliente, Long versao) {
    if (versao == null || versao != cliente.getVersao()) {
      throw new VersionConflictException();
    }
  }

  private DadosCliente validarDados(
      TipoPessoa tipoPessoa, String nome, String documento, String email, String telefone) {
    if (tipoPessoa == null) {
      throw new ValidationException("tipoPessoa", "é obrigatório");
    }

    String nomeNormalizado = trim(nome);
    if (nomeNormalizado == null || nomeNormalizado.length() < 2 || nomeNormalizado.length() > 150) {
      throw new ValidationException("nome", "deve conter de 2 a 150 caracteres");
    }

    String documentoNormalizado = normalizarDocumento(documento, tipoPessoa);
    String emailNormalizado = nullIfBlank(email);
    if (emailNormalizado != null
        && (emailNormalizado.length() > 160 || !EMAIL_PATTERN.matcher(emailNormalizado).matches())) {
      throw new ValidationException("email", "deve ser um e-mail válido com até 160 caracteres");
    }

    String telefoneNormalizado = nullIfBlank(telefone);
    if (telefoneNormalizado != null && !telefoneNormalizado.matches("\\d{10}|\\d{11}")) {
      throw new ValidationException("telefone", "deve ter 10 ou 11 dígitos");
    }

    return new DadosCliente(
        tipoPessoa, nomeNormalizado, documentoNormalizado, emailNormalizado, telefoneNormalizado);
  }

  private String normalizarDocumento(String documento, TipoPessoa tipoPessoa) {
    String valor = trim(documento);
    if (valor == null || !valor.matches("[0-9./\\s-]+")) {
      throw new ValidationException("documento", "deve conter um CPF ou CNPJ válido");
    }

    String digitos = DocumentoValidator.somenteDigitos(valor);
    boolean valido =
        tipoPessoa == TipoPessoa.FISICA
            ? DocumentoValidator.cpfValido(digitos)
            : DocumentoValidator.cnpjValido(digitos);
    if (!valido) {
      throw new ValidationException(
          "documento",
          tipoPessoa == TipoPessoa.FISICA ? "CPF inválido" : "CNPJ inválido");
    }
    return digitos;
  }

  private Boolean resolverSituacao(String situacao) {
    String valor = situacao == null ? "ATIVO" : situacao.trim().toUpperCase(Locale.ROOT);
    return switch (valor) {
      case "ATIVO" -> true;
      case "INATIVO" -> false;
      case "TODOS" -> null;
      default ->
          throw new ValidationException("situacao", "deve ser ATIVO, INATIVO ou TODOS");
    };
  }

  private Sort resolverOrdenacao(String sort) {
    String[] partes = sort == null ? new String[0] : sort.trim().split(",");
    if (partes.length < 1 || partes.length > 2) {
      throw new ValidationException("sort", "deve ser nome ou criadoEm, opcionalmente com direção");
    }

    String campo = partes[0].trim();
    if (!campo.equals("nome") && !campo.equals("criadoEm")) {
      throw new ValidationException("sort", "deve ser nome ou criadoEm");
    }

    Sort.Direction direcao = Sort.Direction.ASC;
    if (partes.length == 2) {
      try {
        direcao = Sort.Direction.fromString(partes[1].trim());
      } catch (IllegalArgumentException ex) {
        throw new ValidationException("sort", "direção deve ser asc ou desc");
      }
    }
    return Sort.by(direcao, campo);
  }

  private Cliente salvarTraduzindoIntegridade(Cliente cliente) {
    try {
      return clienteRepository.save(cliente);
    } catch (ObjectOptimisticLockingFailureException ex) {
      throw new VersionConflictException();
    } catch (DataIntegrityViolationException ex) {
      String texto = ex.getMostSpecificCause().getMessage();
      if (texto != null && texto.contains("uk_cliente_empresa_documento")) {
        throw new CustomerDocumentDuplicateException();
      }
      throw ex;
    }
  }

  private String trim(String value) {
    return value == null ? null : value.trim();
  }

  private String nullIfBlank(String value) {
    String trimmed = trim(value);
    return trimmed == null || trimmed.isEmpty() ? null : trimmed;
  }

  private record DadosCliente(
      TipoPessoa tipoPessoa, String nome, String documento, String email, String telefone) {}

  public static class CustomerDocumentDuplicateException extends RuntimeException {}

  public static class CustomerNotFoundException extends RuntimeException {}

  public static class CustomerHasHistoryException extends RuntimeException {}

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
