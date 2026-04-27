const pool = require('../config/db');

const SORTABLE = new Set(['con_code','con_nameen','con_namereg','con_isdcode','con_active','con_createddt','con_lastmodifieddt']);

// ── FETCH ALL ──────────────────────────────────────────────────────────────
async function fetchAll({ search, active, page=1, limit=20, sortBy='con_nameen', sortDir='ASC' }) {
  const safeSort  = SORTABLE.has(sortBy) ? sortBy : 'con_nameen';
  const safeDir   = sortDir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  const safePage  = Math.max(1, parseInt(page)  || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const offset    = (safePage - 1) * safeLimit;

  const conditions = ['1=1'];
  const params     = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(con_code ILIKE $${params.length} OR con_nameen ILIKE $${params.length} OR con_namereg ILIKE $${params.length} OR con_isdcode ILIKE $${params.length})`);
  }
  if (active !== undefined && active !== '') {
    params.push(active === 'true' || active === true);
    conditions.push(`con_active = $${params.length}`);
  }

  const where = conditions.join(' AND ');
  const [countRes, dataRes] = await Promise.all([
    pool.query(`SELECT COUNT(*) FROM gen_country WHERE ${where}`, params),
    pool.query(`SELECT * FROM gen_country WHERE ${where} ORDER BY ${safeSort} ${safeDir} LIMIT ${safeLimit} OFFSET ${offset}`, params),
  ]);
  return { total: parseInt(countRes.rows[0].count), rows: dataRes.rows };
}

// ── GET ONE ────────────────────────────────────────────────────────────────
async function getOne(recid) {
  const res = await pool.query('SELECT * FROM gen_country WHERE con_recid = $1', [recid]);
  return res.rows[0] || null;
}

// ── INSERT ─────────────────────────────────────────────────────────────────
async function insert({ code, nameen, namereg, isdcode, active }) {
  const activeBool = (active === false || active === 'false') ? false : true;
  const res = await pool.query(
    `INSERT INTO gen_country
       (con_code, con_nameen, con_namereg, con_isdcode, con_active,
        con_createdby, con_createddt, con_lastmodifiedby, con_lastmodifieddt)
     VALUES ($1, $2, $3, $4, $5, $6, now(), $6, now())
     RETURNING *`,
    [code, nameen, namereg || null, isdcode, activeBool, 'system']
  );
  return res.rows[0];
}

// ── UPDATE ─────────────────────────────────────────────────────────────────
async function update(recid, { nameen, namereg, isdcode, active }) {
  const activeBool = (active === false || active === 'false') ? false : true;
  const res = await pool.query(
    `UPDATE gen_country
     SET con_nameen         = $1,
         con_namereg        = $2,
         con_isdcode        = $3,
         con_active         = $4,
         con_lastmodifiedby = $5,
         con_lastmodifieddt = now()
     WHERE con_recid = $6
     RETURNING *`,
    [nameen, namereg || null, isdcode, activeBool, 'system', recid]
  );
  if (!res.rows.length) { const e = new Error('Country not found'); e.status = 404; throw e; }
  return res.rows[0];
}

// ── DELETE SINGLE ──────────────────────────────────────────────────────────
async function deleteOne(recid) {
  const res = await pool.query('DELETE FROM gen_country WHERE con_recid = $1 RETURNING con_recid', [recid]);
  if (!res.rows.length) { const e = new Error('Country not found'); e.status = 404; throw e; }
}

// ── BULK DELETE ────────────────────────────────────────────────────────────
async function bulkDelete(recids) {
  const res = await pool.query('DELETE FROM gen_country WHERE con_recid = ANY($1::uuid[]) RETURNING con_recid', [recids]);
  return res.rowCount;
}

// ── TOGGLE ACTIVE ──────────────────────────────────────────────────────────
async function toggleActive(recid) {
  const res = await pool.query(
    `UPDATE gen_country
     SET con_active = NOT con_active, con_lastmodifiedby = 'system', con_lastmodifieddt = now()
     WHERE con_recid = $1 RETURNING *`,
    [recid]
  );
  if (!res.rows.length) { const e = new Error('Country not found'); e.status = 404; throw e; }
  return res.rows[0];
}

module.exports = { fetchAll, getOne, insert, update, deleteOne, bulkDelete, toggleActive };
