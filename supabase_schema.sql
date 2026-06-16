-- SCRIPT DE CRIAÇÃO DE TABELAS - ÁVILA E SOUZA ADVOGADOS

-- Habilitar extensão UUID caso necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE USUÁRIOS
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    login TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL, -- Senha armazenada em hash SHA-256
    cargo TEXT NOT NULL CHECK (cargo IN ('Administrador', 'Operador')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABELA DE PROCESSOS E CLIENTES
CREATE TABLE IF NOT EXISTS processos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_cliente TEXT NOT NULL,
    numero_processo TEXT NOT NULL,
    telefone TEXT,
    observacoes TEXT,
    advogado_responsavel TEXT NOT NULL CHECK (advogado_responsavel IN ('Dra. Regina', 'Dr. Eloi', 'Walisson', 'Andreia', 'Iza')),
    data_cadastro DATE DEFAULT CURRENT_DATE NOT NULL,
    data_limite DATE NOT NULL,
    status_processo TEXT NOT NULL CHECK (status_processo IN ('Pendente', 'Em Andamento', 'Prazo Cumprido', 'Protocolado', 'Concluído')),
    concluido_por TEXT, -- Nome do usuário que concluiu
    concluido_em TIMESTAMP WITH TIME ZONE, -- Data e hora de conclusão do prazo
    criado_por TEXT NOT NULL, -- Nome do usuário criador
    alterado_por TEXT, -- Nome do usuário que editou por último
    alterado_em TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABELA DE HISTÓRICO DE MOVIMENTAÇÕES (PERMANENTE - SEM DELETE)
CREATE TABLE IF NOT EXISTS historico_movimentacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    processo_id UUID NOT NULL REFERENCES processos(id) ON DELETE CASCADE,
    usuario_nome TEXT NOT NULL,
    acao TEXT NOT NULL,
    detalhes TEXT NOT NULL,
    data_hora TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABELA DE AUDITORIA DE SEGURANÇA
CREATE TABLE IF NOT EXISTS auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_nome TEXT NOT NULL,
    usuario_cargo TEXT NOT NULL,
    tipo_acao TEXT NOT NULL,
    detalhes TEXT NOT NULL,
    data_hora TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar Índices de performance
CREATE INDEX IF NOT EXISTS idx_processos_advogado ON processos(advogado_responsavel);
CREATE INDEX IF NOT EXISTS idx_processos_status ON processos(status_processo);
CREATE INDEX IF NOT EXISTS idx_historico_processo ON historico_movimentacoes(processo_id);

-- Inserir Usuário Administrador Master Inicial
-- Login: admin / Senha: 123 (a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3)
INSERT INTO usuarios (nome, email, login, senha, cargo)
VALUES (
    'Administrador Master',
    'admin@aviladesouza.adv.br',
    'admin',
    'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
    'Administrador'
) ON CONFLICT (login) DO NOTHING;
