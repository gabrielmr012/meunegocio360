CREATE TABLE cliente (
    id UUID NOT NULL,
    empresa_id UUID NOT NULL,
    tipo_pessoa VARCHAR(10) NOT NULL,
    nome VARCHAR(150) NOT NULL,
    nome_busca VARCHAR(150) NOT NULL,
    documento VARCHAR(14) NOT NULL,
    email VARCHAR(160),
    telefone VARCHAR(11),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ(6) NOT NULL,
    atualizado_em TIMESTAMPTZ(6) NOT NULL,
    versao BIGINT NOT NULL,
    CONSTRAINT pk_cliente PRIMARY KEY (id),
    CONSTRAINT fk_cliente_empresa FOREIGN KEY (empresa_id) REFERENCES empresa (id),
    CONSTRAINT ck_cliente_tipo_pessoa CHECK (tipo_pessoa IN ('FISICA', 'JURIDICA')),
    CONSTRAINT uk_cliente_empresa_documento UNIQUE (empresa_id, documento)
);

CREATE INDEX idx_cliente_empresa_nome ON cliente (empresa_id, nome_busca);
CREATE INDEX idx_cliente_empresa_ativo ON cliente (empresa_id, ativo);
