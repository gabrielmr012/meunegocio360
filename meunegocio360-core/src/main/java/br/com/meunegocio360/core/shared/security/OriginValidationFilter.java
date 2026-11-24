package br.com.meunegocio360.core.shared.security;

import br.com.meunegocio360.core.shared.exception.GlobalExceptionHandler;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.filter.OncePerRequestFilter;

public class OriginValidationFilter extends OncePerRequestFilter {

  private final List<String> allowedOrigins;
  private final GlobalExceptionHandler exceptionHandler;

  public OriginValidationFilter(
      List<String> allowedOrigins, GlobalExceptionHandler exceptionHandler) {
    this.allowedOrigins = allowedOrigins;
    this.exceptionHandler = exceptionHandler;
  }

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    String origin = request.getHeader("Origin");
    boolean refreshOrLogout =
        "POST".equals(request.getMethod())
            && ("/api/v1/auth/refresh".equals(request.getRequestURI())
                || "/api/v1/auth/logout".equals(request.getRequestURI()));
    return !refreshOrLogout
        || origin == null
        || origin.isBlank()
        || allowedOrigins.contains(origin);
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain chain)
      throws ServletException, IOException {
    response.setStatus(HttpStatus.FORBIDDEN.value());
    response.setContentType("application/problem+json");
    response.setCharacterEncoding(StandardCharsets.UTF_8.name());
    response.getWriter().write(exceptionHandler.buildForbiddenOrigin(request));
  }
}
