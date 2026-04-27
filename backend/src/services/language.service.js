const pool = require("../config/db");

// ✅ GET ALL
const getAllLanguages = async () => {
  const result = await pool.query(`
    SELECT 
      ln_recid AS id,
      ln_code AS code,
      ln_nameen AS en,
      ln_namereg AS reg,
      ln_active AS active
    FROM public.sys_languages
    ORDER BY ln_createddt DESC
  `);

  return result.rows;
};

// ✅ CREATE (AUTO CODE)
const createLanguage = async (data) => {
  const { en, reg, active } = data;

  if (!en || !reg) {
    throw new Error("Language name is required");
  }

  // 🔥 Auto generate code
  const code = "LANG-" + Date.now();

  try {
    const result = await pool.query(
      `INSERT INTO public.sys_languages
      (ln_code, ln_nameen, ln_namereg,
       ln_createdby, ln_createddt,
       ln_lastmodifiedby, ln_lastmodifieddt,
       ln_active)
      VALUES ($1,$2,$3,$4,NOW(),$4,NOW(),$5)
      RETURNING 
        ln_recid AS id,
        ln_code AS code,
        ln_nameen AS en,
        ln_namereg AS reg,
        ln_active AS active`,
      [code, en, reg, "admin", active ?? true]
    );

    return result.rows[0];

  } catch (err) {
    if (err.code === "23505") {
      throw new Error("Language code already exists");
    }
    throw err;
  }
};

// ✅ UPDATE
const updateLanguage = async (id, data) => {
  const { code, en, reg, active } = data;

  const result = await pool.query(
    `UPDATE public.sys_languages SET
      ln_code=$1,
      ln_nameen=$2,
      ln_namereg=$3,
      ln_lastmodifiedby=$4,
      ln_lastmodifieddt=NOW(),
      ln_active=$5
    WHERE ln_recid=$6
    RETURNING 
      ln_recid AS id,
      ln_code AS code,
      ln_nameen AS en,
      ln_namereg AS reg,
      ln_active AS active`,
    [code, en, reg, "admin", active, id]
  );

  return result.rows[0];
};

// DELETE
const deleteLanguage = async (id) => {
  const result = await pool.query(
    "DELETE FROM public.sys_languages WHERE ln_recid = $1",
    [id]
  );

  if (result.rowCount === 0) {
    return null; // nothing deleted
  }

  return true;
};


module.exports = {
  getAllLanguages,
  createLanguage,
  updateLanguage,
  deleteLanguage,
};
