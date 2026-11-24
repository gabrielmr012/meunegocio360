# MeuNegócio360 — frontend

Aplicação React da RF-FE-001: login, restauração e renovação de sessão, rota inicial protegida e logout. A interface usa Bootstrap 5 e chama a API pela origem atual em `/api/v1`.

## Desenvolvimento local

1. Configure o backend e o PostgreSQL seguindo o [README da raiz](../README.md).
2. Na pasta `meunegocio360-js`, copie `.env.example` para `.env.local`.
3. Execute `npm install` e `npm run dev`.

O Vite encaminha `/api` para `http://localhost:8080`. `VITE_API_BASE_URL` deve permanecer relativo; não inclua segredos em variáveis `VITE_*`.

## Comandos

| Comando           | Uso                         |
| ----------------- | --------------------------- |
| `npm run dev`     | Servidor de desenvolvimento |
| `npm run lint`    | ESLint                      |
| `npm run build`   | Build estático em `dist/`   |
| `npm run preview` | Servir o build localmente   |

Rotas implementadas: `/login` e `/` (protegida). Detalhes do contrato, dos estados de erro e dos critérios de aceite estão em [`docs/requisitos-fe.md`](../docs/requisitos-fe.md#rf-fe-001--fluxo-de-login-do-usuário).
