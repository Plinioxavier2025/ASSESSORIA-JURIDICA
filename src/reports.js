import { getProcessos } from './db.js';

// Função auxiliar para calcular dias restantes baseado na data fixa do sistema 2026-06-15
function obterDiasRestantes(dataLimiteStr) {
  if (!dataLimiteStr) return 0;
  // Forçar fuso local para evitar perda de dia
  const dataLimite = new Date(dataLimiteStr + 'T00:00:00');
  const hoje = new Date('2026-06-15T00:00:00');
  const diffTime = dataLimite - hoje;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Função auxiliar de formatação de datas
function formatarData(dataStr) {
  if (!dataStr) return '-';
  const parts = dataStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`; // Formato DD/MM/AAAA
  }
  // Se for ISO Timestamp completo
  const d = new Date(dataStr);
  if (!isNaN(d.getTime())) {
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    return `${dia}/${mes}/${ano}`;
  }
  return dataStr;
}

// Filtra a lista de processos com base nos filtros da UI
export async function obterDadosFiltradosRelatorio(filtros) {
  const processos = await getProcessos();
  const dados = [];

  for (const p of processos) {
    let matches = true;

    // 1. Filtro por Advogado Responsável
    if (filtros.advogado && filtros.advogado !== 'Todos') {
      if (p.advogado_responsavel !== filtros.advogado) {
        matches = false;
      }
    }

    // 2. Filtro por Status do Processo
    if (filtros.status && filtros.status !== 'Todos') {
      if (p.status_processo !== filtros.status) {
        matches = false;
      }
    }

    // 3. Filtro por Tipo de Relatório (Categoria de Prazos)
    const diasRestantes = obterDiasRestantes(p.data_limite);
    const isVencido = diasRestantes < 0 && !p.prazo_concluido;
    const isProximo = diasRestantes <= 15 && diasRestantes >= 0 && !p.prazo_concluido;

    if (filtros.tipoRelatorio === 'vencidos') {
      if (!isVencido) matches = false;
    } else if (filtros.tipoRelatorio === 'proximos') {
      if (!isProximo && !isVencido) matches = false; // Mostra próximos ou vencidos ativos
    } else if (filtros.tipoRelatorio === 'concluidos') {
      if (p.status_processo !== 'Concluído' && !p.prazo_concluido) {
        matches = false;
      }
    }

    if (matches) {
      dados.push({
        ...p,
        dias_restantes: diasRestantes,
        is_vencido: isVencido
      });
    }
  }

  return dados;
}

// Exporta relatórios para Excel (usando XLSX/SheetJS)
export async function exportarExcelRelatorio(filtros) {
  const dados = await obterDadosFiltradosRelatorio(filtros);

  if (dados.length === 0) {
    alert("Nenhum registro encontrado para exportar com os filtros atuais.");
    return;
  }

  if (!window.XLSX) {
    alert("Biblioteca XLSX não carregada no escopo global.");
    return;
  }

  // Mapeia para cabeçalhos amigáveis do Excel
  const linhas = dados.map(p => {
    let diasDesc = p.prazo_concluido ? 'Prazo Cumprido' : `${p.dias_restantes} dias`;
    if (!p.prazo_concluido && p.dias_restantes < 0) {
      diasDesc = `Atrasado (${Math.abs(p.dias_restantes)} dias)`;
    }

    return {
      'Nome do Cliente': p.nome_cliente,
      'Número do Processo': p.numero_processo,
      'Telefone de Contato': p.telefone || '-',
      'Advogado Responsável': p.advogado_responsavel,
      'Data de Cadastro': formatarData(p.data_cadastro),
      'Data Limite do Prazo': formatarData(p.data_limite),
      'Prazo Restante': diasDesc,
      'Status Atual': p.status_processo,
      'Observações': p.observacoes || '-'
    };
  });

  const ws = window.XLSX.utils.json_to_sheet(linhas);

  // Define larguras padrão de coluna
  const wscols = [
    { wch: 30 }, // Cliente
    { wch: 28 }, // Nº Processo
    { wch: 18 }, // Telefone
    { wch: 22 }, // Advogado
    { wch: 15 }, // Cadastro
    { wch: 18 }, // Limite
    { wch: 20 }, // Dias Restantes
    { wch: 16 }, // Status
    { wch: 45 }  // Observações
  ];
  ws['!cols'] = wscols;

  const wb = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(wb, ws, "Controle de Prazos");

  const filename = `relatorio_prazos_${new Date().toISOString().slice(0, 10)}.xlsx`;
  window.XLSX.writeFile(wb, filename);
}

// Exporta relatórios para PDF (usando jsPDF + AutoTable com as cores corporativas)
export async function exportarPDFRelatorio(filtros) {
  const dados = await obterDadosFiltradosRelatorio(filtros);

  if (dados.length === 0) {
    throw new Error("Nenhum registro encontrado com os filtros atuais.");
  }

  if (!window.jspdf) {
    throw new Error("Biblioteca jsPDF não carregada no escopo global.");
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('l', 'mm', 'a4'); // Paisagem para caber dados processuais

  // CABEÇALHO CORPORATIVO: Azul Escuro (#0d1b2a / [13, 27, 42])
  doc.setFillColor(13, 27, 42);
  doc.rect(0, 0, 297, 32, 'F');

  // Adicionar Título Principal do Escritório (Dourado Metálico #D4AF37 / [212, 175, 55])
  doc.setTextColor(212, 175, 55);
  doc.setFontSize(18);
  doc.setFont('Helvetica', 'bold');
  doc.text("ÁVILA & SOUZA ADVOGADOS", 15, 13);

  // Subtítulo em Branco
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('Helvetica', 'normal');
  doc.text("RELATÓRIO DE GESTÃO DE PROCESSOS E CENTRAL DE CONTROLE DE PRAZOS", 15, 21);

  // Metadados do relatório (direita)
  const dataGeracao = new Date().toLocaleString('pt-BR');
  doc.setFontSize(8);
  doc.setTextColor(190, 190, 190);
  doc.text(`Gerado em: ${dataGeracao}`, 230, 12);
  doc.text(`Total de Processos: ${dados.length} registros`, 230, 18);
  doc.text(`Filtros: Advogado: ${filtros.advogado} | Status: ${filtros.status}`, 230, 24);

  // Linha divisória fina em Dourado
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(1);
  doc.line(0, 32, 297, 32);

  // Formatar dados para encaixar no AutoTable
  const body = dados.map(p => {
    let diasDesc = p.prazo_concluido ? 'Concluído' : `${p.dias_restantes} dias`;
    if (!p.prazo_concluido && p.dias_restantes < 0) {
      diasDesc = `Atrasado (${Math.abs(p.dias_restantes)}d)`;
    }

    return [
      p.nome_cliente,
      p.numero_processo,
      p.telefone || '-',
      p.advogado_responsavel,
      formatarData(p.data_cadastro),
      formatarData(p.data_limite),
      diasDesc,
      p.status_processo,
      p.observacoes || '-'
    ];
  });

  const headers = [
    ["Cliente", "Nº Processo", "Telefone", "Advogado", "Cadastro", "Limite", "Prazo Restante", "Status", "Observações"]
  ];

  doc.autoTable({
    startY: 40,
    head: headers,
    body: body,
    theme: 'grid',
    headStyles: {
      fillColor: [20, 33, 61], // Azul marinho
      textColor: [212, 175, 55], // Dourado
      fontStyle: 'bold',
      fontSize: 8.5
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 40 }, // Cliente
      1: { cellWidth: 38 }, // Processo
      2: { cellWidth: 22 }, // Telefone
      3: { cellWidth: 22 }, // Advogado
      4: { cellWidth: 18 }, // Cadastro
      5: { cellWidth: 18 }, // Limite
      6: { cellWidth: 22 }, // Prazo restante
      7: { cellWidth: 20 }, // Status
      8: { cellWidth: 67 }  // Observações
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250]
    },
    margin: { left: 15, right: 15 }
  });

  const filename = `relatorio_prazos_${new Date().toISOString().slice(0, 10)}.pdf`;
  
  // Usar Data URI em vez de Blob URL para evitar o bug de download com nome UUID em PWAs/Chrome
  const dataUri = doc.output('datauristring');
  const downloadAnchor = document.createElement('a');
  downloadAnchor.href = dataUri;
  downloadAnchor.download = filename;
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  document.body.removeChild(downloadAnchor);
}
