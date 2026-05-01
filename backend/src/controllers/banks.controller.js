const svc = require('../services/banks.service');

// GET /api/banks?search=&page=&limit=&sortBy=&sortDir=
exports.fetchAll = async (req, res, next) => {
  try {
    const data = await svc.fetchAll(req.query);
    res.json({ success: true, ...data });
  } catch (e) { next(e); }
};

// GET /api/banks/next-code
exports.nextCode = async (req, res, next) => {
  try {
    const code = await svc.nextCode();
    res.json({ success: true, code });
  } catch (e) { next(e); }
};

// GET /api/banks/:recid
exports.getOne = async (req, res, next) => {
  try {
    const row = await svc.getOne(req.params.recid);
    if (!row) return res.status(404).json({ success: false, message: 'Bank not found' });
    res.json({ success: true, data: row });
  } catch (e) { next(e); }
};

// POST /api/banks
exports.create = async (req, res, next) => {
  try {
    const code = await svc.nextCode();
    const row  = await svc.insert({
      code,
      nameen:    req.body.bk_nameen,
      namereg:   req.body.bk_namereg  || null,
      companyid: req.body.bk_companyid || null,
      active:    req.body.bk_active,
    });
    res.status(201).json({ success: true, data: row });
  } catch (e) { next(e); }
};

// PUT /api/banks/:recid
exports.update = async (req, res, next) => {
  try {
    const row = await svc.update(req.params.recid, {
      nameen:    req.body.bk_nameen,
      namereg:   req.body.bk_namereg  || null,
      companyid: req.body.bk_companyid || null,
      active:    req.body.bk_active,
    });
    res.json({ success: true, data: row });
  } catch (e) { next(e); }
};

// DELETE /api/banks/:recid
exports.deleteOne = async (req, res, next) => {
  try {
    await svc.deleteOne(req.params.recid);
    res.json({ success: true, message: 'Bank deleted' });
  } catch (e) { next(e); }
};

// POST /api/banks/bulk-delete
exports.bulkDelete = async (req, res, next) => {
  try {
    const { recids } = req.body;
    const count = await svc.bulkDelete(recids);
    res.json({ success: true, message: `${count} record(s) deleted` });
  } catch (e) { next(e); }
};

// PATCH /api/banks/:recid/toggle
exports.toggleActive = async (req, res, next) => {
  try {
    const row = await svc.toggleActive(req.params.recid);
    res.json({ success: true, data: row });
  } catch (e) { next(e); }
};