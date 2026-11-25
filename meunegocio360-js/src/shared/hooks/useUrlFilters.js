import { useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router';

const SITUACOES = new Set(['ATIVO', 'INATIVO', 'TODOS']);

export default function useUrlFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => {
    const requestedSituation = searchParams.get('situacao') || 'ATIVO';
    const parsedPage = Number.parseInt(searchParams.get('page') || '0', 10);

    return {
      q: searchParams.get('q') || '',
      situacao: SITUACOES.has(requestedSituation) ? requestedSituation : 'ATIVO',
      page: Number.isInteger(parsedPage) && parsedPage >= 0 ? parsedPage : 0,
    };
  }, [searchParams]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    let changed = false;
    if (!next.has('q')) {
      next.set('q', '');
      changed = true;
    }
    if (!next.has('situacao') || !SITUACOES.has(next.get('situacao'))) {
      next.set('situacao', 'ATIVO');
      changed = true;
    }
    const page = Number.parseInt(next.get('page') || '0', 10);
    if (!next.has('page') || !Number.isInteger(page) || page < 0) {
      next.set('page', '0');
      changed = true;
    }
    if (changed) setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const updateFilters = useCallback(
    (updates) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined) {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      });
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const resetFilters = useCallback(() => {
    setSearchParams({ q: '', situacao: 'ATIVO', page: '0' }, { replace: true });
  }, [setSearchParams]);

  return { filters, updateFilters, resetFilters };
}
