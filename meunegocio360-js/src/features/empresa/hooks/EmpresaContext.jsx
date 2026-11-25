import { createContext, useContext } from 'react';

export const EmpresaStatus = Object.freeze({
  CARREGANDO: 'carregando',
  ATIVA: 'ativa',
  AUSENTE: 'ausente',
  ERRO: 'erro',
});

export const EmpresaContext = createContext(null);

export function useEmpresa() {
  const context = useContext(EmpresaContext);
  if (!context) {
    throw new Error('useEmpresa deve ser usado dentro de um EmpresaProvider');
  }
  return context;
}
