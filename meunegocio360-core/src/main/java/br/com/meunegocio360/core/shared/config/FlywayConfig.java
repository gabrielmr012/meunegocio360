package br.com.meunegocio360.core.shared.config;

import javax.sql.DataSource;
import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Força a inicialização do Flyway antes do EntityManagerFactory (JPA). Sem isso, o Spring Boot 4.x
 * pode não executar as migrations automaticamente.
 */
@Configuration
public class FlywayConfig {

  @Bean
  static BeanFactoryPostProcessor flywayBeforeEntityManagerFactory() {
    return beanFactory -> {
      String entityManagerFactory = "entityManagerFactory";
      if (beanFactory.containsBeanDefinition(entityManagerFactory)) {
        var beanDefinition = beanFactory.getBeanDefinition(entityManagerFactory);
        String[] currentDependencies = beanDefinition.getDependsOn();
        if (currentDependencies == null) {
          beanDefinition.setDependsOn("flyway");
        } else if (java.util.Arrays.stream(currentDependencies).noneMatch("flyway"::equals)) {
          String[] dependencies =
              java.util.Arrays.copyOf(currentDependencies, currentDependencies.length + 1);
          dependencies[dependencies.length - 1] = "flyway";
          beanDefinition.setDependsOn(dependencies);
        }
      }
    };
  }

  @Bean
  public Flyway flyway(
      DataSource dataSource,
      @Value("${spring.flyway.locations:classpath:db/migration}") String locations) {
    Flyway flyway =
        Flyway.configure().dataSource(dataSource).locations(locations.split(",")).load();
    flyway.migrate();
    return flyway;
  }
}
