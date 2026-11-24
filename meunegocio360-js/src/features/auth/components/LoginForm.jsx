// ============================================================
// LoginForm — formulário de login com RHF + Zod (RNF-FE-20…26)
// ============================================================
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation, useNavigate } from 'react-router';
import { Form, Button, Alert, Spinner, Card } from 'react-bootstrap';
import loginSchema from '../schemas.js';
import { login } from '../api/authApi.js';
import { useAuth } from '../hooks/AuthContext.jsx';
import logo from '../../../assets/logo_meunegocio360_v2_sem_fundo.png';

export default function LoginForm() {
  const { setSession, sessionError } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [serverError, setServerError] = useState(null);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [focusRequest, setFocusRequest] = useState(null);
  const serverErrorRef = useRef(null);
  const lastFocusSequenceRef = useRef(0);

  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    setValue,
    clearErrors,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', senha: '' },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  const sessionExpiredError = useMemo(
    () => (sessionError ? { code: 'SESSION_EXPIRED', message: sessionError } : null),
    [sessionError],
  );
  const visibleServerError = serverError || sessionExpiredError;
  useEffect(() => {
    if (
      isSubmitting ||
      !focusRequest ||
      lastFocusSequenceRef.current === focusRequest.sequence
    ) {
      return;
    }
    lastFocusSequenceRef.current = focusRequest.sequence;
    setFocus(focusRequest.field);
  }, [focusRequest, isSubmitting, setFocus]);

  useEffect(() => {
    if (isSubmitting) return;
    if (!visibleServerError) return;
    if (visibleServerError.code === 'INVALID_CREDENTIALS') {
      setFocus('senha');
      return;
    }
    serverErrorRef.current?.focus();
  }, [isSubmitting, setFocus, visibleServerError]);

  // Contagem regressiva para bloqueio
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const id = setInterval(() => {
      setLockoutSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [lockoutSeconds]);

  const isLocked = lockoutSeconds > 0;

  const requestFieldFocus = (field) => {
    setFocusRequest((request) => ({
      field,
      sequence: (request?.sequence || 0) + 1,
    }));
  };

  const onInvalid = (formErrors) => {
    const firstInvalidField = ['email', 'senha'].find((field) => formErrors[field]);
    if (firstInvalidField) requestFieldFocus(firstInvalidField);
  };

  const onSubmit = async (data) => {
    setServerError(null);

    try {
      const result = await login(data.email, data.senha);

      // Sucesso: limpa formulário e redireciona
      reset({ email: '', senha: '' });
      setSession(result.accessToken, result.usuario, result.expiresIn);
      navigate(getSafeFrom(location.state?.from), { replace: true });
    } catch (err) {
      // VALIDATION_ERROR → erros nos campos (400)
      if (err.code === 'VALIDATION_ERROR' && err.errors?.length) {
        let firstInvalidField = null;
        for (const fe of err.errors) {
          if (!['email', 'senha'].includes(fe.field)) continue;
          firstInvalidField ||= fe.field;
          setError(
            fe.field,
            { type: 'server', message: fe.message || 'Confira este campo.' },
            { shouldFocus: false },
          );
        }
        if (firstInvalidField) {
          requestFieldFocus(firstInvalidField);
        } else {
          setServerError({
            code: 'VALIDATION_ERROR',
            message: 'Confira os dados informados.',
          });
        }
        return;
      }

      // INVALID_CREDENTIALS (401)
      if (err.code === 'INVALID_CREDENTIALS') {
        setValue('senha', '');
        clearErrors('senha');
        setServerError({ code: err.code, message: 'E-mail ou senha inválidos.' });
        return;
      }

      // ACCOUNT_TEMPORARILY_LOCKED (429)
      if (err.code === 'ACCOUNT_TEMPORARILY_LOCKED') {
        const retryAfter = err.retryAfter || 900; // fallback 15 min
        setLockoutSeconds(retryAfter);
        const minutos = Math.ceil(retryAfter / 60);
        setServerError({
          code: err.code,
          message: `Muitas tentativas. Tente novamente em ${minutos} minuto${minutos > 1 ? 's' : ''}.`,
        });
        return;
      }

      // Falha de rede / timeout / 5xx
      setServerError({
        code: 'LOGIN_FAILED',
        message:
          'Não foi possível entrar agora. Verifique sua conexão e tente novamente.',
      });
    }
  };

  return (
    <Card className="login-card shadow-sm mx-auto w-100">
      <Card.Body className="p-4">
        <img
          src={logo}
          alt="MeuNegócio360"
          className="login-logo img-fluid d-block mx-auto mb-4"
        />
        <h1 className="fs-3 text-center mb-1">Entrar</h1>
        <p className="text-center text-secondary small mb-4">MeuNegócio360</p>

        {visibleServerError && (
          <Alert
            ref={serverErrorRef}
            tabIndex={-1}
            variant="danger"
            role="alert"
            className="login-server-error py-2 small"
          >
            {visibleServerError.message}
          </Alert>
        )}

        <Form
          className="login-form"
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          noValidate
        >
          {/* E-mail */}
          <Form.Group className="mb-3" controlId="login-email">
            <Form.Label>E-mail</Form.Label>
            <Form.Control
              type="email"
              autoComplete="username"
              placeholder="seu@email.com"
              isInvalid={!!errors.email}
              aria-invalid={errors.email ? 'true' : 'false'}
              aria-describedby={errors.email ? 'login-email-feedback' : undefined}
              {...register('email')}
              disabled={isSubmitting || isLocked}
            />
            <Form.Control.Feedback type="invalid" id="login-email-feedback" role="alert">
              {errors.email?.message}
            </Form.Control.Feedback>
          </Form.Group>

          {/* Senha */}
          <Form.Group className="mb-4" controlId="login-senha">
            <Form.Label>Senha</Form.Label>
            <Form.Control
              type="password"
              autoComplete="current-password"
              placeholder="Sua senha"
              isInvalid={!!errors.senha}
              aria-invalid={errors.senha ? 'true' : 'false'}
              aria-describedby={errors.senha ? 'login-senha-feedback' : undefined}
              {...register('senha')}
              disabled={isSubmitting || isLocked}
            />
            <Form.Control.Feedback type="invalid" id="login-senha-feedback" role="alert">
              {errors.senha?.message}
            </Form.Control.Feedback>
          </Form.Group>

          <Button
            type="submit"
            variant="primary"
            className="login-submit w-100 d-flex align-items-center justify-content-center gap-2"
            disabled={isSubmitting || isLocked}
            aria-busy={isSubmitting}
          >
            {isSubmitting && (
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
              />
            )}
            {isLocked
              ? `Aguarde ${formatLockout(lockoutSeconds)}`
              : isSubmitting
                ? 'Entrando…'
                : 'Entrar'}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
}

function getSafeFrom(from) {
  return typeof from === 'string' && from.startsWith('/') && !from.startsWith('//')
    ? from
    : '/';
}

function formatLockout(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0) return `${m}min${s > 0 ? ` ${s}s` : ''}`;
  return `${s}s`;
}
