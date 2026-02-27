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

      // --- CORREÇÃO DO LINK ---
      let link = ApiPNCP.pick(item, ["linkSistemaOrigem", "link", "url"]);
      
      // Se existe um link, mas não começa com http, nós corrigimos:
      if (link && !link.startsWith('http')) {
          if (link.startsWith('/')) {
              link = 'https://pncp.gov.br' + link; // Adiciona o portal do PNCP se for link relativo
          } else {
              link = 'https://' + link; // Apenas adiciona https se vier sem protocolo
          }
      }
      // ------------------------

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
          ${link ? `
            <a href="${link}" target="_blank" class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-sm">
              Ver Oficial
            </a>
          ` : '<span class="text-[10px] text-red-500 bg-red-50 px-2 py-1 rounded font-medium">Link indisponível</span>'}
        </div>
      `;
      grid.appendChild(card);
  });
}
