
import { Worker } from './types';

export const ROLES = ['Mason', 'Helper', 'Steel Worker', 'Carpenter', 'Supervisor'] as const;

export const INITIAL_WORKERS: Worker[] = [
  { id: '1', name: 'John Doe', role: 'Mason', dailyWage: 800, attendance: new Array(30).fill(false) },
  { id: '2', name: 'Sam Smith', role: 'Helper', dailyWage: 450, attendance: new Array(30).fill(false) },
  { id: '3', name: 'Mike Ross', role: 'Steel Worker', dailyWage: 750, attendance: new Array(30).fill(false) },
  { id: '4', name: 'Harvey Specter', role: 'Supervisor', dailyWage: 1200, attendance: new Array(30).fill(false) },
];

export const APP_THEME = {
  primary: 'orange-600',
  secondary: 'blue-900',
  accent: 'slate-100'
};
