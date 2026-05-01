const svc = require('../services/cityService');
const { generateCityCode } = require('../utils/codeGenerator');

// ── GET ALL ─────────────────────────────────────────────
exports.fetchAll = async (req, res, next) => {
  try {
    const data = await svc.fetchAll(req.query);
    res.json({ success: true, ...data });
  } catch (e) {
    next(e);
  }
};

// ── NEXT CODE ───────────────────────────────────────────
exports.nextCode = async (req, res, next) => {
  try {
    const code = await generateCityCode();
    res.json({ success: true, code });
  } catch (e) {
    next(e);
  }
};

// ── GET ONE ─────────────────────────────────────────────
exports.getOne = async (req, res, next) => {
  try {
    const row = await svc.getOne(req.params.recid);

    if (!row) {
      return res.status(404).json({
        success: false,
        message: "City not found",
      });
    }

    res.json({ success: true, data: row });
  } catch (e) {
    next(e);
  }
};

// ── CREATE ─────────────────────────────────────────────
exports.create = async (req, res, next) => {
  try {
    console.log("[CITY CREATE]", req.body);

    const { ct_nameen, ct_namereg, ct_stdcode, ct_active, ct_stateid } = req.body;

    // ✅ VALIDATION
    if (!ct_nameen) {
      return res.status(400).json({
        success: false,
        message: "City name is required",
      });
    }

    if (!ct_stateid) {
      return res.status(400).json({
        success: false,
        message: "State ID is required",
      });
    }

    const code = await generateCityCode();

    const row = await svc.insert({
      code,
      nameen: ct_nameen,
      namereg: ct_namereg || null,
      stdcode: ct_stdcode,
      active: ct_active,
      stateid: ct_stateid,   // ✅ FIXED
    });

    res.status(201).json({ success: true, data: row });
  } catch (e) {
    next(e);
  }
};

// ── UPDATE ─────────────────────────────────────────────
exports.update = async (req, res, next) => {
  try {
    console.log("[CITY UPDATE]", req.body);

    const { ct_nameen, ct_namereg, ct_stdcode, ct_active, ct_stateid } = req.body;

    const row = await svc.update(req.params.recid, {
      nameen: ct_nameen,
      namereg: ct_namereg || null,
      stdcode: ct_stdcode,
      active: ct_active,
      stateid: ct_stateid,   // ✅ FIXED
    });

    res.json({ success: true, data: row });
  } catch (e) {
    next(e);
  }
};

// ── DELETE ─────────────────────────────────────────────
exports.deleteOne = async (req, res, next) => {
  try {
    await svc.deleteOne(req.params.recid);

    res.json({
      success: true,
      message: "City deleted",
    });
  } catch (e) {
    next(e);
  }
};

// ── BULK DELETE ─────────────────────────────────────────
exports.bulkDelete = async (req, res, next) => {
  try {
    const { recids } = req.body;

    const count = await svc.bulkDelete(recids);

    res.json({
      success: true,
      message: `${count} record(s) deleted`,
    });
  } catch (e) {
    next(e);
  }
};

// ── TOGGLE ─────────────────────────────────────────────
exports.toggleActive = async (req, res, next) => {
  try {
    const row = await svc.toggleActive(req.params.recid);
    res.json({ success: true, data: row });
  } catch (e) {
    next(e);
  }
};