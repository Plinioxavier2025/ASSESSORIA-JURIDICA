import { getUsuarios, registrarAuditoria, isSupabaseConnected, secureLogin } from './db.js';

let currentUser = null;

// Helper nativo para gerar hash SHA-256 (seguro e limpo)
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

// Tenta restaurar a sessão ao carregar a página
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

export async function login(username, password) {
  const hashedInput = await hashSenha(password.trim());
  let user = null;
  
  if (isSupabaseConnected()) {
    user = await secureLogin(username, hashedInput);
  }
  
  if (!user) {
    // Fallback local
    const users = await getUsuarios();
    user = users.find(u => u.login.trim().toLowerCase() === username.trim().toLowerCase() && u.senha === hashedInput);
  }
  
  if (user) {
    currentUser = {
      id: user.id,
      nome: user.nome,
      email: user.email,
      login: user.login,
      cargo: user.cargo,
      password_hash: hashedInput // Salva o hash da senha na sessão para autenticação no banco
    };
    sessionStorage.setItem('as_session', JSON.stringify(currentUser));
    
    await registrarAuditoria("Login", `Usuário "${currentUser.nome}" realizou login com sucesso no sistema.`, currentUser);
    return currentUser;
  } else {
    await registrarAuditoria("Tentativa de Login", `Tentativa de login malsucedida para o usuário: "${username}".`, null);
    throw new Error("Usuário ou senha incorretos!");
  }
}

export async function logout() {
  if (currentUser) {
    const userForAudit = { ...currentUser };
    currentUser = null;
    sessionStorage.removeItem('as_session');
    await registrarAuditoria("Logout", `Usuário "${userForAudit.nome}" encerrou a sessão.`, userForAudit);
  }
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
    'adicionar_historico_processo'
  ];
  
  // Ações bloqueadas explicitamente para Operador:
  // - 'criar_usuario', 'editar_usuario', 'deletar_usuario' (Gerenciamento de Usuários)
  // - 'alterar_senhas_outros' (Segurança de credenciais de terceiros)
  // - 'alterar_configuracoes' (Configurações globais de conexão Supabase)
  // - 'excluir_processo' (Apenas administradores podem remover por segurança jurídica)
  
  return allowedOperatorActions.includes(action);
}
