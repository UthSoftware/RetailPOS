const pool = require('../config/db');
const { generateSysFormCode } = require('../utils/codeGenerator');

const SORTABLE = new Set(['sf_formcode', 'sf_formname', 'sf_active']);

// ── FETCH ALL ─────────────────────────────────────────────
async function fetchAll({ search, active, page = 1, limit = 20, sortBy = 'sf_formname', sortDir = 'ASC' }) {
  const safeSort  = SORTABLE.has(sortBy) ? sortBy : 'sf_formname';
  const safeDir   = sortDir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  const safePage  = Math.max(1, parseInt(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const offset    = (safePage - 1) * safeLimit;

  const conditions = ['1=1'];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(f.sf_formcode ILIKE $${params.length} OR f.sf_formname ILIKE $${params.length})`);
  }
  if (active !== undefined && active !== '') {
    params.push(active === 'true' || active === true);
    conditions.push(`f.sf_active = $${params.length}`);
  }

  const where = conditions.join(' AND ');
  const baseQ = `
    FROM sys_forms f
    LEFT JOIN sys_modules m ON m.m_recid = f.sf_moduleid
    LEFT JOIN sys_tables  t ON t.st_recid::text = f.sf_primarytableid
    WHERE ${where}`;

  const [countRes, dataRes] = await Promise.all([
    pool.query(`SELECT COUNT(*) ${baseQ}`, params),
    pool.query(`SELECT f.*, m.m_nameen AS sf_modulename, t.st_tablename AS sf_tablename ${baseQ} ORDER BY f.${safeSort} ${safeDir} LIMIT ${safeLimit} OFFSET ${offset}`, params),
  ]);
  return { total: parseInt(countRes.rows[0].count), rows: dataRes.rows };
}

// ── NEXT CODE ─────────────────────────────────────────────
async function nextCode() { return generateSysFormCode(); }

// ── GET ONE ─────────────────────────────────────────────
async function getOne(recid) {
  const res = await pool.query(
    `SELECT f.*, m.m_nameen AS sf_modulename, t.st_tablename AS sf_tablename
     FROM sys_forms f
     LEFT JOIN sys_modules m ON m.m_recid = f.sf_moduleid
     LEFT JOIN sys_tables  t ON t.st_recid::text = f.sf_primarytableid
     WHERE f.sf_recid = $1`, [recid]);
  return res.rows[0] || null;
}

// ── INSERT ─────────────────────────────────────────────
async function insert({ code, formname, tableid, moduleid, active }) {
  const activeBool = (active === false || active === 'false') ? false : true;
  const res = await pool.query(
    `INSERT INTO sys_forms (sf_formcode, sf_formname, sf_primarytableid, sf_moduleid, sf_active)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [code, formname, tableid || null, moduleid || null, activeBool]
  );
  return res.rows[0];
}

// ── UPDATE ─────────────────────────────────────────────
async function update(recid, { formname, tableid, moduleid, active }) {
  const activeBool = (active === false || active === 'false') ? false : true;
  const res = await pool.query(
    `UPDATE sys_forms SET sf_formname=$1, sf_primarytableid=$2, sf_moduleid=$3, sf_active=$4 WHERE sf_recid=$5 RETURNING *`,
    [formname, tableid || null, moduleid || null, activeBool, recid]
  );
  if (!res.rows.length) { const e = new Error('Form not found'); e.status = 404; throw e; }
  return res.rows[0];
}

// ── DELETE ONE ─────────────────────────────────────────────
async function deleteOne(recid) {
  const res = await pool.query('DELETE FROM sys_forms WHERE sf_recid=$1 RETURNING sf_recid', [recid]);
  if (!res.rows.length) { const e = new Error('Form not found'); e.status = 404; throw e; }
}

// ── BULK DELETE ─────────────────────────────────────────────
async function bulkDelete(recids) {
  const res = await pool.query('DELETE FROM sys_forms WHERE sf_recid = ANY($1::uuid[]) RETURNING sf_recid', [recids]);
  return res.rowCount;
}

// ── TOGGLE ACTIVE ─────────────────────────────────────────────
async function toggleActive(recid) {
  const res = await pool.query('UPDATE sys_forms SET sf_active = NOT sf_active WHERE sf_recid=$1 RETURNING *', [recid]);
  if (!res.rows.length) { const e = new Error('Form not found'); e.status = 404; throw e; }
  return res.rows[0];
}

// ── HELPER: get all tables for dropdown ─────────────────────
async function getAllTables() {
  const res = await pool.query('SELECT st_recid, st_tablecode, st_tablename FROM sys_tables ORDER BY st_tablename');
  return res.rows;
}

// ── HELPER: get all modules for dropdown ─────────────────────
async function getAllModules() {
  const res = await pool.query('SELECT m_recid AS id, m_nameen AS name FROM sys_modules ORDER BY m_nameen');
  return res.rows;
}

module.exports = { fetchAll, nextCode, getOne, insert, update, deleteOne, bulkDelete, toggleActive, getAllTables, getAllModules };