// ----------------- ABSTRAÇÃO DE DADOS (SUPABASE / LOCAL FALLBACK) -----------------
import { getCurrentUser } from './auth.js';

let supabase = null;

// Tenta carregar do import.meta.env (Vite env vars) ou usa os padrões do projeto
const ENV_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://qtwpqyfgedwsvziqorht.supabase.co";
const ENV_SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_dFSD8w6tT78Tvj-MGR-Flw_DMzjc81V";

// Função para inicializar o cliente Supabase
export function initSupabase(url, key) {
  if (url && key) {
    try {
      if (!window.supabase) {
        console.error("Biblioteca cliente do Supabase não encontrada no escopo window.");
        return false;
      }
      
      // Sanitizar a URL (remover barra no final e /rest/v1 se houver)
      let sanitizedUrl = url.trim().replace(/\/+$/, "");
      if (sanitizedUrl.endsWith("/rest/v1")) {
        sanitizedUrl = sanitizedUrl.substring(0, sanitizedUrl.length - 8);
      }
      sanitizedUrl = sanitizedUrl.replace(/\/+$/, "");

      supabase = window.supabase.createClient(sanitizedUrl, key);
      localStorage.setItem('as_supabase_url', sanitizedUrl);
      localStorage.setItem('as_supabase_key', key);
      return true;
    } catch (e) {
      console.error("Erro ao inicializar Supabase:", e);
      return false;
    }
  }
  return false;
}

export async function secureLogin(username, passwordHash) {
  if (isSupabaseConnected()) {
    try {
      const { data, error } = await supabase.rpc('secure_login', {
        p_login: username,
        p_password_hash: passwordHash
      });
      if (!error && data && data.length > 0) {
        return data[0];
      } else if (error) {
        console.error("Erro no Supabase secureLogin:", error.message);
      }
    } catch (e) {
      console.error("Erro no Supabase secureLogin:", e);
    }
  }
  return null;
}

// Inicialização automática com dados salvos ou de ambiente
const savedUrl = localStorage.getItem('as_supabase_url') || ENV_SUPABASE_URL;
const savedKey = localStorage.getItem('as_supabase_key') || ENV_SUPABASE_KEY;

if (savedUrl && savedKey) {
  if (window.supabase) {
    initSupabase(savedUrl, savedKey);
  } else {
    window.addEventListener('load', () => {
      if (window.supabase) {
        initSupabase(savedUrl, savedKey);
      }
    });
  }
}

export function isSupabaseConnected() {
  return supabase !== null;
}

export function getSupabaseCredentials() {
  return {
    url: localStorage.getItem('as_supabase_url') || '',
    key: localStorage.getItem('as_supabase_key') || ''
  };
}

export function disconnectSupabase() {
  supabase = null;
  localStorage.removeItem('as_supabase_url');
  localStorage.removeItem('as_supabase_key');
}

// ----------------- MOCK DATA E VALORES PADRÃO (LOCAL STORAGE) -----------------
// Senha criptografada "123" em SHA-256: a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3
const DEFAULT_USERS = [
  {
    id: "u-admin",
    nome: "Administrador Master",
    email: "admin@aviladesouza.adv.br",
    login: "admin",
    senha: "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
    cargo: "Administrador",
    created_at: "2026-06-01T09:00:00.000Z"
  },
  {
    id: "u-regina",
    nome: "Dra. Regina Silva",
    email: "regina@aviladesouza.adv.br",
    login: "regina",
    senha: "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
    cargo: "Operador",
    created_at: "2026-06-02T10:00:00.000Z"
  },
  {
    id: "u-eloi",
    nome: "Dr. Eloi Souza",
    email: "eloi@aviladesouza.adv.br",
    login: "eloi",
    senha: "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
    cargo: "Operador",
    created_at: "2026-06-02T10:05:00.000Z"
  }
];

// Prazos simulados baseados na data atual de 15/06/2026
const DEFAULT_PROCESSES = [
  {
    id: "p-1",
    nome_cliente: "Ana Silva Ramos",
    numero_processo: "5001234-56.2026.8.13.0024",
    telefone: "(31) 98888-1111",
    observacoes: "Contestar ação de cobrança indevida. Anexar comprovantes de pagamento de 2025.",
    advogado_responsavel: "Dra. Regina",
    data_cadastro: "2026-06-01",
    data_limite: "2026-06-29", // 14 dias (Azul)
    status_processo: "Pendente",
    prazo_concluido: false,
    created_at: "2026-06-01T14:30:00.000Z",
    criado_por: "Administrador Master"
  },
  {
    id: "p-2",
    nome_cliente: "Bruno Costa Neves",
    numero_processo: "5005678-12.2026.8.13.0024",
    telefone: "(31) 97777-2222",
    observacoes: "Apresentar réplica à contestação do réu. Foco na ilegitimidade passiva alegada.",
    advogado_responsavel: "Dr. Eloi",
    data_cadastro: "2026-06-05",
    data_limite: "2026-06-23", // 8 dias (Verde)
    status_processo: "Em Andamento",
    prazo_concluido: false,
    created_at: "2026-06-05T10:15:00.000Z",
    criado_por: "Administrador Master"
  },
  {
    id: "p-3",
    nome_cliente: "Carlos Oliveira Mendes",
    numero_processo: "5012345-89.2026.8.13.0024",
    telefone: "(31) 96666-3333",
    observacoes: "Manifestar sobre laudo pericial técnico de insalubridade do trabalho.",
    advogado_responsavel: "Walisson",
    data_cadastro: "2026-06-10",
    data_limite: "2026-06-19", // 4 dias (Amarelo)
    status_processo: "Pendente",
    prazo_concluido: false,
    created_at: "2026-06-10T16:40:00.000Z",
    criado_por: "Administrador Master"
  },
  {
    id: "p-4",
    nome_cliente: "Daniela Rezende Pinto",
    numero_processo: "5034567-23.2026.8.13.0024",
    telefone: "(31) 95555-4444",
    observacoes: "Protocolar Recurso Inominado contra sentença de improcedência.",
    advogado_responsavel: "Andreia",
    data_cadastro: "2026-06-12",
    data_limite: "2026-06-17", // 2 dias (Vermelho)
    status_processo: "Em Andamento",
    prazo_concluido: false,
    created_at: "2026-06-12T11:20:00.000Z",
    criado_por: "Dra. Regina Silva"
  },
  {
    id: "p-5",
    nome_cliente: "Eduardo Santos Lima",
    numero_processo: "5045678-90.2026.8.13.0024",
    telefone: "(31) 94444-5555",
    observacoes: "Contrarrazões de Apelação cível atrasadas. Entrar em contato com o juízo urgente.",
    advogado_responsavel: "Iza",
    data_cadastro: "2026-05-20",
    data_limite: "2026-06-12", // Vencido (-3 dias) (Atrasado/Vermelho)
    status_processo: "Pendente",
    prazo_concluido: false,
    created_at: "2026-05-20T09:15:00.000Z",
    criado_por: "Administrador Master"
  },
  {
    id: "p-6",
    nome_cliente: "Felipe Andrade Marques",
    numero_processo: "5056789-01.2026.8.13.0024",
    telefone: "(31) 93333-6666",
    observacoes: "Manifestação sobre cálculo de liquidação protocolada e concluída.",
    advogado_responsavel: "Dra. Regina",
    data_cadastro: "2026-06-01",
    data_limite: "2026-06-25",
    status_processo: "Concluído",
    prazo_concluido: true,
    concluido_por: "Dra. Regina Silva",
    concluido_em: "2026-06-10T14:30:00.000Z",
    created_at: "2026-06-01T10:00:00.000Z",
    criado_por: "Dra. Regina Silva"
  }
];

const DEFAULT_HISTORY = [
  {
    id: "h-1",
    processo_id: "p-1",
    usuario_nome: "Administrador Master",
    acao: "Abertura de Processo",
    detalhes: "Processo cadastrado inicialmente com status Pendente.",
    data_hora: "2026-06-01T14:30:00.000Z"
  },
  {
    id: "h-2",
    processo_id: "p-2",
    usuario_nome: "Administrador Master",
    acao: "Abertura de Processo",
    detalhes: "Processo cadastrado inicialmente com status Em Andamento.",
    data_hora: "2026-06-05T10:15:00.000Z"
  },
  {
    id: "h-3",
    processo_id: "p-3",
    usuario_nome: "Administrador Master",
    acao: "Abertura de Processo",
    detalhes: "Processo cadastrado inicialmente com status Pendente.",
    data_hora: "2026-06-10T16:40:00.000Z"
  },
  {
    id: "h-4",
    processo_id: "p-4",
    usuario_nome: "Dra. Regina Silva",
    acao: "Abertura de Processo",
    detalhes: "Processo cadastrado inicialmente com status Em Andamento.",
    data_hora: "2026-06-12T11:20:00.000Z"
  },
  {
    id: "h-5",
    processo_id: "p-5",
    usuario_nome: "Administrador Master",
    acao: "Abertura de Processo",
    detalhes: "Processo cadastrado inicialmente com status Pendente.",
    data_hora: "2026-05-20T09:15:00.000Z"
  },
  {
    id: "h-6",
    processo_id: "p-6",
    usuario_nome: "Dra. Regina Silva",
    acao: "Abertura de Processo",
    detalhes: "Processo cadastrado inicialmente com status Pendente.",
    data_hora: "2026-06-01T10:00:00.000Z"
  },
  {
    id: "h-7",
    processo_id: "p-6",
    usuario_nome: "Dra. Regina Silva",
    acao: "Conclusão de Prazo",
    detalhes: "Prazo concluído e processo movido para seção correspondente.",
    data_hora: "2026-06-10T14:30:00.000Z"
  }
];

const DEFAULT_AUDITS = [
  {
    id: "a-1",
    usuario_nome: "Sistema",
    usuario_cargo: "Administrador",
    tipo_acao: "Inicialização do Sistema",
    detalhes: "Banco de dados local emulado carregado com dados de demonstração.",
    data_hora: "2026-06-15T09:00:00.000Z"
  }
];

// Métodos auxiliares do LocalStorage
function getLocalTable(key, defaultData) {
  const data = localStorage.getItem(`as_${key}`);
  if (!data) {
    localStorage.setItem(`as_${key}`, JSON.stringify(defaultData));
    return defaultData;
  }
  return JSON.parse(data);
}

function saveLocalTable(key, data) {
  localStorage.setItem(`as_${key}`, JSON.stringify(data));
}

// Inicializador de Local Storage
export function initLocalData() {
  getLocalTable('usuarios', DEFAULT_USERS);
  getLocalTable('processos', DEFAULT_PROCESSES);
  getLocalTable('historico', DEFAULT_HISTORY);
  getLocalTable('auditoria', DEFAULT_AUDITS);
  
  // Registrar data do último backup local se não houver
  if (!localStorage.getItem('as_last_backup_time')) {
    localStorage.setItem('as_last_backup_time', new Date().toLocaleString('pt-BR'));
  }
}

// Inicializa imediatamente
initLocalData();

// ----------------- IMPLEMENTAÇÃO DA API DE AUDITORIA -----------------
export async function registrarAuditoria(tipo_acao, detalhes, usuario) {
  const nomeUser = usuario ? usuario.nome : "Sistema";
  const cargoUser = usuario ? usuario.cargo : "Administrador";
  const currentUser = getCurrentUser();
  const loginName = currentUser ? currentUser.login : "Sistema";
  const passwordHash = currentUser ? currentUser.password_hash : "";

  if (isSupabaseConnected()) {
    try {
      const { error } = await supabase.rpc('secure_registrar_auditoria', {
        p_login: loginName,
        p_password_hash: passwordHash,
        p_tipo_acao: tipo_acao,
        p_detalhes: detalhes,
        p_usuario_nome: nomeUser,
        p_usuario_cargo: cargoUser
      });
      if (!error) return;
    } catch (e) {
      console.error("Erro no Supabase auditoria, usando fallback local", e);
    }
  }

  // Fallback Local Storage
  const audits = getLocalTable('auditoria', DEFAULT_AUDITS);
  audits.unshift({
    id: `a-${Date.now()}`,
    usuario_nome: nomeUser,
    usuario_cargo: cargoUser,
    data_hora: new Date().toISOString(),
    tipo_acao,
    detalhes
  });
  saveLocalTable('auditoria', audits);
}

// ----------------- IMPLEMENTAÇÃO DA API DE USUÁRIOS -----------------
export async function getUsuarios() {
  if (isSupabaseConnected()) {
    const currentUser = getCurrentUser();
    const loginName = currentUser ? currentUser.login : "";
    const passwordHash = currentUser ? currentUser.password_hash : "";
    try {
      const { data, error } = await supabase.rpc('secure_get_usuarios', {
        p_login: loginName,
        p_password_hash: passwordHash
      });
      if (!error) return data;
    } catch (e) {
      console.error("Erro no Supabase getUsuarios, usando local", e);
    }
  }
  return getLocalTable('usuarios', DEFAULT_USERS);
}

export async function addUsuario(usuarioData, currentUser) {
  let novoUsuario = null;
  const adminUser = getCurrentUser();
  const loginName = adminUser ? adminUser.login : "";
  const passwordHash = adminUser ? adminUser.password_hash : "";

  if (isSupabaseConnected()) {
    try {
      const { data, error } = await supabase.rpc('secure_add_usuario', {
        p_login: loginName,
        p_password_hash: passwordHash,
        p_novo_nome: usuarioData.nome,
        p_novo_email: usuarioData.email,
        p_novo_login: usuarioData.login,
        p_nova_senha: usuarioData.senha,
        p_novo_cargo: usuarioData.cargo
      });
      if (!error && data) {
        novoUsuario = data;
      } else if (error) {
        throw new Error(error.message);
      }
    } catch (e) {
      console.error("Erro no Supabase addUsuario, usando local fallback", e);
      throw e;
    }
  }

  if (!novoUsuario) {
    const usuarios = getLocalTable('usuarios', DEFAULT_USERS);
    if (usuarios.some(u => u.login === usuarioData.login || (usuarioData.email && u.email === usuarioData.email))) {
      throw new Error("Usuário (login) ou E-mail já cadastrado!");
    }
    novoUsuario = {
      id: `u-${Date.now()}`,
      ...usuarioData,
      created_at: new Date().toISOString()
    };
    usuarios.push(novoUsuario);
    saveLocalTable('usuarios', usuarios);
  }

  await registrarAuditoria("Cadastro de Usuário", `Usuário "${novoUsuario.nome}" (${novoUsuario.cargo}) cadastrado.`, currentUser);
  return novoUsuario;
}

export async function editUsuario(id, usuarioData, currentUser) {
  let usuarioEditado = null;
  const adminUser = getCurrentUser();
  const loginName = adminUser ? adminUser.login : "";
  const passwordHash = adminUser ? adminUser.password_hash : "";

  if (isSupabaseConnected()) {
    try {
      const { data, error } = await supabase.rpc('secure_edit_usuario', {
        p_login: loginName,
        p_password_hash: passwordHash,
        p_usuario_id: id,
        p_edit_nome: usuarioData.nome,
        p_edit_email: usuarioData.email,
        p_edit_login: usuarioData.login,
        p_edit_senha: usuarioData.senha || null,
        p_edit_cargo: usuarioData.cargo
      });
      if (!error && data) {
        usuarioEditado = data;
      } else if (error) {
        throw new Error(error.message);
      }
    } catch (e) {
      console.error("Erro no Supabase editUsuario", e);
      throw e;
    }
  }

  if (!usuarioEditado) {
    const usuarios = getLocalTable('usuarios', DEFAULT_USERS);
    const index = usuarios.findIndex(u => u.id === id);
    if (index !== -1) {
      usuarios[index] = { ...usuarios[index], ...usuarioData };
      usuarioEditado = usuarios[index];
      saveLocalTable('usuarios', usuarios);
    } else {
      throw new Error("Usuário não encontrado localmente.");
    }
  }

  await registrarAuditoria("Edição de Usuário", `Dados do usuário "${usuarioEditado.nome}" foram alterados.`, currentUser);
  return usuarioEditado;
}

export async function deleteUsuario(id, currentUser) {
  let excluido = false;
  const adminUser = getCurrentUser();
  const loginName = adminUser ? adminUser.login : "";
  const passwordHash = adminUser ? adminUser.password_hash : "";

  if (isSupabaseConnected()) {
    try {
      const { data, error } = await supabase.rpc('secure_delete_usuario', {
        p_login: loginName,
        p_password_hash: passwordHash,
        p_usuario_id: id
      });
      if (!error && data) {
        excluido = true;
      } else if (error) {
        throw new Error(error.message);
      }
    } catch (e) {
      console.error("Erro no Supabase deleteUsuario", e);
      throw e;
    }
  }

  const usuarios = getLocalTable('usuarios', DEFAULT_USERS);
  const index = usuarios.findIndex(u => u.id === id);
  if (index !== -1) {
    const nomeExcluido = usuarios[index].nome;
    usuarios.splice(index, 1);
    saveLocalTable('usuarios', usuarios);
    excluido = true;
    await registrarAuditoria("Exclusão de Usuário", `Usuário "${nomeExcluido}" foi removido do sistema.`, currentUser);
  }

  if (!excluido) {
    throw new Error("Usuário não encontrado.");
  }
  return true;
}

// ----------------- IMPLEMENTAÇÃO DA API DE PROCESSOS -----------------
export async function getProcessos() {
  if (isSupabaseConnected()) {
    const currentUser = getCurrentUser();
    const loginName = currentUser ? currentUser.login : "";
    const passwordHash = currentUser ? currentUser.password_hash : "";
    try {
      const { data, error } = await supabase.rpc('secure_get_processos', {
        p_login: loginName,
        p_password_hash: passwordHash
      });
      if (!error) return data;
    } catch (e) {
      console.error("Erro no Supabase getProcessos, usando local fallback", e);
    }
  }
  return getLocalTable('processos', DEFAULT_PROCESSES);
}

export async function addProcesso(processoData, currentUser) {
  let novoProcesso = null;
  const criadoPorNome = currentUser ? currentUser.nome : "Sistema";
  const loginName = currentUser ? currentUser.login : "";
  const passwordHash = currentUser ? currentUser.password_hash : "";

  const payload = {
    ...processoData,
    prazo_concluido: false,
    criado_por: criadoPorNome
  };

  if (isSupabaseConnected()) {
    try {
      const { data, error } = await supabase.rpc('secure_add_processo', {
        p_login: loginName,
        p_password_hash: passwordHash,
        p_nome_cliente: processoData.nome_cliente,
        p_numero_processo: processoData.numero_processo,
        p_telefone: processoData.telefone,
        p_observacoes: processoData.observacoes,
        p_advogado_responsavel: processoData.advogado_responsavel,
        p_data_limite: processoData.data_limite,
        p_status_processo: processoData.status_processo,
        p_criado_por: criadoPorNome
      });
      if (!error && data) {
        novoProcesso = data;
        await supabase.rpc('secure_add_historico', {
          p_login: loginName,
          p_password_hash: passwordHash,
          p_processo_id: novoProcesso.id,
          p_usuario_nome: criadoPorNome,
          p_acao: "Abertura de Processo",
          p_detalhes: `Processo cadastrado inicialmente para o advogado ${processoData.advogado_responsavel} com status ${processoData.status_processo}.` + (processoData.observacoes ? ` Observações: ${processoData.observacoes}` : '')
        });
      } else if (error) {
        throw new Error(error.message);
      }
    } catch (e) {
      console.error("Erro no Supabase addProcesso, usando local", e);
    }
  }

  if (!novoProcesso) {
    const processos = getLocalTable('processos', DEFAULT_PROCESSES);
    novoProcesso = {
      id: `p-${Date.now()}`,
      ...payload,
      created_at: new Date().toISOString()
    };
    processos.unshift(novoProcesso);
    saveLocalTable('processos', processos);

    // Salvar histórico inicial local
    const historicos = getLocalTable('historico', DEFAULT_HISTORY);
    historicos.push({
      id: `h-${Date.now()}`,
      processo_id: novoProcesso.id,
      usuario_nome: criadoPorNome,
      acao: "Abertura de Processo",
      detalhes: `Processo cadastrado inicialmente para o advogado ${processoData.advogado_responsavel} com status ${processoData.status_processo}.` + (payload.observacoes ? ` Observações: ${payload.observacoes}` : ''),
      data_hora: new Date().toISOString()
    });
    saveLocalTable('historico', historicos);
  }

  await registrarAuditoria("Cadastro de Processo", `Processo do cliente "${novoProcesso.nome_cliente}" cadastrado sob responsabilidade de ${novoProcesso.advogado_responsavel}.`, currentUser);
  return novoProcesso;
}

export async function editProcesso(id, processoData, currentUser) {
  let processoEditado = null;
  const alteradoPorNome = currentUser ? currentUser.nome : "Sistema";
  const loginName = currentUser ? currentUser.login : "";
  const passwordHash = currentUser ? currentUser.password_hash : "";

  if (isSupabaseConnected()) {
    try {
      // Obter processo antigo para auditar mudanças de status
      const { data: oldProcList } = await supabase.rpc('secure_get_processos', {
        p_login: loginName,
        p_password_hash: passwordHash
      });
      const oldProc = oldProcList ? oldProcList.find(p => p.id === id) : null;
      
      const { data, error } = await supabase.rpc('secure_edit_processo', {
        p_login: loginName,
        p_password_hash: passwordHash,
        p_processo_id: id,
        p_nome_cliente: processoData.nome_cliente,
        p_numero_processo: processoData.numero_processo,
        p_telefone: processoData.telefone,
        p_observacoes: processoData.observacoes,
        p_advogado_responsavel: processoData.advogado_responsavel,
        p_data_limite: processoData.data_limite,
        p_status_processo: processoData.status_processo,
        p_alterado_por: alteradoPorNome
      });
      
      if (!error && data) {
        processoEditado = data;

        // Verificar se mudou status, advogado ou observações para registrar histórico
        let mudancas = [];
        if (oldProc) {
          if (oldProc.status_processo !== processoEditado.status_processo) {
            mudancas.push(`Status alterado de "${oldProc.status_processo}" para "${processoEditado.status_processo}".`);
          }
          if (oldProc.advogado_responsavel !== processoEditado.advogado_responsavel) {
            mudancas.push(`Responsável alterado de "${oldProc.advogado_responsavel}" para "${processoEditado.advogado_responsavel}".`);
          }
          if (oldProc.data_limite !== processoEditado.data_limite) {
            mudancas.push(`Data limite do prazo alterada de "${oldProc.data_limite}" para "${processoEditado.data_limite}".`);
          }
          if (oldProc.observacoes !== processoEditado.observacoes) {
            mudancas.push(`Observações atualizadas para: "${processoEditado.observacoes || ''}".`);
          }
        }

        if (mudancas.length === 0) {
          mudancas.push("Dados cadastrais do processo alterados.");
        }

        await supabase.rpc('secure_add_historico', {
          p_login: loginName,
          p_password_hash: passwordHash,
          p_processo_id: id,
          p_usuario_nome: alteradoPorNome,
          p_acao: "Alteração de Cadastro",
          p_detalhes: mudancas.join(" | ")
        });
      } else if (error) {
        throw new Error(error.message);
      }
    } catch (e) {
      console.error("Erro no Supabase editProcesso", e);
    }
  }

  if (!processoEditado) {
    const processos = getLocalTable('processos', DEFAULT_PROCESSES);
    const index = processos.findIndex(p => p.id === id);
    if (index !== -1) {
      const oldProc = processos[index];
      
      let mudancas = [];
      if (oldProc.status_processo !== payload.status_processo) {
        mudancas.push(`Status alterado de "${oldProc.status_processo}" para "${payload.status_processo}".`);
      }
      if (oldProc.advogado_responsavel !== payload.advogado_responsavel) {
        mudancas.push(`Responsável alterado de "${oldProc.advogado_responsavel}" para "${payload.advogado_responsavel}".`);
      }
      if (oldProc.data_limite !== payload.data_limite) {
        mudancas.push(`Data limite do prazo alterada de "${oldProc.data_limite}" para "${payload.data_limite}".`);
      }
      if (oldProc.observacoes !== payload.observacoes) {
        mudancas.push(`Observações atualizadas para: "${payload.observacoes || ''}".`);
      }

      if (mudancas.length === 0) {
        mudancas.push("Dados cadastrais do processo alterados.");
      }

      processos[index] = { ...oldProc, ...payload };
      processoEditado = processos[index];
      saveLocalTable('processos', processos);

      // Histórico
      const historicos = getLocalTable('historico', DEFAULT_HISTORY);
      historicos.push({
        id: `h-${Date.now()}`,
        processo_id: id,
        usuario_nome: alteradoPorNome,
        acao: "Alteração de Cadastro",
        detalhes: mudancas.join(" | "),
        data_hora: new Date().toISOString()
      });
      saveLocalTable('historico', historicos);
    } else {
      throw new Error("Processo não encontrado.");
    }
  }

  await registrarAuditoria("Edição de Processo", `Processo do cliente "${processoEditado.nome_cliente}" (Nº ${processoEditado.numero_processo}) alterado por ${alteradoPorNome}.`, currentUser);
  return processoEditado;
}

export async function deleteProcesso(id, currentUser) {
  let excluido = false;
  const loginName = currentUser ? currentUser.login : "";
  const passwordHash = currentUser ? currentUser.password_hash : "";

  if (isSupabaseConnected()) {
    try {
      const { data, error } = await supabase.rpc('secure_delete_processo', {
        p_login: loginName,
        p_password_hash: passwordHash,
        p_processo_id: id
      });
      if (!error && data) {
        excluido = true;
      }
    } catch (e) {
      console.error("Erro no Supabase deleteProcesso", e);
    }
  }

  const processos = getLocalTable('processos', DEFAULT_PROCESSES);
  const index = processos.findIndex(p => p.id === id);
  if (index !== -1) {
    const nomeCliente = processos[index].nome_cliente;
    const numProcesso = processos[index].numero_processo;
    
    // Deleta o processo
    processos.splice(index, 1);
    saveLocalTable('processos', processos);

    // Deleta os históricos vinculados
    const historicos = getLocalTable('historico', DEFAULT_HISTORY);
    const historicosFiltrados = historicos.filter(h => h.processo_id !== id);
    saveLocalTable('historico', historicosFiltrados);

    excluido = true;
    await registrarAuditoria("Exclusão de Processo", `Processo Nº "${numProcesso}" do cliente "${nomeCliente}" excluído definitivamente.`, currentUser);
  }

  if (!excluido) {
    throw new Error("Processo não encontrado.");
  }
  return true;
}

// ----------------- HISTÓRICO DE MOVIMENTAÇÕES -----------------
export async function getHistoricoPorProcesso(processoId) {
  if (isSupabaseConnected()) {
    const currentUser = getCurrentUser();
    const loginName = currentUser ? currentUser.login : "";
    const passwordHash = currentUser ? currentUser.password_hash : "";
    try {
      const { data, error } = await supabase.rpc('secure_get_historico', {
        p_login: loginName,
        p_password_hash: passwordHash,
        p_processo_id: processoId
      });
      if (!error) return data;
    } catch (e) {
      console.error("Erro no Supabase getHistoricoPorProcesso", e);
    }
  }
  const hist = getLocalTable('historico', DEFAULT_HISTORY);
  return hist
    .filter(h => h.processo_id === processoId)
    .sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora));
}

export async function addHistorico(processoId, acao, detalhes, currentUser) {
  let novoHistorico = null;
  const usuarioNome = currentUser ? currentUser.nome : "Sistema";
  const loginName = currentUser ? currentUser.login : "";
  const passwordHash = currentUser ? currentUser.password_hash : "";

  if (isSupabaseConnected()) {
    try {
      const { data, error } = await supabase.rpc('secure_add_historico', {
        p_login: loginName,
        p_password_hash: passwordHash,
        p_processo_id: processoId,
        p_usuario_nome: usuarioNome,
        p_acao: acao,
        p_detalhes: detalhes
      });
      if (!error && data) {
        novoHistorico = data;
      }
    } catch (e) {
      console.error("Erro no Supabase addHistorico", e);
    }
  }

  if (!novoHistorico) {
    const historicos = getLocalTable('historico', DEFAULT_HISTORY);
    novoHistorico = {
      id: `h-${Date.now()}`,
      ...payload,
      data_hora: new Date().toISOString()
    };
    historicos.push(novoHistorico);
    saveLocalTable('historico', historicos);
  }

  return novoHistorico;
}

// ----------------- CONCLUIR PRAZO (REQUISITO EXPECÍFICO) -----------------
export async function concluirPrazo(processoId, currentUser) {
  let processoEditado = null;
  const concluidoPorNome = currentUser ? currentUser.nome : "Sistema";
  const loginName = currentUser ? currentUser.login : "";
  const passwordHash = currentUser ? currentUser.password_hash : "";

  if (isSupabaseConnected()) {
    try {
      const { data, error } = await supabase.rpc('secure_concluir_prazo', {
        p_login: loginName,
        p_password_hash: passwordHash,
        p_processo_id: processoId,
        p_concluido_por: concluidoPorNome
      });
      
      if (!error && data) {
        processoEditado = data;
        const dataHoraConclusao = processoEditado.concluido_em;
        
        // Registrar histórico permanente da conclusão no Supabase
        await supabase.rpc('secure_add_historico', {
          p_login: loginName,
          p_password_hash: passwordHash,
          p_processo_id: processoId,
          p_usuario_nome: concluidoPorNome,
          p_acao: "Conclusão de Prazo",
          p_detalhes: `Prazo concluído por ${concluidoPorNome} em ${new Date(dataHoraConclusao).toLocaleDateString('pt-BR')} às ${new Date(dataHoraConclusao).toLocaleTimeString('pt-BR')}. Processo movido para a seção "Em Andamento".`
        });
      } else if (error) {
        throw new Error(error.message);
      }
    } catch (e) {
      console.error("Erro no Supabase concluirPrazo, local fallback executado", e);
    }
  }

  if (!processoEditado) {
    const processos = getLocalTable('processos', DEFAULT_PROCESSES);
    const index = processos.findIndex(p => p.id === processoId);
    if (index !== -1) {
      processos[index] = { ...processos[index], ...payload };
      processoEditado = processos[index];
      saveLocalTable('processos', processos);

      // Salvar histórico local
      const historicos = getLocalTable('historico', DEFAULT_HISTORY);
      historicos.push({
        id: `h-${Date.now()}`,
        processo_id: processoId,
        usuario_nome: concluidoPorNome,
        acao: "Conclusão de Prazo",
        detalhes: `Prazo concluído por ${concluidoPorNome} em ${new Date(dataHoraConclusao).toLocaleDateString('pt-BR')} às ${new Date(dataHoraConclusao).toLocaleTimeString('pt-BR')}. Processo movido para a seção "Em Andamento".`,
        data_hora: dataHoraConclusao
      });
      saveLocalTable('historico', historicos);
    } else {
      throw new Error("Processo não encontrado para conclusão.");
    }
  }

  await registrarAuditoria("Conclusão de Prazo", `Prazo do processo do cliente "${processoEditado.nome_cliente}" marcado como concluído por ${concluidoPorNome}.`, currentUser);
  return processoEditado;
}

// ----------------- BACKUP MANUAL (EXCEL/JSON EXPORTS) -----------------
export function downloadBackupLocal() {
  const backup = {
    usuarios: getLocalTable('usuarios', DEFAULT_USERS),
    processos: getLocalTable('processos', DEFAULT_PROCESSES),
    historico: getLocalTable('historico', DEFAULT_HISTORY),
    auditoria: getLocalTable('auditoria', DEFAULT_AUDITS),
    timestamp: new Date().toISOString()
  };

  const str = JSON.stringify(backup, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(str);
  
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataUri);
  downloadAnchor.setAttribute('download', `backup_avila_souza_${new Date().toISOString().slice(0,10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  document.body.removeChild(downloadAnchor);
  
  localStorage.setItem('as_last_backup_time', new Date().toLocaleString('pt-BR'));
}

export function restoreBackupLocal(jsonData) {
  try {
    const data = JSON.parse(jsonData);
    if (data.usuarios && data.processos && data.historico && data.auditoria) {
      saveLocalTable('usuarios', data.usuarios);
      saveLocalTable('processos', data.processos);
      saveLocalTable('historico', data.historico);
      saveLocalTable('auditoria', data.auditoria);
      return true;
    }
    return false;
  } catch (e) {
    console.error("Erro ao restaurar backup:", e);
    return false;
  }
}
