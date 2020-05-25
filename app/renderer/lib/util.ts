export const WEEKS_PER_MONTH = 4.34524;


export function formatCurrency( value: number ) {
  const num = new Intl.NumberFormat(
    'en-US',
    { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }
  );
  return num.format( value );
}


export function getWeeklyWages( wage: number ) {
  return Math.floor(
    wage / WEEKS_PER_MONTH
  );
}
