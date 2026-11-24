package br.com.meunegocio360.core.empresa.api;

import br.com.meunegocio360.core.empresa.application.EmpresaService;
import br.com.meunegocio360.core.empresa.domain.Empresa;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/empresa")
public class EmpresaController {

  private final EmpresaService empresaService;

  public EmpresaController(EmpresaService empresaService) {
    this.empresaService = empresaService;
  }

  @GetMapping
  @Operation(summary = "Consulta a empresa ativa")
  public ResponseEntity<EmpresaResponse> consultar() {
    Empresa empresa = empresaService.consultar();
    return ResponseEntity.ok(EmpresaResponse.from(empresa));
  }

  @PostMapping
  @PreAuthorize("hasRole('ADMIN')")
  @Operation(summary = "Cadastra a empresa ativa")
  public ResponseEntity<EmpresaResponse> cadastrar(@Valid @RequestBody EmpresaRequest request) {
    Empresa empresa = empresaService.cadastrar(request);
    EmpresaResponse response = EmpresaResponse.from(empresa);
    return ResponseEntity.created(URI.create("/api/v1/empresa/" + empresa.getId())).body(response);
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  @Operation(summary = "Edita a empresa")
  public ResponseEntity<EmpresaResponse> atualizar(
      @PathVariable UUID id, @Valid @RequestBody EmpresaUpdateRequest request) {
    return ResponseEntity.ok(EmpresaResponse.from(empresaService.atualizar(id, request)));
  }

  @PatchMapping("/{id}/situacao")
  @PreAuthorize("hasRole('ADMIN')")
  @Operation(summary = "Inativa ou reativa a empresa")
  public ResponseEntity<EmpresaResponse> alterarSituacao(
      @PathVariable UUID id, @Valid @RequestBody EmpresaSituacaoRequest request) {
    return ResponseEntity.ok(EmpresaResponse.from(empresaService.alterarSituacao(id, request)));
  }
}
