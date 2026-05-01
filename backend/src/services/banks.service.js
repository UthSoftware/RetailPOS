const pool = require('../config/db');
const { generateBankCode } = require('../utils/codeGenerator');

const SORTABLE = new Set(['bk_code', 'bk_nameen', 'bk_namereg', 'bk_active', 'bk_createddate']);

// ── FETCH ALL ─────────────────────────────────────────────
async function fetchAll({ search, active, page = 1, limit = 20, sortBy = 'bk_nameen', sortDir = 'ASC' }) {
  const safeSort  = SORTABLE.has(sortBy) ? sortBy : 'bk_nameen';
  const safeDir   = sortDir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  const safePage  = Math.max(1, parseInt(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const offset    = (safePage - 1) * safeLimit;

  const conditions = ['1=1'];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(bk_code ILIKE $${params.length} OR bk_nameen ILIKE $${params.length} OR bk_namereg ILIKE $${params.length})`);
  }
  if (active !== undefined && active !== '') {
    params.push(active === 'true' || active === true);
    conditions.push(`bk_active = $${params.length}`);
  }

  const where = conditions.join(' AND ');
  const [countRes, dataRes] = await Promise.all([
    pool.query(`SELECT COUNT(*) FROM fa_banks WHERE ${where}`, params),
    pool.query(`SELECT * FROM fa_banks WHERE ${where} ORDER BY ${safeSort} ${safeDir} LIMIT ${safeLimit} OFFSET ${offset}`, params),
  ]);
  return { total: parseInt(countRes.rows[0].count), rows: dataRes.rows };
}

// ── NEXT CODE ─────────────────────────────────────────────
async function nextCode() { return generateBankCode(); }

// ── GET ONE ─────────────────────────────────────────────
async function getOne(recid) {
  const res = await pool.query('SELECT * FROM fa_banks WHERE bk_recid = $1', [recid]);
  return res.rows[0] || null;
}

// ── INSERT ─────────────────────────────────────────────
async function insert({ code, nameen, namereg, companyid, active }) {
  const activeBool = (active === false || active === 'false') ? false : true;
  const res = await pool.query(
    `INSERT INTO fa_banks (bk_code, bk_nameen, bk_namereg, bk_companyid, bk_active, bk_createdby, bk_createddate, bk_lastmodifiedby, bk_lastmodifieddate)
     VALUES ($1,$2,$3,$4,$5,'system',NOW(),'system',NOW()) RETURNING *`,
    [code, nameen, namereg || null, companyid || null, activeBool]
  );
  return res.rows[0];
}

// ── UPDATE ─────────────────────────────────────────────
async function update(recid, { nameen, namereg, companyid, active }) {
  const activeBool = (active === false || active === 'false') ? false : true;
  const res = await pool.query(
    `UPDATE fa_banks SET bk_nameen=$1, bk_namereg=$2, bk_companyid=$3, bk_active=$4, bk_lastmodifiedby='system', bk_lastmodifieddate=NOW() WHERE bk_recid=$5 RETURNING *`,
    [nameen, namereg || null, companyid || null, activeBool, recid]
  );
  if (!res.rows.length) { const e = new Error('Bank not found'); e.status = 404; throw e; }
  return res.rows[0];
}

// ── DELETE ONE ─────────────────────────────────────────────
async function deleteOne(recid) {
  const res = await pool.query('DELETE FROM fa_banks WHERE bk_recid=$1 RETURNING bk_recid', [recid]);
  if (!res.rows.length) { const e = new Error('Bank not found'); e.status = 404; throw e; }
}

// ── BULK DELETE ─────────────────────────────────────────────
async function bulkDelete(recids) {
  const res = await pool.query('DELETE FROM fa_banks WHERE bk_recid = ANY($1::uuid[]) RETURNING bk_recid', [recids]);
  return res.rowCount;
}

// ── TOGGLE ACTIVE ─────────────────────────────────────────────
async function toggleActive(recid) {
  const res = await pool.query(
    `UPDATE fa_banks SET bk_active = NOT bk_active, bk_lastmodifiedby='system', bk_lastmodifieddate=NOW() WHERE bk_recid=$1 RETURNING *`,
    [recid]
  );
  if (!res.rows.length) { const e = new Error('Bank not found'); e.status = 404; throw e; }
  return res.rows[0];
}

module.exports = { fetchAll, nextCode, getOne, insert, update, deleteOne, bulkDelete, toggleActive };