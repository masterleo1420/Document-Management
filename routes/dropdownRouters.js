const express = require('express');
const router = express.Router();
const customerController = require('../Controller/dropdownController');

router.post('/customer',customerController.dropdownCustomer);
router.post('/department',customerController.dropdownDepartment);
router.post('/email',customerController.dropdownEmail);
router.post('/project',customerController.dropdownProject);
router.post('/project/part',customerController.dropdownProjectPart);
router.post('/process',customerController.dropdownProcess);
router.post('/defaults',customerController.dropdownDefaults);

module.exports = router;