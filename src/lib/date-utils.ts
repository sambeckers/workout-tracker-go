export const format = (date: Date, formatStr: string): string => {
  const d = new Date(date);
  
  const formatMap: { [key: string]: () => string } = {
    'yyyy': () => d.getFullYear().toString(),
    'MM': () => (d.getMonth() + 1).toString().padStart(2, '0'),
    'dd': () => d.getDate().toString().padStart(2, '0'),
    'HH': () => d.getHours().toString().padStart(2, '0'),
    'mm': () => d.getMinutes().toString().padStart(2, '0'),
    'yyyy-MM-dd': () => `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`,
    'HH:mm': () => `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`,
    'MMM dd, yyyy': () => {
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return `${months[d.getMonth()]} ${d.getDate().toString().padStart(2,'0')}, ${d.getFullYear()}`;
    },
    'MMM dd': () => {
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return `${months[d.getMonth()]} ${d.getDate().toString().padStart(2,'0')}`;
    },
  };
  
  return formatMap[formatStr] ? formatMap[formatStr]() : formatStr;
};

export const parseISO = (dateStr: string): Date => {
  return new Date(dateStr);
};