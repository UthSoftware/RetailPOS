// ── Code Generators ──────────────────────────────────────────
const pool = require('../config/db');

// Helper: get max code and increment
async function getNextCode(table, codeCol, prefix) {
  try {
    const res = await pool.query(
      `SELECT ${codeCol} FROM ${table} ORDER BY ${codeCol} DESC LIMIT 1`
    );
    if (res.rows.length === 0) return `${prefix}-000001`;
    const last = res.rows[0][codeCol] || '';
    const num  = parseInt(last.replace(/[^0-9]/g, ''), 10) || 0;
    return `${prefix}-${String(num + 1).padStart(6, '0')}`;
  } catch {
    return `${prefix}-${Date.now()}`;
  }
}

async function generateCountryCode()  { return getNextCode('gen_country', 'con_code', 'CON'); }
async function generateStateCode()    { return getNextCode('gen_state',   'st_code',  'ST');  }
async function generateCityCode()     { return getNextCode('gen_city',    'ct_code',  'CT');  }
async function generateAreaCode()     { return getNextCode('gen_area',    'a_areacode','AREA'); }
async function generateBankCode()     { return getNextCode('fa_banks',    'bk_code',  'BK');  }
async function generateSysFormCode()  { return getNextCode('sys_forms',   'sf_formcode','SF'); }
async function generateSysTableCode() { return getNextCode('sys_tables',  'st_tablecode','TBL'); }

module.exports = {
  generateCountryCode,
  generateStateCode,
  generateCityCode,
  generateAreaCode,
  generateBankCode,
  generateSysFormCode,
  generateSysTableCode,
};
