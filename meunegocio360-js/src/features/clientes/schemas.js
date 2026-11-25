import { z } from 'zod';
import { cnpjValido, cpfValido, somenteDigitos } from '../../shared/lib/formatadores.js';

const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const clienteSchema = z
  .object({
    tipoPessoa: z
      .string()
      .refine(
        (value) => value === 'FISICA' || value === 'JURIDICA',
        'Selecione o tipo de pessoa.',
      ),
    nome: z
      .string()
      .trim()
      .min(2, 'Informe o nome.')
      .max(150, 'Use no máximo 150 caracteres.'),
    documento: z.string().transform(somenteDigitos),
    email: z
      .string()
      .trim()
      .max(160, 'Use no máximo 160 caracteres.')
      .refine(
        (value) => value === '' || emailValido.test(value),
        'Informe um e-mail válido.',
      ),
    telefone: z.string().transform(somenteDigitos),
  })
  .superRefine((values, context) => {
    if (!values.documento) {
      context.addIssue({
        code: 'custom',
        path: ['documento'],
        message: 'Informe o documento.',
      });
    } else if (values.tipoPessoa === 'FISICA' && !cpfValido(values.documento)) {
      context.addIssue({
        code: 'custom',
        path: ['documento'],
        message: 'CPF inválido.',
      });
    } else if (values.tipoPessoa === 'JURIDICA' && !cnpjValido(values.documento)) {
      context.addIssue({
        code: 'custom',
        path: ['documento'],
        message: 'CNPJ inválido.',
      });
    }

    if (values.telefone && !/^(?:\d{10}|\d{11})$/.test(values.telefone)) {
      context.addIssue({
        code: 'custom',
        path: ['telefone'],
        message: 'Informe um telefone válido com DDD.',
      });
    }
  });

export default clienteSchema;
