const pool = require('../config/db');

const SORTABLE = new Set([
  'st_code',
  'st_nameen',
  'st_namereg',
  'st_active',
  'st_createddt',
  'st_lastmodifieddt'
]);

// ── FETCH ALL ──────────────────────────────────────────────────────────────
async function fetchAll({
  search,
  active,
  page = 1,
  limit = 20,
  sortBy = 'st_nameen',
  sortDir = 'ASC'
}) {
  const safeSort  = SORTABLE.has(sortBy) ? sortBy : 'st_nameen';
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
      (st_code ILIKE $${params.length}
       OR st_nameen ILIKE $${params.length}
       OR st_namereg ILIKE $${params.length})
    `);
  }

  // ACTIVE FILTER
  if (active !== undefined && active !== '') {
    params.push(active === 'true' || active === true);
    conditions.push(`st_active = $${params.length}`);
  }

  const where = conditions.join(' AND ');

  const [countRes, dataRes] = await Promise.all([
    pool.query(`SELECT COUNT(*) FROM gen_state WHERE ${where}`, params),
    pool.query(
      `SELECT * FROM gen_state
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

// ── GET ONE ────────────────────────────────────────────────────────────────
async function getOne(recid) {
  const res = await pool.query(
    'SELECT * FROM gen_state WHERE st_recid = $1',
    [recid]
  );
  return res.rows[0] || null;
}

// ── INSERT ─────────────────────────────────────────────────────────────────
async function insert({ code, nameen, namereg, active, countryid }) {
  const activeBool = (active === false || active === 'false') ? false : true;

  const res = await pool.query(
    `INSERT INTO gen_state
      (st_code, st_nameen, st_namereg, st_active,
       st_countryid, st_createdby, st_createddt,
       st_lastmodifiedby, st_lastmodifieddt)
     VALUES ($1, $2, $3, $4, $5, $6, now(), $6, now())
     RETURNING *`,
    [code, nameen, namereg || null, activeBool, countryid, 'system']
  );

  return res.rows[0];
}

// ── UPDATE ─────────────────────────────────────────────────────────────────
async function update(recid, { nameen, namereg, active, countryid }) {
  const activeBool = (active === false || active === 'false') ? false : true;

  const res = await pool.query(
    `UPDATE gen_state
     SET st_nameen         = $1,
         st_namereg        = $2,
         st_active         = $3,
         st_countryid      = $4,
         st_lastmodifiedby = $5,
         st_lastmodifieddt = now()
     WHERE st_recid = $6
     RETURNING *`,
    [nameen, namereg || null, activeBool, countryid, 'system', recid]
  );

  if (!res.rows.length) {
    const e = new Error('State not found');
    e.status = 404;
    throw e;
  }

  return res.rows[0];
}

// ── DELETE SINGLE ──────────────────────────────────────────────────────────
async function deleteOne(recid) {
  const res = await pool.query(
    'DELETE FROM gen_state WHERE st_recid = $1 RETURNING st_recid',
    [recid]
  );

  if (!res.rows.length) {
    const e = new Error('State not found');
    e.status = 404;
    throw e;
  }
}

// ── BULK DELETE ────────────────────────────────────────────────────────────
async function bulkDelete(recids) {
  const res = await pool.query(
    'DELETE FROM gen_state WHERE st_recid = ANY($1::uuid[]) RETURNING st_recid',
    [recids]
  );

  return res.rowCount;
}

// ── TOGGLE ACTIVE ──────────────────────────────────────────────────────────
async function toggleActive(recid) {
  const res = await pool.query(
    `UPDATE gen_state
     SET st_active = NOT st_active,
         st_lastmodifiedby = 'system',
         st_lastmodifieddt = now()
     WHERE st_recid = $1
     RETURNING *`,
    [recid]
  );

  if (!res.rows.length) {
    const e = new Error('State not found');
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
  bulkDelete,
  toggleActive,
};
