CREATE TABLE refresh_token (
    id UUID NOT NULL,
    usuario_id UUID NOT NULL,
    familia_id UUID NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    expira_em TIMESTAMPTZ(6) NOT NULL,
    revogado_em TIMESTAMPTZ(6),
    criado_em TIMESTAMPTZ(6) NOT NULL,
    atualizado_em TIMESTAMPTZ(6) NOT NULL,
    versao BIGINT NOT NULL,
    CONSTRAINT pk_refresh_token PRIMARY KEY (id),
    CONSTRAINT uk_refresh_token_token_hash UNIQUE (token_hash),
    CONSTRAINT fk_refresh_token_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuario (id)
);

CREATE INDEX idx_refresh_token_usuario_id ON refresh_token (usuario_id);
CREATE INDEX idx_refresh_token_familia_id ON refresh_token (familia_id);
