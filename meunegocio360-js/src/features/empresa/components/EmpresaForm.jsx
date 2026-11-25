import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Card, Form, Spinner } from 'react-bootstrap';
import {
  aplicarMascaraCnpj,
  aplicarMascaraTelefone,
  cnpjValido,
  somenteDigitos,
} from '../../../shared/lib/formatadores.js';
import ErrorAlert from '../../../shared/ui/ErrorAlert.jsx';

const fusos = [
  'America/Sao_Paulo',
  'America/Noronha',
  'America/Manaus',
  'America/Belem',
  'America/Fortaleza',
  'America/Recife',
  'America/Bahia',
  'America/Porto_Velho',
  'America/Boa_Vista',
  'America/Rio_Branco',
  'America/Campo_Grande',
  'America/Cuiaba',
  'America/Santarem',
  'America/Araguaina',
  'UTC',
];

const schema = z.object({
  razaoSocial: z
    .string()
    .trim()
    .min(3, 'Informe a razão social.')
    .max(150, 'Use no máximo 150 caracteres.'),
  nomeFantasia: z
    .string()
    .trim()
    .max(150, 'Use no máximo 150 caracteres.')
    .or(z.literal('')),
  cnpj: z
    .string()
    .transform(somenteDigitos)
    .refine((value) => value.length > 0, 'Informe o CNPJ.')
    .refine(cnpjValido, 'CNPJ inválido.'),
  email: z
    .string()
    .trim()
    .max(160, 'Use no máximo 160 caracteres.')
    .refine(
      (value) => value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      'Informe um e-mail válido.',
    ),
  telefone: z
    .string()
    .transform(somenteDigitos)
    .refine(
      (value) => value === '' || /^(?:\d{10}|\d{11})$/.test(value),
      'Informe um telefone válido com DDD.',
    ),
  fusoHorario: z.string().min(1, 'Selecione o fuso horário.'),
  moeda: z.literal('BRL'),
});

function getDefaultValues(empresa) {
  return {
    razaoSocial: empresa?.razaoSocial || '',
    nomeFantasia: empresa?.nomeFantasia || '',
    cnpj: aplicarMascaraCnpj(empresa?.cnpj || ''),
    email: empresa?.email || '',
    telefone: aplicarMascaraTelefone(empresa?.telefone || ''),
    fusoHorario: empresa?.fusoHorario || 'America/Sao_Paulo',
    moeda: 'BRL',
  };
}

const serverFieldNames = new Set([
  'razaoSocial',
  'nomeFantasia',
  'cnpj',
  'email',
  'telefone',
  'fusoHorario',
  'moeda',
]);

export default function EmpresaForm({
  empresa,
  onSubmit,
  submitting = false,
  serverError,
  onServerErrorCleared,
}) {
  const [lastValues, setLastValues] = useState(null);
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: getDefaultValues(empresa),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  useEffect(() => {
    reset(getDefaultValues(empresa));
  }, [empresa, reset]);

  useEffect(() => {
    if (serverError?.code === 'COMPANY_CNPJ_DUPLICATE') {
      setFocus('cnpj');
    }
  }, [serverError?.code, setFocus]);

  const submit = async (values) => {
    setLastValues(values);
    await onSubmit({
      ...values,
      cnpj: somenteDigitos(values.cnpj),
      telefone: somenteDigitos(values.telefone),
      ...(empresa ? { versao: empresa.versao } : {}),
    });
  };

  const onInvalid = (formErrors) => {
    const firstInvalidField = Object.keys(formErrors)[0];
    if (firstInvalidField) setFocus(firstInvalidField);
  };

  useEffect(() => {
    if (serverError?.code !== 'VALIDATION_ERROR' || !serverError.errors?.length) return;

    let firstInvalidField;
    serverError.errors.forEach(({ field, message }) => {
      if (!serverFieldNames.has(field)) return;
      firstInvalidField ||= field;
      setError(field, {
        type: 'server',
        message: message || 'Confira este campo.',
      });
    });
    if (firstInvalidField) setFocus(firstInvalidField);
  }, [serverError, setError, setFocus]);

  const cnpjField = register('cnpj');
  const telefoneField = register('telefone');
  const busy = submitting || isSubmitting;
  const isDuplicate = serverError?.code === 'COMPANY_CNPJ_DUPLICATE';

  let message = '';
  let retry;
  let retryLabel;
  if (serverError?.code === 'COMPANY_ALREADY_ACTIVE') {
    message =
      'Já existe uma empresa ativa. Inative-a antes de cadastrar ou reativar outra.';
  } else if (serverError?.code === 'ACCESS_DENIED') {
    message = 'Você não tem permissão para alterar os dados da empresa.';
  } else if (serverError?.code === 'VERSION_CONFLICT') {
    message = 'Os dados da empresa foram alterados por outra operação.';
    retry = onServerErrorCleared;
    retryLabel = 'Recarregar dados';
  } else if (serverError && !isDuplicate && serverError.code !== 'VALIDATION_ERROR') {
    message = 'Não foi possível salvar os dados da empresa. Tente novamente.';
    retry = lastValues ? () => onSubmit(lastValues) : undefined;
  }

  return (
    <Card className="shadow-sm">
      <Card.Body className="p-4">
        {serverError?.code === 'COMPANY_ALREADY_ACTIVE' ? (
          <ErrorAlert
            message={message}
            onRetry={onServerErrorCleared}
            retryLabel="Recarregar dados"
          />
        ) : (
          <ErrorAlert message={message} onRetry={retry} retryLabel={retryLabel} />
        )}

        <Form onSubmit={handleSubmit(submit, onInvalid)} noValidate>
          <Form.Group className="mb-3" controlId="empresa-razao-social">
            <Form.Label>Razão social</Form.Label>
            <Form.Control
              autoComplete="organization"
              {...register('razaoSocial')}
              isInvalid={!!errors.razaoSocial}
              aria-invalid={!!errors.razaoSocial}
              aria-describedby={
                errors.razaoSocial ? 'empresa-razao-social-feedback' : undefined
              }
            />
            <Form.Control.Feedback
              type="invalid"
              id="empresa-razao-social-feedback"
              role="alert"
            >
              {errors.razaoSocial?.message}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" controlId="empresa-nome-fantasia">
            <Form.Label>Nome fantasia</Form.Label>
            <Form.Control
              autoComplete="organization"
              {...register('nomeFantasia')}
              isInvalid={!!errors.nomeFantasia}
              aria-invalid={!!errors.nomeFantasia}
              aria-describedby={
                errors.nomeFantasia ? 'empresa-nome-fantasia-feedback' : undefined
              }
            />
            <Form.Control.Feedback
              type="invalid"
              id="empresa-nome-fantasia-feedback"
              role="alert"
            >
              {errors.nomeFantasia?.message}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" controlId="empresa-cnpj">
            <Form.Label>CNPJ</Form.Label>
            <Form.Control
              {...cnpjField}
              inputMode="numeric"
              isInvalid={!!errors.cnpj || isDuplicate}
              aria-invalid={!!errors.cnpj || isDuplicate}
              aria-describedby={
                errors.cnpj || isDuplicate ? 'empresa-cnpj-feedback' : undefined
              }
              onChange={(event) =>
                setValue('cnpj', aplicarMascaraCnpj(event.target.value), {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
            <Form.Control.Feedback type="invalid" id="empresa-cnpj-feedback" role="alert">
              {isDuplicate
                ? 'Já existe uma empresa cadastrada com este CNPJ.'
                : errors.cnpj?.message}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" controlId="empresa-email">
            <Form.Label>E-mail</Form.Label>
            <Form.Control
              type="email"
              autoComplete="email"
              {...register('email')}
              isInvalid={!!errors.email}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'empresa-email-feedback' : undefined}
            />
            <Form.Control.Feedback
              type="invalid"
              id="empresa-email-feedback"
              role="alert"
            >
              {errors.email?.message}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" controlId="empresa-telefone">
            <Form.Label>Telefone</Form.Label>
            <Form.Control
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              {...telefoneField}
              isInvalid={!!errors.telefone}
              aria-invalid={!!errors.telefone}
              aria-describedby={errors.telefone ? 'empresa-telefone-feedback' : undefined}
              onChange={(event) =>
                setValue('telefone', aplicarMascaraTelefone(event.target.value), {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
            <Form.Control.Feedback
              type="invalid"
              id="empresa-telefone-feedback"
              role="alert"
            >
              {errors.telefone?.message}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" controlId="empresa-fuso">
            <Form.Label>Fuso horário</Form.Label>
            <Form.Select
              {...register('fusoHorario')}
              isInvalid={!!errors.fusoHorario}
              aria-invalid={!!errors.fusoHorario}
              aria-describedby={errors.fusoHorario ? 'empresa-fuso-feedback' : undefined}
            >
              {fusos.map((fuso) => (
                <option key={fuso} value={fuso}>
                  {fuso}
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid" id="empresa-fuso-feedback" role="alert">
              {errors.fusoHorario?.message}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-4" controlId="empresa-moeda">
            <Form.Label>Moeda</Form.Label>
            <Form.Select disabled {...register('moeda')}>
              <option value="BRL">BRL</option>
            </Form.Select>
          </Form.Group>

          <Button
            type="submit"
            variant="primary"
            disabled={busy}
            aria-busy={busy}
            className="empresa-submit"
          >
            {busy && (
              <Spinner
                as="span"
                animation="border"
                size="sm"
                className="me-2"
                aria-hidden="true"
              />
            )}
            {busy ? 'Salvando…' : 'Salvar'}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
}
