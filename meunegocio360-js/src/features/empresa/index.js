export { EmpresaProvider } from './hooks/useEmpresa.jsx';
export { EmpresaStatus, useEmpresa } from './hooks/EmpresaContext.jsx';

export const empresaPageLoaders = {
  cadastro: () => import('./pages/EmpresaCadastroPage.jsx'),
  empresa: () => import('./pages/EmpresaPage.jsx'),
};
