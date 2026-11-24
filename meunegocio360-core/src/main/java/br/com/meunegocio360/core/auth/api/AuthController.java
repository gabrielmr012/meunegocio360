package br.com.meunegocio360.core.auth.api;

import br.com.meunegocio360.core.application.AuthenticatedUser;
import br.com.meunegocio360.core.auth.application.AuthService;
import jakarta.validation.Valid;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

  private static final String COOKIE_NAME = "mn360_refresh";

  private final AuthService authService;
  private final int refreshExpiracaoDias;
  private final boolean cookieSecure;

  public AuthController(
      AuthService authService,
      @Value("${app.auth.refresh.expiracao-dias}") int refreshExpiracaoDias,
      @Value("${app.auth.cookie.secure}") boolean cookieSecure) {
    this.authService = authService;
    this.refreshExpiracaoDias = refreshExpiracaoDias;
    this.cookieSecure = cookieSecure;
  }

  @PostMapping("/login")
  public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
    AuthService.LoginResult result = authService.login(request.email(), request.senha());
    return ResponseEntity.ok()
        .header(HttpHeaders.SET_COOKIE, criarCookieRefresh(result.refreshTokenValue()))
        .body(LoginResponse.from(result));
  }

  @PostMapping("/refresh")
  public ResponseEntity<LoginResponse> refresh(
      @CookieValue(name = COOKIE_NAME, required = false) String refreshToken) {
    AuthService.RefreshResult result = authService.refresh(refreshToken);
    return ResponseEntity.ok()
        .header(HttpHeaders.SET_COOKIE, criarCookieRefresh(result.refreshTokenValue()))
        .body(LoginResponse.from(result));
  }

  @PostMapping("/logout")
  public ResponseEntity<Void> logout(
      @CookieValue(name = COOKIE_NAME, required = false) String refreshToken) {
    authService.logout(refreshToken);
    return ResponseEntity.noContent()
        .header(HttpHeaders.SET_COOKIE, expirarCookieRefresh())
        .build();
  }

  @GetMapping("/me")
  public ResponseEntity<UsuarioResponse> me(AuthenticatedUser authenticatedUser) {
    var data = authService.me(authenticatedUser.usuarioId());
    return ResponseEntity.ok(UsuarioResponse.from(data));
  }

  private String criarCookieRefresh(String value) {
    return ResponseCookie.from(COOKIE_NAME, value)
        .httpOnly(true)
        .secure(cookieSecure)
        .sameSite("Strict")
        .path("/api/v1/auth")
        .maxAge(Duration.ofDays(refreshExpiracaoDias))
        .build()
        .toString();
  }

  private String expirarCookieRefresh() {
    return ResponseCookie.from(COOKIE_NAME, "")
        .httpOnly(true)
        .secure(cookieSecure)
        .sameSite("Strict")
        .path("/api/v1/auth")
        .maxAge(0)
        .build()
        .toString();
  }
}
