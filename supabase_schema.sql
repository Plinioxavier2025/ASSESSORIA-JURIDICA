-- SCRIPT DE CRIAÇÃO E SEGURANÇA DE TABELAS - ÁVILA E SOUZA ADVOGADOS

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Remover trigger antigo e a tabela antiga se existirem para recriar a estrutura limpa
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.usuarios CASCADE;

-- 1. TABELA DE USUÁRIOS (PERFIS DE USUÁRIO - VINCULADOS AO AUTH.USERS)
CREATE TABLE public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    login TEXT NOT NULL UNIQUE,
    cargo TEXT NOT NULL CHECK (cargo IN ('Administrador', 'Operador')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABELA DE PROCESSOS E CLIENTES
CREATE TABLE IF NOT EXISTS public.processos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_cliente TEXT NOT NULL,
    numero_processo TEXT NOT NULL,
    telefone TEXT,
    observacoes TEXT,
    advogado_responsavel TEXT NOT NULL CHECK (advogado_responsavel IN ('Dra. Regina', 'Dr. Eloi', 'Dr. Walisson', 'Dra. Andreia', 'Dra. Iza')),
    data_cadastro DATE DEFAULT CURRENT_DATE NOT NULL,
    data_limite DATE NOT NULL,
    status_processo TEXT NOT NULL CHECK (status_processo IN ('Pendente', 'Em Andamento', 'Prazo Cumprido', 'Protocolado', 'Concluído')),
    prazo_concluido BOOLEAN DEFAULT FALSE NOT NULL,
    concluido_por TEXT, -- Nome do usuário que concluiu
    concluido_em TIMESTAMP WITH TIME ZONE, -- Data e hora de conclusão do prazo
    criado_por TEXT NOT NULL, -- Nome do usuário criador
    alterado_por TEXT, -- Nome do usuário que editou por último
    alterado_em TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABELA DE HISTÓRICO DE MOVIMENTAÇÕES (PERMANENTE - SEM DELETE)
CREATE TABLE IF NOT EXISTS public.historico_movimentacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    processo_id UUID NOT NULL REFERENCES public.processos(id) ON DELETE CASCADE,
    usuario_nome TEXT NOT NULL,
    acao TEXT NOT NULL,
    detalhes TEXT NOT NULL,
    data_hora TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABELA DE AUDITORIA DE SEGURANÇA
CREATE TABLE IF NOT EXISTS public.auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_nome TEXT NOT NULL,
    usuario_cargo TEXT NOT NULL,
    tipo_acao TEXT NOT NULL,
    detalhes TEXT NOT NULL,
    data_hora TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar Índices de performance
CREATE INDEX IF NOT EXISTS idx_processos_advogado ON public.processos(advogado_responsavel);
CREATE INDEX IF NOT EXISTS idx_processos_status ON public.processos(status_processo);
CREATE INDEX IF NOT EXISTS idx_historico_processo ON public.historico_movimentacoes(processo_id);

-- =========================================================================
-- HABILITAR ROW LEVEL SECURITY (RLS)
-- =========================================================================
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- FUNÇÕES DE SUPORTE À SEGURANÇA (SECURITY DEFINER)
-- =========================================================================

-- Retorna o cargo do usuário autenticado no Supabase Auth
CREATE OR REPLACE FUNCTION public.get_current_user_cargo()
RETURNS text AS $$
    SELECT cargo FROM public.usuarios WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Retorna o nome completo do usuário autenticado no Supabase Auth
CREATE OR REPLACE FUNCTION public.get_current_user_name()
RETURNS text AS $$
    SELECT nome FROM public.usuarios WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- =========================================================================
-- POLÍTICAS DE ACESSO (RLS POLICIES)
-- =========================================================================

-- --- 1. POLÍTICAS DA TABELA 'USUARIOS' ---
DROP POLICY IF EXISTS policy_usuarios_select ON public.usuarios;
CREATE POLICY policy_usuarios_select ON public.usuarios
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS policy_usuarios_write ON public.usuarios;
CREATE POLICY policy_usuarios_write ON public.usuarios
    FOR ALL TO authenticated USING (public.get_current_user_cargo() = 'Administrador');

-- --- 2. POLÍTICAS DA TABELA 'PROCESSOS' ---
-- Administradores acessam tudo. Operadores apenas seus processos (criados, concluídos ou sob responsabilidade).
DROP POLICY IF EXISTS policy_processos_select ON public.processos;
CREATE POLICY policy_processos_select ON public.processos
    FOR SELECT TO authenticated 
    USING (
        public.get_current_user_cargo() = 'Administrador' 
        OR (
            public.get_current_user_cargo() = 'Operador' 
            AND (
                criado_por = public.get_current_user_name() 
                OR concluido_por = public.get_current_user_name() 
                OR public.get_current_user_name() LIKE (advogado_responsavel || '%')
            )
        )
    );

DROP POLICY IF EXISTS policy_processos_insert ON public.processos;
CREATE POLICY policy_processos_insert ON public.processos
    FOR INSERT TO authenticated 
    WITH CHECK (true);

DROP POLICY IF EXISTS policy_processos_update ON public.processos;
CREATE POLICY policy_processos_update ON public.processos
    FOR UPDATE TO authenticated 
    USING (
        public.get_current_user_cargo() = 'Administrador' 
        OR (
            public.get_current_user_cargo() = 'Operador' 
            AND (
                criado_por = public.get_current_user_name() 
                OR public.get_current_user_name() LIKE (advogado_responsavel || '%')
            )
        )
    )
    WITH CHECK (
        public.get_current_user_cargo() = 'Administrador' 
        OR (
            public.get_current_user_cargo() = 'Operador' 
            AND (
                criado_por = public.get_current_user_name() 
                OR public.get_current_user_name() LIKE (advogado_responsavel || '%')
            )
        )
    );

DROP POLICY IF EXISTS policy_processos_delete ON public.processos;
CREATE POLICY policy_processos_delete ON public.processos
    FOR DELETE TO authenticated 
    USING (public.get_current_user_cargo() = 'Administrador');

-- --- 3. POLÍTICAS DA TABELA 'HISTORICO_MOVIMENTACOES' ---
-- Administradores acessam tudo. Operadores acessam se tiverem direito de ler o processo correspondente.
DROP POLICY IF EXISTS policy_historico_select ON public.historico_movimentacoes;
CREATE POLICY policy_historico_select ON public.historico_movimentacoes
    FOR SELECT TO authenticated 
    USING (
        public.get_current_user_cargo() = 'Administrador' 
        OR EXISTS (
            SELECT 1 FROM public.processos p 
            WHERE p.id = processo_id 
            AND (
                p.criado_por = public.get_current_user_name() 
                OR p.concluido_por = public.get_current_user_name() 
                OR public.get_current_user_name() LIKE (p.advogado_responsavel || '%')
            )
        )
    );

DROP POLICY IF EXISTS policy_historico_insert ON public.historico_movimentacoes;
CREATE POLICY policy_historico_insert ON public.historico_movimentacoes
    FOR INSERT TO authenticated 
    WITH CHECK (true);

-- --- 4. POLÍTICAS DA TABELA 'AUDITORIA' ---
-- Apenas Administradores podem visualizar. Usuários autenticados podem inserir.
DROP POLICY IF EXISTS policy_auditoria_select ON public.auditoria;
CREATE POLICY policy_auditoria_select ON public.auditoria
    FOR SELECT TO authenticated 
    USING (public.get_current_user_cargo() = 'Administrador');

DROP POLICY IF EXISTS policy_auditoria_insert ON public.auditoria;
CREATE POLICY policy_auditoria_insert ON public.auditoria
    FOR INSERT TO authenticated 
    WITH CHECK (true);

-- =========================================================================
-- TRIGGER DE SINCRONIZAÇÃO DE USUÁRIOS (AUTH -> PUBLIC.USUARIOS)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.usuarios (id, nome, email, login, cargo)
    VALUES (
        new.id,
        coalesce(new.raw_user_meta_data->>'nome', ''),
        new.email,
        coalesce(new.raw_user_meta_data->>'login', split_part(new.email, '@', 1)),
        coalesce(new.raw_user_meta_data->>'cargo', 'Operador')
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir que o trigger não cause duplicados se executado repetidas vezes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================================
-- RPCs PARA ADMINISTRAÇÃO DE USUÁRIOS (EVITA EXPOR SERVICE ROLE KEY)
-- =========================================================================

-- Criar usuário
CREATE OR REPLACE FUNCTION public.create_user_admin(
    p_email text,
    p_password text,
    p_nome text,
    p_login text,
    p_cargo text
)
RETURNS json AS $$
DECLARE
    new_user_id uuid;
    result json;
BEGIN
    IF public.get_current_user_cargo() != 'Administrador' THEN
        RAISE EXCEPTION 'Acesso negado. Apenas administradores podem criar usuários.';
    END IF;

    -- Inserir no esquema de autenticação do Supabase
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change_token_current,
        phone_change_token,
        reauthentication_token
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        p_email,
        crypt(p_password, gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}',
        json_build_object('nome', p_nome, 'login', p_login, 'cargo', p_cargo),
        now(),
        now(),
        '',
        '',
        '',
        '',
        '',
        ''
    )
    RETURNING id INTO new_user_id;

    SELECT json_build_object(
        'id', new_user_id,
        'nome', p_nome,
        'email', p_email,
        'login', p_login,
        'cargo', p_cargo
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Editar usuário (inclusive redefinir senha)
CREATE OR REPLACE FUNCTION public.edit_user_admin(
    p_user_id uuid,
    p_email text,
    p_password text,
    p_nome text,
    p_login text,
    p_cargo text
)
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    IF public.get_current_user_cargo() != 'Administrador' THEN
        RAISE EXCEPTION 'Acesso negado. Apenas administradores podem editar usuários.';
    END IF;

    IF p_password IS NOT NULL AND p_password != '' THEN
        UPDATE auth.users
        SET 
            email = p_email,
            encrypted_password = crypt(p_password, gen_salt('bf')),
            raw_user_meta_data = json_build_object('nome', p_nome, 'login', p_login, 'cargo', p_cargo),
            updated_at = now()
        WHERE id = p_user_id;
    ELSE
        UPDATE auth.users
        SET 
            email = p_email,
            raw_user_meta_data = json_build_object('nome', p_nome, 'login', p_login, 'cargo', p_cargo),
            updated_at = now()
        WHERE id = p_user_id;
    END IF;

    UPDATE public.usuarios
    SET
        nome = p_nome,
        email = p_email,
        login = p_login,
        cargo = p_cargo
    WHERE id = p_user_id;

    SELECT json_build_object(
        'id', p_user_id,
        'nome', p_nome,
        'email', p_email,
        'login', p_login,
        'cargo', p_cargo
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Excluir usuário
CREATE OR REPLACE FUNCTION public.delete_user_admin(
    p_user_id uuid
)
RETURNS boolean AS $$
BEGIN
    IF public.get_current_user_cargo() != 'Administrador' THEN
        RAISE EXCEPTION 'Acesso negado. Apenas administradores podem remover usuários.';
    END IF;

    DELETE FROM auth.users WHERE id = p_user_id;
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================================
-- SEED DE USUÁRIOS INICIAIS (NO SUPABASE AUTH E PUBLIC.USUARIOS VIA TRIGGER)
-- =========================================================================
DO $$
BEGIN
    -- 1. Administrador Master (Login: admin / Senha: 123)
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@aviladesouza.adv.br') THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
            confirmation_token, recovery_token, email_change_token_new, email_change_token_current, phone_change_token, reauthentication_token
        )
        VALUES (
            '00000000-0000-0000-0000-000000000000',
            '00000000-0000-0000-0000-000000000001',
            'authenticated',
            'authenticated',
            'admin@aviladesouza.adv.br',
            crypt('123', gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{"nome":"Administrador Master", "login":"admin", "cargo":"Administrador"}',
            now(),
            now(),
            '', '', '', '', '', ''
        );
    END IF;

    -- 2. Dra. Regina Silva (Login: regina / Senha: 123)
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'regina@aviladesouza.adv.br') THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
            confirmation_token, recovery_token, email_change_token_new, email_change_token_current, phone_change_token, reauthentication_token
        )
        VALUES (
            '00000000-0000-0000-0000-000000000000',
            '00000000-0000-0000-0000-000000000002',
            'authenticated',
            'authenticated',
            'regina@aviladesouza.adv.br',
            crypt('123', gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{"nome":"Dra. Regina Silva", "login":"regina", "cargo":"Operador"}',
            now(),
            now(),
            '', '', '', '', '', ''
        );
    END IF;

    -- 3. Dr. Eloi Souza (Login: eloi / Senha: 123)
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'eloi@aviladesouza.adv.br') THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
            confirmation_token, recovery_token, email_change_token_new, email_change_token_current, phone_change_token, reauthentication_token
        )
        VALUES (
            '00000000-0000-0000-0000-000000000000',
            '00000000-0000-0000-0000-000000000003',
            'authenticated',
            'authenticated',
            'eloi@aviladesouza.adv.br',
            crypt('123', gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{"nome":"Dr. Eloi Souza", "login":"eloi", "cargo":"Operador"}',
            now(),
            now(),
            '', '', '', '', '', ''
        );
    END IF;

    -- 4. Corrigir usuários existentes que possam estar com campos nulos (remediação automática)
    UPDATE auth.users
    SET 
        confirmation_token = COALESCE(confirmation_token, ''),
        recovery_token = COALESCE(recovery_token, ''),
        email_change_token_new = COALESCE(email_change_token_new, ''),
        email_change_token_current = COALESCE(email_change_token_current, ''),
        phone_change_token = COALESCE(phone_change_token, ''),
        reauthentication_token = COALESCE(reauthentication_token, ''),
        email_change = COALESCE(email_change, '');

END $$;
