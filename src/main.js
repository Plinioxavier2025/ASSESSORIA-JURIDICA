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
  hashSenha,
  restaurarSessaoSupabase,
  alterarSenhaPropria
} from './auth.js';

import { exportarPDFRelatorio } from './reports.js';


// Limpeza automática de Service Workers e Caches antigos em ambiente de desenvolvimento local (localhost)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().then((unregistered) => {
          if (unregistered) {
            console.log('Service Worker de desenvolvimento desregistrado automaticamente.');
            window.location.reload(); // Recarrega uma vez para garantir que as requisições não sejam mais interceptadas
          }
        });
      }
    });
  }
  if ('caches' in window) {
    caches.keys().then((names) => {
      for (const name of names) {
        caches.delete(name);
      }
    });
  }
}

// DATA ATUAL DO SISTEMA (DINÂMICA)
const DATA_HOJE_SISTEMA = new Date();
DATA_HOJE_SISTEMA.setHours(0, 0, 0, 0);

// ----------------- AUXILIARES E UTILITÁRIOS -----------------

// Escapar caracteres especiais contra XSS
export function escapeHTML(str) {
  if (typeof str !== 'string') return str || '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Controlar estado de carregamento de botões (evitar clique duplo)
export function setButtonLoading(button, isLoading, loadingText = "Processando...") {
  if (!button) return;
  if (isLoading) {
    button.disabled = true;
    button.dataset.originalHtml = button.innerHTML;
    button.innerHTML = `
      <span class="spinner-loading"></span>
      <span>${escapeHTML(loadingText)}</span>
    `;
    button.classList.add('btn-loading');
  } else {
    button.disabled = false;
    if (button.dataset.originalHtml) {
      button.innerHTML = button.dataset.originalHtml;
    }
    button.classList.remove('btn-loading');
  }
}

// Cria popups de notificação (toasts) no canto da tela de forma segura
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
    <span class="toast-text"></span>
  `;
  toast.querySelector('.toast-text').textContent = message;

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

// Retorna a lista de advogados configurados no sistema com seus mapeamentos
function obterListaAdvogados() {
  return [
    { dbKey: 'Dra. Regina', label: localStorage.getItem('as_advogado_nome_1') || 'Dra. Regina', avatar: 'DR', class: 'init-regina', colId: 'cards-regina', countId: 'count-regina' },
    { dbKey: 'Dr. Eloi', label: localStorage.getItem('as_advogado_nome_2') || 'Dr. Eloi', avatar: 'DE', class: 'init-eloi', colId: 'cards-eloi', countId: 'count-eloi' },
    { dbKey: 'Dr. Walisson', label: localStorage.getItem('as_advogado_nome_3') || 'Dr. Walisson', avatar: 'WA', class: 'init-walisson', colId: 'cards-walisson', countId: 'count-walisson' },
    { dbKey: 'Dra. Andreia', label: localStorage.getItem('as_advogado_nome_4') || 'Dra. Andreia', avatar: 'AN', class: 'init-andreia', colId: 'cards-andreia', countId: 'count-andreia' },
    { dbKey: 'Dra. Iza', label: localStorage.getItem('as_advogado_nome_5') || 'Dra. Iza', avatar: 'IZ', class: 'init-iza', colId: 'cards-iza', countId: 'count-iza' }
  ];
}

// Retorna o nome de exibição (label) correspondente a chave do banco de dados
function obterLabelAdvogado(dbKey) {
  const list = obterListaAdvogados();
  const match = list.find(a => a.dbKey === dbKey);
  return match ? match.label : dbKey;
}

// Popula dinamicamente os elementos de select do sistema com os nomes dos advogados
function popularSelectsAdvogados() {
  const advogadosList = obterListaAdvogados();
  
  // 1. Tabela Filtros (Filtro por Advogado)
  const filterLawyerSelect = document.getElementById('filter-lawyer');
  if (filterLawyerSelect) {
    const currentValue = filterLawyerSelect.value;
    filterLawyerSelect.innerHTML = '<option value="Todos">Todos os Advogados</option>';
    advogadosList.forEach(adv => {
      filterLawyerSelect.innerHTML += `<option value="${escapeHTML(adv.dbKey)}">${escapeHTML(adv.label)}</option>`;
    });
    filterLawyerSelect.value = currentValue || 'Todos';
  }
  
  // 2. Formulário de Processo (Selecione o Advogado)
  const procAdvogadoSelect = document.getElementById('proc-advogado');
  if (procAdvogadoSelect) {
    const currentValue = procAdvogadoSelect.value;
    procAdvogadoSelect.innerHTML = '<option value="" disabled selected>Selecione o Advogado</option>';
    advogadosList.forEach(adv => {
      procAdvogadoSelect.innerHTML += `<option value="${escapeHTML(adv.dbKey)}">${escapeHTML(adv.label)}</option>`;
    });
    if (currentValue) procAdvogadoSelect.value = currentValue;
  }
}


// Adiciona dias úteis a uma data inicial
function adicionarDiasUteis(dataInicio, dias) {
  let data = new Date(dataInicio);
  let c = 0;
  while (c < dias) {
    data.setDate(data.getDate() + 1);
    const diaSemana = data.getDay();
    if (diaSemana !== 0 && diaSemana !== 6) { // 0 = Domingo, 6 = Sábado
      c++;
    }
  }
  return data;
}

// Converte palavras de números por extenso em português para inteiros
function extrairDiasDoTexto(snippet) {
  // 1. Procurar por números em formato digital primeiro
  const digitoMatch = snippet.match(/\b\d+\b/);
  if (digitoMatch) {
    return parseInt(digitoMatch[0], 10);
  }

  // 2. Procurar por extenso em português
  const textoLimpo = snippet.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remove acentos

  const palavrasMapa = {
    'um': 1, 'uma': 1, 'dois': 2, 'duas': 2, 'tres': 3, 'quatro': 4, 'cinco': 5,
    'seis': 6, 'sete': 7, 'oito': 8, 'nove': 9, 'dez': 10, 'onze': 11, 'doze': 12,
    'treze': 13, 'catorze': 14, 'quatorze': 14, 'quinze': 15, 'vinte': 20, 'trinta': 30,
    'quarenta': 40, 'cinquenta': 50, 'sessenta': 60, 'setenta': 70, 'oitenta': 80,
    'noventa': 90
  };

  const palavras = textoLimpo.split(/\s+/);
  let valorAcumulado = 0;
  let encontrouAlguma = false;

  for (let i = 0; i < palavras.length; i++) {
    const p = palavras[i];
    if (palavrasMapa[p] !== undefined) {
      encontrouAlguma = true;
      const val = palavrasMapa[p];
      // Verifica se é uma dezena e tem unidade depois, ex: "vinte e cinco"
      if (val >= 20 && palavras[i + 1] === 'e' && palavrasMapa[palavras[i + 2]] !== undefined && palavrasMapa[palavras[i + 2]] < 10) {
        valorAcumulado += val + palavrasMapa[palavras[i + 2]];
        i += 2; // pula o 'e' e a unidade
      } else {
        valorAcumulado += val;
      }
    }
  }

  if (encontrouAlguma) {
    return valorAcumulado;
  }

  return null;
}

// Analisa o trecho de texto e detecta o prazo em dias
function detectarDiasPrazo(blockText) {
  // Regex mais tolerante e abrangente para detectar a expressão de prazo
  const daysRegex = /(?:prazo(?:\s+legal|\s+supletivo|\s+comum|\s+improrrogavel)?\s+de|em|no\s+prazo\s+de|prazo\s*:\s*)\s+([a-zA-Z\d\s\(\)-]{1,40})\s+dias/i;
  const match = blockText.match(daysRegex);
  
  if (match) {
    const extracted = extrairDiasDoTexto(match[1]);
    if (extracted !== null) {
      return { days: extracted, detected: true };
    }
  }

  // Fallback para procurar padrões alternativos de número + dias
  const fallbackRegex = /\b(\d+|um|dois|tres|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|treze|catorze|quatorze|quinze|vinte|trinta|quarenta|cinquenta|sessenta|setenta|oitenta|noventa)\s+dias/i;
  const fallbackMatch = blockText.match(fallbackRegex);
  if (fallbackMatch) {
    const extracted = extrairDiasDoTexto(fallbackMatch[1]);
    if (extracted !== null) {
      return { days: extracted, detected: true };
    }
  }

  return { days: 15, detected: false }; // Padrão
}

// Carrega dinamicamente a biblioteca PDF.js
async function loadPDFJS() {
  if (window.pdfjsLib) return window.pdfjsLib;
  
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      resolve(window.pdfjsLib);
    };
    script.onerror = () => {
      reject(new Error("Erro ao carregar a biblioteca PDF.js. Verifique sua conexão com a internet."));
    };
    document.head.appendChild(script);
  });
}

// Analisa o texto do PDF e extrai publicações estruturadas
function parsePublications(text) {
  const cnjRegex = /\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/g;
  
  const matches = [];
  let match;
  while ((match = cnjRegex.exec(text)) !== null) {
    matches.push({
      number: match[0],
      index: match.index
    });
  }
  
  if (matches.length === 0) {
    return [];
  }
  
  const publications = [];
  
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const startIndex = current.index;
    const endIndex = (i + 1 < matches.length) ? matches[i + 1].index : text.length;
    const blockText = text.substring(startIndex, endIndex).trim();
    
    const processNumber = current.number;
    
    // Padrões de Autor/Réu comuns em diários de justiça brasileiros
    const reqtePattern = /(?:REQTE|REQUERENTE|AUTOR|EXEQUENTE|APELANTE|PACIENTE|IMPETRANTE|AGRAVANTE|RECLAMANTE)\s*:\s*([^-\n\.\;]+)/i;
    const reqdoPattern = /(?:REQDO|REQUERIDO|R[EÉ]U|EXECUTADO|APELADO|IMPETRADO|AGRAVADO|RECLAMADO)\s*:\s*([^-\n\.\;]+)/i;
    
    const reqteMatch = blockText.match(reqtePattern);
    const reqdoMatch = blockText.match(reqdoPattern);
    
    const plaintiff = reqteMatch ? reqteMatch[1].trim() : '';
    const defendant = reqdoMatch ? reqdoMatch[1].trim() : '';
    
    let suggestedClient = plaintiff || defendant || '';
    
    if (!suggestedClient) {
      const vsMatch = blockText.match(/(\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+(?:x|vs\.?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/);
      if (vsMatch) {
        suggestedClient = vsMatch[1].trim();
      }
    }
    
    if (!suggestedClient) {
      suggestedClient = 'Cliente não identificado';
    }
    
    const resultPrazo = detectarDiasPrazo(blockText);
    const extractedDays = resultPrazo.days;
    const hasDetectedDays = resultPrazo.detected;
    
    const datePattern = /\b(\d{2})[\/\.](\d{2})[\/\.](\d{4})\b/;
    const dateMatch = blockText.match(datePattern);
    let specificDate = null;
    if (dateMatch) {
      const day = dateMatch[1];
      const month = dateMatch[2];
      const year = dateMatch[3];
      specificDate = `${year}-${month}-${day}`;
    }
    
    let calculatedDate;
    if (hasDetectedDays) {
      // Prioridade máxima: se o juiz definiu um prazo em dias (ex: 15 dias, quinze dias),
      // calcula-se adicionando os dias úteis a partir de hoje
      calculatedDate = adicionarDiasUteis(new Date(), extractedDays).toISOString().split('T')[0];
    } else if (specificDate) {
      // Se não detectou prazo em dias, mas encontrou uma data específica (ex: data de audiência)
      // e essa data é futura, usa essa data diretamente
      const todayIso = new Date().toISOString().split('T')[0];
      if (specificDate >= todayIso) {
        calculatedDate = specificDate;
      } else {
        // Se a data específica é no passado (como data de sentença/despacho), usa o prazo padrão
        calculatedDate = adicionarDiasUteis(new Date(), 15).toISOString().split('T')[0];
      }
    } else {
      // Fallback padrão se nada for detectado
      calculatedDate = adicionarDiasUteis(new Date(), 15).toISOString().split('T')[0];
    }
    
    let orderText = '';
    const dispatchKeywords = [/intime[- ]se/i, /manifeste[- ]se/i, /apresente/i, /recolha/i, /fica(?:m)?\s+intimad[ao](?:s)?/i, /cumpra[- ]se/i, /determino/i, /vistos/i, /defiro/i, /indefiro/i];
    let firstKeywordIndex = -1;
    
    for (const kw of dispatchKeywords) {
      const m = blockText.match(kw);
      if (m && m.index !== undefined) {
        if (firstKeywordIndex === -1 || m.index < firstKeywordIndex) {
          firstKeywordIndex = m.index;
        }
      }
    }
    
    if (firstKeywordIndex !== -1) {
      orderText = blockText.substring(firstKeywordIndex).trim();
    } else {
      orderText = blockText.replace(processNumber, '').trim();
    }
    
    orderText = orderText.replace(/\s+/g, ' ');
    if (orderText.length > 500) {
      orderText = orderText.substring(0, 500) + '...';
    }
    
    publications.push({
      id: `pub-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`,
      numero_processo: processNumber,
      plaintiff,
      defendant,
      nome_cliente: suggestedClient,
      prazo_dias: extractedDays,
      data_limite: calculatedDate,
      has_detected_days: hasDetectedDays,
      specific_date: specificDate,
      observacoes: orderText,
      texto_original: blockText
    });
  }
  
  return publications;
}

// ----------------- RENDERIZAÇÃO DA SPA -----------------

// Inicialização e atualização de dados da tela
export async function atualizarTelas() {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  // Redireciona usuários sem permissão se estiverem em uma aba restrita
  const activeTabEl = document.querySelector('.nav-item.active');
  const activeTab = activeTabEl ? activeTabEl.getAttribute('data-target') : 'dashboard';
  if (!checkPermission(`ver_${activeTab}`) && activeTab !== 'dashboard' && activeTab !== 'prazoscumpridos') {
    const dashboardTab = document.querySelector('.nav-item[data-target="dashboard"]');
    if (dashboardTab) {
      dashboardTab.click();
    }
    return;
  }



  // 1. Obter Processos
  const processos = await getProcessos();

  const advogadosList = obterListaAdvogados();

  // Limpar colunas kanban e atualizar títulos das colunas
  advogadosList.forEach(adv => {
    const col = document.getElementById(adv.colId);
    if (col) col.innerHTML = '';
    
    // Atualiza o título da coluna
    const colEl = document.querySelector(`.kanban-column[data-lawyer="${adv.dbKey}"]`);
    if (colEl) {
      const titleEl = colEl.querySelector('.lawyer-meta h3');
      if (titleEl) titleEl.textContent = adv.label;
      
      const avatarEl = colEl.querySelector('.lawyer-avatar');
      if (avatarEl) {
        const parts = adv.label.split(' ');
        const init = parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0][0] + (parts[0][1] || '');
        avatarEl.textContent = init.toUpperCase();
      }
    }
  });

  // Popular selects de filtros e formulários
  popularSelectsAdvogados();

  // Contadores dinâmicos de alertas
  let countExpired = 0;
  let countRed = 0;
  let countYellow = 0;
  let countGreen = 0;
  let countBlue = 0;

  // Contadores por Advogado
  const contadoresAdvogado = {};
  advogadosList.forEach(adv => {
    contadoresAdvogado[adv.dbKey] = 0;
  });

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
      <div class="card-client-name" title="${escapeHTML(p.nome_cliente)}">${escapeHTML(p.nome_cliente)}</div>
      <div class="card-process-num" title="${escapeHTML(p.numero_processo)}">${escapeHTML(p.numero_processo)}</div>
      <div class="card-deadline-tag">
        <i data-lucide="clock"></i>
        <span>${escapeHTML(obterTextoPrazo(dias, concluido))} (${escapeHTML(formatarDataBR(p.data_limite))})</span>
      </div>
      <div class="card-bottom-actions">
        <span class="status-badge badge-${escapeHTML(p.status_processo.toLowerCase().replace(' ', '-'))}">${escapeHTML(p.status_processo)}</span>
        <div class="card-quick-buttons">
          ${!concluido ? `
            <button class="btn-quick-action action-conclude" title="Concluir Prazo" data-id="${escapeHTML(p.id)}">
              <i data-lucide="check-circle2"></i>
            </button>
          ` : ''}
          <button class="btn-quick-action action-edit" title="Editar Processo" data-id="${escapeHTML(p.id)}">
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
    const adv = advogadosList.find(a => a.dbKey === p.advogado_responsavel);
    if (adv) {
      const col = document.getElementById(adv.colId);
      if (col) {
        col.appendChild(card);
        contadoresAdvogado[adv.dbKey]++;
      }
    }
  });

  // Exibir placeholder se coluna estiver vazia e atualizar contadores
  advogadosList.forEach(adv => {
    const col = document.getElementById(adv.colId);
    const count = contadoresAdvogado[adv.dbKey];
    if (col && count === 0) {
      col.innerHTML = `<div class="card-placeholder-empty">Nenhum prazo sob responsabilidade</div>`;
    }
    const countEl = document.getElementById(adv.countId);
    if (countEl) countEl.textContent = count;
  });

  // Atualizar contadores do topo da tela
  document.getElementById('metric-expired').textContent = countExpired;
  document.getElementById('metric-red').textContent = countRed;
  document.getElementById('metric-yellow').textContent = countYellow;
  document.getElementById('metric-green').textContent = countGreen;
  document.getElementById('metric-blue').textContent = countBlue;

  // Re-instanciar ícones do Lucide
  window.lucide.createIcons();

  // 2. Preencher tabelas gerais de outras abas se ativas
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
          <strong>${escapeHTML(p.nome_cliente)}</strong>
          <span style="font-size: 11px; color: var(--text-muted);">Cadastrado por ${escapeHTML(p.criado_por)}</span>
        </div>
      </td>
      <td>${escapeHTML(p.numero_processo)}</td>
      <td>${escapeHTML(p.telefone || '-')}</td>
      <td>${escapeHTML(obterLabelAdvogado(p.advogado_responsavel))}</td>
      <td>${escapeHTML(formatarDataBR(p.data_cadastro))}</td>
      <td>${escapeHTML(formatarDataBR(p.data_limite))}</td>
      <td style="font-weight: 600;">${escapeHTML(obterTextoPrazo(dias, concluido))}</td>
      <td><span class="status-badge badge-${escapeHTML(p.status_processo.toLowerCase().replace(' ', '-'))}">${escapeHTML(p.status_processo)}</span></td>
      <td>
        <div class="td-actions">
          <button class="btn-table-action" onclick="abrirModalDetalhes('${escapeHTML(p.id)}')">
            <i data-lucide="folder-open"></i> Pasta Digital
          </button>
          <button class="btn-table-action" onclick="abrirModalCadastro('${escapeHTML(p.id)}')">
            <i data-lucide="edit"></i> Editar
          </button>
          ${!concluido ? `
            <button class="btn-table-action btn-conclude" onclick="cumprirPrazoTabela('${escapeHTML(p.id)}', '${escapeHTML(p.nome_cliente)}')">
              <i data-lucide="check"></i> Concluir
            </button>
          ` : ''}
          <button class="btn-table-action btn-delete" onclick="excluirProcessoTabela('${escapeHTML(p.id)}', '${escapeHTML(p.nome_cliente)}')">
            <i data-lucide="trash-2"></i> Excluir
          </button>
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
          <strong>${escapeHTML(p.nome_cliente)}</strong>
          <span style="font-size: 11px; color: var(--text-muted);">Telefone: ${escapeHTML(p.telefone || '-')}</span>
        </div>
      </td>
      <td>${escapeHTML(p.numero_processo)}</td>
      <td>${escapeHTML(obterLabelAdvogado(p.advogado_responsavel))}</td>
      <td>${escapeHTML(formatarDataBR(p.data_cadastro))}</td>
      <td>${escapeHTML(formatarDataBR(p.data_limite))}</td>
      <td>${escapeHTML(p.concluido_em ? new Date(p.concluido_em).toLocaleString('pt-BR') : '-')}</td>
      <td><strong>${escapeHTML(p.concluido_por || '-')}</strong></td>
      <td>
        <div class="td-actions">
          <button class="btn-table-action" onclick="abrirModalDetalhes('${escapeHTML(p.id)}')">
            <i data-lucide="folder-open"></i> Pasta Digital
          </button>
          <button class="btn-table-action" onclick="abrirModalCadastro('${escapeHTML(p.id)}')">
            <i data-lucide="edit"></i> Editar
          </button>
          <button class="btn-table-action btn-delete" onclick="excluirProcessoTabela('${escapeHTML(p.id)}', '${escapeHTML(p.nome_cliente)}')">
            <i data-lucide="trash-2"></i> Excluir
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
      <td><strong>${escapeHTML(u.nome)}</strong></td>
      <td><code>${escapeHTML(u.login)}</code></td>
      <td>
        <span class="status-badge ${escapeHTML(u.cargo === 'Administrador' ? 'badge-protocolado' : 'badge-andamento')}">
          ${escapeHTML(u.cargo)}
        </span>
      </td>
      <td>${escapeHTML(formatarDataBR(u.created_at.slice(0, 10)))}</td>
      <td>
        <div class="td-actions">
          <button class="btn-table-action" onclick="abrirModalEdicaoUsuario('${escapeHTML(u.id)}', '${escapeHTML(u.nome)}', '${escapeHTML(u.email)}', '${escapeHTML(u.login)}', '${escapeHTML(u.cargo)}')">
            <i data-lucide="user-cog"></i> Editar
          </button>
          ${u.login !== 'admin' ? `
            <button class="btn-table-action btn-delete" onclick="deletarUsuarioSistema('${escapeHTML(u.id)}', '${escapeHTML(u.nome)}')">
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
  // Backup data
  const lastBackup = localStorage.getItem('as_last_backup_time') || 'Nunca';
  const backupEl = document.getElementById('backup-last-time');
  if (backupEl) {
    backupEl.textContent = lastBackup;
  }

  // Preencher nomes dos advogados
  const adv1 = document.getElementById('adv-nome-1');
  if (adv1) adv1.value = localStorage.getItem('as_advogado_nome_1') || 'Dra. Regina';
  const adv2 = document.getElementById('adv-nome-2');
  if (adv2) adv2.value = localStorage.getItem('as_advogado_nome_2') || 'Dr. Eloi';
  const adv3 = document.getElementById('adv-nome-3');
  if (adv3) adv3.value = localStorage.getItem('as_advogado_nome_3') || 'Dr. Walisson';
  const adv4 = document.getElementById('adv-nome-4');
  if (adv4) adv4.value = localStorage.getItem('as_advogado_nome_4') || 'Dra. Andreia';
  const adv5 = document.getElementById('adv-nome-5');
  if (adv5) adv5.value = localStorage.getItem('as_advogado_nome_5') || 'Dra. Iza';

  // Ocultar card de backup para operadores
  const currentUser = getCurrentUser();
  const backupCard = document.getElementById('settings-card-backup');
  if (backupCard) {
    if (currentUser && currentUser.cargo === 'Administrador') {
      backupCard.style.display = 'block';
    } else {
      backupCard.style.display = 'none';
    }
  }
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
  document.getElementById('details-lawyer').textContent = obterLabelAdvogado(p.advogado_responsavel);

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
        <strong>${escapeHTML(h.usuario_nome)}</strong> &bull; ${escapeHTML(h.acao)} &bull; ${escapeHTML(new Date(h.data_hora).toLocaleString('pt-BR'))}
      </div>
      <div class="timeline-desc">${escapeHTML(h.detalhes)}</div>
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
  try {
    await restaurarSessaoSupabase();
  } catch (err) {
    console.error("Erro ao sincronizar sessão no início:", err);
  }
  const user = getCurrentUser();
  if (user) {
    showDashboard(user);
  } else {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app-screen').style.display = 'none';
  }

  // 2. Formulário de Login
  const loginForm = document.getElementById('login-form');
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const loginUser = document.getElementById('login-user').value.trim();
    const loginPass = document.getElementById('login-pass').value;
    const submitBtn = loginForm.querySelector('button[type="submit"]');

    if (!loginUser) {
      showToast("Por favor, digite seu usuário ou e-mail.", "warning");
      return;
    }
    if (!loginPass) {
      showToast("Por favor, insira sua senha.", "warning");
      return;
    }

    setButtonLoading(submitBtn, true, "Acessando...");

    try {
      const loggedUser = await login(loginUser, loginPass);
      showToast(`Bem-vindo, ${loggedUser.nome}!`, 'success');
      showDashboard(loggedUser);
    } catch (err) {
      let msg = err.message;
      if (msg === "Failed to fetch") {
        msg = "Sem conexão com o servidor. Verifique sua internet.";
      }
      showToast(msg, 'error');
    } finally {
      setButtonLoading(submitBtn, false);
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
      if (!checkPermission(`ver_${target}`) && target !== 'dashboard' && target !== 'prazoscumpridos') {
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
                  <strong>${escapeHTML(h.usuario_nome)}</strong> &bull; ${escapeHTML(h.acao)} &bull; ${escapeHTML(new Date(h.data_hora).toLocaleString('pt-BR'))}
                </div>
                <div style="margin-top: 2px;">${escapeHTML(h.detalhes)}</div>
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
  const formProcesso = document.getElementById('form-processo');
  formProcesso.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('process-id-input').value;
    const submitBtn = formProcesso.querySelector('button[type="submit"]');

    const procData = {
      nome_cliente: document.getElementById('proc-nome-cliente').value.trim(),
      numero_processo: document.getElementById('proc-numero').value.trim() || 'Não informado',
      telefone: document.getElementById('proc-telefone').value.trim(),
      advogado_responsavel: document.getElementById('proc-advogado').value,
      data_limite: document.getElementById('proc-data-limite').value,
      status_processo: document.getElementById('proc-status').value || 'Pendente',
      observacoes: document.getElementById('proc-observacoes').value.trim()
    };

    // Validações imediatas
    if (!procData.nome_cliente) {
      showToast("Nome do cliente é obrigatório.", "warning");
      return;
    }

    if (procData.numero_processo && procData.numero_processo !== 'Não informado') {
      const cnjRegex = /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/;
      if (!cnjRegex.test(procData.numero_processo)) {
        showToast("Número de processo inválido. Padrão CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO", "warning");
        return;
      }
    }

    if (procData.telefone) {
      // Remove parênteses, traços e espaços para validar
      const cleanPhone = procData.telefone.replace(/\D/g, '');
      if (cleanPhone.length < 10 || cleanPhone.length > 11) {
        showToast("Telefone inválido. Deve possuir DDD + 8 ou 9 dígitos.", "warning");
        return;
      }
    }

    if (!procData.advogado_responsavel) {
      showToast("Selecione o advogado responsável.", "warning");
      return;
    }

    if (!procData.data_limite) {
      showToast("A data limite do prazo é obrigatória.", "warning");
      return;
    }

    const isCompleted = procData.status_processo === 'Concluído' || procData.status_processo === 'Prazo Cumprido';

    setButtonLoading(submitBtn, true, "Salvando...");

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
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });

  // 9. Pasta Digital - Fechar e Editar
  document.querySelectorAll('#btn-close-details-modal, #btn-close-details-modal-footer').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('modal-detalhes-processo').style.display = 'none';
    });
  });

  const btnEditFromDetails = document.getElementById('btn-edit-from-details');
  if (btnEditFromDetails) {
    btnEditFromDetails.addEventListener('click', () => {
      const procId = document.getElementById('form-add-timeline-note').getAttribute('data-processo-id');
      if (procId) {
        document.getElementById('modal-detalhes-processo').style.display = 'none';
        abrirModalCadastro(procId);
      }
    });
  }

  // 10. Registrar Nota na Linha do Tempo Manual
  const formAddNote = document.getElementById('form-add-timeline-note');
  formAddNote.addEventListener('submit', async (e) => {
    e.preventDefault();
    const procId = e.target.getAttribute('data-processo-id');
    const note = document.getElementById('timeline-note-input').value.trim();
    const submitBtn = formAddNote.querySelector('button[type="submit"]');
    if (!note) return;

    setButtonLoading(submitBtn, true, "Gravando...");

    try {
      await addHistorico(procId, "Anotação Manual", note, getCurrentUser());
      document.getElementById('timeline-note-input').value = '';
      showToast("Nota de andamento registrada.");
      await renderizarLinhaDoTempo(procId);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setButtonLoading(submitBtn, false);
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

  // 12. Clique nos cards de métricas do topo para filtrar na tabela de processos
  const cardsMetricas = [
    { classe: '.expired-card', filtro: 'Vencido' },
    { classe: '.red-card', filtro: 'Vermelho' },
    { classe: '.yellow-card', filtro: 'Amarelo' },
    { classe: '.green-card', filtro: 'Verde' },
    { classe: '.blue-card', filtro: 'Azul' }
  ];

  cardsMetricas.forEach(item => {
    const cardEl = document.querySelector(item.classe);
    if (cardEl) {
      cardEl.addEventListener('click', () => {
        // Mudar para aba de processos
        const navProcessos = document.querySelector('.nav-item[data-target="processos"]');
        if (navProcessos) {
          navProcessos.click();
        }
        // Definir filtro de urgência e atualizar
        const selectUrgencia = document.getElementById('filter-urgency');
        if (selectUrgencia) {
          selectUrgencia.value = item.filtro;
          atualizarTelas();
        }
      });
    }
  });

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
    const loginName = document.getElementById('user-username').value.trim();
    const cargo = document.getElementById('user-permission').value;
    const senha = document.getElementById('user-pass').value;
    const submitBtn = document.getElementById('form-usuario').querySelector('button[type="submit"]');

    if (!nome) {
      showToast("O nome completo é obrigatório.", "warning");
      return;
    }

    if (!loginName) {
      showToast("O login é obrigatório.", "warning");
      return;
    }

    const loginRegex = /^[a-zA-Z0-9_\-\.]+$/;
    if (!loginRegex.test(loginName)) {
      showToast("Login inválido. Não utilize espaços ou caracteres especiais.", "warning");
      return;
    }

    const email = `${loginName.toLowerCase()}@aviladesouza.adv.br`;

    if (!id && !senha) {
      showToast("A senha é obrigatória para cadastrar novos usuários.", "warning");
      return;
    }

    if (senha && senha.trim().length < 6) {
      showToast("A senha deve ter pelo menos 6 caracteres.", "warning");
      return;
    }

    const payload = { nome, email, login: loginName, cargo };
    if (senha) {
      payload.senha = senha.trim();
    }

    setButtonLoading(submitBtn, true, "Salvando...");

    try {
      const currentUser = getCurrentUser();
      if (id) {
        await editUsuario(id, payload, currentUser);
        showToast("Dados do usuário atualizados.", 'success');
      } else {
        await addUsuario(payload, currentUser);
        showToast("Novo usuário criado com sucesso!", 'success');
      }
      fecharModalUsuario();
      atualizarTelas();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });

  // Exportar Relatório PDF com os filtros da tela
  document.getElementById('btn-export-pdf').addEventListener('click', async () => {
    const filtros = {
      advogado: document.getElementById('filter-lawyer').value,
      status: document.getElementById('filter-status').value,
      tipoRelatorio: 'Todos'
    };

    const urgFiltro = document.getElementById('filter-urgency').value;
    if (urgFiltro === 'Vencido') {
      filtros.tipoRelatorio = 'vencidos';
    } else if (urgFiltro !== 'Todos') {
      filtros.tipoRelatorio = 'proximos';
    } else if (filtros.status === 'Concluído' || filtros.status === 'Prazo Cumprido') {
      filtros.tipoRelatorio = 'concluidos';
    }

    showToast("Gerando relatório PDF...", "info");
    try {
      await exportarPDFRelatorio(filtros);
      showToast("Relatório PDF baixado com sucesso!", "success");
    } catch (err) {
      showToast("Erro ao exportar PDF: " + err.message, "error");
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

  // 16. Configurações - Alterar Minha Senha
  const formAlterarSenha = document.getElementById('form-alterar-senha-propria');
  if (formAlterarSenha) {
    formAlterarSenha.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const currentPass = document.getElementById('change-pass-current').value;
      const newPass = document.getElementById('change-pass-new').value;
      const confirmPass = document.getElementById('change-pass-confirm').value;
      const submitBtn = formAlterarSenha.querySelector('button[type="submit"]');

      if (newPass.length < 6) {
        showToast("A nova senha deve ter pelo menos 6 caracteres.", "warning");
        return;
      }

      if (newPass !== confirmPass) {
        showToast("A nova senha e a confirmação não coincidem.", "warning");
        return;
      }

      setButtonLoading(submitBtn, true, "Atualizando...");

      try {
        await alterarSenhaPropria(currentPass, newPass);
        showToast("Senha alterada com sucesso!", "success");
        formAlterarSenha.reset();
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        setButtonLoading(submitBtn, false);
      }
    });
  }

  // 17. Importação de PDF AASP
  const btnOpenImportPdf = document.getElementById('btn-open-import-pdf');
  const modalImportPdf = document.getElementById('modal-import-pdf');
  const btnCloseImportPdfModal = document.getElementById('btn-close-import-pdf-modal');
  const btnCloseImportPdfFooter = document.getElementById('btn-close-import-pdf-footer');
  const pdfDropzone = document.getElementById('pdf-dropzone');
  const inputPdfFile = document.getElementById('input-pdf-file');
  const pdfLoadingStatus = document.getElementById('pdf-loading-status');
  const pdfLoadingMessage = document.getElementById('pdf-loading-message');
  const pdfImportResultsContainer = document.getElementById('pdf-import-results-container');
  const pdfPublicationsList = document.getElementById('pdf-publications-list');
  const pdfResultsCount = document.getElementById('pdf-results-count');

  if (btnOpenImportPdf) {
    btnOpenImportPdf.addEventListener('click', () => {
      pdfDropzone.style.display = 'flex';
      pdfLoadingStatus.style.display = 'none';
      pdfImportResultsContainer.style.display = 'none';
      pdfPublicationsList.innerHTML = '';
      if (inputPdfFile) inputPdfFile.value = '';
      
      modalImportPdf.style.display = 'flex';
      window.lucide.createIcons();
    });
  }

  const fecharModalImportPdf = () => {
    modalImportPdf.style.display = 'none';
  };

  if (btnCloseImportPdfModal) btnCloseImportPdfModal.addEventListener('click', fecharModalImportPdf);
  if (btnCloseImportPdfFooter) btnCloseImportPdfFooter.addEventListener('click', fecharModalImportPdf);

  // Eventos de Drag & Drop
  if (pdfDropzone) {
    pdfDropzone.addEventListener('click', () => {
      inputPdfFile.click();
    });

    pdfDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      pdfDropzone.classList.add('dragover');
    });

    pdfDropzone.addEventListener('dragleave', () => {
      pdfDropzone.classList.remove('dragover');
    });

    pdfDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      pdfDropzone.classList.remove('dragover');
      const files = e.dataTransfer.files;
      if (files.length > 0 && files[0].type === 'application/pdf') {
        processarArquivoPDF(files[0]);
      } else {
        showToast("Por favor, selecione um arquivo PDF válido.", "warning");
      }
    });
  }

  if (inputPdfFile) {
    inputPdfFile.addEventListener('change', (e) => {
      const files = e.target.files;
      if (files.length > 0) {
        processarArquivoPDF(files[0]);
      }
    });
  }

  // Função para processar o PDF
  async function processarArquivoPDF(file) {
    pdfDropzone.style.display = 'none';
    pdfLoadingStatus.style.display = 'block';
    pdfLoadingMessage.textContent = 'Carregando leitor de PDF...';
    
    try {
      const pdfjs = await loadPDFJS();
      pdfLoadingMessage.textContent = 'Lendo e extraindo textos do PDF...';
      
      const fileReader = new FileReader();
      fileReader.onload = async function() {
        try {
          const typedarray = new Uint8Array(this.result);
          const loadingTask = pdfjs.getDocument({ data: typedarray });
          const pdf = await loadingTask.promise;
          
          let fullText = '';
          const numPages = pdf.numPages;
          
          for (let i = 1; i <= numPages; i++) {
            pdfLoadingMessage.textContent = `Extraindo textos: página ${i} de ${numPages}...`;
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
          }
          
          pdfLoadingMessage.textContent = 'Analisando textos judiciais...';
          const publications = parsePublications(fullText);
          
          pdfLoadingStatus.style.display = 'none';
          
          if (publications.length === 0) {
            showToast("Nenhuma publicação com formato de processo CNJ foi encontrada no PDF.", "warning");
            pdfDropzone.style.display = 'flex';
            return;
          }
          
          renderizarPublicacoesImportadas(publications);
        } catch (err) {
          showToast("Erro ao ler o PDF: " + err.message, "error");
          pdfLoadingStatus.style.display = 'none';
          pdfDropzone.style.display = 'flex';
        }
      };
      
      fileReader.readAsArrayBuffer(file);
    } catch (err) {
      showToast(err.message, "error");
      pdfLoadingStatus.style.display = 'none';
      pdfDropzone.style.display = 'flex';
    }
  }

  // Função para renderizar as publicações no modal
  function renderizarPublicacoesImportadas(publications) {
    pdfPublicationsList.innerHTML = '';
    pdfResultsCount.textContent = publications.length;
    pdfImportResultsContainer.style.display = 'block';
    
    publications.forEach((pub, index) => {
      const card = document.createElement('div');
      card.className = 'publication-card animate-fade-in';
      card.id = `pub-card-${pub.id}`;
      
      let lawyerOptionsHTML = '<option value="" disabled selected>Selecione o Advogado</option>';
      obterListaAdvogados().forEach(adv => {
        lawyerOptionsHTML += `<option value="${escapeHTML(adv.dbKey)}">${escapeHTML(adv.label)}</option>`;
      });

      let partiesOptionsHTML = '';
      if (pub.plaintiff) {
        partiesOptionsHTML += `<option value="${escapeHTML(pub.plaintiff)}">Autor: ${escapeHTML(pub.plaintiff)}</option>`;
      }
      if (pub.defendant) {
        partiesOptionsHTML += `<option value="${escapeHTML(pub.defendant)}">Réu: ${escapeHTML(pub.defendant)}</option>`;
      }
      partiesOptionsHTML += `<option value="${escapeHTML(pub.nome_cliente)}" selected>Sugerido: ${escapeHTML(pub.nome_cliente)}</option>`;

      card.innerHTML = `
        <div class="publication-card-header">
          <span class="pub-proc-num">${escapeHTML(pub.numero_processo)}</span>
          <span class="pub-detected-badge">${escapeHTML(pub.has_detected_days ? `Prazo: ${pub.prazo_dias} dias` : pub.specific_date ? 'Data detectada' : 'Prazo padrão')}</span>
        </div>
        
        <div class="publication-card-body">
          <div class="pub-form-inputs">
            <div class="form-control-group" style="margin-bottom: 8px;">
              <label style="font-size: 11px;">Nome do Cliente (Selecione ou edite se necessário)</label>
              <div style="display: flex; gap: 8px;">
                <select class="pub-party-select" style="flex: 1; padding: 8px; font-size: 13px; background: var(--primary-dark); border: 1px solid var(--border-color); color: var(--text-white); border-radius: 6px;">
                  ${partiesOptionsHTML}
                </select>
                <input type="text" class="pub-client-name-input" value="${escapeHTML(pub.nome_cliente)}" style="flex: 1.2; padding: 8px; font-size: 13px; background: var(--primary-dark); border: 1px solid var(--border-color); color: var(--text-white); border-radius: 6px;" placeholder="Nome do Cliente">
              </div>
            </div>
            
            <div class="pub-form-row">
              <div class="form-control-group" style="margin-bottom: 0;">
                <label style="font-size: 11px;">Advogado Responsável *</label>
                <select class="pub-lawyer-select" required style="padding: 8px; font-size: 13px; background: var(--primary-dark); border: 1px solid var(--border-color); color: var(--text-white); border-radius: 6px; width: 100%;">
                  ${lawyerOptionsHTML}
                </select>
              </div>
              
              <div class="form-control-group" style="margin-bottom: 0;">
                <label style="font-size: 11px;">Data Limite do Prazo *</label>
                <input type="date" class="pub-deadline-input" value="${escapeHTML(pub.data_limite)}" required style="padding: 8px; font-size: 13px; background: var(--primary-dark); border: 1px solid var(--border-color); color: var(--text-white); border-radius: 6px; width: 100%;">
              </div>
            </div>
            
            <div class="form-control-group" style="margin-bottom: 0;">
              <label style="font-size: 11px;">O que o Juiz está pedindo (Despacho)</label>
              <textarea class="pub-dispatch-input" rows="2" style="padding: 8px; font-size: 12.5px; background: var(--primary-dark); border: 1px solid var(--border-color); color: var(--text-white); border-radius: 6px; width: 100%; resize: vertical;">${escapeHTML(pub.observacoes)}</textarea>
            </div>
          </div>
          
          <div class="pub-original-text-wrapper">
            <span class="pub-original-text-title">
              <i data-lucide="file-text" style="width: 14px; height: 14px;"></i>
              Trecho da Publicação AASP
            </span>
            <div class="pub-original-text-content">${escapeHTML(pub.texto_original)}</div>
          </div>
        </div>
        
        <div class="publication-card-footer">
          <button type="button" class="btn-action-primary btn-import-pub" data-index="${index}">
            <i data-lucide="plus-circle"></i>
            <span>Importar para Painel</span>
          </button>
        </div>
      `;
      
      pdfPublicationsList.appendChild(card);
      
      const selectParty = card.querySelector('.pub-party-select');
      const inputClientName = card.querySelector('.pub-client-name-input');
      selectParty.addEventListener('change', (e) => {
        inputClientName.value = e.target.value;
      });
      
      const btnImport = card.querySelector('.btn-import-pub');
      btnImport.addEventListener('click', async () => {
        const clientName = inputClientName.value.trim();
        
        // Se já foi importado, o clique desfaz a importação
        if (card.classList.contains('imported')) {
          const processId = card.getAttribute('data-imported-process-id');
          if (!processId) return;
          
          setButtonLoading(btnImport, true, "Desfazendo...");
          
          try {
            await deleteProcesso(processId, getCurrentUser());
            
            showToast(`Importação do cliente "${clientName}" desfeita com sucesso!`, 'success');
            
            card.classList.remove('imported');
            card.removeAttribute('data-imported-process-id');
            
            btnImport.className = 'btn-action-primary btn-import-pub';
            btnImport.innerHTML = `
              <i data-lucide="plus-circle"></i>
              <span>Importar para Painel</span>
            `;
            
            atualizarTelas();
          } catch (err) {
            showToast("Erro ao desfazer importação: " + err.message, "error");
          } finally {
            setButtonLoading(btnImport, false);
            window.lucide.createIcons();
          }
          return;
        }

        const selectLawyer = card.querySelector('.pub-lawyer-select');
        const lawyer = selectLawyer.value;
        const deadlineDateRaw = card.querySelector('.pub-deadline-input').value;
        let deadlineDate = deadlineDateRaw;
        
        // Sanitizar formato de data caso o navegador/usuario use formato texto puro DD/MM/AAAA
        if (deadlineDate && /^\d{2}\/\d{2}\/\d{4}$/.test(deadlineDate)) {
          const parts = deadlineDate.split('/');
          deadlineDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        
        const dispatchText = card.querySelector('.pub-dispatch-input').value.trim();
        
        if (!clientName) {
          showToast("Nome do cliente é obrigatório.", "warning");
          return;
        }
        if (!lawyer) {
          showToast("Selecione o advogado responsável.", "warning");
          selectLawyer.focus();
          return;
        }
        if (!deadlineDate) {
          showToast("A data limite é obrigatória.", "warning");
          return;
        }
        
        setButtonLoading(btnImport, true, "Cadastrando...");
        
        try {
          const processoData = {
            nome_cliente: clientName,
            numero_processo: pub.numero_processo,
            telefone: '',
            advogado_responsavel: lawyer,
            data_limite: deadlineDate,
            status_processo: 'Pendente',
            observacoes: dispatchText
          };
          
          const createdProcess = await addProcesso(processoData, getCurrentUser());
          
          showToast(`Processo do cliente "${clientName}" cadastrado com sucesso!`, 'success');
          
          card.classList.add('imported');
          card.setAttribute('data-imported-process-id', createdProcess.id);
          
          btnImport.className = 'btn-action-danger btn-undo-import';
          btnImport.innerHTML = `
            <i data-lucide="undo-2"></i>
            <span>Desfazer Importação</span>
          `;
          
          atualizarTelas();
        } catch (err) {
          showToast("Erro ao importar processo: " + err.message, "error");
        } finally {
          setButtonLoading(btnImport, false);
          window.lucide.createIcons();
        }
      });
    });
    
    window.lucide.createIcons();
  }

  // 18. Gerenciar Advogados
  const formGerenciarAdvogados = document.getElementById('form-gerenciar-advogados');
  if (formGerenciarAdvogados) {
    formGerenciarAdvogados.addEventListener('submit', async (e) => {
      e.preventDefault();
      const n1 = document.getElementById('adv-nome-1').value.trim();
      const n2 = document.getElementById('adv-nome-2').value.trim();
      const n3 = document.getElementById('adv-nome-3').value.trim();
      const n4 = document.getElementById('adv-nome-4').value.trim();
      const n5 = document.getElementById('adv-nome-5').value.trim();
      
      if (!n1 || !n2 || !n3 || !n4 || !n5) {
        showToast("Todos os nomes de advogados são obrigatórios.", "warning");
        return;
      }
      
      localStorage.setItem('as_advogado_nome_1', n1);
      localStorage.setItem('as_advogado_nome_2', n2);
      localStorage.setItem('as_advogado_nome_3', n3);
      localStorage.setItem('as_advogado_nome_4', n4);
      localStorage.setItem('as_advogado_nome_5', n5);
      
      showToast("Nomes dos advogados atualizados com sucesso!", "success");
      
      // Atualizar todas as telas e selects
      atualizarTelas();
    });
  }
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

  // Mostrar abas restritas de gerenciamento de usuários se admin. Configurações fica visível para todos.
  const navUser = document.getElementById('nav-item-usuarios');
  const navConfig = document.getElementById('nav-item-configuracoes');
  if (navConfig) navConfig.style.display = 'block'; // Visível para todos os usuários logados
  if (userObj.cargo === 'Administrador') {
    if (navUser) navUser.style.display = 'block';
  } else {
    if (navUser) navUser.style.display = 'none';
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

// Registrar Service Worker para suporte PWA (aplicativo de celular) apenas em produção (evita cache em desenvolvimento)
if ('serviceWorker' in navigator && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('PWA Service Worker registrado com sucesso:', reg.scope))
      .catch(err => console.error('Erro ao registrar PWA Service Worker:', err));
  });
}
