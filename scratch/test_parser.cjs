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

  const normalizedBlockText = blockText.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  if (hasDetectedDays) {
    const isBackwards = /antes\s+(?:de\s+|da\s+|do\s+)?(?:realizacao\s+)?(?:de\s+|da\s+|do\s+)?(?:audiencia|pericia)/i.test(normalizedBlockText) || 
                        /antecedencia\s+(?:de\s+|da\s+|do\s+)?(?:audiencia|pericia)/i.test(normalizedBlockText);
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

function extrairDiasDoTexto(snippet) {
  const digitoMatch = snippet.match(/\b\d+\b/);
  if (digitoMatch) {
    return parseInt(digitoMatch[0], 10);
  }

  const textoLimpo = snippet.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

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
      if (val >= 20 && palavras[i + 1] === 'e' && palavrasMapa[palavras[i + 2]] !== undefined && palavrasMapa[palavras[i + 2]] < 10) {
        valorAcumulado += val + palavrasMapa[palavras[i + 2]];
        i += 2;
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

function detectarDiasPrazo(blockText) {
  const normalizedBlock = blockText.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Usamos exec em loop para encontrar todas as ocorrências de padrões de prazo em dias
  const daysRegexGlobal = /(?:prazo\s+(?:[a-zA-Z]{1,20}\s+){0,3}de|em|no\s+prazo\s+de|prazo\s*:\s*)\s*(?:ate\s+)?([a-zA-Z\d\s\(\)-]{1,45})\s+dias/gi;
  
  let match;
  while ((match = daysRegexGlobal.exec(normalizedBlock)) !== null) {
    const extracted = extrairDiasDoTexto(match[1]);
    if (extracted !== null && extracted > 0 && extracted <= 30) {
      return { days: extracted, detected: true };
    }
  }

  // Fallback global
  const fallbackRegexGlobal = /\b(\d+|um|dois|tres|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|treze|catorze|quatorze|quinze|vinte|trinta|quarenta|cinquenta|sessenta|setenta|oitenta|noventa)\s+dias/gi;
  let fallbackMatch;
  while ((fallbackMatch = fallbackRegexGlobal.exec(normalizedBlock)) !== null) {
    const extracted = extrairDiasDoTexto(fallbackMatch[1]);
    if (extracted !== null && extracted > 0 && extracted <= 30) {
      return { days: extracted, detected: true };
    }
  }

  return { days: 15, detected: false };
}

module.exports = {
  adicionarDiasUteis,
  subtrairDiasUteis,
  extrairDataPublicacaoPDF,
  calcularDataLimitePublicacao,
  detectarDiasPrazo
};
