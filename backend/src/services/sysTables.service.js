const pool = require('../config/db');
const { generateSysTableCode } = require('../utils/codeGenerator');

const SORTABLE = new Set(['st_tablecode', 'st_tablename', 'st_active']);

// ── FETCH ALL ─────────────────────────────────────────────
async function fetchAll({ search, active, page = 1, limit = 20, sortBy = 'st_tablename', sortDir = 'ASC' }) {
  const safeSort  = SORTABLE.has(sortBy) ? sortBy : 'st_tablename';
  const safeDir   = sortDir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  const safePage  = Math.max(1, parseInt(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const offset    = (safePage - 1) * safeLimit;

  const conditions = ['1=1'];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(st_tablecode ILIKE $${params.length} OR st_tablename ILIKE $${params.length})`);
  }
  if (active !== undefined && active !== '') {
    params.push(active === 'true' || active === true);
    conditions.push(`st_active = $${params.length}`);
  }

  const where = conditions.join(' AND ');
  const [countRes, dataRes] = await Promise.all([
    pool.query(`SELECT COUNT(*) FROM sys_tables WHERE ${where}`, params),
    pool.query(`SELECT * FROM sys_tables WHERE ${where} ORDER BY ${safeSort} ${safeDir} LIMIT ${safeLimit} OFFSET ${offset}`, params),
  ]);
  return { total: parseInt(countRes.rows[0].count), rows: dataRes.rows };
}

// ── NEXT CODE ─────────────────────────────────────────────
async function nextCode() { return generateSysTableCode(); }

// ── GET ONE ─────────────────────────────────────────────
async function getOne(recid) {
  const res = await pool.query('SELECT * FROM sys_tables WHERE st_recid = $1', [recid]);
  return res.rows[0] || null;
}

// ── INSERT ─────────────────────────────────────────────
async function insert({ code, tablename, active }) {
  const activeBool = (active === false || active === 'false') ? false : true;
  const res = await pool.query(
    `INSERT INTO sys_tables (st_tablecode, st_tablename, st_active) VALUES ($1,$2,$3) RETURNING *`,
    [code, tablename, activeBool]
  );
  return res.rows[0];
}

// ── UPDATE ─────────────────────────────────────────────
async function update(recid, { tablename, active }) {
  const activeBool = (active === false || active === 'false') ? false : true;
  const res = await pool.query(
    `UPDATE sys_tables SET st_tablename=$1, st_active=$2 WHERE st_recid=$3 RETURNING *`,
    [tablename, activeBool, recid]
  );
  if (!res.rows.length) { const e = new Error('Table not found'); e.status = 404; throw e; }
  return res.rows[0];
}

// ── DELETE ONE ─────────────────────────────────────────────
async function deleteOne(recid) {
  const res = await pool.query('DELETE FROM sys_tables WHERE st_recid=$1 RETURNING st_recid', [recid]);
  if (!res.rows.length) { const e = new Error('Table not found'); e.status = 404; throw e; }
}

// ── BULK DELETE ─────────────────────────────────────────────
async function bulkDelete(recids) {
  const res = await pool.query('DELETE FROM sys_tables WHERE st_recid = ANY($1::uuid[]) RETURNING st_recid', [recids]);
  return res.rowCount;
}

// ── TOGGLE ACTIVE ─────────────────────────────────────────────
async function toggleActive(recid) {
  const res = await pool.query('UPDATE sys_tables SET st_active = NOT st_active WHERE st_recid=$1 RETURNING *', [recid]);
  if (!res.rows.length) { const e = new Error('Table not found'); e.status = 404; throw e; }
  return res.rows[0];
}

module.exports = { fetchAll, nextCode, getOne, insert, update, deleteOne, bulkDelete, toggleActive };