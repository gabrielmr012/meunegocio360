import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Card, Form, Spinner } from 'react-bootstrap';
import { Link } from 'react-router';
import {
  aplicarMascaraTelefone,
  somenteDigitos,
} from '../../../shared/lib/formatadores.js';
import DocumentoInput from '../../../shared/ui/DocumentoInput.jsx';
import ErrorAlert from '../../../shared/ui/ErrorAlert.jsx';
import clienteSchema from '../schemas.js';

const SERVER_FIELDS = new Set(['tipoPessoa', 'nome', 'documento', 'email', 'telefone']);
const DOCUMENTO_DUPLICADO =
  'Já existe um cliente com este documento. Ele pode estar inativo; busque por ele e reative.';

function getClienteFormValues(cliente) {
  return {
    tipoPessoa: cliente?.tipoPessoa || '',
    nome: cliente?.nome || '',
    documento: cliente?.documento || '',
    email: cliente?.email || '',
    telefone: aplicarMascaraTelefone(cliente?.telefone || ''),
  };
}

export default function ClienteForm({ cliente, onSave, onReload, submitting = false }) {
  const [serverError, setServerError] = useState(null);
  const [typeNotice, setTypeNotice] = useState('');
  const [reloadError, setReloadError] = useState(null);
  const {
    control,
    register,
    handleSubmit,
    setError,
    setFocus,
    setValue,
    getValues,
    clearErrors,
    trigger,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(clienteSchema),
    defaultValues: getClienteFormValues(cliente),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });
  const tipoPessoa = useWatch({ control, name: 'tipoPessoa' });

  const busy = submitting || isSubmitting;
  const isDuplicate = serverError?.code === 'CUSTOMER_DOCUMENT_DUPLICATE';
  const isVersionConflict = serverError?.code === 'VERSION_CONFLICT';
  const isCompanyInactive = serverError?.code === 'COMPANY_NOT_ACTIVE';
  const isAccessDenied =
    serverError?.status === 403 || serverError?.code === 'ACCESS_DENIED';

  const onInvalid = (formErrors) => {
    const firstInvalidField = [
      'tipoPessoa',
      'nome',
      'documento',
      'email',
      'telefone',
    ].find((field) => formErrors[field]);
    if (firstInvalidField) setFocus(firstInvalidField);
  };

  const save = async (values) => {
    setServerError(null);
    setReloadError(null);
    try {
      await onSave({
        ...values,
        documento: somenteDigitos(values.documento),
        telefone: somenteDigitos(values.telefone),
      });
    } catch (error) {
      setServerError(error);
      if (error?.code === 'CUSTOMER_DOCUMENT_DUPLICATE') {
        setError(
          'documento',
          { type: 'server', message: DOCUMENTO_DUPLICADO },
          { shouldFocus: true },
        );
        return;
      }

      if (error?.code === 'VALIDATION_ERROR' && error.errors?.length) {
        let firstInvalidField;
        error.errors.forEach(({ field, message }) => {
          if (!SERVER_FIELDS.has(field)) return;
          firstInvalidField ||= field;
          setError(field, {
            type: 'server',
            message: message || 'Confira este campo.',
          });
        });
        if (firstInvalidField) setFocus(firstInvalidField);
      }
    }
  };

  const reloadAfterConflict = async () => {
    setReloadError(null);
    try {
      const latestCliente = await onReload();
      if (latestCliente) {
        reset(getClienteFormValues(latestCliente));
        clearErrors();
        setServerError(null);
      }
    } catch (error) {
      setReloadError(error);
    }
  };

  const changeTipoPessoa = (tipoPessoa, onChange) => {
    const documentoAtual = somenteDigitos(getValues('documento'));
    const tamanhoEsperado = tipoPessoa === 'FISICA' ? 11 : 14;
    onChange(tipoPessoa);

    if (documentoAtual && documentoAtual.length !== tamanhoEsperado) {
      setValue('documento', '', { shouldDirty: true, shouldValidate: true });
      setTypeNotice(
        `O documento anterior foi removido porque não corresponde ao formato de ${
          tipoPessoa === 'FISICA' ? 'CPF' : 'CNPJ'
        }.`,
      );
    } else {
      setTypeNotice('');
      if (documentoAtual) trigger('documento');
    }
  };

  if (isAccessDenied) {
    return (
      <main className="container py-4">
        <h1>Acesso negado</h1>
        <p>Você não tem permissão para alterar clientes.</p>
        <Link to="/" className="btn btn-primary">
          Voltar para o início
        </Link>
      </main>
    );
  }

  const genericError =
    serverError &&
    ![
      'CUSTOMER_DOCUMENT_DUPLICATE',
      'VALIDATION_ERROR',
      'VERSION_CONFLICT',
      'COMPANY_NOT_ACTIVE',
      'ACCESS_DENIED',
    ].includes(serverError.code);
  const genericMessage = genericError
    ? 'Não foi possível salvar os dados do cliente. Verifique sua conexão e tente novamente.'
    : serverError?.code === 'VALIDATION_ERROR' &&
        !serverError.errors?.some(({ field }) => SERVER_FIELDS.has(field))
      ? 'Confira os dados informados e tente novamente.'
      : '';

  return (
    <Card className="shadow-sm cliente-form-card">
      <Card.Body className="p-4">
        {isVersionConflict && (
          <ErrorAlert
            message="Este cliente foi alterado por outra operação. Recarregue os dados antes de salvar."
            onRetry={reloadAfterConflict}
            retryLabel="Recarregar dados"
          />
        )}
        {isCompanyInactive && (
          <Alert variant="warning" role="alert">
            Cadastre ou ative a empresa para continuar.{' '}
            <Link to="/empresa">Acessar empresa</Link>
          </Alert>
        )}
        {genericMessage && (
          <ErrorAlert
            message={genericMessage}
            onRetry={() => handleSubmit(save, onInvalid)()}
          />
        )}
        {reloadError && (
          <ErrorAlert
            message="Não foi possível recarregar os dados do cliente."
            onRetry={reloadAfterConflict}
          />
        )}

        <Form onSubmit={handleSubmit(save, onInvalid)} noValidate>
          <fieldset
            className="mb-3"
            aria-describedby={errors.tipoPessoa ? 'cliente-tipo-feedback' : undefined}
          >
            <legend className="form-label fs-6 mb-2">Tipo de pessoa</legend>
            <Controller
              name="tipoPessoa"
              control={control}
              render={({ field }) => (
                <div
                  className="d-flex flex-wrap gap-4"
                  role="radiogroup"
                  aria-labelledby="cliente-tipo-label"
                >
                  <span id="cliente-tipo-label" className="visually-hidden">
                    Tipo de pessoa
                  </span>
                  <div className="form-check">
                    <input
                      ref={field.ref}
                      id="cliente-tipo-fisica"
                      className={`form-check-input${errors.tipoPessoa ? ' is-invalid' : ''}`}
                      type="radio"
                      name={field.name}
                      value="FISICA"
                      checked={field.value === 'FISICA'}
                      onChange={() => changeTipoPessoa('FISICA', field.onChange)}
                      onBlur={field.onBlur}
                      aria-invalid={!!errors.tipoPessoa}
                    />
                    <label className="form-check-label" htmlFor="cliente-tipo-fisica">
                      Pessoa física
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      id="cliente-tipo-juridica"
                      className={`form-check-input${errors.tipoPessoa ? ' is-invalid' : ''}`}
                      type="radio"
                      name={field.name}
                      value="JURIDICA"
                      checked={field.value === 'JURIDICA'}
                      onChange={() => changeTipoPessoa('JURIDICA', field.onChange)}
                      onBlur={field.onBlur}
                      aria-invalid={!!errors.tipoPessoa}
                    />
                    <label className="form-check-label" htmlFor="cliente-tipo-juridica">
                      Pessoa jurídica
                    </label>
                  </div>
                </div>
              )}
            />
            {errors.tipoPessoa && (
              <div
                id="cliente-tipo-feedback"
                className="invalid-feedback d-block"
                role="alert"
              >
                {errors.tipoPessoa.message}
              </div>
            )}
          </fieldset>

          {typeNotice && (
            <Alert variant="info" role="status" className="py-2">
              {typeNotice}
            </Alert>
          )}

          <Form.Group className="mb-3" controlId="cliente-nome">
            <Form.Label>Nome ou razão social</Form.Label>
            <Form.Control
              autoComplete="name"
              maxLength={150}
              {...register('nome')}
              isInvalid={!!errors.nome}
              aria-invalid={!!errors.nome}
              aria-describedby={errors.nome ? 'cliente-nome-feedback' : undefined}
            />
            <Form.Control.Feedback type="invalid" id="cliente-nome-feedback" role="alert">
              {errors.nome?.message}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" controlId="cliente-documento">
            <Form.Label>
              {tipoPessoa === 'FISICA'
                ? 'CPF'
                : tipoPessoa === 'JURIDICA'
                  ? 'CNPJ'
                  : 'CPF ou CNPJ'}
            </Form.Label>
            <Controller
              name="documento"
              control={control}
              render={({ field }) => (
                <DocumentoInput
                  {...field}
                  tipoPessoa={tipoPessoa}
                  placeholder={
                    tipoPessoa === 'FISICA'
                      ? '000.000.000-00'
                      : tipoPessoa === 'JURIDICA'
                        ? '00.000.000/0000-00'
                        : 'Selecione o tipo de pessoa'
                  }
                  disabled={!tipoPessoa}
                  isInvalid={!!errors.documento || isDuplicate}
                  aria-invalid={!!errors.documento || isDuplicate}
                  aria-describedby={
                    errors.documento || isDuplicate
                      ? 'cliente-documento-feedback'
                      : undefined
                  }
                  onChange={(value) => {
                    field.onChange(value);
                    clearErrors('documento');
                    if (isDuplicate) setServerError(null);
                  }}
                />
              )}
            />
            <Form.Control.Feedback
              type="invalid"
              id="cliente-documento-feedback"
              role="alert"
            >
              {isDuplicate ? DOCUMENTO_DUPLICADO : errors.documento?.message}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" controlId="cliente-email">
            <Form.Label>E-mail (opcional)</Form.Label>
            <Form.Control
              type="email"
              autoComplete="email"
              maxLength={160}
              {...register('email')}
              isInvalid={!!errors.email}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'cliente-email-feedback' : undefined}
            />
            <Form.Control.Feedback
              type="invalid"
              id="cliente-email-feedback"
              role="alert"
            >
              {errors.email?.message}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-4" controlId="cliente-telefone">
            <Form.Label>Telefone (opcional)</Form.Label>
            <Form.Control
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              {...register('telefone')}
              isInvalid={!!errors.telefone}
              aria-invalid={!!errors.telefone}
              aria-describedby={errors.telefone ? 'cliente-telefone-feedback' : undefined}
              onChange={(event) =>
                setValue('telefone', aplicarMascaraTelefone(event.target.value), {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
            <Form.Control.Feedback
              type="invalid"
              id="cliente-telefone-feedback"
              role="alert"
            >
              {errors.telefone?.message}
            </Form.Control.Feedback>
          </Form.Group>

          <div className="d-flex flex-wrap gap-2">
            <Button type="submit" disabled={busy} aria-busy={busy}>
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
            <Button
              as={Link}
              to="/clientes"
              variant="outline-dark"
              onClick={(event) => {
                if (busy) event.preventDefault();
              }}
            >
              Cancelar
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
}
