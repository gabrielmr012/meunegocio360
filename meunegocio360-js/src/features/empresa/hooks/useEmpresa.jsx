import { useCallback, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthStatus, useAuth } from '../../auth/index.js';
import { getEmpresa } from '../api/empresaApi.js';
import { EmpresaContext, EmpresaStatus } from './EmpresaContext.jsx';

const EMPRESA_QUERY_KEY = ['empresa-ativa'];

export function EmpresaProvider({ children }) {
  const { status: authStatus } = useAuth();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: EMPRESA_QUERY_KEY,
    queryFn: getEmpresa,
    enabled: authStatus === AuthStatus.AUTENTICADO,
    retry: false,
  });

  useEffect(() => {
    if (authStatus !== AuthStatus.AUTENTICADO) {
      queryClient.removeQueries({ queryKey: EMPRESA_QUERY_KEY });
    }
  }, [authStatus, queryClient]);

  const setEmpresa = useCallback(
    (empresa) => queryClient.setQueryData(EMPRESA_QUERY_KEY, empresa),
    [queryClient],
  );
  const removeEmpresa = useCallback(
    () => queryClient.setQueryData(EMPRESA_QUERY_KEY, null),
    [queryClient],
  );

  const absent =
    query.error?.status === 404 && query.error?.code === 'COMPANY_NOT_REGISTERED';
  const status = query.isPending
    ? EmpresaStatus.CARREGANDO
    : absent
      ? EmpresaStatus.AUSENTE
      : query.isError
        ? EmpresaStatus.ERRO
        : EmpresaStatus.ATIVA;

  const value = useMemo(
    () => ({
      status,
      empresa: query.data ?? null,
      error: query.error ?? null,
      refetch: query.refetch,
      setEmpresa,
      removeEmpresa,
    }),
    [status, query.data, query.error, query.refetch, setEmpresa, removeEmpresa],
  );

  return <EmpresaContext.Provider value={value}>{children}</EmpresaContext.Provider>;
}
