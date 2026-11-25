export function somenteDigitos(valor = '') {
  return String(valor).replace(/\D/g, '');
}

export function aplicarMascaraCpf(valor = '') {
  const digitos = somenteDigitos(valor).slice(0, 11);
  return digitos
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

export function aplicarMascaraCnpj(valor = '') {
  const digitos = somenteDigitos(valor).slice(0, 14);
  return digitos
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

export function aplicarMascaraTelefone(valor = '') {
  const digitos = somenteDigitos(valor).slice(0, 11);
  if (digitos.length <= 10) {
    return digitos.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
  }
  return digitos.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
}

export function cpfValido(cpf) {
  const digitos = somenteDigitos(cpf);
  if (!/^\d{11}$/.test(digitos) || /^(\d)\1+$/.test(digitos)) return false;

  const calcularDigito = (base, pesoInicial) => {
    const soma = [...base].reduce(
      (total, digito, indice) => total + Number(digito) * (pesoInicial - indice),
      0,
    );
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  const primeiro = calcularDigito(digitos.slice(0, 9), 10);
  if (Number(digitos[9]) !== primeiro) return false;

  return Number(digitos[10]) === calcularDigito(digitos.slice(0, 10), 11);
}

export function cnpjValido(cnpj) {
  const digitos = somenteDigitos(cnpj);
  if (!/^\d{14}$/.test(digitos) || /^(\d)\1+$/.test(digitos)) return false;

  const calcularDigito = (base, pesos) => {
    const soma = [...base].reduce(
      (total, digito, indice) => total + Number(digito) * pesos[indice],
      0,
    );
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const primeiro = calcularDigito(
    digitos.slice(0, 12),
    [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  );
  if (Number(digitos[12]) !== primeiro) return false;

  const segundo = calcularDigito(
    digitos.slice(0, 13),
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  );
  return Number(digitos[13]) === segundo;
}
