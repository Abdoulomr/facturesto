export function formatFCFA(amount: number): string {
  return Math.round(amount).toLocaleString('fr-FR') + ' FCFA';
}
