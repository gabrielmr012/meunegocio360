package br.com.meunegocio360.core.shared.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class CnpjValidator implements ConstraintValidator<Cnpj, String> {

  @Override
  public boolean isValid(String cnpj, ConstraintValidatorContext context) {
    if (cnpj == null) {
      return false;
    }
    if (!cnpj.matches("\\d{14}") || cnpj.chars().distinct().count() == 1) {
      return false;
    }

    int[] pesosPrimeiro = {5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
    int[] pesosSegundo = {6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
    int primeiro = calcularDigito(cnpj.substring(0, 12), pesosPrimeiro);
    int segundo = calcularDigito(cnpj.substring(0, 12) + primeiro, pesosSegundo);

    return cnpj.charAt(12) - '0' == primeiro && cnpj.charAt(13) - '0' == segundo;
  }

  private int calcularDigito(String base, int[] pesos) {
    int soma = 0;
    for (int i = 0; i < base.length(); i++) {
      soma += (base.charAt(i) - '0') * pesos[i];
    }
    int resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  }
}
