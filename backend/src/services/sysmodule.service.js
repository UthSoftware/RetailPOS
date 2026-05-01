const pool = require('../config/db');

// ── FETCH ALL MODULES (with pagination) ────────────────────
async function fetchAll({ search, active, page = 1, limit = 20, sortBy = 'm_nameen', sortDir = 'ASC' } = {}) {
  const safeDir   = (sortDir || 'ASC').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  const safePage  = Math.max(1, parseInt(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const offset    = (safePage - 1) * safeLimit;

  const conditions = ['1=1'];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(m_nameen ILIKE $${params.length} OR m_namereg ILIKE $${params.length})`);
  }
  if (active !== undefined && active !== '') {
    params.push(active === 'true' || active === true);
    conditions.push(`m_active = $${params.length}`);
  }

  const where = conditions.join(' AND ');
  const [countRes, dataRes] = await Promise.all([
    pool.query(`SELECT COUNT(*) FROM sys_modules WHERE ${where}`, params),
    pool.query(`SELECT * FROM sys_modules WHERE ${where} ORDER BY m_nameen ${safeDir} LIMIT ${safeLimit} OFFSET ${offset}`, params),
  ]);
  return { total: parseInt(countRes.rows[0].count), rows: dataRes.rows };
}

// ── GET ALL (simple, for dropdowns) ────────────────────────
async function getAllModules() {
  const res = await pool.query('SELECT m_recid AS id, m_nameen AS name FROM sys_modules ORDER BY m_nameen');
  return res.rows;
}

// ── GET ONE ─────────────────────────────────────────────────
async function getOne(recid) {
  const res = await pool.query('SELECT * FROM sys_modules WHERE m_recid=$1', [recid]);
  return res.rows[0] || null;
}

// ── INSERT ─────────────────────────────────────────────────
async function insert({ nameen, namereg, active }) {
  const activeBool = (active === false || active === 'false') ? false : true;
  const res = await pool.query(
    `INSERT INTO sys_modules (m_nameen, m_namereg, m_active) VALUES ($1,$2,$3) RETURNING *`,
    [nameen, namereg || null, activeBool]
  );
  return res.rows[0];
}

// ── UPDATE ─────────────────────────────────────────────────
async function update(recid, { nameen, namereg, active }) {
  const activeBool = (active === false || active === 'false') ? false : true;
  const res = await pool.query(
    `UPDATE sys_modules SET m_nameen=$1, m_namereg=$2, m_active=$3 WHERE m_recid=$4 RETURNING *`,
    [nameen, namereg || null, activeBool, recid]
  );
  if (!res.rows.length) { const e = new Error('Module not found'); e.status = 404; throw e; }
  return res.rows[0];
}

// ── DELETE ONE ─────────────────────────────────────────────
async function deleteOne(recid) {
  const res = await pool.query('DELETE FROM sys_modules WHERE m_recid=$1 RETURNING m_recid', [recid]);
  if (!res.rows.length) { const e = new Error('Module not found'); e.status = 404; throw e; }
}

// ── BULK DELETE ─────────────────────────────────────────────
async function bulkDelete(recids) {
  const res = await pool.query('DELETE FROM sys_modules WHERE m_recid = ANY($1::uuid[]) RETURNING m_recid', [recids]);
  return res.rowCount;
}

// ── TOGGLE ACTIVE ─────────────────────────────────────────────
async function toggleActive(recid) {
  const res = await pool.query('UPDATE sys_modules SET m_active = NOT m_active WHERE m_recid=$1 RETURNING *', [recid]);
  if (!res.rows.length) { const e = new Error('Module not found'); e.status = 404; throw e; }
  return res.rows[0];
}

module.exports = { fetchAll, getAllModules, getOne, insert, update, deleteOne, bulkDelete, toggleActive };