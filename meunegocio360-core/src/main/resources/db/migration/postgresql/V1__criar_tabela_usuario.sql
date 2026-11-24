CREATE TABLE usuario (
    id UUID NOT NULL,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL,
    senha_hash VARCHAR(100) NOT NULL,
    perfil VARCHAR(20) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    tentativas_falhas INTEGER NOT NULL DEFAULT 0,
    bloqueado_ate TIMESTAMPTZ(6),
    ultimo_login_em TIMESTAMPTZ(6),
    criado_em TIMESTAMPTZ(6) NOT NULL,
    atualizado_em TIMESTAMPTZ(6) NOT NULL,
    versao BIGINT NOT NULL,
    CONSTRAINT pk_usuario PRIMARY KEY (id),
    CONSTRAINT uk_usuario_email UNIQUE (email)
);
