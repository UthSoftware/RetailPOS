const svc = require('../services/stateService');
const { generateStateCode } = require('../utils/codeGenerator');

// GET /api/state
exports.fetchAll = async (req, res, next) => {
  try {
    const data = await svc.fetchAll(req.query);
    res.json({ success: true, ...data });
  } catch (e) {
    next(e);
  }
};

// GET /api/state/next-code
exports.nextCode = async (req, res, next) => {
  try {
    const code = await generateStateCode();
    res.json({ success: true, code });
  } catch (e) {
    next(e);
  }
};

// GET /api/state/:recid
exports.getOne = async (req, res, next) => {
  try {
    const row = await svc.getOne(req.params.recid);
    if (!row) {
      return res.status(404).json({
        success: false,
        message: 'State not found'
      });
    }
    res.json({ success: true, data: row });
  } catch (e) {
    next(e);
  }
};

// POST /api/state
exports.create = async (req, res, next) => {
  try {
    console.log('[STATE CREATE] body:', req.body);

    const code = await generateStateCode();

    const row = await svc.insert({
      code,
      nameen: req.body.st_nameen,
      namereg: req.body.st_namereg || null,
      active: req.body.st_active,
      countryid: req.body.st_countryid,
    });

    res.status(201).json({ success: true, data: row });
  } catch (e) {
    next(e);
  }
};

// PUT /api/state/:recid
exports.update = async (req, res, next) => {
  try {
    console.log('[STATE UPDATE] body:', req.body);

    const row = await svc.update(req.params.recid, {
      nameen: req.body.st_nameen,
      namereg: req.body.st_namereg || null,
      active: req.body.st_active,
      countryid: req.body.st_countryid,
    });

    res.json({ success: true, data: row });
  } catch (e) {
    next(e);
  }
};

// DELETE /api/state/:recid
exports.deleteOne = async (req, res, next) => {
  try {
    await svc.deleteOne(req.params.recid);
    res.json({
      success: true,
      message: 'State deleted'
    });
  } catch (e) {
    next(e);
  }
};

// POST /api/state/bulk-delete
exports.bulkDelete = async (req, res, next) => {
  try {
    const { recids } = req.body;
    const count = await svc.bulkDelete(recids);

    res.json({
      success: true,
      message: `${count} record(s) deleted`
    });
  } catch (e) {
    next(e);
  }
};

// PATCH /api/state/:recid/toggle
exports.toggleActive = async (req, res, next) => {
  try {
    const row = await svc.toggleActive(req.params.recid);
    res.json({ success: true, data: row });
  } catch (e) {
    next(e);
  }
};
