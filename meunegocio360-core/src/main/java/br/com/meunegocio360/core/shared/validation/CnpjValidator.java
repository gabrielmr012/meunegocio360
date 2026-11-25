package br.com.meunegocio360.core.shared.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class CnpjValidator implements ConstraintValidator<Cnpj, String> {

  @Override
  public boolean isValid(String cnpj, ConstraintValidatorContext context) {
    return DocumentoValidator.cnpjValido(cnpj);
  }
}
