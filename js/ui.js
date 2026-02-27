let rawResults = []; 
let filteredResults = []; 

function showView(viewName) {
  document.getElementById('view-search').classList.add('hidden');
  document.getElementById('view-results').classList.add('hidden');
  document.getElementById('view-details').classList.add('hidden');
  document.getElementById(`view-${viewName}`).classList.remove('hidden');
}

const form = document.getElementById('pncpForm');
if(form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const dataInicial = ApiPNCP.onlyDigits(document.getElementById('dataInicial').value);
    const dataFinal = ApiPNCP.onlyDigits(document.getElementById('dataFinal').value);
    const modalidades = ApiPNCP.normalizeModalidades(document.getElementById('modalidades').value);
    const btnBuscar = document.getElementById('btnBuscar');

    if (!ApiPNCP.isAAAAMMDD(dataInicial) || !ApiPNCP.isAAAAMMDD(dataFinal)) {
      alert("Erro: preencha as datas no formato AAAAMMDD.");
      return;
    }
    if (modalidades.length === 0) {
      alert("Erro: informe ao menos 1 modalidade válida.");
      return;
    }

    btnBuscar.disabled = true;
    btnBuscar.innerHTML = "A pesquisar...";

    try {
      let merged = [];
      for (let i = 0; i < modalidades.length; i++) {
        const url = ApiPNCP.buildUrl({ dataInicial, dataFinal, codigoModalidadeContratacao: modalidades[i] });
        const json = await ApiPNCP.fetchJsonWithTimeout(url);
        const items = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : []);
        merged = merged.concat(items);
      }

      const seen = new Set();
      const deduped = [];
      for (const it of merged) {
        const key = ApiPNCP.pick(it, ["id", "numeroCompra"]) + "|" + ApiPNCP.pick(it, ["orgaoNome"]);
        if (seen.has(key)) continue;
        seen.add(key);
        deduped.push(it);
      }

      rawResults = deduped;
      applyLocalFilters(); 
      showView('results');

    } catch (error) {
      alert("Ocorreu um erro ao consultar a API: " + error.message);
    } finally {
      btnBuscar.disabled = false;
      btnBuscar.innerHTML = "Pesquisar na API";
    }
  });
}

const filtroTexto = document.getElementById('filtroTexto');
const ordenacao = document.getElementById('ordenacao');

if(filtroTexto) filtroTexto.addEventListener('input', applyLocalFilters);
if(ordenacao) ordenacao.addEventListener('change', applyLocalFilters);

function applyLocalFilters() {
  const query = document.getElementById('filtroTexto').value.trim().toLowerCase();
  const order = document.getElementById('ordenacao').value;

  filteredResults = rawResults.slice();

  if (query) {
    filteredResults = filteredResults.filter(item => {
      const searchable = [
        ApiPNCP.pick(item, ["orgaoNome", "orgaoEntidadeRazaoSocial"]),
        ApiPNCP.pick(item, ["objetoCompra", "objeto"]),
        ApiPNCP.pick(item, ["municipioNome", "municipio"]),
        ApiPNCP.pick(item, ["uf", "siglaUf"])
      ].join(" ").toLowerCase();
      return searchable.includes(query);
    });
  }

  const getTime = (x) => {
    const v = ApiPNCP.pick(x, ["dataPublicacaoPncp", "dataPublicacao", "dataInclusao"]);
    const t = Date.parse(v);
    return Number.isNaN(t) ? 0 : t;
  };
  const dir = order === "asc" ? 1 : -1;
  filteredResults.sort((a, b) => (getTime(a) - getTime(b)) * dir);

  renderResults(filteredResults);
}

function renderResults(items) {
  const grid = document.getElementById('resultsGrid');
  document.getElementById('resultsSubtitle').textContent = `A exibir ${items.length} de ${rawResults.length} contratações`;
  grid.innerHTML = '';

  if (items.length === 0) {
    grid.innerHTML = `<div class="col-span-full p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">Nenhum registo encontrado.</div>`;
    return;
  }

  items.forEach((item, index) => {
    const orgao = ApiPNCP.pick(item, ["orgaoNome", "orgaoEntidadeRazaoSocial"]) || "Órgão não informado";
    const uf = ApiPNCP.pick(item, ["uf", "siglaUf"]) || "--";
    const modalidade = ApiPNCP.pick(item, ["modalidadeNome", "modalidade"]) || "Modalidade Padrão";
    const dataPub = ApiPNCP.pick(item, ["dataPublicacaoPncp", "dataPublicacao"]);
    const formatData = dataPub ? new Date(dataPub).toLocaleDateString('pt-BR') : '';

    const card = document.createElement('div');
    card.className = "bg-white rounded-2xl border border-slate-200 p-5 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between h-full";
    card.onclick = () => showDetails(index);

    card.innerHTML = `
      <div>
        <div class="flex items-start justify-between mb-3">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">${uf}</span>
          <span class="text-xs font-medium text-slate-400">${formatData}</span>
        </div>
        <h3 class="text-sm font-semibold text-slate-800 line-clamp-2 mb-1" title="${orgao}">${orgao}</h3>
        <p class="text-xs text-slate-500 mb-4">${modalidade}</p>
      </div>
      <div class="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
        <span class="text-xs font-medium text-blue-600">Ver detalhes</span>
        <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
      </div>
    `;
    grid.appendChild(card);
  });
}

function showDetails(index) {
  const item = filteredResults[index];
  const container = document.getElementById('detailsContainer');
  
  const orgao = ApiPNCP.pick(item, ["orgaoNome", "orgaoEntidadeRazaoSocial"]);
  const objeto = ApiPNCP.pick(item, ["objetoCompra", "objeto", "descricaoObjeto"]) || "Sem descrição disponível.";
  const link = ApiPNCP.pick(item, ["linkSistemaOrigem", "link", "url"]);
  const numAno = ApiPNCP.pick(item, ["numeroCompra", "numeroInstrumentoConvocatorio"]) + "/" + ApiPNCP.pick(item, ["anoCompra", "ano"]);

  container.innerHTML = `
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-slate-800">${orgao}</h2>
      <p class="text-sm text-slate-500 mt-2">Nº/Ano: <span class="font-medium text-slate-700">${numAno !== "/" ? numAno : "N/A"}</span></p>
    </div>
    <div class="bg-slate-50 p-5 rounded-xl border border-slate-100 mb-6">
      <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Objeto da Compra</h4>
      <p class="text-sm text-slate-700 leading-relaxed">${objeto}</p>
    </div>
    ${link ? `
      <a href="${link}" target="_blank" class="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-medium py-3 px-6 rounded-xl transition-all shadow-sm w-full sm:w-auto">
        Aceder ao Link Original (Origem)
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
      </a>
    ` : ''}
  `;
  showView('details');
}

function exportData(type) {
  if (filteredResults.length === 0) return;
  const timestamp = new Date().toISOString().slice(0,19).replaceAll(":","");
  
  if (type === 'json') {
    const dataStr = JSON.stringify(filteredResults, null, 2);
    downloadFile(`pncp_${timestamp}.json`, dataStr, "application/json;charset=utf-8");
  } else if (type === 'csv') {
    const cols = [
      ["orgao", ["orgaoNome","orgaoEntidadeRazaoSocial"]],
      ["modalidade", ["modalidadeNome","modalidade"]],
      ["uf", ["uf","siglaUf"]],
      ["municipio", ["municipioNome","municipio"]],
      ["data_publicacao", ["dataPublicacaoPncp","dataPublicacao"]],
      ["objeto", ["objetoCompra","objeto"]],
      ["link", ["linkSistemaOrigem","link"]]
    ];
    const esc = (v) => `"${ApiPNCP.pick({v}, ['v']).replaceAll('"','""')}"`;
    const header = cols.map(c => esc(c[0])).join(",");
    const lines = [header, ...filteredResults.map(it => cols.map(([_, keys]) => esc(ApiPNCP.pick(it, keys))).join(","))];
    downloadFile(`pncp_${timestamp}.csv`, lines.join("\n"), "text/csv;charset=utf-8");
  }
}

function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}