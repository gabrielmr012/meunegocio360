package br.com.meunegocio360.core.cliente.api;

import br.com.meunegocio360.core.cliente.application.ClienteService;
import br.com.meunegocio360.core.cliente.domain.Cliente;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/clientes")
@Tag(name = "Clientes", description = "Cadastro e consulta de clientes da empresa ativa")
@PreAuthorize("hasAnyRole('ADMIN', 'OPERADOR_COMERCIAL')")
public class ClienteController {

  private final ClienteService clienteService;

  public ClienteController(ClienteService clienteService) {
    this.clienteService = clienteService;
  }

  @GetMapping
  @Operation(
      summary = "Lista clientes",
      description =
          "Busca por nome (ignorando acentos e caixa) ou documento. A situação padrão é ATIVO; "
              + "a paginação aceita size entre 1 e 100.")
  public ResponseEntity<ClientePageResponse> listar(
      @RequestParam(required = false) String q,
      @RequestParam(defaultValue = "ATIVO") String situacao,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @RequestParam(defaultValue = "nome") String sort) {
    Page<Cliente> clientes = clienteService.listar(q, situacao, page, size, sort);
    return ResponseEntity.ok(
        new ClientePageResponse(
            clientes.getContent().stream().map(ClienteResponse::from).toList(),
            clientes.getNumber(),
            clientes.getSize(),
            clientes.getTotalElements(),
            clientes.getTotalPages()));
  }

  @PostMapping
  @Operation(summary = "Cadastra um cliente")
  public ResponseEntity<ClienteResponse> cadastrar(@Valid @RequestBody ClienteRequest request) {
    Cliente cliente = clienteService.cadastrar(request);
    return ResponseEntity.created(URI.create("/api/v1/clientes/" + cliente.getId()))
        .body(ClienteResponse.from(cliente));
  }

  @GetMapping("/{id}")
  @Operation(summary = "Consulta um cliente")
  public ResponseEntity<ClienteResponse> consultar(@PathVariable UUID id) {
    return ResponseEntity.ok(ClienteResponse.from(clienteService.consultar(id)));
  }

  @PutMapping("/{id}")
  @Operation(summary = "Atualiza todos os dados de um cliente")
  public ResponseEntity<ClienteResponse> atualizar(
      @PathVariable UUID id, @Valid @RequestBody ClienteUpdateRequest request) {
    return ResponseEntity.ok(ClienteResponse.from(clienteService.atualizar(id, request)));
  }

  @PatchMapping("/{id}/situacao")
  @Operation(summary = "Inativa ou reativa um cliente")
  public ResponseEntity<ClienteResponse> alterarSituacao(
      @PathVariable UUID id, @Valid @RequestBody ClienteSituacaoRequest request) {
    return ResponseEntity.ok(ClienteResponse.from(clienteService.alterarSituacao(id, request)));
  }

  @DeleteMapping("/{id}")
  @Operation(
      summary = "Exclui um cliente sem histórico",
      description =
          "A exclusão é recusada com CUSTOMER_HAS_HISTORY se qualquer verificador registrado "
              + "encontrar vínculos.")
  public ResponseEntity<Void> excluir(@PathVariable UUID id) {
    clienteService.excluir(id);
    return ResponseEntity.noContent().build();
  }
}
