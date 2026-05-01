const router = require('express').Router();
const ctrl   = require('../controllers/sysModule.controller');

router.get('/all',              ctrl.getAll);      // simple list for dropdowns
router.get('/',                 ctrl.fetchAll);
router.post('/bulk-delete',     ctrl.bulkDelete);
router.get('/:recid',           ctrl.getOne);
router.post('/',                ctrl.create);
router.put('/:recid',           ctrl.update);
router.delete('/:recid',        ctrl.deleteOne);
router.patch('/:recid/toggle',  ctrl.toggleActive);

module.exports = router;