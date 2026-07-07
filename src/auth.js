import { getUsuarios, registrarAuditoria, isSupabaseConnected, getSupabase } from './db.js';

let currentUser = null;

// Helper nativo para gerar hash SHA-256 (seguro e limpo) - usado apenas no fallback local
export async function hashSenha(senhaPlana) {
  try {
    const msgUint8 = new TextEncoder().encode(senhaPlana);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  } catch (e) {
    console.error("Falha ao gerar hash nativo SHA-256. Retornando fallback não seguro.", e);
    // Fallback simples caso não esteja em contexto seguro (HTTPS/Localhost)
    let hash = 0;
    for (let i = 0; i < senhaPlana.length; i++) {
      const char = senhaPlana.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }
}

// Tenta restaurar a sessão do sessionStorage ao carregar a página
const savedSession = sessionStorage.getItem('as_session');
if (savedSession) {
  try {
    currentUser = JSON.parse(savedSession);
  } catch (e) {
    console.error("Erro ao ler sessão salva:", e);
  }
}

export function getCurrentUser() {
  return currentUser;
}

// Restaura a sessão oficial do Supabase Auth e sincroniza com o front-end
export async function restaurarSessaoSupabase() {
  if (isSupabaseConnected()) {
    try {
      const supabase = getSupabase();
      if (!supabase) return;
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (!error && session && session.user) {
        // Busca perfil atualizado na tabela public.usuarios
        const { data: profile, error: profileErr } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (!profileErr && profile) {
          currentUser = {
            id: profile.id,
            nome: profile.nome,
            email: profile.email,
            login: profile.login,
            cargo: profile.cargo,
            token: session.access_token
          };
          sessionStorage.setItem('as_session', JSON.stringify(currentUser));
        } else {
          // Fallback para os metadados do usuário
          currentUser = {
            id: session.user.id,
            nome: session.user.user_metadata?.nome || "Usuário",
            email: session.user.email,
            login: session.user.user_metadata?.login || session.user.email.split('@')[0],
            cargo: session.user.user_metadata?.cargo || "Operador",
            token: session.access_token
          };
          sessionStorage.setItem('as_session', JSON.stringify(currentUser));
        }
      }
    } catch (e) {
      console.error("Erro ao sincronizar sessão Supabase no início:", e);
    }
  }
}

// Login unificado: Supabase Auth (Oficial) com Fallback Local
export async function login(username, password) {
  let user = null;
  let errorMsg = null;
  
  if (isSupabaseConnected()) {
    try {
      const supabase = getSupabase();
      if (supabase) {
        // Tratamento para aceitar login via username:
        // Caso o usuário não digite o e-mail completo, completa-se automaticamente
        let email = username.trim();
        if (!email.includes('@')) {
          email = email.toLowerCase() + "@aviladesouza.adv.br";
        }
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password.trim()
        });
        
        if (error) {
          errorMsg = error.message;
          // Traduzir erros comuns de login
          if (errorMsg === "Invalid login credentials" || errorMsg.includes("invalid-credential") || errorMsg.includes("Invalid credentials")) {
            errorMsg = "E-mail ou senha incorretos.";
          } else if (errorMsg.includes("Email not confirmed")) {
            errorMsg = "E-mail cadastrado ainda não foi confirmado.";
          }
        } else if (data && data.user) {
          // Busca perfil do banco de dados (public.usuarios)
          const { data: profile, error: profileErr } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', data.user.id)
            .single();
            
          if (!profileErr && profile) {
            user = {
              id: profile.id,
              nome: profile.nome,
              email: profile.email,
              login: profile.login,
              cargo: profile.cargo,
              token: data.session?.access_token
            };
          } else {
            user = {
              id: data.user.id,
              nome: data.user.user_metadata?.nome || "Usuário",
              email: data.user.email,
              login: data.user.user_metadata?.login || username,
              cargo: data.user.user_metadata?.cargo || "Operador",
              token: data.session?.access_token
            };
          }
        }
      }
    } catch (e) {
      console.error("Erro na autenticação oficial do Supabase:", e);
      errorMsg = e.message;
    }
  }
  
  // Se o Supabase falhou ou não está conectado, faz o fallback para o banco local (LocalStorage)
  if (!user) {
    const hashedInput = await hashSenha(password.trim());
    let localUsers = [];
    try {
      const localData = localStorage.getItem('as_usuarios');
      localUsers = localData ? JSON.parse(localData) : [];
    } catch (e) {
      console.error("Erro ao ler usuários locais para fallback:", e);
    }
    
    // Se o localStorage estiver vazio, usa os padrões definidos no projeto
    if (localUsers.length === 0) {
      localUsers = [
        {
          id: "u-admin",
          nome: "Administrador Master",
          email: "admin@aviladesouza.adv.br",
          login: "admin",
          senha: "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
          cargo: "Administrador"
        },
        {
          id: "u-regina",
          nome: "Dra. Regina Silva",
          email: "regina@aviladesouza.adv.br",
          login: "regina",
          senha: "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
          cargo: "Operador"
        },
        {
          id: "u-eloi",
          nome: "Dr. Eloi Souza",
          email: "eloi@aviladesouza.adv.br",
          login: "eloi",
          senha: "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
          cargo: "Operador"
        }
      ];
    }

    const localUser = localUsers.find(u => u.login.trim().toLowerCase() === username.trim().toLowerCase() && u.senha === hashedInput);
    
    if (localUser) {
      user = {
        id: localUser.id,
        nome: localUser.nome,
        email: localUser.email,
        login: localUser.login,
        cargo: localUser.cargo
      };
    }
  }
  
  if (user) {
    currentUser = user;
    sessionStorage.setItem('as_session', JSON.stringify(currentUser));
    await registrarAuditoria("Login", `Usuário "${currentUser.nome}" realizou login com sucesso no sistema.`, currentUser);
    return currentUser;
  } else {
    await registrarAuditoria("Tentativa de Login", `Tentativa de login malsucedida para o usuário: "${username}".`, null);
    throw new Error(errorMsg || "E-mail ou senha incorretos.");
  }
}

// Encerramento de sessão oficial
export async function logout() {
  if (currentUser) {
    const userForAudit = { ...currentUser };
    currentUser = null;
    sessionStorage.removeItem('as_session');
    
    if (isSupabaseConnected()) {
      try {
        const supabase = getSupabase();
        if (supabase) {
          await supabase.auth.signOut();
        }
      } catch (e) {
        console.error("Erro ao realizar logout do Supabase:", e);
      }
    }
    
    await registrarAuditoria("Logout", `Usuário "${userForAudit.nome}" encerrou a sessão.`, userForAudit);
  }
}

// Alteração de senha do próprio usuário logado
export async function alterarSenhaPropria(senhaAtual, novaSenha) {
  if (!currentUser) {
    throw new Error("Usuário não autenticado.");
  }

  if (isSupabaseConnected()) {
    try {
      const supabase = getSupabase();
      if (supabase) {
        // 1. Validar a senha antiga realizando uma tentativa de login temporária
        let email = currentUser.email;
        const { error: loginErr } = await supabase.auth.signInWithPassword({
          email: email,
          password: senhaAtual.trim()
        });

        if (loginErr) {
          throw new Error("Senha atual incorreta.");
        }

        // 2. Atualizar a senha para o valor novo
        const { error } = await supabase.auth.updateUser({ password: novaSenha.trim() });
        if (error) {
          if (error.message.includes("at least 6 characters")) {
            throw new Error("A senha deve ter pelo menos 6 caracteres.");
          }
          throw new Error(error.message);
        }
      }
    } catch (e) {
      console.error("Erro ao alterar senha no Supabase:", e);
      throw e;
    }
  } else {
    // No fallback local, verificamos e salvamos no localStorage
    const usuarios = await getUsuarios();
    const idx = usuarios.findIndex(u => u.id === currentUser.id);
    if (idx !== -1) {
      const currentHashed = await hashSenha(senhaAtual.trim());
      if (usuarios[idx].senha !== currentHashed) {
        throw new Error("Senha atual incorreta.");
      }
      usuarios[idx].senha = await hashSenha(novaSenha.trim());
      localStorage.setItem('as_usuarios', JSON.stringify(usuarios));
    } else {
      throw new Error("Usuário não encontrado localmente.");
    }
  }
  await registrarAuditoria("Alteração de Senha", `O usuário "${currentUser.nome}" alterou sua própria senha com sucesso.`, currentUser);
}

export function isAdmin() {
  return currentUser && currentUser.cargo === 'Administrador';
}

export function isOperator() {
  return currentUser && currentUser.cargo === 'Operador';
}

// Controle fino de permissões
export function checkPermission(action) {
  if (!currentUser) return false;
  if (currentUser.cargo === 'Administrador') return true; // Administrador Master possui acesso completo
  
  // Permissões limitadas do Operador (Usuário Comum)
  const allowedOperatorActions = [
    'ver_dashboard',
    'ver_processos',
    'criar_processo',
    'editar_processo',
    'concluir_prazo',
    'ver_historico_processo',
    'adicionar_historico_processo',
    'ver_configuracoes'
  ];
  
  return allowedOperatorActions.includes(action);
}
