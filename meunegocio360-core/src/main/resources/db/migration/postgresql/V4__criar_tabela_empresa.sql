CREATE TABLE empresa (
    id UUID NOT NULL,
    razao_social VARCHAR(150) NOT NULL,
    nome_fantasia VARCHAR(150),
    cnpj VARCHAR(14) NOT NULL,
    email VARCHAR(160),
    telefone VARCHAR(11),
    fuso_horario VARCHAR(50) NOT NULL DEFAULT 'America/Sao_Paulo',
    moeda VARCHAR(3) NOT NULL DEFAULT 'BRL',
    ativa BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ(6) NOT NULL,
    atualizado_em TIMESTAMPTZ(6) NOT NULL,
    versao BIGINT NOT NULL,
    CONSTRAINT pk_empresa PRIMARY KEY (id),
    CONSTRAINT uk_empresa_cnpj UNIQUE (cnpj)
);

CREATE UNIQUE INDEX uk_empresa_ativa_unica
    ON empresa ((1))
    WHERE ativa;
