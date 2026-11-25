import { Form } from 'react-bootstrap';
import { aplicarMascaraCnpj, aplicarMascaraCpf } from '../lib/formatadores.js';

export default function DocumentoInput({ tipoPessoa, value = '', onChange, ...props }) {
  const isCpf = tipoPessoa === 'FISICA';
  const mask = isCpf ? aplicarMascaraCpf : aplicarMascaraCnpj;

  return (
    <Form.Control
      {...props}
      type="text"
      inputMode="numeric"
      maxLength={isCpf ? 14 : 18}
      value={mask(value)}
      onChange={(event) => onChange(mask(event.target.value))}
    />
  );
}
