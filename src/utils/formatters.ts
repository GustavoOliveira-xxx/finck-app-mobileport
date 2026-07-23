export function formatarMoeda(valor: number): string {
  const n = Number(valor) || 0;
  const neg = n < 0;
  const fixo = Math.abs(n).toFixed(2);
  const [inteiro, dec] = fixo.split('.');
  const comMilhar = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${neg ? '-' : ''}${comMilhar},${dec}`;
}

export function formatarData(dataISO: string): string {
  if (!dataISO) return '-';
  const [ano, mes, dia] = dataISO.split('-');
  if (!ano || !mes || !dia) return dataISO;
  return `${dia}/${mes}/${ano}`;
}

export function hojeISO(): string {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

export function gerarId(): string {
  return `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}
