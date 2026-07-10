// Script para testar o parser com o texto completo do PDF de 16 páginas
const fs = require('fs');

const ocrText = `
Data impressão: segunda-feira, 06 de julho 
de 2026 - 10h02.
Associado: REGINA APARECIDA SILVA 
AVILA
OAB: 201982
1 - D J E N - TRT2
Disponibilização: Segunda-feira, 6 de julho de 2026 
Arquivo: 1
Publicação: 38323
TRT2 Diário de Justiça Eletrônico Nacional
Intimação
 Processo: 1001433-24.2026.5.02.0521 Órgão: Vara do Trabalho de Arujá 
Data de disponibilização: Tipo de comunicação: Intimação Meio: Diário de 
Justiça Eletrônico Nacional Parte(s): ROGERIO LEITE DE MELO MUNDO 
DAS FERRAMENTAS DO BRASIL LTDA Advogado(s) REGINA APARECIDA 
DA SILVA AVILA OAB SP- 201982    PODER JUDICIÁRIO JUSTIÇA DO 
TRABALHO TRIBUNAL REGIONAL DO TRABALHO DA 2ª REGIÃO VARA DO 
TRABALHO DE ARUJÁ ATSum 1001433-24.2026.5.02.0521 RECLAMANTE: 
ROGERIO LEITE DE MELO RECLAMADO: MUNDO DAS FERRAMENTAS DO 
BRASIL LTDA INTIMAÇÃO Fica V. Sa. intimado para tomar ciência do 
Despacho ID 1941a36 proferido nos autos. Não serão prestadas 
informações processuais por telefone, nos termos do Art. 476, da Nova 
CNC: O atendimento telefônico pela Secretaria da Vara do Trabalho 
restringe-se a situações excepcionais, vedada a prestação de informações 
sobre a tramitação processual, que deverão ser obtidas pelo Balcão Virtual 
ou pelos canais oficiais do TRT-2. CONCLUSÃO Nesta data, faço o feito 
concluso ao(a) MM(a) Juiz(a) da Vara do Trabalho de Arujá/SP. ARUJA/SP, 
data abaixo. MARCELO PECANHA CUTRIM DESPACHO Designo o dia 
30/09/2026 11:00 horas, para a realização de audiência UNA, a ser 
realizada na modalidade híbrida, com a utilização da plataforma de 
videoconferência ZOOM, ocasião em que as partes deverão acessar a sala 
de audiência virtual correspondente, observadas as penalidades do artigo 
844 da CLT. Fica cancelada eventual audiência anteriormente designada. 
Faculta- se às partes e às testemunhas a participação em modo 
SEMIPRESENCIAL, podendo comparecer no Fórum Trabalhista de Arujá, 
localizado na Rua Major Benjamin Franco, 88 - Jardim Vitória, ARUJA/SP - 
CEP: 07400-165, na data acima designada. É obrigatório o comparecimento 
das partes e testemunhas (presencialmente no Fórum ou na sala de 
videoconferência ZOOM). Adverte- se que, na forma remota, as partes e 
testemunhas devem estar em ambientes claramente distintos entre si, de 
forma a garantir-se que essas não se comuniquem com outras pessoas e 
advogados por ocasião dos depoimentos pessoais e testemunhos, 
possibilitando, assim, a colheita da prova. As partes poderão apresentar rol 
de testemunhas no prazo máximo de até 5 (cinco) dias antes da realização 
da audiência, sob pena de preclusão. A não apresentação do rol acarretará 
a oitiva apenas daquelas que comparecerem espontaneamente (Tese 
vinculante - RRAg-0000444-07.2023.5.17.0009). Registro que, por se tratar 
de feito que tramita pelo rito sumaríssimo, só será deferido adiamento para 
oitiva de testemunha ausente previamente arrolada e convidada (art. 852-H,
1 de 16
§§ 2º e 3º, da CLT). A prova do convite da testemunha ausente – inclusive 
com problemas de conexão para adentrar à sala virtual - deve ser feita na 
abertura da audiência (CLT, art. 852- H, 3º). O modelo para intimação de 
testemunhas estará disponível na consulta processual, cabendo às partes 
IMPRIMIR O DOCUMENTO, PREENCHÊ- LO E ENTREGÁ- LO às suas 
testemunhas (art. 825, da CLT c/c Prov GP/CR n. 13/06. art. 305 - E. TRT 2ª 
Região/SP). A defesa e demais documentos, classificados na forma do art. 
12, da Res. CSJT nº 185/2017, deverão ser protocolados no sistema PJe até 
a audiência (parágrafo único, do art. 847 da CLT). Recomenda-se a juntada 
com pelo menos 48 horas de antecedência à audiência. Em audiência, V. Sª. 
pode designar preposto, art. 843, da CLT, bem como constituir advogado. A 
ausência da reclamada na audiência ou, ainda, a falta de defesa, importa na 
aplicação das penas de revelia e confissão quanto à matéria de fato (art. 
844, da CLT c/ c art. 344 do CPC). O acesso à audiência virtual, pela 
plataforma ZOOM, deve se dar por meio das dados abaixo indicados, a 
respeito dos quais ficam as partes cientificadas, por meio deste despacho, 
mediante publicação no DEJT. Caso alguma das partes não possua 
advogado habilitado, os dados serão também informados no documento de 
intimação ou citação. https:// trt2- jus- br.zoom.us/ j/88631726170?
pwd=CxyI7ZWmvYmKn0U3VGoNsvA9zNhaqJ.1 ID da reunião: 886 317 
6170 Senha de acesso: vtaruja01 Se o acesso ocorrer por celular, há 
necessidade de se baixar o aplicativo ZOOM; porém, para acesso de 
computador ou notebook, basta copiar o link acima e colá-lo ao navegador 
de internet. Cabe observar que o ZOOM CLOUD MEETINGS não envia 
convite de forma automática aos participantes. Na hipótese de eventual 
atraso para início da audiência, em razão de outra estar em andamento, 
caberá às partes e advogados aguardarem e ficarem atentos ao início da 
audiência. O andamento da pauta do dia poderá ser acompanhado através 
do aplicativo JTe, disponibilizado para celulares dos sistemas Android e IOS 
(lojas Google Play e App Store), ou através do link https:// jte.csjt.jus.br/. 
Eventuais dificuldades técnicas de acesso à audiência deverão ser 
comunicadas imediatamente pela(s) parte(s) à Secretaria da Vara, através 
do endereço de e- mail institucional vtaruja01@trtsp.jus.br, sob pena de 
preclusão. Solicita-se comunicar com antecedência mínima de dez dias a 
necessidade de nomeação de intérprete de LIBRAS - Língua Brasileira de 
Sinais para atuar na audiência, caso haja pessoa surda ou com deficiência 
auditiva como partícipe de processo. Cite(m)- se a(s) reclamada(s) para 
responder(em) aos termos da presente ação e intime- se acerca da 
audiência designada, pelo correio. Acaso a(s) reclamada(s) mantenha(m) 
cadastro junto ao Domicílio Judicial Eletrônico, a primeira citação deverá, 
obrigatoriamente, ser encaminhada por esta via, nos termos do Provimento 
GP/CR nº 04/2022, Portaria CNJ nº 46/2024 e Resolução CNJ nº 455 de 
27/04/2022. Registre- se que a ausência de confirmação em até 3 (três) 
dias úteis contados do recebimento da citação eletrônica, implicará a 
realização da citação pelos meios convencionais, conforme acima 
determinado, cabendo ao réu citado apresentar justa causa para a ausência 
de confirmação do recebimento da aludida citação enviada eletronicamente 
para seu domicílio judicial eletrônico, na primeira oportunidade de falar nos 
autos. Não apresentada justificativa para tal omissão, a parte ré estará 
sujeita à multa no percentual de até 5% do valor da causa, conforme 
Resolução CNJ n. 455/2022 e art. 246, §§1º, 1º- A e 1º- C, do CPC. 
2 de 16
Resultando sem êxito a citação no modo eletrônico, ou não estando a(s) 
reclamada(s) cadastrada(s) no Domicílio Judicial Eletrônico, cite(m)-se a(s) 
reclamada(s) na(s) pessoa(s) de seu(s) sócio(s) atuais, nos endereços 
cadastrados na base de dados da Receita Federal, caso ainda não 
diligenciados, por oficial de justiça. Tratando- se a(o)s reclamada(o)s de 
pessoa física(s), intime-se a parte autora para fornecer o atual endereço 
da(o)s ré(réu)s em 05 dias, sob pena de extinção do feito sem resolução do 
mérito. Tratando-se a(o)s reclamada(o)s de pessoa jurídica e se não houver 
ficha Jucesp nos autos, a parte autora deverá ser intimada para 
apresentação no prazo de 2 dias, sob pena de extinção do feito sem 
resolução do mérito. Decorrido prazo ou restando frustrada a citação na(s) 
pessoa(s) de seu(s) sócio(s), voltem conclusos. Int. ARUJA/SP, 03 de julho 
de 2026. MAURICIO EVANDRO CAMPOS COSTA Juiz do Trabalho 
TitularIntimado(s) / Citado(s) - ROGERIO LEITE DE MELO
2 - D J E N - TRT2
Disponibilização: Segunda-feira, 6 de julho de 2026 
Arquivo: 1
Publicação: 2732
TRT2 Diário de Justiça Eletrônico Nacional
Lista de distribuição
 Processo: 1001444-53.2026.5.02.0521 Órgão: Vara do Trabalho de Arujá 
Data de disponibilização: Tipo de comunicação: Lista de distribuição 
Meio: Diário de Justiça Eletrônico Nacional Parte(s): ROGERIO LEITE DE 
MELO SANTA ISABEL SERVICOS ADMINISTRATIVOS E GESTAO LTDA 
Advogado(s) REGINA APARECIDA DA SILVA AVILA OAB SP- 201982   
 Processo 1001444-53.2026.5.02.0521 distribuído para Vara do Trabalho de 
Arujá na data 02/07/2026 Para maiores informações, clique no link a seguir: 
https:// pje.trt2.jus.br/ pjekz/
visualizacao/26070300300249400000471360367?instancia=1
3 - D J E N - TRT2
Disponibilização: Segunda-feira, 6 de julho de 2026 
Arquivo: 1
Publicação: 2032
TRT2 Diário de Justiça Eletrônico Nacional
Lista de distribuição
 Processo: 1002375-90.2025.5.02.0521 Órgão: 20ª Turma - Cadeira 2 Data 
de disponibilização: Tipo de comunicação: Lista de distribuição Meio: 
Diário de Justiça Eletrônico Nacional Parte(s): NIAZITEX IMPORTACAO E 
EXPORTACAO DE TECIDOS LTDA CLEIDSON SANTOS DE SOUSA 
Advogado(s) REGINA APARECIDA DA SILVA AVILA OAB SP- 201982 
SHIRLEY MENDONCA LEAL OAB SP-107307    Processo 
1002375-90.2025.5.02.0521 distribuído para 20ª Turma - 20ª Turma - 
Cadeira 2 na data 02/07/2026 Para maiores informações, clique no link a 
3 de 16
seguir: https:// pje.trt2.jus.br/ pjekz/
visualizacao/26070300300691500000303865157?instancia=2
5 - D J E N - TJSP
Disponibilização: Segunda-feira, 6 de julho de 2026 
Arquivo: 1
Publicação: 290880
TJSP Diário de Justiça Eletrônico Nacional
Intimação
 Processo: 4002396-33.2026.8.26.0045 Órgão: Vara do Juizado Especial 
Cível e Criminal da Comarca de Arujá Data de disponibilização: 06/07/2026 
Tipo de comunicação: Intimação Meio: Diário de Justiça Eletrônico 
Nacional Parte(s): CLOVIS FRANCO FARIA Advogado(s) REGINA 
APARECIDA DA SILVA AVILA OAB SP- 201982    PROCEDIMENTO DO 
JUIZADO ESPECIAL CÍVEL Nº 4002396-33.2026.8.26.0045/ SP Assunto: 
Rescisão do contrato e devolução do dinheiro AUTOR: CLOVIS FRANCO 
FARIAADVOGADO(A): REGINA APARECIDA DA SILVA AVILA (OAB 
SP201982) ATO ORDINATÓRIO Intimo a parte Autora para que, no prazo de 
05 (cinco) dias, proceda com o cadastro do endereço da Ré para citação 
automática, lembrando que o endereço favoritado será o que o sistema 
emitirá a carta. Local: Arujá
6 - D J E N - TJSP
Disponibilização: Segunda-feira, 6 de julho de 2026 
Arquivo: 1
Publicação: 289103
TJSP Diário de Justiça Eletrônico Nacional
Intimação
 Processo: 4002396-33.2026.8.26.0045 Órgão: Vara do Juizado Especial 
Cível e Criminal da Comarca de Arujá Data de disponibilização: 06/07/2026 
Tipo de comunicação: Intimação Meio: Diário de Justiça Eletrônico 
Nacional Parte(s): CLOVIS FRANCO FARIA Advogado(s) REGINA 
APARECIDA DA SILVA AVILA OAB SP- 201982    PROCEDIMENTO DO 
JUIZADO ESPECIAL CÍVEL Nº 4002396-33.2026.8.26.0045/ SP AUTOR: 
CLOVIS FRANCO FARIAADVOGADO(A): REGINA APARECIDA DA SILVA 
AVILA (OAB SP201982) DESPACHO/DECISÃO Vistos. 1) No caso dos autos, 
vislumbro os requisitos parciais da tutela de urgência, nos termos do art. 
300 do Código de Processo Civil. O perigo de dano é evidente, na medida 
em que a manutenção da exigibilidade do contrato de financiamento poderá 
culminar na inscrição do nome do autor nos cadastros de inadimplentes. A 
probabilidade do direito também está presente, mormente porque o 
contrato de financiamento é, em tese, coligado ao contrato de compra e 
venda veicular, mesmo porque o automóvel constitui garantia real daquele. 
Assim, o distrato feito entre o comprador e o vendedor é, em princípio, 
oponível à instituição bancária. No que tange ao pedido para que a 
4 de 16
requerida (vendedora) seja impedida de devolver o bem ao autor, não 
vislumbro risco de dano irreparável. No que se refere ao pedido para que a 
requerida (vendedora) seja compelida a tirar o veículo do nome do autor, 
não vislumbro cabimento neste momento inicial, mesmo porque na inércia 
da requerida, o autor, na qualidade de antigo proprietário, fica obrigado a 
fazer a comunicação junto à autarquia de trânsito, sob pena de ser 
responsabilizado solidariamente pelos débitos do veículo. Veja-se: Art. 134. 
No caso de transferência de propriedade, expirado o prazo previsto no § 1º 
do art. 123 deste Código sem que o novo proprietário tenha tomado as 
providências necessárias à efetivação da expedição do novo Certificado de 
Registro de Veículo, o antigo proprietário deverá encaminhar ao órgão 
executivo de trânsito do Estado ou do Distrito Federal, no prazo de 60 
(sessenta) dias, cópia autenticada do comprovante de transferência de 
propriedade, devidamente assinado e datado, sob pena de ter que se 
responsabilizar solidariamente pelas penalidades impostas e suas 
reincidências até a data da comunicação. Nesse sentido, não cabe ao 
Poder Judiciário se substituir na obrigação legal do autor. Por estes 
fundamentos, CONCEDO PARCIALMENTE a tutela de urgência para fins de, 
suspendendo a exigibilidade do contrato de financiamento veicular coligado 
ao contrato de compra e venda, impor à parte ré (Banco Votorantim S.A.) a 
obrigação de não fazer, para que não inscreva o nome do autor nos 
cadastros de inadimplentes, sob pena de multa de R$ 16.000,00 (dezesseis 
mil reais). 2) Cite- se e intime- se a parte requerida para que apresente 
contestação no prazo de 15 (quinze) dias, sob pena de revelia. 3) 
Oportunamente será designada audiência de tentativa de conciliação. 
Intime-se.
7 - D J E N - TJSP
Disponibilização: Segunda-feira, 6 de julho de 2026 
Arquivo: 1
Publicação: 237382
TJSP Diário de Justiça Eletrônico Nacional
Intimação
 Processo: 1000815-68.2025.8.26.0045 Órgão: Foro de Arujá - Vara do 
Juizado Especial Cível e Criminal Data de disponibilização: 06/07/2026 
Tipo de comunicação: Intimação Meio: Diário de Justiça Eletrônico 
Nacional Parte(s): JOãO VITOR DOS SANTOS BANCO BRADESCO S.A. 
GABRIEL DA SILVA JUSTINO PICPAY SERVICOS S.A Advogado(s) VIDAL 
RIBEIRO PONCANO OAB SP-91473 REGINA APARECIDA DA SILVA ÁVILA 
OAB SP- 201982 GUILHERME KASCHNY BASTIAN OAB SP-266795 
DANIELLE ADA CUSTÓDIO MORALI OAB SP-472235    Processo 
1000815-68.2025.8.26.0045 - Procedimento do Juizado Especial Cível - 
Indenização por Dano Moral - João Vitor dos Santos - Gabriel da Silva 
Justino - - BANCO BRADESCO S.A. - - Picpay Servicos S.a e outros - Ficam 
as partes e respectivos representantes cientificados de que o presente 
processo passará a tramitar eletronicamente no Sistema Eproc do Tribunal 
de Justiça do Estado de São Paulo, sob o número10008156820258260045. 
Caso seja advogado: Ficam intimados os procuradores para que 
5 de 16
providenciem o credenciamento no eproc, caso ainda não estejam 
habilitados, bem como verifiquem os dados cadastrais constantes do 
referido sistema, promovendo, se necessário, a regularização mediante 
abertura de chamado junto ao suporte do sistema. Material de apoio 
disponível em: EPROC_ADVOGADO- Primeiros_passos_no_sistema.PDF 
Caso seja entidade conveniada e a comunicação junto a este E. Tribunal de 
Justiça for: Via portal eproc - Fica a entidade intimada para que, caso ainda 
não esteja credenciada, providencie o credenciamento no sistema eproc, 
bem como a verificação dos dados cadastrais constantes; Via integração 
entre sistemas - As entidades ainda pendentes de integração, deverão 
entrar em contato com a equipe responsável no TJSP por meio de abertura 
de chamado; Em caso de dúvidas, abra um chamado em https://
www.suportesistemastjsp.com.br/. As comunicações subsequentes serão 
realizadas pelo sistema eproc, nos termos da legislação vigente e das 
Resoluções do CNJ aplicáveis. - ADV: VIDAL RIBEIRO PONCANO (OAB 
91473/ SP), DANIELLE ADA CUSTÓDIO MORALI (OAB 472235/ SP), 
GUILHERME KASCHNY BASTIAN (OAB 266795/ SP), REGINA APARECIDA 
DA SILVA ÁVILA (OAB 201982/SP)
8 - D J E N - TJSP
Disponibilização: Segunda-feira, 6 de julho de 2026 
Arquivo: 1
Publicação: 222566
TJSP Diário de Justiça Eletrônico Nacional
Intimação
 Processo: 1004205-17.2023.8.26.0045 Órgão: Processamento 2º Grupo - 
4ª Câmara Direito Privado - Pátio do Colégio, 73 - 4º andar Data de 
disponibilização: 06/07/2026 Tipo de comunicação: Intimação Meio: 
Diário de Justiça Eletrônico Nacional Parte(s): M. F. S. M. A. S. 
Advogado(s) REGINA APARECIDA DA SILVA ÁVILA OAB SP-201982 ANA 
PAULA RICI ALMEIDA OAB SP-394224    INTIMAÇÃO DE ACÓRDÃO Nº 
1004205-17.2023.8.26.0045 - Processo Digital. Petições para juntada 
devem ser apresentadas exclusivamente por meio eletrônico, nos termos 
do artigo 7º da Res. 551/2011 - Apelação Cível - Arujá - Apelante: M. F. S. 
(Justiça Gratuita) - Apelada: M. A. S. (Representado(a) por sua Mãe) e 
outros - Magistrado(a) Carlos Castilho Aguiar França - Deram provimento 
em parte ao recurso. V. U. - EMENTA : DIREITO CIVIL. APELAÇÃO. REVISÃO 
DE ALIMENTOS. PROVIMENTO PARCIAL.I. CASO EM EXAMERECURSO DE 
APELAÇÃO CONTRA SENTENÇA QUE JULGOU EXTINTO O PROCESSO EM 
RELAÇÃO À FILHA M. E IMPROCEDENTE A AÇÃO REVISIONAL DE 
ALIMENTOS QUANTO AO FILHO G., REDUZINDO A PENSÃO PARA 50% DO 
VALOR ESTABELECIDO E CONDENANDO O AUTOR AO PAGAMENTO DAS 
CUSTAS E HONORÁRIOS. O APELANTE BUSCA A REFORMA DA DECISÃO, 
ALEGANDO EQUÍVOCO NO JULGAMENTO E PLEITEANDO A REDUÇÃO DOS 
ALIMENTOS AO FILHO G. PARA 1/3 DO SALÁRIO MÍNIMO, DEVIDO À SUA 
CONDIÇÃO DE TRABALHADOR INFORMAL E AO SUSTENTO DE OUTRAS 
FILHAS.II. QUESTÃO EM DISCUSSÃO2. A QUESTÃO EM DISCUSSÃO 
CONSISTE EM (I) DETERMINAR SE HOUVE EQUÍVOCO NA CLASSIFICAÇÃO 
6 de 16
DO RESULTADO DO JULGAMENTO QUANTO À SUCUMBÊNCIA E (II) 
AVALIAR A POSSIBILIDADE DE REDUÇÃO DA PENSÃO ALIMENTÍCIA 
DEVIDA AO FILHO G. COM BASE NO BINÔMIO NECESSIDADE POSSIBILIDADE.III. RAZÕES DE DECIDIR3. O APELANTE OBTEVE 
RESULTADO ECONÔMICO COM A REDUÇÃO DA PENSÃO ALIMENTÍCIA, 
CARACTERIZANDO A PROCEDÊNCIA PARCIAL DO PEDIDO, O QUE IMPLICA 
NA NECESSIDADE DE PARTILHA DO ÔNUS SUCUMBENCIAL.4. A REDUÇÃO 
DA PENSÃO ALIMENTÍCIA PARA 40% DO SALÁRIO MÍNIMO É JUSTIFICADA 
PELA ALTERAÇÃO DA SITUAÇÃO ECONÔMICA DO ALIMENTANTE, QUE 
POSSUI OUTROS FILHOS MENORES E ATUA COMO TRABALHADOR 
INFORMAL, CONFORME O ART. 1.699 DO CÓDIGO CIVIL.4. DISPOSITIVO E 
TESE5. RECURSO PARCIALMENTE PROVIDO PARA REDUZIR A PENSÃO DE 
G. PARA 40% DO SALÁRIO MÍNIMO E ALTERAR A SUCUMBÊNCIA PARA 
RECÍPROCA.TESE DE JULGAMENTO: 1. A PROCEDÊNCIA PARCIAL DO 
PEDIDO IMPLICA NA PARTILHA DO ÔNUS SUCUMBENCIAL. 2. A REVISÃO 
DA PENSÃO ALIMENTÍCIA DEVE CONSIDERAR O BINÔMIO NECESSIDADE POSSIBILIDADE.LEGISLAÇÃO CITADA:CÓDIGO CIVIL, ART. 1.699. ART. 1007 
CPC - EVENTUAL RECURSO - SE AO STJ: CUSTAS R$ 270,12 - (GUIA GRU NO 
SITE http://www.stj.jus.br) - RESOLUÇÃO STJ/GP N. 2 DE 1º DE FEVEREIRO 
DE 2017; SE AO STF: CUSTAS R$ 1.157,59 - GUIA GRU COBRANÇA - FICHA 
DE COMPENSAÇÃO - (EMITIDA ATRAVÉS DO SITE www.stf.jus.br ) E PORTE 
DE REMESSA E RETORNO R$ 156,90 - GUIA FEDTJ - CÓD 140-6 - BANCO DO 
BRASIL OU INTERNET - RESOLUÇÃO N. 875, DE 23 DE JUNHO DE 2025 DO 
STF. Os valores referentes ao PORTE DE REMESSA E RETORNO, não se 
aplicam aos PROCESSOS ELETRÔNICOS, de acordo com o art. 3º, inciso II, 
da RESOLUÇÃO N. 833, DE 13 DE MAIO DE 2024 DO STF. - Advs: Ana Paula 
Rici Almeida (OAB: 394224/ SP) - Regina Aparecida da Silva Ávila (OAB: 
201982/SP) - 4º andar
9 - D J E N - TJSP
Disponibilização: Segunda-feira, 6 de julho de 2026 
Arquivo: 1
Publicação: 162199
TJSP Diário de Justiça Eletrônico Nacional
Intimação
 Processo: 0003769-81.2000.8.26.0045 Órgão: Foro de Arujá - 1ª Vara Data 
de disponibilização: 06/07/2026 Tipo de comunicação: Intimação Meio: 
Diário de Justiça Eletrônico Nacional Parte(s): ASSOCIAçãO UNIãO DOS 
MORADORESDA CIDADE DE ARUJá PARQUE RODRIGO BARRETO ESTADO 
DE SãO PAULO IMOBILIARIA E CONSTRUTORA CONTINENTAL LTDA 
LEONICIO CORDEIRO DA SILVA MUNICIPIO DE ARUJA O ESPOLIO “DE 
CUJUS” YOSHIO MIYASHIRO, REPRESENTADO PORMARIA GERALDA 
BARBOSA MIYASHIRO PEDRO DIVINO GARDENAL NETO PREFEITURA 
MUNICIPAL DE ARUJá VICENTE LUONGO WALTER LUONGO ZELIA MARIA 
DE OLIVEIRA Advogado(s) VERA EVANDIA BENINCASA OAB SP-88041 
TATIANA RODRIGUES SILVA DE JESUS OAB SP-218656 RENATA BESAGIO 
RUIZ OAB SP-131817 REGINA APARECIDA DA SILVA ÁVILA OAB 
SP-201982 RAQUEL MOULIN AZEVEDO MIRANDA OAB SP-392349 PAULO 
7 de 16
ROBERTO RODRIGUES PINTO OAB SP-55388 MICHELLE ESTEFANO 
MOTTA DE MOURA OAB SP-236137 MESSIAS SILVA DE JESUS OAB 
SP-198269 MAURICIO PEREIRA PITORRI OAB SP-129623 MARIANA 
PANARIELLO PAULENAS MENDES OAB SP-259458 MARIA CRISTINA DE 
MORAES AGUIAR OAB SP-79337 MÁRCIA ANDRÉA DA SILVA OAB 
SP-140501 LUIS CARLOS CORRÊA LEITE OAB SP-43459 LUCIANO DE 
FREITAS SIMÕES FERREIRA OAB SP-167780 LISONETE RISOLA DIAS OAB 
SP-215836 LIDIA MARIA DE ARAUJO DA C. BORGES OAB SP-104616 
KICIANA FRANCISCO FERREIRA MAYO OAB SP-140436 JUDITE GIROTTO 
OAB SP-47217 JOSE ROBERTO AMANCIO DA SILVA OAB SP-59844 JOSÉ 
LUÍS MARTÍNEZ VÁZQUEZ OAB SP-64527 JAIR RODRIGUES DE LIMA OAB 
SP-149072 HELIO LOBO JUNIOR OAB SP-25120 FERNANDO DE OLIVEIRA 
LUONGO OAB SP-490610 EUZEBIO RODRIGUES DE MIRANDA OAB 
SP-230665 ELAINE CRISTINA DA SILVA NASCIMENTO OAB SP-152123 
EDGAR GONÇALVES OLIVEIRA JUNIOR OAB SP-198341 DEMOSTENES 
LOPES CORDEIRO OAB SP-96722 DEMICIANA RIBEIRO AQUINO OAB 
SP-414364 CLERIO RODRIGUES DA COSTA OAB SP-94553 CALIXTO 
TOSHIRO HONDA OAB SP-266920 BRUNO SAMMARCO OAB SP-5086 
BIANCA CAPISTRANO OAB SP-465541 ANDRÉIA GONÇALVES CARREIRA 
DE MEDEIROS OAB SP-407148 ANDREA CARLA BRAZ ROSSI OAB 
SP-107148 ANA CRISTINA ALMEIDA COSTA SAPATA OAB SP-165286 
ADRIANA RUIZ VICENTIN OAB SP-196161 Processo 
0003769-81.2000.8.26.0045 (045.01.2000.003769) - Ação Civil Pública - 
Propriedade - Imobiliaria e Construtora Continental Ltda - - Walter Luongo - - 
Vicente Luongo - - Zelia Maria de Oliveira - - Municipio de Aruja - - Pedro 
Divino Gardenal Neto - - Estado de São Paulo - - LEONICIO CORDEIRO DA 
SILVA - - Prefeitura Municipal de Arujá - - Associação União dos 
Moradoresda Cidade de Arujá Parque Rodrigo Barreto - - O Espolio “de 
Cujus” Yoshio Miyashiro, Representado Pormaria Geralda Barbosa 
Miyashiro e outros - Município de Guarulhos - - Edite Ferreira de Barros - - 
Bruno Cardoso Della Bidia - - Aparecida Helena Cruzes - - PAULO DOS 
SANTOS OLIVEIRA - - NUCLEO ESPECIALIZADO DE HABITAÇÃO E 
URBANISMO DA DEFENSORIA PUBLICA - - ELISETE DE OLIVEIRA SILVA - - 
Aldemir Bezerra Reis - - FERNANDA SANTOS RODRIGUES DE CASTRO - - 
Antonio José da Silva Bastos - - Elenilton Germano de Oliveira - - Associação 
União dos Moradoresda Cidade de Arujá Parque Rodrigo Barreto - - Espolio 
“de Cujus” Yoshio Miyashiro, RepLeg Maria Geralda Barbosa Miyashiro - - 
Vandeilson Carlos de Lima - - VANDERLEA APARECIDA DA SILVA e outros - 
Luis Carlos Corrêa Leite - WRROM E ASSOCIADOS PARTICIPAÇÕES LTDA. - - 
Luciano de Freitas Simões Ferreira - - IVANILDO MARTINS e outros - - João 
Batista Alves Avelino e outros - Vistos. Fls. 8065/8067: Indefiro o pedido de 
levantamento da suspensão unicamente dos autos mencionados, 
mantendo- se a suspensão mencionada, sendo certo que esta também 
atinge os autos 1000919-70. 2019.8.2 6.0045 Fls. 8214: Intime- se o 
administrador judicial para a resposta do CRI de Santa Isabel/SP, devendo 
este comparecer junto ao cartório para obtenção das matrículas 
mencionadas, por meio de mídia a ser disponibilizada pelo próprio CRI de 
Santa Isabel/SP, devendo ainda o administrador depositar uma cópia com 
os arquivos no cartório deste Juízo. Intime- se o administrador 
pessoalmente. Fls. 8106 e 8224: Indefiro o pedido de expedição de certidão, 
podendo parte obter os extratos diretamente junto ao Banco do Brasil. Fls. 
8 de 16
8225/8228: Anote-se a penhora no rosto dos autos, por ordem deferida nos 
autos 0000547-94.2026.8.26.0045, valor da dívida atualizada no dia 19 de 
maio de 2026 é de R$ 62.800,38 (sessenta e dois mil e oitocentos reais e 
trinta e oito centavos). Sem prejuízo, certifique a serventia a situação do 
recurso de Agravo de Instrumento de nº 2300734-04.2024.8.26.0000. Int. - 
ADV: DEMOSTENES LOPES CORDEIRO (OAB 96722/ SP), REGINA 
APARECIDA DA SILVA ÁVILA (OAB 201982 / SP), ANDRÉIA GONÇALVES 
CARREIRA DE MEDEIROS (OAB 407148/SP), CLERIO RODRIGUES DA COSTA 
(OAB 94553/ SP), ANDRÉIA GONÇALVES CARREIRA DE MEDEIROS (OAB 
407148/ SP), ANDRÉIA GONÇALVES CARREIRA DE MEDEIROS (OAB 
407148/ SP), VERA EVANDIA BENINCASA (OAB 88041/ SP), REGINA 
APARECIDA DA SILVA ÁVILA (OAB 201982 / SP), ANDRÉIA GONÇALVES 
CARREIRA DE MEDEIROS (OAB 407148/ SP), ANDRÉIA GONÇALVES 
CARREIRA DE MEDEIROS (OAB 407148/SP), MARIA CRISTINA DE MORAES 
AGUIAR (OAB 79337/SP), DEMICIANA RIBEIRO AQUINO (OAB 414364/SP), 
ANDRÉIA GONÇALVES CARREIRA DE MEDEIROS (OAB 407148/ SP), 
ADRIANA RUIZ VICENTIN (OAB 196161/SP), ANDREA CARLA BRAZ ROSSI 
(OAB 107148/SP), ELAINE CRISTINA DA SILVA NASCIMENTO (OAB 152123/
SP), JAIR RODRIGUES DE LIMA (OAB 149072/SP), LIDIA MARIA DE ARAUJO 
DA C. BORGES (OAB 104616/SP), ANA CRISTINA ALMEIDA COSTA SAPATA 
(OAB 165286/SP), LIDIA MARIA DE ARAUJO DA C. BORGES (OAB 104616/
SP), FERNANDO DE OLIVEIRA LUONGO (OAB 490610/ SP), ANDRÉIA 
GONÇALVES CARREIRA DE MEDEIROS (OAB 407148/SP), RAQUEL MOULIN 
AZEVEDO MIRANDA (OAB 392349/ SP), ANDRÉIA GONÇALVES CARREIRA 
DE MEDEIROS (OAB 407148/SP), MESSIAS SILVA DE JESUS (OAB 198269/
SP), EDGAR GONÇALVES OLIVEIRA JUNIOR (OAB 198341/ SP), REGINA 
APARECIDA DA SILVA ÁVILA (OAB 201982/SP), CALIXTO TOSHIRO HONDA 
(OAB 266920/ SP), MARIANA PANARIELLO PAULENAS MENDES (OAB 
259458/ SP), DEMICIANA RIBEIRO AQUINO (OAB 414364/ SP), MAURICIO 
PEREIRA PITORRI (OAB 129623/SP), PAULO ROBERTO RODRIGUES PINTO 
(OAB 55388/ SP), BRUNO SAMMARCO (OAB 5086/ SP), JUDITE GIROTTO 
(OAB 47217/SP), JUDITE GIROTTO (OAB 47217/SP), LUIS CARLOS CORRÊA 
LEITE (OAB 43459/ SP), TATIANA RODRIGUES SILVA DE JESUS (OAB 
218656/SP), JOSE ROBERTO AMANCIO DA SILVA (OAB 59844/SP), HELIO 
LOBO JUNIOR (OAB 25120/SP), LUCIANO DE FREITAS SIMÕES FERREIRA 
(OAB 167780/ SP), TATIANA RODRIGUES SILVA DE JESUS (OAB 218656/
SP), MICHELLE ESTEFANO MOTTA DE MOURA (OAB 236137/SP), EUZEBIO 
RODRIGUES DE MIRANDA (OAB 230665/ SP), EUZEBIO RODRIGUES DE 
MIRANDA (OAB 230665/SP), DEMICIANA RIBEIRO AQUINO (OAB 414364/
SP), MÁRCIA ANDRÉA DA SILVA (OAB 140501/ SP), MÁRCIA ANDRÉA DA 
SILVA (OAB 140501/SP), DEMICIANA RIBEIRO AQUINO (OAB 414364/SP), 
DEMICIANA RIBEIRO AQUINO (OAB 414364/ SP), JOSÉ LUÍS MARTÍNEZ 
VÁZQUEZ (OAB 64527/ SP), DEMICIANA RIBEIRO AQUINO (OAB 414364/
SP), KICIANA FRANCISCO FERREIRA MAYO (OAB 140436/ SP), RENATA 
BESAGIO RUIZ (OAB 131817/SP), BIANCA CAPISTRANO (OAB 465541/SP), 
LISONETE RISOLA DIAS (OAB 215836/SP)
10 - D J E N - TJSP
Disponibilização: Segunda-feira, 6 de julho de 2026 
9 de 16
Arquivo: 1
Publicação: 162238
TJSP Diário de Justiça Eletrônico Nacional
Intimação
 Processo: 0001096-41.2025.8.26.0045 Órgão: Foro de Arujá - 1ª Vara Data 
de disponibilização: 06/07/2026 Tipo de comunicação: Intimação Meio: 
Diário de Justiça Eletrônico Nacional Parte(s): A.B.V. O.R.V. Advogado(s) 
VERA LUCIA XIMENES COLETTI OAB SP-288114 REGINA APARECIDA DA 
SILVA ÁVILA OAB SP- 201982 ADERVALDO JOSE DOS SANTOS OAB 
SP-272567    Processo 0001096-41.2025.8.26.0045 (processo principal 
1004360-97.2023.8.26.0278) - Cumprimento de sentença - 
Reconhecimento / Dissolução - A.B.V. - - A.B.V. - O.R.V. - Vistos. Fls. 106/107 
e 110: Providencie o exequente a juntada de planilha de cálculos atualizada. 
Após, abra- se nova vista ao Ministério Público. Int. - ADV: REGINA 
APARECIDA DA SILVA ÁVILA (OAB 201982 / SP), ADERVALDO JOSE DOS 
SANTOS (OAB 272567/SP), VERA LUCIA XIMENES COLETTI (OAB 288114/
SP), REGINA APARECIDA DA SILVA ÁVILA (OAB 201982/SP)
11 - D J E N - TJSP
Disponibilização: Segunda-feira, 6 de julho de 2026 
Arquivo: 1
Publicação: 162197
TJSP Diário de Justiça Eletrônico Nacional
Intimação
 Processo: 1003646-89.2025.8.26.0045 Órgão: Foro de Arujá - 1ª Vara Data 
de disponibilização: 06/07/2026 Tipo de comunicação: Intimação Meio: 
Diário de Justiça Eletrônico Nacional Parte(s): FERNANDO FREITAS 
CUNHA JúLIA CASSIANO CUNHA Advogado(s) REGINA APARECIDA DA 
SILVA ÁVILA OAB SP- 201982    Processo 1003646-89.2025.8.26.0045 - 
Arrolamento Comum - Inventário e Partilha - Fernando Freitas Cunha - Júlia 
Cassiano Cunha - Vistos. Providencie os autores o recolhimento da taxa 
judiciária, observando o quanto exposto no art. 4º, §7º, LEI N° 11.608, DE 29 
DE DEZEMBRO DE 2003. Após, tornem os autos conclusos com urgência 
para homologação da partilha. Int. - ADV: REGINA APARECIDA DA SILVA
 ÁVILA (OAB 201982 / SP), REGINA APARECIDA DA SILVA ÁVILA (OAB 
201982/SP)
12 - D J E N - TJSP
Disponibilização: Segunda-feira, 6 de julho de 2026 
Arquivo: 1
Publicação: 135891
TJSP Diário de Justiça Eletrônico Nacional
Intimação
 Processo: 0001845-97.2021.8.26.0045 Órgão: Foro de Arujá - Vara do 
10 de 16
Juizado Especial Cível e Criminal Data de disponibilização: 06/07/2026 
Tipo de comunicação: Intimação Meio: Diário de Justiça Eletrônico 
Nacional Parte(s): L.C.A.E. Advogado(s) REGINA APARECIDA DA SILVA 
ÁVILA OAB SP-201982    Processo 0001845-97.2021.8.26.0045 (processo 
principal 1003111-10.2018.8.26.0045) - Cumprimento de sentença - 
Obrigações - L.C.A.E. - Ficam as partes e respectivos representantes 
cientificados de que o presente processo passará a tramitar 
eletronicamente no Sistema Eproc do Tribunal de Justiça do Estado de São 
Paulo, sob o número00018459720218260045. Caso seja advogado: Ficam 
intimados os procuradores para que providenciem o credenciamento no 
eproc, caso ainda não estejam habilitados, bem como verifiquem os dados 
cadastrais constantes do referido sistema, promovendo, se necessário, a 
regularização mediante abertura de chamado junto ao suporte do sistema. 
Material de apoio disponível em: EPROC_ADVOGADO Primeiros_passos_no_sistema.PDF Caso seja entidade conveniada e a 
comunicação junto a este E. Tribunal de Justiça for: Via portal eproc - Fica a 
entidade intimada para que, caso ainda não esteja credenciada, providencie 
o credenciamento no sistema eproc, bem como a verificação dos dados 
cadastrais constantes; Via integração entre sistemas - As entidades ainda 
pendentes de integração, deverão entrar em contato com a equipe 
responsável no TJSP por meio de abertura de chamado; Em caso de 
dúvidas, abra um chamado em https:// www.suportesistemastjsp.com.br/. 
As comunicações subsequentes serão realizadas pelo sistema eproc, nos 
termos da legislação vigente e das Resoluções do CNJ aplicáveis. - ADV: 
REGINA APARECIDA DA SILVA ÁVILA (OAB 201982/SP)
13 - D J E N - TJSP
Disponibilização: Segunda-feira, 6 de julho de 2026 
Arquivo: 1
Publicação: 104747
TJSP Diário de Justiça Eletrônico Nacional
Intimação
 Processo: 0002566-15.2022.8.26.0045 Órgão: Foro de Arujá - Vara do 
Juizado Especial Cível e Criminal Data de disponibilização: 06/07/2026 
Tipo de comunicação: Intimação Meio: Diário de Justiça Eletrônico 
Nacional Parte(s): DURVAL RODRIGUES DA COSTA LEAL MULTIMARCAS 
Advogado(s) REGINA APARECIDA DA SILVA ÁVILA OAB SP- 201982 
CRISTIANA SILVA OAB SP-306738    Processo 0002566-15.2022.8.26.0045 
(processo principal 1003092-33.2020.8.26.0045) - Cumprimento de 
sentença - Obrigações - Durval Rodrigues da Costa - Leal Multimarcas - 
Vistos. Fls. 195/197: no prazo de 10 dias o exequente deverá esclarecer o 
peticionamento, posto que nos autos não há requerimento de terceiros. 
Intime-se. - ADV: REGINA APARECIDA DA SILVA ÁVILA (OAB 201982/SP), 
CRISTIANA SILVA (OAB 306738/SP)
14 - D J E N - TJSP
11 de 16
Disponibilização: Segunda-feira, 6 de julho de 2026 
Arquivo: 1
Publicação: 87269
TJSP Diário de Justiça Eletrônico Nacional
Intimação
 Processo: 1002044-10.2018.8.26.0045 Órgão: Foro de Arujá - Vara do 
Juizado Especial Cível e Criminal Data de disponibilização: 06/07/2026 
Tipo de comunicação: Intimação Meio: Diário de Justiça Eletrônico 
Nacional Parte(s): LEANDRO CANHADAS DE ARAUJO - EPP 
Advogado(s) REGINA APARECIDA DA SILVA ÁVILA OAB SP- 201982   
 Processo 1002044-10.2018.8.26.0045 - Procedimento do Juizado Especial 
Cível - Obrigações - Leandro Canhadas de Araujo - Epp - Ficam as partes e 
respectivos representantes cientificados de que o presente processo 
passará a tramitar eletronicamente no Sistema Eproc do Tribunal de Justiça 
do Estado de São Paulo, sob o número10020441020188260045. Caso seja 
advogado: Ficam intimados os procuradores para que providenciem o 
credenciamento no eproc, caso ainda não estejam habilitados, bem como 
verifiquem os dados cadastrais constantes do referido sistema, 
promovendo, se necessário, a regularização mediante abertura de chamado 
junto ao suporte do sistema. Material de apoio disponível em: 
EPROC_ADVOGADO-Primeiros_passos_no_sistema.PDF Caso seja entidade 
conveniada e a comunicação junto a este E. Tribunal de Justiça for: Via 
portal eproc - Fica a entidade intimada para que, caso ainda não esteja 
credenciada, providencie o credenciamento no sistema eproc, bem como a 
verificação dos dados cadastrais constantes; Via integração entre sistemas 
- As entidades ainda pendentes de integração, deverão entrar em contato 
com a equipe responsável no TJSP por meio de abertura de chamado; Em 
caso de dúvidas, abra um chamado em https://
www.suportesistemastjsp.com.br/. As comunicações subsequentes serão 
realizadas pelo sistema eproc, nos termos da legislação vigente e das 
Resoluções do CNJ aplicáveis. - ADV: REGINA APARECIDA DA SILVA ÁVILA
 (OAB 201982/SP)
15 - D J E N - TJSP
Disponibilização: Segunda-feira, 6 de julho de 2026 
Arquivo: 1
Publicação: 77643
TJSP Diário de Justiça Eletrônico Nacional
Intimação
 Processo: 1046787-43.2024.8.26.0224 Órgão: Foro de Guarulhos - 5ª Vara 
de Família e Sucessões Data de disponibilização: 06/07/2026 Tipo de 
comunicação: Intimação Meio: Diário de Justiça Eletrônico Nacional 
Parte(s): L.M.P.Q. F.C.N.Q. Advogado(s) REGINA APARECIDA DA SILVA 
ÁVILA OAB SP-201982 JOCIMARA APARECIDA GINDRO AMBRICO OAB 
SP-372955    Processo 1046787-43.2024.8.26.0224 - Interdição/ Curatela - 
Tutela de Urgência - L.M.P.Q. - F.C.N.Q. - Vistos. Defiro os requerimentos 
retro do MP. Providencie a serventia o necessário. Intime- se. - ADV: 
12 de 16
JOCIMARA APARECIDA GINDRO AMBRICO (OAB 372955/ SP), JOCIMARA 
APARECIDA GINDRO AMBRICO (OAB 372955/SP), REGINA APARECIDA DA 
SILVA ÁVILA (OAB 201982/SP)
16 - D J E N - TJSP
Disponibilização: Segunda-feira, 6 de julho de 2026 
Arquivo: 1
Publicação: 67137
TJSP Diário de Justiça Eletrônico Nacional
Intimação
 Processo: 0002406-19.2024.8.26.0045 Órgão: Foro de Arujá - Vara do 
Juizado Especial Cível e Criminal Data de disponibilização: 06/07/2026 
Tipo de comunicação: Intimação Meio: Diário de Justiça Eletrônico 
Nacional Parte(s): R.M. Advogado(s) REGINA APARECIDA DA SILVA 
ÁVILA OAB SP-201982    Processo 0002406-19.2024.8.26.0045 (processo 
principal 1003193-70.2020.8.26.0045) - Cumprimento de sentença - Nota 
Promissória - R.M. - Ficam as partes e respectivos representantes 
cientificados de que o presente processo passará a tramitar 
eletronicamente no Sistema Eproc do Tribunal de Justiça do Estado de São 
Paulo, sob o número00024061920248260045. Caso seja advogado: Ficam 
intimados os procuradores para que providenciem o credenciamento no 
eproc, caso ainda não estejam habilitados, bem como verifiquem os dados 
cadastrais constantes do referido sistema, promovendo, se necessário, a 
regularização mediante abertura de chamado junto ao suporte do sistema. 
Material de apoio disponível em: EPROC_ADVOGADO Primeiros_passos_no_sistema.PDF Caso seja entidade conveniada e a 
comunicação junto a este E. Tribunal de Justiça for: Via portal eproc - Fica a 
entidade intimada para que, caso ainda não esteja credenciada, providencie 
o credenciamento no sistema eproc, bem como a verificação dos dados 
cadastrais constantes; Via integração entre sistemas - As entidades ainda 
pendentes de integração, deverão entrar em contato com a equipe 
responsável no TJSP por meio de abertura de chamado; Em caso de 
dúvidas, abra um chamado em https:// www.suportesistemastjsp.com.br/. 
As comunicações subsequentes serão realizadas pelo sistema eproc, nos 
termos da legislação vigente e das Resoluções do CNJ aplicáveis. - ADV: 
REGINA APARECIDA DA SILVA ÁVILA (OAB 201982/SP)
17 - D J E N - TJSP
Disponibilização: Segunda-feira, 6 de julho de 2026 
Arquivo: 1
Publicação: 67135
TJSP Diário de Justiça Eletrônico Nacional
Intimação
 Processo: 0002407-04.2024.8.26.0045 Órgão: Foro de Arujá - Vara do 
Juizado Especial Cível e Criminal Data de disponibilização: 06/07/2026 
13 de 16
Tipo de comunicação: Intimação Meio: Diário de Justiça Eletrônico 
Nacional Parte(s): CAICK AURELIANO MONTEIRO DA SILVA MARCO 
ANTONIO DE OLIVEIRA Advogado(s) REGINA APARECIDA DA SILVA
 ÁVILA OAB SP-201982    Processo 0002407-04.2024.8.26.0045 (processo 
principal 0008172-05.2014.8.26.0045) - Cumprimento de sentença - 
Indenização por Dano Material - Caick Aureliano Monteiro da Silva - - Marco 
Antonio de Oliveira - Ficam as partes e respectivos representantes 
cientificados de que o presente processo passará a tramitar 
eletronicamente no Sistema Eproc do Tribunal de Justiça do Estado de São 
Paulo, sob o número00024070420248260045. Caso seja advogado: Ficam 
intimados os procuradores para que providenciem o credenciamento no 
eproc, caso ainda não estejam habilitados, bem como verifiquem os dados 
cadastrais constantes do referido sistema, promovendo, se necessário, a 
regularização mediante abertura de chamado junto ao suporte do sistema. 
Material de apoio disponível em: EPROC_ADVOGADO Primeiros_passos_no_sistema.PDF Caso seja entidade conveniada e a 
comunicação junto a este E. Tribunal de Justiça for: Via portal eproc - Fica a 
entidade intimada para que, caso ainda não esteja credenciada, providencie 
o credenciamento no sistema eproc, bem como a verificação dos dados 
cadastrais constantes; Via integração entre sistemas - As entidades ainda 
pendentes de integração, deverão entrar em contato com a equipe 
responsável no TJSP por meio de abertura de chamado; Em caso de 
dúvidas, abra um chamado em https:// www.suportesistemastjsp.com.br/. 
As comunicações subsequentes serão realizadas pelo sistema eproc, nos 
termos da legislação vigente e das Resoluções do CNJ aplicáveis. - ADV: 
REGINA APARECIDA DA SILVA ÁVILA (OAB 201982 / SP), REGINA 
APARECIDA DA SILVA ÁVILA (OAB 201982/SP)
18 - D J E N - TJSP
Disponibilização: Segunda-feira, 6 de julho de 2026 
Arquivo: 1
Publicação: 60696
TJSP Diário de Justiça Eletrônico Nacional
Intimação
 Processo: 1002748-47.2023.8.26.0045 Órgão: Foro de Arujá - 1ª Vara Data 
de disponibilização: 06/07/2026 Tipo de comunicação: Intimação Meio: 
Diário de Justiça Eletrônico Nacional Parte(s): R.M.M. R.C.A. 
Advogado(s) SILVIA SATIE KUWAHARA OAB SP-185387 REGINA 
APARECIDA DA SILVA ÁVILA OAB SP- 201982    Processo 
1002748-47.2023.8.26.0045 (apensado ao processo 
1004974-25.2023.8.26.0045) - Procedimento Comum Cível - União Estável 
ou Concubinato - R.M.M. - R.C.A. - Manifeste-se a requerente, no prazo legal, 
acerca do pedido de dilação de prazo juntado pela parte requerida. - ADV: 
SILVIA SATIE KUWAHARA (OAB 185387/SP), REGINA APARECIDA DA SILVA 
ÁVILA (OAB 201982/SP)
14 de 16
19 - D J E N - TJSP
Disponibilização: Segunda-feira, 6 de julho de 2026 
Arquivo: 1
Publicação: 61643
TJSP Diário de Justiça Eletrônico Nacional
Intimação
 Processo: 1007862-73.2025.8.26.0278 Órgão: Núcleo 4.0 Acid. Trabalho 
Inter. e Lit. - Vara do Núcleo Especializado de Justiça 4.0 - Acidentes do 
Trabalho do Interior e do Litoral Data de disponibilização: 06/07/2026 Tipo 
de comunicação: Intimação Meio: Diário de Justiça Eletrônico Nacional 
Parte(s): PAULO CESAR SILVA FONSECA Advogado(s) REGINA 
APARECIDA DA SILVA ÁVILA OAB SP- 201982    Processo 
1007862-73.2025.8.26.0278 - Procedimento Comum Cível - Auxílio-Doença 
Acidentário - Paulo Cesar Silva Fonseca - Ficam as partes cientes da 
manifestação constante à página 90, por meio da qual o(a) perito(a) judicial 
Dr. (a) Bianca Pansardi Renzi (Perita), informa a redesignação de perícia 
para o dia 16/09/2026, às 14:00, no consultório sito à Rua Navajas, 591, 
centro, Mogi das Cruzes. A parte pericianda deverá comparecer com 
antecedência mínima de 15 minutos, portando os seguintes documentos: 
Carteira Nacional de Habilitação (CNH), Carteira Trabalho e documento 
oficial de identidade com foto, bem como todos os relatórios e exames 
médicos de que disponha. - ADV: REGINA APARECIDA DA SILVA ÁVILA
 (OAB 201982/SP)
20 - D J E N - TJSP
Disponibilização: Segunda-feira, 6 de julho de 2026 
Arquivo: 1
Publicação: 22800
TJSP Diário de Justiça Eletrônico Nacional
Lista de distribuição
 Processo: 4002547-96.2026.8.26.0045 Órgão: 2ª Vara da Comarca de 
Arujá Data de disponibilização: 06/07/2026 Tipo de comunicação: Lista de 
distribuição Meio: Diário de Justiça Eletrônico Nacional Parte(s): K.S. 
FISIOTERAPIA LTDA NOTRE DAME INTERMEDICA SAUDE S.A. 
Advogado(s) REGINA APARECIDA DA SILVA AVILA OAB SP- 201982   
 Processo 4002547-96.2026.8.26.0045 distribuido para 2ª Vara da Comarca 
de Arujá na data de 02/07/2026.
21 - D J E N - TJSP
Disponibilização: Segunda-feira, 6 de julho de 2026 
Arquivo: 1
Publicação: 192497
TJSP Diário de Justiça Eletrônico Nacional
Intimação
 Processo: 4001208-05.2026.8.26.0045 Órgão: Vara do Juizado Especial 
Cível e Criminal da Comarca de Arujá Data de disponibilização: 06/07/2026 
Tipo de comunicação: Intimação Meio: Diário de Justiça Eletrônico 
Nacional Parte(s): CARLOS ALBERTO LOIACONE Advogado(s) REGINA 
APARECIDA DA SILVA AVILA OAB SP- 201982    PROCEDIMENTO DO 
JUIZADO ESPECIAL CÍVEL Nº 4001208-05.2026.8.26.0045/ SP AUTOR: 
CARLOS ALBERTO LOIACONEADVOGADO(A): REGINA APARECIDA DA 
SILVA AVILA (OAB SP201982) DESPACHO/DECISÃO Vistos. 1) A concessão 
da tutela de urgência é medida excepcional no ordenamento jurídica pátrio, 
pois o pleito final é antecipado no início do processo, sem a possibilidade 
do contraditório e ampla defesa, já que não estabelecida a relação jurídica 
processual diante da não citação do réu. Sendo assim, existe a necessidade 
da comprovação dos requisitos autorizadores para que haja a concessão 
da tutela de urgência. Nesse sentido: AGRAVO DE INSTRUMENTO. PLANO 
DE ASSISTÊNCIA MÉDICO- HOSPITALAR. EXCLUSÃO EXPRESSA DE 
TRANSPLANTES DE ÓRGÃOS, COM EXCEÇÃO DE RIM E CÓRNEA. Tem-se 
que a regra geral é o andamento regular do processo, com o 
estabelecimento do contraditório e da ampla defesa. A antecipação de 
tutela é instituto excepcional no processo civil brasileiro, que só deve ser 
deferida diante da presença dos requisitos autorizadores da concessão da 
medida, consignados no art. 273 do CPC. A falta de pressupostos, torna 
inviável o deferimento da tutela antecipada, por ofensa à norma legal. 
NEGARAM PROVIMENTO. (Agravo de Instrumento Nº 70016146599, Sexta 
Câmara Cível, Tribunal de Justiça do RS, Relator: Artur Arnildo Ludwig, 
Julgado em 14/12/2006). No caso dos autos, o autor relata que passou a 
sofrer descontos relacionados a um empréstimo não contratado. No rol de 
pedidos finais consta o pleito de inexigibilidade do débito de R$ 9.163,15. 
Em sede de tutela, o autor requer a suspensão dos descontos mensais. Em 
que pese as alegações do autor, o extrato bancário solicitado pelo juízo 
demonstrou que o autor recebeu R$ 9.162,07 no dia 27/07/2023 (evento 9, 
DOC2, 02) e, aparentemente, este valor não foi transferido a terceiros. 
Assim, entendo adequado ao caso o estabelecimento do contraditório e o 
regular andamento do feito. Por estes fundamentos, deixo de conceder a 
tutela pretendida. 2) Oportunamente será designada audiência de 
conciliação. 3) Cite-se a demandada e intime-se para contestar, no prazo de 
15 dias, sob pena de revelia. 4) Defiro os benefícios da justiça gratuita à 
parte autora. Int.
16 de 16
`;

// Carregar lógica de main.js
const mainJsContent = fs.readFileSync('src/main.js', 'utf8');

// Extrair as funções de main.js necessárias para o teste
// Vamos usar eval ou mockar as funções principais no próprio script
// Para ser limpo, vamos usar as funções que escrevemos no arquivo cjs.

const { extrairDataPublicacaoPDF, calcularDataLimitePublicacao, detectarDiasPrazo } = require('./test_parser.cjs');

// Regex de cabeçalho
const headerRegex = /\\b(\\d+)\\s*-\\s*(D\\s*J\\s*E\\s*N|D\\s*J\\s*E|D\\s*J)\\s*-\\s*([A-Z0-9]+)\\b/gi;
const cnjRegex = /\\d{7}-\\d{2}\\.\\d{4}\\.\\d\\.\\d{2}\\.\\d{4}/g;

const pdfBaseDate = extrairDataPublicacaoPDF(ocrText);
console.log('PDF BASE DATE:', pdfBaseDate.toISOString().split('T')[0]);

// Vamos fatiar por cabeçalho
const headerRegexReal = /\b(\d+)\s*-\s*(D\s*J\s*E\s*N|D\s*J\s*E|D\s*J)\s*-\s*([A-Z0-9]+)\b/gi;
const matches = [];
let match;
while ((match = headerRegexReal.exec(ocrText)) !== null) {
  matches.push({
    headerText: match[0],
    pubIndex: parseInt(match[1], 10),
    tribunal: match[3],
    index: match.index
  });
}

console.log('TOTAL MATCHES:', matches.length);

for (let i = 0; i < matches.length; i++) {
  const current = matches[i];
  const startIndex = current.index;
  const endIndex = (i + 1 < matches.length) ? matches[i + 1].index : ocrText.length;
  const blockText = ocrText.substring(startIndex, endIndex).trim();
  
  const cnjRegex = /\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/;
  const cnjMatch = blockText.match(cnjRegex);
  const processNumber = cnjMatch ? cnjMatch[0] : 'CNJ não identificado';
  
  const resultPrazo = detectarDiasPrazo(blockText);
  const extractedDays = resultPrazo.days;
  const hasDetectedDays = resultPrazo.detected;
  
  const calculatedDate = calcularDataLimitePublicacao(blockText, pdfBaseDate, extractedDays, hasDetectedDays);
  
  // Calcular diferença de dias a partir da disponibilização (06/07/2026)
  const diffTime = new Date(calculatedDate + 'T00:00:00') - pdfBaseDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  console.log(`PUB ${current.pubIndex} | PROC: ${processNumber} | DIAS DETECTADOS: ${extractedDays} (Explícito: ${hasDetectedDays}) | DATA LIMITE: ${calculatedDate} | DIAS DECORRIDOS: ${diffDays}`);
}
