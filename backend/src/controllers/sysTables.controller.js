const svc = require('../services/sysTables.service');

// GET /api/sys-tables
exports.fetchAll = async (req, res, next) => {
  try {
    const data = await svc.fetchAll(req.query);
    res.json({ success: true, ...data });
  } catch (e) { next(e); }
};

// GET /api/sys-tables/next-code
exports.nextCode = async (req, res, next) => {
  try {
    const code = await svc.nextCode();
    res.json({ success: true, code });
  } catch (e) { next(e); }
};

// GET /api/sys-tables/:recid
exports.getOne = async (req, res, next) => {
  try {
    const row = await svc.getOne(req.params.recid);
    if (!row) return res.status(404).json({ success: false, message: 'Table not found' });
    res.json({ success: true, data: row });
  } catch (e) { next(e); }
};

// POST /api/sys-tables
exports.create = async (req, res, next) => {
  try {
    const code = await svc.nextCode();
    const row  = await svc.insert({
      code,
      tablename: req.body.st_tablename,
      active:    req.body.st_active,
    });
    res.status(201).json({ success: true, data: row });
  } catch (e) { next(e); }
};

// PUT /api/sys-tables/:recid
exports.update = async (req, res, next) => {
  try {
    const row = await svc.update(req.params.recid, {
      tablename: req.body.st_tablename,
      active:    req.body.st_active,
    });
    res.json({ success: true, data: row });
  } catch (e) { next(e); }
};

// DELETE /api/sys-tables/:recid
exports.deleteOne = async (req, res, next) => {
  try {
    await svc.deleteOne(req.params.recid);
    res.json({ success: true, message: 'Table deleted' });
  } catch (e) { next(e); }
};

// POST /api/sys-tables/bulk-delete
exports.bulkDelete = async (req, res, next) => {
  try {
    const { recids } = req.body;
    const count = await svc.bulkDelete(recids);
    res.json({ success: true, message: `${count} record(s) deleted` });
  } catch (e) { next(e); }
};

// PATCH /api/sys-tables/:recid/toggle
exports.toggleActive = async (req, res, next) => {
  try {
    const row = await svc.toggleActive(req.params.recid);
    res.json({ success: true, data: row });
  } catch (e) { next(e); }
};