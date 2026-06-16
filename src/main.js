import {
  initSupabase,
  isSupabaseConnected,
  getSupabaseCredentials,
  disconnectSupabase,
  registrarAuditoria,
  getUsuarios,
  addUsuario,
  editUsuario,
  deleteUsuario,
  getProcessos,
  addProcesso,
  editProcesso,
  deleteProcesso,
  getHistoricoPorProcesso,
  addHistorico,
  concluirPrazo,
  downloadBackupLocal,
  restoreBackupLocal
} from './db.js';

import {
  login,
  logout,
  getCurrentUser,
  isAdmin,
  checkPermission,
  hashSenha
} from './auth.js';


// DATA ATUAL FIXA DO SISTEMA
const DATA_HOJE_SISTEMA = new Date('2026-06-15T00:00:00');

// ----------------- AUXILIARES E UTILITÁRIOS -----------------

// Cria popups de notificação (toasts) no canto da tela
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast-message toast-${type}`;

  let iconName = 'info';
  if (type === 'success') iconName = 'check-circle';
  if (type === 'error') iconName = 'alert-triangle';
  if (type === 'warning') iconName = 'alert-octagon';

  toast.innerHTML = `
    <i data-lucide="${iconName}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  window.lucide.createIcons();

  setTimeout(() => {
    toast.style.animation = 'fadeIn 0.3s ease-out reverse';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Calcula dias restantes considerando fusos horários locais
function calcularDiasRestantes(dataLimiteStr) {
  if (!dataLimiteStr) return 0;
  const dataLimite = new Date(dataLimiteStr + 'T00:00:00');
  const diffTime = dataLimite - DATA_HOJE_SISTEMA;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Formata data ISO (AAAA-MM-DD) para formato brasileiro (DD/MM/AAAA)
function formatarDataBR(dataStr) {
  if (!dataStr) return '-';
  const parts = dataStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  const d = new Date(dataStr);
  if (!isNaN(d.getTime())) {
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    return `${dia}/${mes}/${ano}`;
  }
  return dataStr;
}

// Determina a classe de cor com base nos dias restantes
function obterClassePrazo(diasRestantes, concluido) {
  if (concluido) return 'color-concluded';
  if (diasRestantes < 0) return 'color-expired'; // Atrasado
  if (diasRestantes <= 2) return 'color-red';     // Urgência máxima
  if (diasRestantes <= 5) return 'color-yellow';  // Atenção
  if (diasRestantes <= 10) return 'color-green';  // Monitoramento
  if (diasRestantes <= 15) return 'color-blue';   // Planejados
  return ''; // Sem alerta especial
}

// Traduz classe de prazo para texto legível
function obterTextoPrazo(diasRestantes, concluido) {
  if (concluido) return 'Prazo Cumprido';
  if (diasRestantes < 0) return `Vencido há ${Math.abs(diasRestantes)} dia(s)`;
  if (diasRestantes === 0) return 'Vence hoje!';
  if (diasRestantes === 1) return 'Vence amanhã!';
  return `Faltam ${diasRestantes} dias`;
}

// ----------------- RENDERIZAÇÃO DA SPA -----------------

// Inicialização e atualização de dados da tela
export async function atualizarTelas() {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  // Atualizar dados de conexão
  const isConnected = isSupabaseConnected();
  const dbBadge = document.getElementById('db-connection-badge');
  const dbText = document.getElementById('db-connection-text');

  if (isConnected) {
    dbBadge.className = 'connection-status-badge online-mode';
    dbText.textContent = 'Supabase Conectado';
  } else {
    dbBadge.className = 'connection-status-badge offline-mode';
    dbText.textContent = 'Modo Local Offline';
  }

  // 1. Obter Processos
  const processos = await getProcessos();

  // Limpar colunas kanban
  const colRegina = document.getElementById('cards-regina');
  const colEloi = document.getElementById('cards-eloi');
  const colWalisson = document.getElementById('cards-walisson');
  const colAndreia = document.getElementById('cards-andreia');
  const colIza = document.getElementById('cards-iza');

  colRegina.innerHTML = '';
  colEloi.innerHTML = '';
  colWalisson.innerHTML = '';
  colAndreia.innerHTML = '';
  colIza.innerHTML = '';

  // Contadores dinâmicos de alertas
  let countExpired = 0;
  let countRed = 0;
  let countYellow = 0;
  let countGreen = 0;
  let countBlue = 0;

  // Contadores por Advogado
  let countReginaLawyer = 0;
  let countEloiLawyer = 0;
  let countWalissonLawyer = 0;
  let countAndreiaLawyer = 0;
  let countIzaLawyer = 0;

  processos.forEach(p => {
    const dias = calcularDiasRestantes(p.data_limite);
    const concluido = p.status_processo === 'Concluído' || p.prazo_concluido;

    // Concluídos não aparecem no Kanban dashboard
    if (concluido) return;

    const classeCor = obterClassePrazo(dias, concluido);

    // Incrementar alertas do topo caso não esteja concluído
    if (dias < 0) countExpired++;
    else if (dias <= 2) countRed++;
    else if (dias <= 5) countYellow++;
    else if (dias <= 10) countGreen++;
    else if (dias <= 15) countBlue++;

    // Criar Card do Kanban
    const card = document.createElement('div');
    card.className = `process-card ${classeCor} animate-fade-in`;
    card.setAttribute('data-id', p.id);

    // Conteúdo do Card
    card.innerHTML = `
      <div class="card-client-name" title="${p.nome_cliente}">${p.nome_cliente}</div>
      <div class="card-process-num" title="${p.numero_processo}">${p.numero_processo}</div>
      <div class="card-deadline-tag">
        <i data-lucide="clock"></i>
        <span>${obterTextoPrazo(dias, concluido)} (${formatarDataBR(p.data_limite)})</span>
      </div>
      <div class="card-bottom-actions">
        <span class="status-badge badge-${p.status_processo.toLowerCase().replace(' ', '-')}">${p.status_processo}</span>
        <div class="card-quick-buttons">
          ${!concluido ? `
            <button class="btn-quick-action action-conclude" title="Concluir Prazo" data-id="${p.id}">
              <i data-lucide="check-circle2"></i>
            </button>
          ` : ''}
          <button class="btn-quick-action action-edit" title="Editar Processo" data-id="${p.id}">
            <i data-lucide="edit-3"></i>
          </button>
        </div>
      </div>
    `;

    // Vincula clique geral no card para abrir pasta digital (detalhes/histórico)
    card.addEventListener('click', (e) => {
      // Impede clique duplo se clicado nos botões rápidos
      if (e.target.closest('button')) return;
      abrirModalDetalhes(p.id);
    });

    // Vincula botões rápidos
    const btnConcluir = card.querySelector('.action-conclude');
    if (btnConcluir) {
      btnConcluir.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
          await concluirPrazo(p.id, currentUser);
          showToast(`Prazo do cliente "${p.nome_cliente}" cumprido com sucesso!`, 'success');
          atualizarTelas();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }

    const btnEditar = card.querySelector('.action-edit');
    if (btnEditar) {
      btnEditar.addEventListener('click', (e) => {
        e.stopPropagation();
        abrirModalCadastro(p.id);
      });
    }

    // Injeta na coluna correspondente
    if (p.advogado_responsavel === 'Dra. Regina') { colRegina.appendChild(card); countReginaLawyer++; }
    else if (p.advogado_responsavel === 'Dr. Eloi') { colEloi.appendChild(card); countEloiLawyer++; }
    else if (p.advogado_responsavel === 'Walisson') { colWalisson.appendChild(card); countWalissonLawyer++; }
    else if (p.advogado_responsavel === 'Andreia') { colAndreia.appendChild(card); countAndreiaLawyer++; }
    else if (p.advogado_responsavel === 'Iza') { colIza.appendChild(card); countIzaLawyer++; }
  });

  // Exibir placeholder se coluna estiver vazia
  const colunas = [
    { el: colRegina, count: countReginaLawyer },
    { el: colEloi, count: countEloiLawyer },
    { el: colWalisson, count: countWalissonLawyer },
    { el: colAndreia, count: countAndreiaLawyer },
    { el: colIza, count: countIzaLawyer }
  ];
  colunas.forEach(c => {
    if (c.count === 0) {
      c.el.innerHTML = `<div class="card-placeholder-empty">Nenhum prazo sob responsabilidade</div>`;
    }
  });

  // Atualizar indicadores de badges nas colunas
  document.getElementById('count-regina').textContent = countReginaLawyer;
  document.getElementById('count-eloi').textContent = countEloiLawyer;
  document.getElementById('count-walisson').textContent = countWalissonLawyer;
  document.getElementById('count-andreia').textContent = countAndreiaLawyer;
  document.getElementById('count-iza').textContent = countIzaLawyer;

  // Atualizar contadores do topo da tela
  document.getElementById('metric-expired').textContent = countExpired;
  document.getElementById('metric-red').textContent = countRed;
  document.getElementById('metric-yellow').textContent = countYellow;
  document.getElementById('metric-green').textContent = countGreen;
  document.getElementById('metric-blue').textContent = countBlue;

  // Re-instanciar ícones do Lucide
  window.lucide.createIcons();

  // 2. Preencher tabelas gerais de outras abas se ativas
  const activeTab = document.querySelector('.nav-item.active').getAttribute('data-target');
  if (activeTab === 'processos') {
    renderizarTabelaProcessos(processos);
  } else if (activeTab === 'prazoscumpridos') {
    renderizarTabelaPrazosCumpridos(processos);
  } else if (activeTab === 'usuarios') {
    renderizarTabelaUsuarios();
  } else if (activeTab === 'configuracoes') {
    renderizarConfiguracoes();
  }
}

// RENDERIZAR TABELA DE PROCESSOS (ABA 2)
function renderizarTabelaProcessos(processos) {
  const tableBody = document.getElementById('table-processos-body');
  if (!tableBody) return;
  tableBody.innerHTML = '';

  // Filtros aplicados
  const txtFiltro = document.getElementById('filter-text').value.toLowerCase().trim();
  const advFiltro = document.getElementById('filter-lawyer').value;
  const statusFiltro = document.getElementById('filter-status').value;
  const urgFiltro = document.getElementById('filter-urgency').value;

  const filtrados = processos.filter(p => {
    // Busca textual (Nome, Processo, Telefone)
    const matchesTxt = !txtFiltro ||
      p.nome_cliente.toLowerCase().includes(txtFiltro) ||
      p.numero_processo.toLowerCase().includes(txtFiltro) ||
      (p.telefone && p.telefone.includes(txtFiltro));

    // Advogado
    const matchesAdv = advFiltro === 'Todos' || p.advogado_responsavel === advFiltro;

    // Status
    const matchesStatus = statusFiltro === 'Todos' || p.status_processo === statusFiltro;

    // Urgência/Prazo
    const dias = calcularDiasRestantes(p.data_limite);
    const concluido = p.status_processo === 'Concluído' || p.prazo_concluido;
    let matchesUrg = true;

    if (urgFiltro !== 'Todos') {
      if (concluido) {
        matchesUrg = false; // Registros concluídos não batem com filtros de prazo ativo
      } else {
        if (urgFiltro === 'Vencido' && dias >= 0) matchesUrg = false;
        if (urgFiltro === 'Vermelho' && (dias > 2 || dias < 0)) matchesUrg = false;
        if (urgFiltro === 'Amarelo' && (dias > 5 || dias <= 2)) matchesUrg = false;
        if (urgFiltro === 'Verde' && (dias > 10 || dias <= 5)) matchesUrg = false;
        if (urgFiltro === 'Azul' && (dias > 15 || dias <= 10)) matchesUrg = false;
      }
    }

    return matchesTxt && matchesAdv && matchesStatus && matchesUrg;
  });

  if (filtrados.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-muted);">Nenhum processo encontrado com os filtros atuais.</td></tr>`;
    return;
  }

  filtrados.forEach(p => {
    const dias = calcularDiasRestantes(p.data_limite);
    const concluido = p.status_processo === 'Concluído' || p.prazo_concluido;
    const classeCor = obterClassePrazo(dias, concluido);
    const currentUser = getCurrentUser();

    const tr = document.createElement('tr');
    tr.className = classeCor;

    tr.innerHTML = `
      <td>
        <div class="table-client-info">
          <strong>${p.nome_cliente}</strong>
          <span style="font-size: 11px; color: var(--text-muted);">Cadastrado por ${p.criado_por}</span>
        </div>
      </td>
      <td>${p.numero_processo}</td>
      <td>${p.telefone || '-'}</td>
      <td>${p.advogado_responsavel}</td>
      <td>${formatarDataBR(p.data_cadastro)}</td>
      <td>${formatarDataBR(p.data_limite)}</td>
      <td style="font-weight: 600;">${obterTextoPrazo(dias, concluido)}</td>
      <td><span class="status-badge badge-${p.status_processo.toLowerCase().replace(' ', '-')}">${p.status_processo}</span></td>
      <td>
        <div class="td-actions">
          <button class="btn-table-action" onclick="abrirModalDetalhes('${p.id}')">
            <i data-lucide="folder-open"></i> Pasta Digital
          </button>
          <button class="btn-table-action" onclick="abrirModalCadastro('${p.id}')">
            <i data-lucide="edit"></i> Editar
          </button>
          ${!concluido ? `
            <button class="btn-table-action btn-conclude" onclick="cumprirPrazoTabela('${p.id}', '${p.nome_cliente}')">
              <i data-lucide="check"></i> Concluir
            </button>
          ` : ''}
          ${isAdmin() ? `
            <button class="btn-table-action btn-delete" onclick="excluirProcessoTabela('${p.id}', '${p.nome_cliente}')">
              <i data-lucide="trash-2"></i> Excluir
            </button>
          ` : ''}
        </div>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  window.lucide.createIcons();
}

// Vincula funções no escopo global para cliques na tabela dinâmica
window.abrirModalDetalhes = abrirModalDetalhes;
window.abrirModalCadastro = abrirModalCadastro;

window.cumprirPrazoTabela = async function (id, nome) {
  try {
    await concluirPrazo(id, getCurrentUser());
    showToast(`Prazo de "${nome}" cumprido com sucesso!`, 'success');
    atualizarTelas();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.excluirProcessoTabela = async function (id, nome) {
  if (confirm(`Tem certeza absoluta que deseja excluir permanentemente o processo do cliente "${nome}"?\nEsta ação registrará um log de auditoria permanente.`)) {
    try {
      await deleteProcesso(id, getCurrentUser());
      showToast(`Processo de "${nome}" excluído.`, 'success');
      atualizarTelas();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
};

// RENDERIZAR TABELA DE PRAZOS CUMPRIDOS
function renderizarTabelaPrazosCumpridos(processos) {
  const tableBody = document.getElementById('table-prazoscumpridos-body');
  if (!tableBody) return;
  tableBody.innerHTML = '';

  const queryInput = document.getElementById('prazoscumpridos-search-input');
  const query = queryInput ? queryInput.value.toLowerCase().trim() : '';

  const filtrados = processos.filter(p => {
    const concluido = p.status_processo === 'Concluído' || p.prazo_concluido;
    if (!concluido) return false;

    return !query ||
      p.nome_cliente.toLowerCase().includes(query) ||
      p.numero_processo.toLowerCase().includes(query) ||
      (p.advogado_responsavel && p.advogado_responsavel.toLowerCase().includes(query)) ||
      (p.concluido_por && p.concluido_por.toLowerCase().includes(query));
  });

  if (filtrados.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">Nenhum prazo cumprido encontrado com os filtros atuais.</td></tr>`;
    return;
  }

  filtrados.forEach(p => {
    const tr = document.createElement('tr');
    tr.className = 'color-concluded';

    tr.innerHTML = `
      <td>
        <div class="table-client-info">
          <strong>${p.nome_cliente}</strong>
          <span style="font-size: 11px; color: var(--text-muted);">Telefone: ${p.telefone || '-'}</span>
        </div>
      </td>
      <td>${p.numero_processo}</td>
      <td>${p.advogado_responsavel}</td>
      <td>${formatarDataBR(p.data_cadastro)}</td>
      <td>${formatarDataBR(p.data_limite)}</td>
      <td>${p.concluido_em ? new Date(p.concluido_em).toLocaleString('pt-BR') : '-'}</td>
      <td><strong>${p.concluido_por || '-'}</strong></td>
      <td>
        <div class="td-actions">
          <button class="btn-table-action" onclick="abrirModalDetalhes('${p.id}')">
            <i data-lucide="folder-open"></i> Pasta Digital
          </button>
          <button class="btn-table-action" onclick="abrirModalCadastro('${p.id}')">
            <i data-lucide="edit"></i> Editar
          </button>
        </div>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  window.lucide.createIcons();
}

// RENDERIZAR TABELA DE USUÁRIOS (ABA 5)
async function renderizarTabelaUsuarios() {
  const tableBody = document.getElementById('table-usuarios-body');
  if (!tableBody) return;
  tableBody.innerHTML = '';

  const usuarios = await getUsuarios();
  usuarios.forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${u.nome}</strong></td>
      <td>${u.email}</td>
      <td><code>${u.login}</code></td>
      <td>
        <span class="status-badge ${u.cargo === 'Administrador' ? 'badge-protocolado' : 'badge-andamento'}">
          ${u.cargo}
        </span>
      </td>
      <td>${formatarDataBR(u.created_at.slice(0, 10))}</td>
      <td>
        <div class="td-actions">
          <button class="btn-table-action" onclick="abrirModalEdicaoUsuario('${u.id}', '${u.nome}', '${u.email}', '${u.login}', '${u.cargo}')">
            <i data-lucide="user-cog"></i> Editar
          </button>
          ${u.login !== 'admin' ? `
            <button class="btn-table-action btn-delete" onclick="deletarUsuarioSistema('${u.id}', '${u.nome}')">
              <i data-lucide="user-x"></i> Excluir
            </button>
          ` : ''}
        </div>
      </td>
    `;
    tableBody.appendChild(tr);
  });
  window.lucide.createIcons();
}

window.abrirModalEdicaoUsuario = function (id, nome, email, login, cargo) {
  document.getElementById('user-modal-title').textContent = "Editar Usuário";
  document.getElementById('user-id-input').value = id;
  document.getElementById('user-nome-completo').value = nome;
  document.getElementById('user-email').value = email;
  document.getElementById('user-username').value = login;
  document.getElementById('user-permission').value = cargo;

  const passField = document.getElementById('user-pass');
  passField.required = false;
  passField.placeholder = "Deixe em branco para manter a senha";
  document.querySelector('.help-label-pass').style.display = 'inline';

  document.getElementById('user-submit-text').textContent = "Salvar Alterações";
  document.getElementById('modal-usuario').style.display = 'flex';
  window.lucide.createIcons();
};

window.deletarUsuarioSistema = async function (id, nome) {
  if (confirm(`Deseja realmente excluir permanentemente o acesso do usuário "${nome}"?`)) {
    try {
      await deleteUsuario(id, getCurrentUser());
      showToast(`Usuário "${nome}" excluído.`, 'success');
      atualizarTelas();
    } catch (e) {
      showToast(e.message, 'error');
    }
  }
};

// RENDERIZAR CONFIGURAÇÕES E CREDENCIAIS SUPABASE (ABA 6)
function renderizarConfiguracoes() {
  const creds = getSupabaseCredentials();
  document.getElementById('settings-supabase-url').value = creds.url;
  document.getElementById('settings-supabase-key').value = creds.key;

  const isConnected = isSupabaseConnected();
  const formAlert = document.getElementById('config-conn-alert');
  const btnDisconnect = document.getElementById('btn-disconnect-db');

  if (isConnected) {
    formAlert.className = 'settings-alert-badge connected';
    formAlert.innerHTML = `
      <i data-lucide="shield-check"></i>
      <div>
        <strong>Supabase Conectado com Sucesso</strong>
        <p>A central está sincronizando e lendo dados diretamente do banco de dados na nuvem.</p>
      </div>
    `;
    btnDisconnect.style.display = 'inline-flex';
  } else {
    formAlert.className = 'settings-alert-badge disconnected';
    formAlert.innerHTML = `
      <i data-lucide="unplug"></i>
      <div>
        <strong>Modo Offline Ativo (Local)</strong>
        <p>Os dados estão sendo salvos apenas no seu navegador. Insira as credenciais abaixo para conectar a um banco real.</p>
      </div>
    `;
    btnDisconnect.style.display = 'none';
  }

  // Backup data
  const lastBackup = localStorage.getItem('as_last_backup_time') || 'Nunca';
  document.getElementById('backup-last-time').textContent = lastBackup;
  window.lucide.createIcons();
}

// ----------------- MODAL DE DETALHES & LINHA DO TEMPO -----------------

// Abre modal com histórico permanente do processo (pasta digital)
async function abrirModalDetalhes(processoId) {
  const processos = await getProcessos();
  const p = processos.find(item => item.id === processoId);
  if (!p) {
    showToast("Processo não encontrado.", "error");
    return;
  }

  // Preencher dados principais do cabeçalho
  document.getElementById('details-client-name').textContent = `Pasta Digital: ${p.nome_cliente}`;
  document.getElementById('details-process-number').textContent = p.numero_processo;
  document.getElementById('details-phone').textContent = p.telefone || 'Não informado';
  document.getElementById('details-lawyer').textContent = p.advogado_responsavel;

  const statusBadge = document.getElementById('details-status-badge');
  statusBadge.className = `status-badge badge-${p.status_processo.toLowerCase().replace(' ', '-')}`;
  statusBadge.textContent = p.status_processo;

  document.getElementById('details-created-at').textContent = formatarDataBR(p.created_at.slice(0, 10));
  document.getElementById('details-deadline').textContent = formatarDataBR(p.data_limite);
  document.getElementById('details-observations').textContent = p.observacoes || 'Nenhuma observação informada.';

  // Armazenar ID do processo no formulário de notas rápidas
  document.getElementById('form-add-timeline-note').setAttribute('data-processo-id', p.id);
  document.getElementById('timeline-note-input').value = '';

  // Renderizar linha do tempo de históricos
  await renderizarLinhaDoTempo(p.id);

  // Mostrar modal
  document.getElementById('modal-detalhes-processo').style.display = 'flex';
  window.lucide.createIcons();
}

async function renderizarLinhaDoTempo(processoId) {
  const timelineContainer = document.getElementById('details-timeline-container');
  timelineContainer.innerHTML = '';

  const historico = await getHistoricoPorProcesso(processoId);

  if (historico.length === 0) {
    timelineContainer.innerHTML = `<p style="text-align: center; color: var(--text-muted); font-size: 12.5px; padding: 20px;">Nenhuma movimentação registrada.</p>`;
    return;
  }

  historico.forEach(h => {
    const item = document.createElement('div');
    item.className = 'timeline-item';
    item.innerHTML = `
      <div class="timeline-meta">
        <strong>${h.usuario_nome}</strong> &bull; ${h.acao} &bull; ${new Date(h.data_hora).toLocaleString('pt-BR')}
      </div>
      <div class="timeline-desc">${h.detalhes}</div>
    `;
    timelineContainer.appendChild(item);
  });

  // Rolar para o final (movimentação mais recente)
  timelineContainer.scrollTop = timelineContainer.scrollHeight;
}

// ----------------- MODAL DE CADASTRO / EDIÇÃO DE PROCESSOS -----------------

// Abre modal de formulário
async function abrirModalCadastro(processoId = null) {
  const form = document.getElementById('form-processo');
  form.reset();

  const histDiv = document.getElementById('proc-existente-historico');
  if (histDiv) histDiv.style.display = 'none';

  const numInput = document.getElementById('proc-numero');
  if (numInput) delete numInput.dataset.autofilled;

  if (processoId) {
    // Modo Edição
    document.getElementById('process-modal-title').textContent = "Editar Processo / Cliente";
    const processos = await getProcessos();
    const p = processos.find(item => item.id === processoId);

    if (!p) return;

    document.getElementById('process-id-input').value = p.id;
    document.getElementById('proc-nome-cliente').value = p.nome_cliente;
    document.getElementById('proc-numero').value = p.numero_processo;
    document.getElementById('proc-telefone').value = p.telefone || '';
    document.getElementById('proc-advogado').value = p.advogado_responsavel;
    document.getElementById('proc-data-limite').value = p.data_limite;
    document.getElementById('proc-status').value = p.status_processo;
    document.getElementById('proc-observacoes').value = p.observacoes || '';
  } else {
    // Modo Criação
    document.getElementById('process-modal-title').textContent = "Novo Processo / Cliente";
    document.getElementById('process-id-input').value = '';
    document.getElementById('proc-status').value = 'Pendente';
  }

  document.getElementById('modal-processo').style.display = 'flex';
  window.lucide.createIcons();
}

// ----------------- INICIALIZAÇÃO E AÇÕES DOS EVENTOS DOM -----------------

const inicializarApp = async () => {
  // Inicialização de ícones gerais
  window.lucide.createIcons();

  // 1. Tentar Login Automático
  const user = getCurrentUser();
  if (user) {
    showDashboard(user);
  } else {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app-screen').style.display = 'none';
  }

  // 2. Formulário de Login
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const loginUser = document.getElementById('login-user').value;
    const loginPass = document.getElementById('login-pass').value;

    try {
      const loggedUser = await login(loginUser, loginPass);
      showToast(`Bem-vindo, ${loggedUser.nome}!`, 'success');
      showDashboard(loggedUser);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // 3. Botão de Logout
  document.getElementById('btn-logout-sidebar').addEventListener('click', async () => {
    if (confirm("Deseja sair do sistema?")) {
      await logout();
      document.getElementById('app-screen').style.display = 'none';
      document.getElementById('login-screen').style.display = 'flex';
      document.getElementById('login-form').reset();
    }
  });

  // 4. Navegação entre Abas da SPA
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();

      const target = item.getAttribute('data-target');

      // Permitir navegação se tiver permissão ou pertencer ao módulo prazoscumpridos
      if (!checkPermission(`ver_${target}`) && target !== 'dashboard' && target !== 'configuracoes' && target !== 'prazoscumpridos') {
        showToast("Você não possui permissão para acessar esta funcionalidade.", "warning");
        return;
      }

      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      // Alternar visualização das abas
      document.querySelectorAll('.app-tab-view').forEach(view => view.classList.remove('active'));
      const targetView = document.getElementById(`tab-${target}`);
      if (targetView) targetView.classList.add('active');

      // Mudar Título do Topbar
      const viewTitle = item.querySelector('span').textContent;
      document.getElementById('topbar-view-title').textContent = viewTitle;

      // Resetar barra de busca global conforme o contexto ou foco
      const globalSearchWrapper = document.getElementById('global-search-wrapper');
      if (target === 'dashboard' || target === 'processos' || target === 'prazoscumpridos') {
        globalSearchWrapper.style.display = 'block';
      } else {
        globalSearchWrapper.style.display = 'none';
      }

      atualizarTelas();
    });
  });

  // 5. Busca Global Instantânea (filtra no kanban, tabela de processos e prazos cumpridos)
  document.getElementById('global-search-input').addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase().trim();
    const activeTab = document.querySelector('.nav-item.active').getAttribute('data-target');

    if (activeTab === 'dashboard') {
      const cards = document.querySelectorAll('.process-card');
      cards.forEach(card => {
        const client = card.querySelector('.card-client-name').textContent.toLowerCase();
        const proc = card.querySelector('.card-process-num').textContent.toLowerCase();
        if (client.includes(val) || proc.includes(val)) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    } else if (activeTab === 'processos') {
      document.getElementById('filter-text').value = val;
      atualizarTelas();
    } else if (activeTab === 'prazoscumpridos') {
      const pcSearch = document.getElementById('prazoscumpridos-search-input');
      if (pcSearch) pcSearch.value = val;
      getProcessos().then(renderizarTabelaPrazosCumpridos);
    }
  });

  // 5b. Busca e Autofill por Número do Processo no Modal de Cadastro
  const numInput = document.getElementById('proc-numero');
  if (numInput) {
    const handleProcNumeroLookup = async () => {
      const val = numInput.value.trim();
      const processIdInput = document.getElementById('process-id-input');
      const histDiv = document.getElementById('proc-existente-historico');
      const timelineDiv = document.getElementById('proc-existente-timeline');

      if (processIdInput && processIdInput.value) {
        return; // Não executa lookup em modo edição
      }

      if (!val) {
        if (numInput.dataset.autofilled === 'true') {
          document.getElementById('proc-nome-cliente').value = '';
          document.getElementById('proc-telefone').value = '';
          document.getElementById('proc-advogado').value = '';
          document.getElementById('proc-observacoes').value = '';
          if (processIdInput) processIdInput.value = '';
          if (histDiv) histDiv.style.display = 'none';
          delete numInput.dataset.autofilled;
        }
        return;
      }

      const processos = await getProcessos();
      const cleanNum = (num) => num ? num.replace(/\D/g, '') : '';
      const targetClean = cleanNum(val);

      const match = processos.find(p => {
        if (!p.numero_processo) return false;
        return p.numero_processo.trim() === val || (targetClean && cleanNum(p.numero_processo) === targetClean);
      });

      if (match) {
        document.getElementById('proc-nome-cliente').value = match.nome_cliente;
        document.getElementById('proc-telefone').value = match.telefone || '';
        document.getElementById('proc-advogado').value = match.advogado_responsavel;
        document.getElementById('proc-observacoes').value = match.observacoes || '';
        if (processIdInput) processIdInput.value = match.id;
        numInput.dataset.autofilled = 'true';

        if (timelineDiv) {
          timelineDiv.innerHTML = '';
          const historico = await getHistoricoPorProcesso(match.id);
          if (historico.length === 0) {
            timelineDiv.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 10px;">Nenhum histórico registrado.</p>';
          } else {
            historico.forEach(h => {
              const pItem = document.createElement('div');
              pItem.style.marginBottom = '8px';
              pItem.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
              pItem.style.paddingBottom = '5px';
              pItem.innerHTML = `
                <div style="color: var(--text-muted); font-size: 10.5px;">
                  <strong>${h.usuario_nome}</strong> &bull; ${h.acao} &bull; ${new Date(h.data_hora).toLocaleString('pt-BR')}
                </div>
                <div style="margin-top: 2px;">${h.detalhes}</div>
              `;
              timelineDiv.appendChild(pItem);
            });
          }
        }
        if (histDiv) histDiv.style.display = 'block';
        showToast(`Processo do cliente "${match.nome_cliente}" localizado. Preenchendo dados...`, 'info');
      } else {
        if (numInput.dataset.autofilled === 'true') {
          document.getElementById('proc-nome-cliente').value = '';
          document.getElementById('proc-telefone').value = '';
          document.getElementById('proc-advogado').value = '';
          document.getElementById('proc-observacoes').value = '';
          if (processIdInput) processIdInput.value = '';
          if (histDiv) histDiv.style.display = 'none';
          delete numInput.dataset.autofilled;
        }
      }
    };
    numInput.addEventListener('input', handleProcNumeroLookup);
  }

  // 6. Filtros Tabela de Processos
  document.getElementById('filter-text').addEventListener('input', () => renderizarTabelaProcessos(JSON.parse(localStorage.getItem('as_processos') || '[]')));
  document.getElementById('filter-lawyer').addEventListener('change', () => renderizarTabelaProcessos(JSON.parse(localStorage.getItem('as_processos') || '[]')));
  document.getElementById('filter-status').addEventListener('change', () => renderizarTabelaProcessos(JSON.parse(localStorage.getItem('as_processos') || '[]')));
  document.getElementById('filter-urgency').addEventListener('change', () => renderizarTabelaProcessos(JSON.parse(localStorage.getItem('as_processos') || '[]')));

  document.getElementById('btn-clear-filters').addEventListener('click', () => {
    document.getElementById('filter-text').value = '';
    document.getElementById('filter-lawyer').value = 'Todos';
    document.getElementById('filter-status').value = 'Todos';
    document.getElementById('filter-urgency').value = 'Todos';
    document.getElementById('global-search-input').value = '';
    atualizarTelas();
  });

  // 7. Modais de Processo - Cancelar e Fechar
  document.getElementById('btn-open-create-process').addEventListener('click', () => abrirModalCadastro());
  document.getElementById('btn-close-process-modal').addEventListener('click', fecharModalProcesso);
  document.getElementById('btn-cancel-process-modal').addEventListener('click', fecharModalProcesso);

  function fecharModalProcesso() {
    document.getElementById('modal-processo').style.display = 'none';
    const histDiv = document.getElementById('proc-existente-historico');
    if (histDiv) histDiv.style.display = 'none';
    const numInput = document.getElementById('proc-numero');
    if (numInput) delete numInput.dataset.autofilled;
  }

  // 8. Salvar Processo (Novo ou Edição)
  document.getElementById('form-processo').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('process-id-input').value;

    const procData = {
      nome_cliente: document.getElementById('proc-nome-cliente').value.trim(),
      numero_processo: document.getElementById('proc-numero').value.trim() || 'Não informado',
      telefone: document.getElementById('proc-telefone').value.trim(),
      advogado_responsavel: document.getElementById('proc-advogado').value,
      data_limite: document.getElementById('proc-data-limite').value,
      status_processo: document.getElementById('proc-status').value || 'Pendente',
      observacoes: document.getElementById('proc-observacoes').value.trim()
    };

    const isCompleted = procData.status_processo === 'Concluído' || procData.status_processo === 'Prazo Cumprido';

    try {
      const currentUser = getCurrentUser();
      if (id) {
        if (isCompleted) {
          procData.prazo_concluido = true;
          procData.concluido_por = currentUser.nome;
          procData.concluido_em = new Date().toISOString();
        } else {
          procData.prazo_concluido = false;
          procData.concluido_por = null;
          procData.concluido_em = null;
        }
        await editProcesso(id, procData, currentUser);
        showToast("Cadastro de processo atualizado.", 'success');
      } else {
        if (isCompleted) {
          procData.prazo_concluido = true;
          procData.concluido_por = currentUser.nome;
          procData.concluido_em = new Date().toISOString();
        } else {
          procData.prazo_concluido = false;
        }
        await addProcesso(procData, currentUser);
        showToast("Novo processo cadastrado com sucesso!", 'success');
      }
      fecharModalProcesso();
      atualizarTelas();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // 9. Pasta Digital - Fechar
  document.querySelectorAll('#btn-close-details-modal, #btn-close-details-modal-footer').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('modal-detalhes-processo').style.display = 'none';
    });
  });

  // 10. Registrar Nota na Linha do Tempo Manual
  document.getElementById('form-add-timeline-note').addEventListener('submit', async (e) => {
    e.preventDefault();
    const procId = e.target.getAttribute('data-processo-id');
    const note = document.getElementById('timeline-note-input').value.trim();
    if (!note) return;

    try {
      await addHistorico(procId, "Anotação Manual", note, getCurrentUser());
      document.getElementById('timeline-note-input').value = '';
      showToast("Nota de andamento registrada.");
      await renderizarLinhaDoTempo(procId);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // 11. Prazos Cumpridos - Filtro instantâneo
  const pcSearch = document.getElementById('prazoscumpridos-search-input');
  if (pcSearch) {
    pcSearch.addEventListener('input', async () => {
      const processos = await getProcessos();
      renderizarTabelaPrazosCumpridos(processos);
    });
  }


  // 13. Usuários - Cadastrar / Salvar
  document.getElementById('btn-open-create-user').addEventListener('click', () => {
    document.getElementById('user-modal-title').textContent = "Cadastrar Novo Usuário";
    document.getElementById('user-id-input').value = '';
    document.getElementById('user-nome-completo').value = '';
    document.getElementById('user-email').value = '';
    document.getElementById('user-username').value = '';
    document.getElementById('user-permission').value = 'Operador';

    const passField = document.getElementById('user-pass');
    passField.required = true;
    passField.placeholder = "Digite a senha de acesso";
    document.querySelector('.help-label-pass').style.display = 'none';

    document.getElementById('user-submit-text').textContent = "Cadastrar Usuário";
    document.getElementById('modal-usuario').style.display = 'flex';
  });

  document.getElementById('btn-close-user-modal').addEventListener('click', fecharModalUsuario);
  document.getElementById('btn-cancel-user-modal').addEventListener('click', fecharModalUsuario);

  function fecharModalUsuario() {
    document.getElementById('modal-usuario').style.display = 'none';
  }

  document.getElementById('form-usuario').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('user-id-input').value;
    const nome = document.getElementById('user-nome-completo').value.trim();
    const email = document.getElementById('user-email').value.trim();
    const loginName = document.getElementById('user-username').value.trim();
    const cargo = document.getElementById('user-permission').value;
    const senha = document.getElementById('user-pass').value;

    const payload = { nome, email, login: loginName, cargo };

    // Criptografa senha apenas se fornecida
    if (senha) {
      payload.senha = await hashSenha(senha);
    }

    try {
      const currentUser = getCurrentUser();
      if (id) {
        await editUsuario(id, payload, currentUser);
        showToast("Dados do usuário atualizados.", 'success');
      } else {
        if (!senha) throw new Error("A senha é obrigatória para novos cadastros!");
        await addUsuario(payload, currentUser);
        showToast("Novo usuário criado com sucesso!", 'success');
      }
      fecharModalUsuario();
      atualizarTelas();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // 14. Configurações - Supabase Conexão
  document.getElementById('form-settings-supabase').addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = document.getElementById('settings-supabase-url').value.trim();
    const key = document.getElementById('settings-supabase-key').value.trim();

    if (!url || !key) {
      showToast("Insira a URL e a Anon Key do projeto Supabase.", "warning");
      return;
    }

    const connected = initSupabase(url, key);
    if (connected) {
      await registrarAuditoria("Conexão Supabase", `Conexão configurada para a URL: ${url}`, getCurrentUser());
      showToast("Supabase conectado com sucesso!", "success");
      atualizarTelas();
    } else {
      showToast("Falha ao inicializar o cliente Supabase. Verifique se o script CDN carregou.", "error");
    }
  });

  document.getElementById('btn-disconnect-db').addEventListener('click', async () => {
    if (confirm("Deseja desconectar o Supabase e voltar para o Modo Simulação Local?")) {
      disconnectSupabase();
      await registrarAuditoria("Desconexão Supabase", "Banco desconectado manualmente. Transição para modo offline local.", getCurrentUser());
      showToast("Supabase desconectado.");
      atualizarTelas();
    }
  });

  // 15. Configurações - Backup Download e Recuperação
  document.getElementById('btn-download-backup').addEventListener('click', () => {
    downloadBackupLocal();
    showToast("Backup gerado e baixado no computador.", "success");
    atualizarTelas();
  });

  document.getElementById('input-restore-backup').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const success = restoreBackupLocal(event.target.result);
      if (success) {
        showToast("Banco de dados local restaurado com sucesso!", "success");
        await registrarAuditoria("Restauração de Backup", "Banco de dados restaurado manualmente de arquivo local.", getCurrentUser());
        atualizarTelas();
      } else {
        showToast("Arquivo de backup inválido.", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Limpar input
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarApp);
} else {
  inicializarApp();
}

// Exibir tela inicial pós login
async function showDashboard(userObj) {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app-screen').style.display = 'grid';

  // Iniciais do Avatar
  const parts = userObj.nome.split(' ');
  const init = parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0][0] + (parts[0][1] || '');
  document.getElementById('user-avatar').textContent = init.toUpperCase();
  document.getElementById('user-display-name').textContent = userObj.nome;
  document.getElementById('user-display-role').textContent = userObj.cargo;

  // Mostrar aba restrita de gerenciamento de usuários se admin
  const navUser = document.getElementById('nav-item-usuarios');
  if (userObj.cargo === 'Administrador') {
    navUser.style.display = 'block';
  } else {
    navUser.style.display = 'none';
  }

  // Preencher e desenhar os cards/tabelas
  await atualizarTelas();

  // Executar Alerta de Abertura Inicial
  exibirAvisoPrazosIniciais();
}

// Calcula e avisa sobre prazos urgentes na abertura do sistema
async function exibirAvisoPrazosIniciais() {
  const processos = await getProcessos();
  let countProximos = 0;

  processos.forEach(p => {
    const concluido = p.status_processo === 'Concluído' || p.prazo_concluido;
    if (!concluido) {
      const dias = calcularDiasRestantes(p.data_limite);
      // Prazos próximos do vencimento: ≤ 15 dias (Azul, Verde, Amarelo, Vermelho e Vencidos!)
      if (dias <= 15) {
        countProximos++;
      }
    }
  });

  if (countProximos > 0) {
    const welcomeModal = document.getElementById('modal-welcome-alert');
    const msgEl = document.getElementById('welcome-alert-message');
    msgEl.innerHTML = `Existem <strong>${countProximos}</strong> prazos próximos do vencimento ou pendentes sob monitoramento corporativo.<br>Por favor, atente-se às colunas coloridas do seu painel.`;
    welcomeModal.style.display = 'flex';
  }
}
