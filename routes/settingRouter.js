const router = require('express').Router();
const settingController = require('../Controller/settingController');

//* Setting Default
router.post('/', settingController.getDefault);
router.put('/edit', settingController.editDefault);
router.post('/overdue', settingController.getOverdue);
router.put('/overdue/edit', settingController.editOverdue);

module.exports = router