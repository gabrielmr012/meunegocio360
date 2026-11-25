import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getClientes } from '../api/clientesApi.js';

const PAGE_SIZE_PADRAO = 10;

function useDebouncedValue(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timeoutId);
  }, [value, delay]);

  return debouncedValue;
}

export function useBuscaClientes({
  q = '',
  situacao = 'ATIVO',
  page = 0,
  size = PAGE_SIZE_PADRAO,
  enabled = true,
  minCaracteres = 0,
} = {}) {
  const debouncedQ = useDebouncedValue(q.trim(), 400);
  const searchEnabled = enabled && debouncedQ.length >= minCaracteres;
  const query = useQuery({
    queryKey: ['clientes', debouncedQ, situacao, page, size],
    queryFn: () =>
      getClientes({
        q: debouncedQ,
        situacao,
        page,
        size,
      }),
    enabled: searchEnabled,
  });

  return {
    query,
    debouncedQ,
    isDebouncing: q.trim() !== debouncedQ,
    searchEnabled,
  };
}
