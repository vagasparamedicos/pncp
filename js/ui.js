const mapData = {
  "Centro-Oeste": [
    { nome: "Goiás", sigla: "GO" },
    { nome: "Mato Grosso", sigla: "MT" },
    { nome: "Mato Grosso do Sul", sigla: "MS" },
    { nome: "Distrito Federal", sigla: "DF" }
  ],
  "Sul": [
    { nome: "Paraná", sigla: "PR" },
    { nome: "Santa Catarina", sigla: "SC" },
    { nome: "Rio Grande do Sul", sigla: "RS" }
  ],
  "Sudeste": [
    { nome: "São Paulo", sigla: "SP" },
    { nome: "Minas Gerais", sigla: "MG" },
    { nome: "Rio de Janeiro", sigla: "RJ" },
    { nome: "Espírito Santo", sigla: "ES" }
  ],
  "Nordeste": [
    { nome: "Bahia", sigla: "BA" }, { nome: "Pernambuco", sigla: "PE" }, { nome: "Ceará", sigla: "CE" },
    { nome: "Maranhão", sigla: "MA" }, { nome: "Paraíba", sigla: "PB" }, { nome: "Rio Grande do Norte", sigla: "RN" },
    { nome: "Alagoas", sigla: "AL" }, { nome: "Piauí", sigla: "PI" }, { nome: "Sergipe", sigla: "SE" }
  ],
  "Norte": [
    { nome: "Amazonas", sigla: "AM" }, { nome: "Pará", sigla: "PA" }, { nome: "Acre", sigla: "AC" },
    { nome: "Roraima", sigla: "RR" }, { nome: "Rondônia", sigla: "RO" }, { nome: "Amapá", sigla: "AP" },
    { nome: "Tocantins", sigla: "TO" }
  ]
};

const MODALIDADES_BUSCA = ["6", "8", "2", "3", "7"]; 
const MEDICAL_KEYWORDS = ["médico", "medico", "medicina", "plantão", "plantao", "clínico", "clinico", "psiquiatra", "pediatra", "saúde", "hospitalar"];

let currentRegion = "";
let currentState = "";
let currentCitySelected = "";
let currentCitiesData = {}; 

function showView(viewName) {
  ['regions', 'states', 'cities', 'vacancies'].forEach(v => {
    document.getElementById(`view-${v}`).classList.add('hidden');
    document.getElementById(`view-${v}`).classList.remove('block');
  });
  document.getElementById(`view-${viewName}`).classList.remove('hidden');
  document.getElementById(`view-${viewName}`).classList.add('block');
}

function initDashboard() {
  const grid = document.getElementById('regionsGrid');
  grid.innerHTML = '';
  Object.keys(mapData).forEach(region => {
    const btn = document.createElement('button');
    btn.className = "w-full text-left bg-white rounded-2xl border border-slate-200 p-5 active:scale-[0.98] transition-all hover:border-blue-300 hover:shadow-md group flex items-center justify-between";
    btn.onclick = () => openRegion(region);
    btn.innerHTML = `
      <div>
        <h3 class="text-lg font-bold text-slate-800">${region}</h3>
        <p class="text-sm text-slate-500 mt-1">${mapData[region].length} estados</p>
      </div>
      <div class="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
      </div>
    `;
    grid.appendChild(btn);
  });
}

function openRegion(regionName) {
  currentRegion = regionName;
  document.getElementById('statesTitle').textContent = `Estados - ${regionName}`;
  const grid = document.getElementById('statesGrid');
  grid.innerHTML = '';

  mapData[regionName].forEach(state => {
    const btn = document.createElement('button');
    btn.className = "w-full text-left bg-white rounded-2xl border border-slate-200 p-5 active:scale-[0.98] transition-all hover:border-blue-300 hover:shadow-md group";
    btn.onclick = () => openState(state.nome, state.sigla);
    btn.innerHTML = `
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-bold text-slate-800">${state.nome}</h3>
          <span class="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded mt-1 inline-block">${state.sigla}</span>
        </div>
        <svg class="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
      </div>
    `;
    grid.appendChild(btn);
  });
  showView('states');
}

async function openState(stateName, stateSigla) {
  currentState = stateSigla;
  document.getElementById('citiesTitle').textContent = `Documentos em ${stateName}`;
  document.getElementById('citiesSubtitle').innerHTML = "Buscando Editais, Atas e Contratos médicos (últimos 30 dias)...";
  document.getElementById('citiesGrid').innerHTML = '';
  document.getElementById('loadingCities').classList.remove('hidden');
  showView('cities');

  const { dataInicial, dataFinal } = ApiPNCP.getDateRange(30); 
  let rawItems = [];

  try {
    // 1. BUSCAR EDITAIS
    for (let i = 0; i < MODALIDADES_BUSCA.length; i++) {
      const mod = MODALIDADES_BUSCA[i];
      const url = ApiPNCP.buildUrl(API_EDITAIS, { dataInicial, dataFinal, codigoModalidadeContratacao: mod, tamanhoPagina: 50 });
      
      const json = await ApiPNCP.fetchJsonWithTimeout(url);
      const items = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : []);
      items.forEach(it => it.tipoDocumento = 'edital');
      rawItems = rawItems.concat(items);

      if (i < MODALIDADES_BUSCA.length - 1) await new Promise(resolve => setTimeout(resolve, 300));
    }
    await new Promise(resolve => setTimeout(resolve, 300));

    // 2. BUSCAR ATAS DE REGISTRO
    const urlAtas = ApiPNCP.buildUrl(API_ATAS, { dataInicial, dataFinal, tamanhoPagina: 50 });
    const jsonAtas = await ApiPNCP.fetchJsonWithTimeout(urlAtas);
    const itemsAtas = Array.isArray(jsonAtas?.data) ? jsonAtas.data : (Array.isArray(jsonAtas) ? jsonAtas : []);
    itemsAtas.forEach(it => it.tipoDocumento = 'ata');
    rawItems = rawItems.concat(itemsAtas);
    await new Promise(resolve => setTimeout(resolve, 300));

    // 3. BUSCAR CONTRATOS
    const urlContratos = ApiPNCP.buildUrl(API_CONTRATOS, { dataInicial, dataFinal, tamanhoPagina: 50 });
    const jsonContratos = await ApiPNCP.fetchJsonWithTimeout(urlContratos);
    const itemsContratos = Array.isArray(jsonContratos?.data) ? jsonContratos.data : (Array.isArray(jsonContratos) ? jsonContratos : []);
    itemsContratos.forEach(it => it.tipoDocumento = 'contrato');
    rawItems = rawItems.concat(itemsContratos);

    currentCitiesData = {};
    let medicalCount = 0;

    rawItems.forEach(item => {
      // Localização robusta de Estado (UF)
      const ufEncontrada = ApiPNCP.pick(item, ["uf", "siglaUf"]) || (item.orgaoEntidade && item.orgaoEntidade.ufSigla) || (item.unidadeOrgao && item.unidadeOrgao.ufSigla);
      if (ufEncontrada && ufEncontrada !== stateSigla) return; 

      // Objeto varia entre Editais, Atas e Contratos
      const objeto = ApiPNCP.pick(item, ["objetoCompra", "objeto", "descricaoObjeto", "objetoAta", "objetoContrato"]).toLowerCase();
      
      const isMedical = MEDICAL_KEYWORDS.some(kw => objeto.includes(kw));
      if (!isMedical) return;

      // Cálculo de Relevância
      let relScore = 0;
      MEDICAL_KEYWORDS.forEach(kw => {
          const regex = new RegExp(kw, "gi");
          const matches = objeto.match(regex);
          if (matches) relScore += matches.length;
      });
      item.relevanceScore = relScore;

      // Localização robusta de Município
      const municipio = ApiPNCP.pick(item, ["municipioNome", "municipio"]) || (item.orgaoEntidade && item.orgaoEntidade.municipioNome) || "Município não informado";
      
      if (!currentCitiesData[municipio]) {
        currentCitiesData[municipio] = [];
      }
      currentCitiesData[municipio].push(item);
      medicalCount++;
    });

    document.getElementById('loadingCities').classList.add('hidden');
    
    const cityNames = Object.keys(currentCitiesData).sort();
    document.getElementById('citiesSubtitle').textContent = `${medicalCount} documentos encontrados em ${cityNames.length} municípios.`;

    if (cityNames.length === 0) {
      document.getElementById('citiesGrid').innerHTML = `<div class="col-span-full p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">Nenhum documento médico encontrado neste estado nos últimos 30 dias.</div>`;
      return;
    }

    cityNames.forEach(city => {
      const btn = document.createElement('button');
      const vagas = currentCitiesData[city].length;
      btn.className = "w-full text-left bg-white rounded-2xl border border-slate-200 p-5 active:scale-[0.98] transition-all hover:border-blue-300 hover:shadow-md group flex items-center justify-between";
      btn.onclick = () => {
          currentCitySelected = city;
          document.getElementById('vacanciesTitle').textContent = `Documentos em ${city} - ${currentState}`;
          showView('vacancies');
          renderVacancies();
      };
      btn.innerHTML = `
        <div>
          <h3 class="text-[15px] font-bold text-slate-800">${city}</h3>
          <p class="text-xs text-blue-600 font-semibold mt-1">${vagas} documento(s)</p>
        </div>
        <svg class="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
      `;
      document.getElementById('citiesGrid').appendChild(btn);
    });

  } catch (error) {
    document.getElementById('loadingCities').classList.add('hidden');
    document.getElementById('citiesSubtitle').innerHTML = `<span class="text-red-500 font-medium">Erro ao buscar os dados na API: ${error.message}</span>`;
    console.error(error);
  }
}

// === RENDERIZAR E ORDENAR RESULTADOS ===
function renderVacancies() {
  const grid = document.getElementById('vacanciesGrid');
  grid.innerHTML = '';

  let vacancies = currentCitiesData[currentCitySelected] || [];

  // 1. Aplicar o Filtro por Tipo de Documento
  const tipoDoc = document.getElementById('filtroTipoDoc').value;
  if (tipoDoc !== 'todos') {
      vacancies = vacancies.filter(v => v.tipoDocumento === tipoDoc);
  }

  // 2. Aplicar Ordenação
  const ordenacao = document.getElementById('ordenacaoVagas').value;
  vacancies.sort((a, b) => {
      if (ordenacao === 'relevante') {
          return b.relevanceScore - a.relevanceScore; // Maior pontuação primeiro
      } else {
          const dateA = new Date(ApiPNCP.pick(a, ["dataPublicacaoPncp", "dataPublicacao", "dataAssinatura", "dataInclusao"])).getTime() || 0;
          const dateB = new Date(ApiPNCP.pick(b, ["dataPublicacaoPncp", "dataPublicacao", "dataAssinatura", "dataInclusao"])).getTime() || 0;
          
          if (ordenacao === 'recente') return dateB - dateA; // Decrescente
          if (ordenacao === 'antigo') return dateA - dateB;  // Crescente
      }
      return 0;
  });

  if (vacancies.length === 0) {
      grid.innerHTML = `<div class="col-span-full p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">Nenhum documento encontrado com os filtros selecionados.</div>`;
      return;
  }

  vacancies.forEach(item => {
      const orgao = ApiPNCP.pick(item, ["orgaoNome", "orgaoEntidadeRazaoSocial", "nomeRazaoSocial"]) || (item.orgaoEntidade && item.orgaoEntidade.razaoSocial) || "Órgão não informado";
      const objeto = ApiPNCP.pick(item, ["objetoCompra", "objeto", "descricaoObjeto", "objetoAta", "objetoContrato"]) || "Sem descrição.";
      const dataPub = ApiPNCP.pick(item, ["dataPublicacaoPncp", "dataPublicacao", "dataAssinatura", "dataInclusao"]);
      const formatData = dataPub ? new Date(dataPub).toLocaleDateString('pt-BR') : '';

      // --- SOLUÇÃO DEFINITIVA DOS LINKS ---
      const cnpj = ApiPNCP.pick(item, ["cnpj", "numeroInscricaoCnpj"]) || (item.orgaoEntidade && item.orgaoEntidade.cnpj) || "";
      let linkSeguro = "";

      if (item.tipoDocumento === 'edital' && cnpj && item.anoCompra && item.numeroCompra) {
          linkSeguro = `https://pncp.gov.br/app/editais/${cnpj}/${item.anoCompra}/${item.numeroCompra}`;
      } else if (item.tipoDocumento === 'ata' && cnpj && item.anoAta && item.numeroAta) {
          linkSeguro = `https://pncp.gov.br/app/atas/${cnpj}/${item.anoAta}/${item.numeroAta}`;
      } else if (item.tipoDocumento === 'contrato' && cnpj && item.anoContrato && item.numeroContrato) {
          linkSeguro = `https://pncp.gov.br/app/contratos/${cnpj}/${item.anoContrato}/${item.numeroContrato}`;
      } else {
          let linkBruto = ApiPNCP.pick(item, ["linkSistemaOrigem", "link", "url"]);
          if (linkBruto && !linkBruto.startsWith('http')) {
              linkSeguro = linkBruto.startsWith('/') ? 'https://pncp.gov.br' + linkBruto : 'https://' + linkBruto;
          } else {
              linkSeguro = linkBruto;
          }
      }
      // -------------------------------------

      // Identidade visual por tipo de documento
      let badgeColor = "bg-green-50 text-green-700 border-green-100";
      let badgeText = "Edital / Contratação";
      
      if (item.tipoDocumento === 'ata') {
          badgeColor = "bg-purple-50 text-purple-700 border-purple-100";
          badgeText = "Ata de Registro";
      } else if (item.tipoDocumento === 'contrato') {
          badgeColor = "bg-orange-50 text-orange-700 border-orange-100";
          badgeText = "Contrato Assinado";
      }

      const card = document.createElement('div');
      card.className = "bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between h-full shadow-sm hover:shadow-md transition-all";
      card.innerHTML = `
        <div>
          <div class="flex justify-between items-start mb-4">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeColor}">${badgeText}</span>
            <span class="text-xs text-slate-400 font-medium">${formatData}</span>
          </div>
          <h3 class="text-sm font-bold text-slate-800 mb-2 line-clamp-2" title="${orgao.replace(/"/g, '&quot;')}">${orgao}</h3>
          <p class="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4 line-clamp-4" title="${objeto.replace(/"/g, '&quot;')}">${objeto}</p>
        </div>
        <div class="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
          <span class="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Relevância: ${item.relevanceScore}</span>
          ${linkSeguro ? `
            <a href="${linkSeguro}" target="_blank" class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-sm">
              Ver Oficial
            </a>
          ` : '<span class="text-[10px] text-red-500 bg-red-50 px-2 py-1 rounded font-medium">Link indisponível</span>'}
        </div>
      `;
      grid.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', initDashboard);
