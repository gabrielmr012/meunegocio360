package br.com.meunegocio360.core.shared.validation;

public final class DocumentoValidator {

  private DocumentoValidator() {}

  public static String somenteDigitos(String documento) {
    return documento == null ? "" : documento.replaceAll("\\D", "");
  }

  public static boolean cpfValido(String cpf) {
    if (cpf == null || !cpf.matches("\\d{11}") || cpf.chars().distinct().count() == 1) {
      return false;
    }

    int primeiro = calcularDigito(cpf.substring(0, 9), 10);
    int segundo = calcularDigito(cpf.substring(0, 9) + primeiro, 11);
    return cpf.charAt(9) - '0' == primeiro && cpf.charAt(10) - '0' == segundo;
  }

  public static boolean cnpjValido(String cnpj) {
    if (cnpj == null || !cnpj.matches("\\d{14}") || cnpj.chars().distinct().count() == 1) {
      return false;
    }

    int[] pesosPrimeiro = {5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
    int[] pesosSegundo = {6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
    int primeiro = calcularDigito(cnpj.substring(0, 12), pesosPrimeiro);
    int segundo = calcularDigito(cnpj.substring(0, 12) + primeiro, pesosSegundo);
    return cnpj.charAt(12) - '0' == primeiro && cnpj.charAt(13) - '0' == segundo;
  }

  private static int calcularDigito(String base, int pesoInicial) {
    int soma = 0;
    for (int i = 0; i < base.length(); i++) {
      soma += (base.charAt(i) - '0') * (pesoInicial - i);
    }
    return digitoVerificador(soma);
  }

  private static int calcularDigito(String base, int[] pesos) {
    int soma = 0;
    for (int i = 0; i < base.length(); i++) {
      soma += (base.charAt(i) - '0') * pesos[i];
    }
    return digitoVerificador(soma);
  }

  private static int digitoVerificador(int soma) {
    int resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  }
}
