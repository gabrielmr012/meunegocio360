import { useId, useState } from 'react';
import { Form } from 'react-bootstrap';
import { useBuscaClientes } from '../hooks/useBuscaClientes.js';
import {
  aplicarMascaraCnpj,
  aplicarMascaraCpf,
  somenteDigitos,
} from '../../../shared/lib/formatadores.js';
import ErrorAlert from '../../../shared/ui/ErrorAlert.jsx';

function formatarDocumento(cliente) {
  return cliente.tipoPessoa === 'FISICA' ||
    somenteDigitos(cliente.documento).length === 11
    ? aplicarMascaraCpf(cliente.documento)
    : aplicarMascaraCnpj(cliente.documento);
}

function labelCliente(cliente) {
  return `${cliente.nome} — ${formatarDocumento(cliente)}`;
}

export default function ClienteSelect({
  value = null,
  onChange,
  invalid = false,
  disabled = false,
  label = 'Cliente',
}) {
  const generatedId = useId().replaceAll(':', '');
  const inputId = `cliente-select-input-${generatedId}`;
  const listId = `cliente-select-list-${generatedId}`;
  const [isOpen, setIsOpen] = useState(false);
  const [queryText, setQueryText] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const { query, isDebouncing, searchEnabled } = useBuscaClientes({
    q: queryText,
    situacao: 'ATIVO',
    page: 0,
    size: 10,
    enabled: isOpen,
    minCaracteres: 2,
  });
  const suggestions = query.data?.content || [];
  const activeOptionId =
    activeIndex >= 0 && activeIndex < suggestions.length
      ? `${listId}-option-${activeIndex}`
      : undefined;
  const showOptions =
    isOpen &&
    searchEnabled &&
    !query.isError &&
    !isDebouncing &&
    !query.isFetching &&
    suggestions.length > 0;

  const selectCliente = (cliente) => {
    onChange({
      id: cliente.id,
      nome: cliente.nome,
      documento: cliente.documento,
    });
    setQueryText('');
    setActiveIndex(-1);
    setIsOpen(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (event.key === 'Enter' && isOpen) {
      event.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        selectCliente(suggestions[activeIndex]);
      }
      return;
    }

    if (!isOpen || !suggestions.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    }
  };

  const inputValue = isOpen ? queryText : value ? labelCliente(value) : '';
  const inputInvalid = invalid;

  return (
    <Form.Group className="cliente-select" controlId={inputId}>
      <Form.Label>{label}</Form.Label>
      <Form.Control
        type="search"
        role="combobox"
        autoComplete="off"
        value={inputValue}
        disabled={disabled}
        isInvalid={inputInvalid}
        aria-invalid={inputInvalid}
        aria-expanded={showOptions}
        aria-controls={listId}
        aria-activedescendant={showOptions ? activeOptionId : undefined}
        aria-autocomplete="list"
        aria-describedby={inputInvalid ? `${listId}-feedback` : undefined}
        placeholder="Buscar por nome ou documento"
        onFocus={() => {
          if (value) setQueryText('');
          setIsOpen(true);
          setActiveIndex(-1);
        }}
        onBlur={() => setIsOpen(false)}
        onChange={(event) => {
          setQueryText(event.target.value);
          setActiveIndex(-1);
          setIsOpen(true);
          if (value) onChange(null);
        }}
        onKeyDown={handleKeyDown}
      />
      {inputInvalid && (
        <Form.Control.Feedback type="invalid" id={`${listId}-feedback`} role="alert">
          Selecione um cliente.
        </Form.Control.Feedback>
      )}
      <div
        id={listId}
        className="cliente-select-results"
        role="listbox"
        aria-label={`Sugestões de ${label.toLocaleLowerCase('pt-BR')}`}
        hidden={!showOptions}
      >
        {suggestions.map((cliente, index) => (
          <div
            key={cliente.id}
            id={`${listId}-option-${index}`}
            role="option"
            tabIndex={-1}
            aria-selected={activeIndex === index}
            className="cliente-select-option"
            onMouseDown={(event) => event.preventDefault()}
            onMouseEnter={() => setActiveIndex(index)}
            onClick={() => selectCliente(cliente)}
          >
            <span className="d-block">{cliente.nome}</span>
            <small className="text-secondary">{formatarDocumento(cliente)}</small>
          </div>
        ))}
      </div>
      {isOpen && !searchEnabled && (
        <div
          className="cliente-select-results cliente-select-message"
          role="status"
          aria-live="polite"
        >
          Digite ao menos 2 caracteres.
        </div>
      )}
      {isOpen && searchEnabled && query.isError && (
        <div className="cliente-select-results cliente-select-message">
          <ErrorAlert message="Erro ao buscar." onRetry={() => query.refetch()} />
        </div>
      )}
      {isOpen && searchEnabled && (isDebouncing || query.isFetching) && (
        <div
          className="cliente-select-results cliente-select-message"
          role="status"
          aria-live="polite"
        >
          Buscando…
        </div>
      )}
      {isOpen &&
        searchEnabled &&
        !query.isError &&
        !isDebouncing &&
        !query.isFetching &&
        suggestions.length === 0 && (
          <div
            className="cliente-select-results cliente-select-message"
            role="status"
            aria-live="polite"
          >
            Nenhum cliente encontrado.
          </div>
        )}
    </Form.Group>
  );
}
