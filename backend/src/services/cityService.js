const pool = require('../config/db');

const SORTABLE = new Set([
  'ct_code',
  'ct_nameen',
  'ct_namereg',
  'ct_stdcode',   // ✅ FIXED
  'ct_active',
  'ct_createddt',
  'ct_lastmodifieddt'
]);

// ── FETCH ALL ─────────────────────────────────────────────
async function fetchAll({
  search,
  active,
  page = 1,
  limit = 20,
  sortBy = 'ct_nameen',
  sortDir = 'ASC'
}) {
  const safeSort  = SORTABLE.has(sortBy) ? sortBy : 'ct_nameen';
  const safeDir   = sortDir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  const safePage  = Math.max(1, parseInt(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const offset    = (safePage - 1) * safeLimit;

  const conditions = ['1=1'];
  const params = [];

  // SEARCH
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`
      (ct_code ILIKE $${params.length}
       OR ct_nameen ILIKE $${params.length}
       OR ct_namereg ILIKE $${params.length})
    `);
  }

  // ACTIVE FILTER
  if (active !== undefined && active !== '') {
    params.push(active === 'true' || active === true);
    conditions.push(`ct_active = $${params.length}`);
  }

  const where = conditions.join(' AND ');

  const [countRes, dataRes] = await Promise.all([
    pool.query(`SELECT COUNT(*) FROM gen_city WHERE ${where}`, params),
    pool.query(
      `SELECT * FROM gen_city
       WHERE ${where}
       ORDER BY ${safeSort} ${safeDir}
       LIMIT ${safeLimit} OFFSET ${offset}`,
      params
    ),
  ]);

  return {
    total: parseInt(countRes.rows[0].count),
    rows: dataRes.rows,
  };
}

// ── GET ONE ─────────────────────────────────────────────
async function getOne(recid) {
  const res = await pool.query(
    'SELECT * FROM gen_city WHERE ct_recid = $1',
    [recid]
  );
  return res.rows[0] || null;
}

// ── INSERT ─────────────────────────────────────────────
async function insert({ code, nameen, namereg, stdcode, active, stateid }) {
  const activeBool = (active === false || active === 'false') ? false : true;

  const res = await pool.query(
    `INSERT INTO gen_city
      (ct_code, ct_nameen, ct_namereg, ct_stdcode, ct_active,
       ct_stateid, ct_createdby, ct_createddt,
       ct_lastmodifiedby, ct_lastmodifieddt)
     VALUES ($1, $2, $3, $4, $5, $6, $7, now(), $7, now())
     RETURNING *`,
    [code, nameen, namereg || null, stdcode || null, activeBool, stateid, 'system']
  );

  return res.rows[0];
}

// ── UPDATE ─────────────────────────────────────────────
async function update(recid, { nameen, namereg, stdcode, active, stateid }) {
  const activeBool = (active === false || active === 'false') ? false : true;

  const res = await pool.query(
    `UPDATE gen_city
     SET ct_nameen         = $1,
         ct_namereg        = $2,
         ct_stdcode        = $3,
         ct_active         = $4,
         ct_stateid        = $5,
         ct_lastmodifiedby = $6,
         ct_lastmodifieddt = now()
     WHERE ct_recid = $7
     RETURNING *`,
    [nameen, namereg || null, stdcode || null, activeBool, stateid, 'system', recid]
  );

  if (!res.rows.length) {
    const e = new Error('City not found');
    e.status = 404;
    throw e;
  }

  return res.rows[0];
}

// ── DELETE ─────────────────────────────────────────────
async function deleteOne(recid) {
  const res = await pool.query(
    'DELETE FROM gen_city WHERE ct_recid = $1 RETURNING ct_recid',
    [recid]
  );

  if (!res.rows.length) {
    const e = new Error('City not found');
    e.status = 404;
    throw e;
  }
}

// ── TOGGLE ─────────────────────────────────────────────
async function toggleActive(recid) {
  const res = await pool.query(
    `UPDATE gen_city
     SET ct_active = NOT ct_active,
         ct_lastmodifiedby = 'system',
         ct_lastmodifieddt = now()
     WHERE ct_recid = $1
     RETURNING *`,
    [recid]
  );

  if (!res.rows.length) {
    const e = new Error('City not found');
    e.status = 404;
    throw e;
  }

  return res.rows[0];
}

module.exports = {
  fetchAll,
  getOne,
  insert,
  update,
  deleteOne,
  toggleActive,
};