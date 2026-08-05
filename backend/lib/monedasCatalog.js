/**
 * Metadatos de monedas — códigos en tabla Moneda / public/scriptdb (Pais.moneda, etc.).
 */
const META = {
  DOP: { name: 'Peso Dominicano', symbol: 'RD$' },
  USD: { name: 'Dólar Estadounidense', symbol: 'US$' },
  EUR: { name: 'Euro', symbol: '€' },
  GBP: { name: 'Libra Esterlina', symbol: '£' },
  MXN: { name: 'Peso Mexicano', symbol: 'MX$' },
  COP: { name: 'Peso Colombiano', symbol: 'COL$' },
  ARS: { name: 'Peso Argentino', symbol: 'AR$' },
  CLP: { name: 'Peso Chileno', symbol: 'CL$' },
  BRL: { name: 'Real Brasileño', symbol: 'R$' },
  CAD: { name: 'Dólar Canadiense', symbol: 'CA$' },
  JPY: { name: 'Yen Japonés', symbol: '¥' },
  PEN: { name: 'Sol Peruano', symbol: 'S/' },
};

function metaForCode(code) {
  const c = String(code || '').trim().toUpperCase();
  const hit = META[c];
  if (hit) return { code: c, name: hit.name, symbol: hit.symbol };
  return { code: c, name: c, symbol: c };
}

function mapToApi(item) {
  return {
    id: String(item.id ?? item.id_moneda),
    code: item.code ?? item.codigo_iso,
    name: item.name ?? item.nombre,
    symbol: item.symbol ?? item.simbolo,
    isDefault: Boolean(item.isDefault ?? item.es_predeterminada),
    status:
      String(item.status ?? item.estado ?? 'Activa').toLowerCase() === 'inactiva' ||
      String(item.status ?? item.estado ?? '').toLowerCase() === 'inactive'
        ? 'inactive'
        : 'active',
  };
}

module.exports = { META, metaForCode, mapToApi };
