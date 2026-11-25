import { Button, Modal } from 'react-bootstrap';

export default function ConfirmModal({
  show,
  title,
  confirmLabel = 'Confirmar',
  confirming = false,
  onCancel,
  onConfirm,
  children,
}) {
  return (
    <Modal show={show} onHide={onCancel} centered aria-labelledby="confirm-modal-title">
      <Modal.Header closeButton={!confirming}>
        <Modal.Title id="confirm-modal-title">{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{children}</Modal.Body>
      <Modal.Footer>
        <Button variant="outline-dark" onClick={onCancel} disabled={confirming}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={onConfirm} disabled={confirming}>
          {confirming ? 'Aguarde…' : confirmLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
