// ============================================================
// App — bootstrap da aplicação (providers, roteador, layout)
// ============================================================
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';
import { AuthProvider, useAuth } from '../features/auth/index.js';
import LoadingSpinner from '../shared/ui/LoadingSpinner.jsx';
import ErrorScreen from '../shared/ui/ErrorScreen.jsx';
import RequireAuth from '../shared/ui/RequireAuth.jsx';
import { EmpresaProvider, empresaPageLoaders } from '../features/empresa/index.js';
import RequireEmpresa from '../shared/ui/RequireEmpresa.jsx';
import RequireRole from '../shared/ui/RequireRole.jsx';
import AppLayout from '../features/empresa/components/AppLayout.jsx';
import { PERFIS } from '../shared/lib/perfis.js';
import { clientePageLoaders } from '../features/clientes/routes.js';

// Lazy loading das páginas (RNF-FE-05)
const LoginPage = lazy(() =>
  import('../features/auth/pages/LoginPage.jsx').then((m) => ({ default: m.default })),
);
const HomePage = lazy(() =>
  import('../features/auth/pages/HomePage.jsx').then((m) => ({ default: m.default })),
);
const NotFoundPage = lazy(() =>
  import('../features/auth/pages/NotFoundPage.jsx').then((m) => ({ default: m.default })),
);
const EmpresaCadastroPage = lazy(empresaPageLoaders.cadastro);
const EmpresaPage = lazy(empresaPageLoaders.empresa);
const ClientesListPage = lazy(clientePageLoaders.list);
const ClienteFormPage = lazy(clientePageLoaders.form);
const ClienteSelectDevPage = lazy(clientePageLoaders.selectorDev);

function AuthGate({ children }) {
  const { status, sessionError, retryRestore } = useAuth();

  if (status === 'carregando') {
    return <LoadingSpinner text="Carregando…" />;
  }

  if (status === 'erro') {
    return (
      <ErrorScreen
        message={sessionError || 'Não foi possível conectar ao servidor.'}
        onRetry={retryRestore}
      />
    );
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthGate>
          <EmpresaProvider>
            <Suspense fallback={<LoadingSpinner text="Carregando…" />}>
              <Routes>
                <Route
                  path="/login"
                  element={
                    <Suspense fallback={<LoadingSpinner text="Carregando…" />}>
                      <LoginPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/"
                  element={
                    <RequireAuth>
                      <RequireEmpresa>
                        <AppLayout>
                          <Suspense fallback={<LoadingSpinner text="Carregando…" />}>
                            <HomePage />
                          </Suspense>
                        </AppLayout>
                      </RequireEmpresa>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/empresa/cadastro"
                  element={
                    <RequireAuth>
                      <RequireRole allowed={[PERFIS.ADMIN]}>
                        <Suspense fallback={<LoadingSpinner text="Carregando…" />}>
                          <EmpresaCadastroPage />
                        </Suspense>
                      </RequireRole>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/empresa"
                  element={
                    <RequireAuth>
                      <RequireEmpresa>
                        <AppLayout>
                          <Suspense fallback={<LoadingSpinner text="Carregando…" />}>
                            <EmpresaPage />
                          </Suspense>
                        </AppLayout>
                      </RequireEmpresa>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/clientes"
                  element={
                    <RequireAuth>
                      <RequireEmpresa>
                        <RequireRole allowed={[PERFIS.ADMIN, PERFIS.OPERADOR_COMERCIAL]}>
                          <AppLayout>
                            <Suspense fallback={<LoadingSpinner text="Carregando…" />}>
                              <ClientesListPage />
                            </Suspense>
                          </AppLayout>
                        </RequireRole>
                      </RequireEmpresa>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/clientes/novo"
                  element={
                    <RequireAuth>
                      <RequireEmpresa>
                        <RequireRole allowed={[PERFIS.ADMIN, PERFIS.OPERADOR_COMERCIAL]}>
                          <AppLayout>
                            <Suspense fallback={<LoadingSpinner text="Carregando…" />}>
                              <ClienteFormPage />
                            </Suspense>
                          </AppLayout>
                        </RequireRole>
                      </RequireEmpresa>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/clientes/:id"
                  element={
                    <RequireAuth>
                      <RequireEmpresa>
                        <RequireRole allowed={[PERFIS.ADMIN, PERFIS.OPERADOR_COMERCIAL]}>
                          <AppLayout>
                            <Suspense fallback={<LoadingSpinner text="Carregando…" />}>
                              <ClienteFormPage />
                            </Suspense>
                          </AppLayout>
                        </RequireRole>
                      </RequireEmpresa>
                    </RequireAuth>
                  }
                />
                {import.meta.env.DEV && (
                  <Route
                    path="/dev/cliente-select"
                    element={
                      <RequireAuth>
                        <RequireEmpresa>
                          <RequireRole
                            allowed={[PERFIS.ADMIN, PERFIS.OPERADOR_COMERCIAL]}
                          >
                            <AppLayout>
                              <Suspense fallback={<LoadingSpinner text="Carregando…" />}>
                                <ClienteSelectDevPage />
                              </Suspense>
                            </AppLayout>
                          </RequireRole>
                        </RequireEmpresa>
                      </RequireAuth>
                    }
                  />
                )}
                <Route
                  path="*"
                  element={
                    <Suspense fallback={<LoadingSpinner text="Carregando…" />}>
                      <NotFoundPage />
                    </Suspense>
                  }
                />
              </Routes>
            </Suspense>
          </EmpresaProvider>
        </AuthGate>
      </AuthProvider>
    </BrowserRouter>
  );
}
