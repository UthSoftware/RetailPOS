const pool = require('../config/db');

const SORTABLE = new Set([
  'a_areacode',
  'a_areanameen',
  'a_areanamereg',
  'a_pincode',
  'a_active',
  'a_createddate',
  'a_lastmodifieddate'
]);

// ── FETCH ALL ─────────────────────────────────────────────
async function fetchAll({
  search,
  active,
  page = 1,
  limit = 20,
  sortBy = 'a_areanameen',
  sortDir = 'ASC'
}) {
  const safeSort = SORTABLE.has(sortBy) ? sortBy : 'a_areanameen';
  const safeDir = sortDir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  const safePage = Math.max(1, parseInt(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const offset = (safePage - 1) * safeLimit;

  const conditions = ['1=1'];
  const params = [];

  // SEARCH
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`
      (a_areacode ILIKE $${params.length}
       OR a_areanameen ILIKE $${params.length}
       OR a_areanamereg ILIKE $${params.length}
       OR a_pincode ILIKE $${params.length})
    `);
  }

  // ACTIVE FILTER
  if (active !== undefined && active !== '') {
    params.push(active === 'true' || active === true);
    conditions.push(`a_active = $${params.length}`);
  }

  const where = conditions.join(' AND ');

  const [countRes, dataRes] = await Promise.all([
    pool.query(`SELECT COUNT(*) FROM gen_area WHERE ${where}`, params),
    pool.query(
      `SELECT * FROM gen_area
       WHERE ${where}
       ORDER BY ${safeSort} ${safeDir}
       LIMIT ${safeLimit} OFFSET ${offset}`,
      params
    )
  ]);

  return {
    total: parseInt(countRes.rows[0].count),
    rows: dataRes.rows
  };
}

// ── GET ONE ─────────────────────────────────────────────
async function getOne(recid) {
  const res = await pool.query(
    `SELECT * FROM gen_area WHERE a_recid = $1`,
    [recid]
  );
  return res.rows[0] || null;
}

// ── INSERT ─────────────────────────────────────────────
async function insert({ code, cityid, nameen, namereg, pin, active }) {
  const activeBool = (active === false || active === 'false') ? false : true;

  const res = await pool.query(
    `INSERT INTO gen_area
    (a_cityid, a_areacode, a_areanameen, a_areanamereg, a_pincode,
     a_createdby, a_createddate, a_lastmodifiedby, a_lastmodifieddate, a_active)
     VALUES ($1,$2,$3,$4,$5,$6,now(),$6,now(),$7)
     RETURNING *`,
    [
      cityid,
      code,
      nameen,
      namereg || null,
      pin,
      'system',
      activeBool
    ]
  );

  return res.rows[0];
}

// ── UPDATE ─────────────────────────────────────────────
async function update(recid, { cityid, nameen, namereg, pin, active }) {
  const activeBool = (active === false || active === 'false') ? false : true;

  const res = await pool.query(
    `UPDATE gen_area
     SET a_cityid = $1,
         a_areanameen = $2,
         a_areanamereg = $3,
         a_pincode = $4,
         a_active = $5,
         a_lastmodifiedby = $6,
         a_lastmodifieddate = now()
     WHERE a_recid = $7
     RETURNING *`,
    [cityid, nameen, namereg || null, pin, activeBool, 'system', recid]
  );

  if (!res.rows.length) {
    const e = new Error('Area not found');
    e.status = 404;
    throw e;
  }

  return res.rows[0];
}

// ── DELETE ─────────────────────────────────────────────
async function deleteOne(recid) {
  const res = await pool.query(
    `DELETE FROM gen_area WHERE a_recid = $1 RETURNING a_recid`,
    [recid]
  );

  if (!res.rows.length) {
    const e = new Error('Area not found');
    e.status = 404;
    throw e;
  }
}

// ── TOGGLE ─────────────────────────────────────────────
async function toggleActive(recid) {
  const res = await pool.query(
    `UPDATE gen_area
     SET a_active = NOT a_active,
         a_lastmodifiedby = 'system',
         a_lastmodifieddate = now()
     WHERE a_recid = $1
     RETURNING *`,
    [recid]
  );

  if (!res.rows.length) {
    const e = new Error('Area not found');
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
  toggleActive
};
