// URLs das 3 fontes diferentes do PNCP
const API_EDITAIS = "https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao";
const API_ATAS = "https://pncp.gov.br/api/consulta/v1/atas";
const API_CONTRATOS = "https://pncp.gov.br/api/consulta/v1/contratos";

const ApiPNCP = {
  onlyDigits: (s) => (s || "").replace(/\D+/g, ""),

  getDateRange: (daysAgo = 30) => {
    const today = new Date();
    const past = new Date();
    past.setDate(today.getDate() - daysAgo);

    const format = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}${m}${d}`;
    };

    return {
      dataInicial: format(past),
      dataFinal: format(today)
    };
  },

  // Ajustado para aceitar a URL base (porque agora temos 3)
  buildUrl: (baseUrl, {dataInicial, dataFinal, codigoModalidadeContratacao, pagina=1, tamanhoPagina=50}) => {
    const u = new URL(baseUrl);
    u.searchParams.set("dataInicial", dataInicial);
    u.searchParams.set("dataFinal", dataFinal);
    // Atas e Contratos não usam a modalidade na URL base da mesma forma que os Editais
    if (codigoModalidadeContratacao) {
        u.searchParams.set("codigoModalidadeContratacao", codigoModalidadeContratacao);
    }
    u.searchParams.set("pagina", String(pagina));
    u.searchParams.set("tamanhoPagina", String(tamanhoPagina));
    return u.toString();
  },

  fetchJsonWithTimeout: async (url, ms=20000) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    try {
      const resp = await fetch(url, { signal: ctrl.signal });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      
      const text = await resp.text();
      if (!text || text.trim() === "") {
        return { data: [] };
      }
      return JSON.parse(text);

    } finally {
      clearTimeout(t);
    }
  },

  pick: (obj, keys) => {
    for (const k of keys){
      if (obj && obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== "") return obj[k];
    }
    return "";
  }
};
