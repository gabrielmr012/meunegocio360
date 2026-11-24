package br.com.meunegocio360.core.shared.config;

import br.com.meunegocio360.core.auth.domain.Perfil;
import br.com.meunegocio360.core.auth.domain.Usuario;
import br.com.meunegocio360.core.auth.domain.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@Profile("dev")
public class DevSeedConfig implements ApplicationRunner {

  private static final Logger log = LoggerFactory.getLogger(DevSeedConfig.class);

  private final UsuarioRepository usuarioRepository;
  private final PasswordEncoder passwordEncoder;
  private final String adminSenha;
  private final String comercialSenha;
  private final String financeiroSenha;

  public DevSeedConfig(
      UsuarioRepository usuarioRepository,
      PasswordEncoder passwordEncoder,
      @Value("${SEED_ADMIN_SENHA:}") String adminSenha,
      @Value("${SEED_USUARIO_SENHA:}") String comercialSenha,
      @Value("${SEED_FINANCEIRO_SENHA:}") String financeiroSenha) {
    this.usuarioRepository = usuarioRepository;
    this.passwordEncoder = passwordEncoder;
    this.adminSenha = adminSenha;
    this.comercialSenha = comercialSenha;
    this.financeiroSenha = financeiroSenha;
  }

  @Override
  public void run(ApplicationArguments args) {
    if (adminSenha == null || adminSenha.isBlank()) {
      log.warn("A senha de seed ADMIN não foi configurada. Seed não será executado.");
      return;
    }
    if (comercialSenha == null || comercialSenha.isBlank()) {
      log.warn("A senha de seed OPERADOR_COMERCIAL não foi configurada. Seed não será executado.");
      return;
    }
    if (financeiroSenha == null || financeiroSenha.isBlank()) {
      log.warn("A senha de seed OPERADOR_FINANCEIRO não foi configurada. Seed não será executado.");
      return;
    }

    if (usuarioRepository.findByEmailIgnoreCase("admin@meunegocio360.com.br").isEmpty()) {
      Usuario admin =
          new Usuario(
              "Administrador",
              "admin@meunegocio360.com.br",
              passwordEncoder.encode(adminSenha),
              Perfil.ADMIN);
      usuarioRepository.save(admin);
      log.info("Usuário de desenvolvimento ADMIN criado.");
    }

    if (usuarioRepository.findByEmailIgnoreCase("comercial@meunegocio360.com.br").isEmpty()) {
      Usuario comercial =
          new Usuario(
              "Operador Comercial",
              "comercial@meunegocio360.com.br",
              passwordEncoder.encode(comercialSenha),
              Perfil.OPERADOR_COMERCIAL);
      usuarioRepository.save(comercial);
      log.info("Usuário de desenvolvimento OPERADOR_COMERCIAL criado.");
    }

    if (usuarioRepository.findByEmailIgnoreCase("financeiro@meunegocio360.com.br").isEmpty()) {
      Usuario financeiro =
          new Usuario(
              "Operador Financeiro",
              "financeiro@meunegocio360.com.br",
              passwordEncoder.encode(financeiroSenha),
              Perfil.OPERADOR_FINANCEIRO);
      usuarioRepository.save(financeiro);
      log.info("Usuário de desenvolvimento OPERADOR_FINANCEIRO criado.");
    }
  }
}
