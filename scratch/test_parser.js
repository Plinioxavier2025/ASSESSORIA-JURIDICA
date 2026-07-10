// Script para testar a lógica de cálculo de prazos judiciais regressivos localmente
const fs = require('fs');

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

function subtrairDiasUteis(dataFim, dias) {
  let data = new Date(dataFim);
  let c = 0;
  while (c < dias) {
    data.setDate(data.getDate() - 1);
    const diaSemana = data.getDay();
    if (diaSemana !== 0 && diaSemana !== 6) { // 0 = Domingo, 6 = Sábado
      c++;
    }
  }
  return data;
}

function extrairDataPublicacaoPDF(fullText) {
  const textSubset = fullText.substring(0, 2000)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .toLowerCase();
    
  const mesMapa = {
    'janeiro': 0, 'fevereiro': 1, 'marco': 2, 'abril': 3, 'maio': 4, 'junho': 5,
    'julho': 6, 'agosto': 7, 'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11
  };
  
  const regexExtenso = /disponibilizacao:\s*[a-z\-–\s,]*(\d{1,2})\s+de\s+([a-z]+)\s+de\s+(\d{4})/i;
  const matchExt = textSubset.match(regexExtenso);
  if (matchExt) {
    const dia = parseInt(matchExt[1], 10);
    const mesNome = matchExt[2].toLowerCase().trim();
    const ano = parseInt(matchExt[3], 10);
    if (mesMapa[mesNome] !== undefined) {
      const d = new Date(ano, mesMapa[mesNome], dia);
      d.setHours(0, 0, 0, 0);
      return d;
    }
  }
  
  const regexData = /\b(\d{2})[\/\.-](\d{2})[\/\.-](\d{4})\b/;
  const matchData = textSubset.match(regexData);
  if (matchData) {
    const d = new Date(parseInt(matchData[3], 10), parseInt(matchData[2], 10) - 1, parseInt(matchData[1], 10));
    d.setHours(0, 0, 0, 0);
    return d;
  }
  
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function calcularDataLimitePublicacao(blockText, pdfBaseDate, extractedDays, hasDetectedDays) {
  const pdfBaseDateStr = pdfBaseDate.toISOString().split('T')[0];

  const datePatternGlobal = /\b(\d{2})[\/\.](\d{2})[\/\.](\d{4})\b/g;
  let futureDates = [];
  let matchDate;
  while ((matchDate = datePatternGlobal.exec(blockText)) !== null) {
    const day = matchDate[1];
    const month = matchDate[2];
    const year = matchDate[3];
    const foundDate = `${year}-${month}-${day}`;
    if (foundDate > pdfBaseDateStr) {
      futureDates.push(foundDate);
    }
  }

  console.log('DEBUG futureDates:', futureDates);

  if (hasDetectedDays) {
    const isBackwards = /antes\s+(?:de\s+|da\s+|do\s+)?(?:realizacao\s+)?(?:de\s+|da\s+|do\s+)?(?:audiencia|pericia)/i.test(blockText) || 
                        /antecedencia\s+(?:de\s+|da\s+|do\s+)?(?:audiencia|pericia)/i.test(blockText);
    console.log('DEBUG isBackwards:', isBackwards);
    if (isBackwards && futureDates.length > 0) {
      const targetEventDate = futureDates[0];
      const dt = new Date(targetEventDate + 'T00:00:00');
      if (!isNaN(dt.getTime())) {
        return subtrairDiasUteis(dt, extractedDays).toISOString().split('T')[0];
      }
    }
    return adicionarDiasUteis(pdfBaseDate, extractedDays).toISOString().split('T')[0];
  }

  if (futureDates.length > 0) {
    return futureDates[0];
  }

  return adicionarDiasUteis(pdfBaseDate, 15).toISOString().split('T')[0];
}

const pdfText = `
Data impressão: segunda-feira, 06 de julho de 2026 - 10h02.
Disponibilização: Segunda-feira, 6 de julho de 2026
TRT2 Diário de Justiça Eletrônico Nacional
`;

const baseDate = extrairDataPublicacaoPDF(pdfText);

const block1 = `
Processo: 1001433-24.2026.5.02.0521
Designo o dia 30/09/2026 11:00 horas, para a realização de audiência UNA.
As partes poderão apresentar rol de testemunhas no prazo máximo de até 5 (cinco) dias antes da realização da audiência.
`;

const res1 = calcularDataLimitePublicacao(block1, baseDate, 5, true);
console.log('CASO 1 (Regressivo):', res1, '-> Esperado: 2026-09-23');
