export const WEEKS_PER_MONTH = 4.34524;


export function formatCurrency( value: number ) {
  const num = new Intl.NumberFormat(
    'en-US',
    { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }
  );
  return num.format( value );
}


export function getWeeklyWages( wages: number ) {
  return Math.floor(
    wages / WEEKS_PER_MONTH
  );
}


export function getMonthlyWages( wages: number ) {
  return Math.floor(
    wages * WEEKS_PER_MONTH
  );
}


export function getLetter( num: number ) {
  return String.fromCharCode( num + 64 );
}
