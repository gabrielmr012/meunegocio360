import { Pagination } from 'react-bootstrap';

export default function Paginacao({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <Pagination aria-label="Paginação de clientes" className="clientes-pagination">
      <Pagination.Prev
        aria-label="Página anterior"
        disabled={page === 0}
        onClick={() => onPageChange(page - 1)}
      />
      <Pagination.Item active aria-current="page">
        {page + 1} de {totalPages}
      </Pagination.Item>
      <Pagination.Next
        aria-label="Próxima página"
        disabled={page + 1 >= totalPages}
        onClick={() => onPageChange(page + 1)}
      />
    </Pagination>
  );
}
