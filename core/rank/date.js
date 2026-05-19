// core/rank/date.js
// Rang date : espace analytique fermé.
// Source : Bonneau (2012)
// rank = (dateResult.space × cs^len_reste) / 2

'use strict';

import { charsetSize, passwordLength } from '../charset.js';

/**
 * @param {string} password
 * @param {boolean} dt
 * @param {{ format: string, space: number } | null} dateResult
 * @returns {{ rank: number, model: 'date' } | { rank: null, model: 'date' }}
 */
export function rankDate(password, dt, dateResult) {
  if (!dt || !dateResult) return { rank: null, model: 'date' };

  const totalLen  = passwordLength(password);
  const cs        = charsetSize(password);
  const dateSpace = dateResult.space;
  const dateLen   = estimateDateLen(dateResult.format);
  const restLen   = Math.max(0, totalLen - dateLen);

  const rank = restLen > 0
    ? Math.round((dateSpace * Math.pow(cs, restLen)) / 2)
    : Math.round(dateSpace / 2);

  return { rank, model: 'date' };
}

function estimateDateLen(format) {
  switch (format) {
    case 'YYYY':            return 4;
    case 'DDMM':            return 4;
    case 'DD/MM':           return 5;
    case 'DDMonthName':     return 4;
    case 'MonthNameDD':     return 4;
    case 'MonthNameYYYY':   return 7;
    case 'DDMonthNameYYYY': return 8;
    case 'MonthName':       return 3;
    default:                return 4;
  }
}
