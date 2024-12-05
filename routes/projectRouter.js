const router = require('express').Router();
const projectController = require('../Controller/projectController/projectController');
const projectPartController = require('../Controller/projectController/projectPartController');

//* Project List
router.post('/', projectController.getProjects);
router.post('/item', projectController.getProject); //deprecated
router.post('/add', projectController.addProject);
router.put('/edit', projectController.editProject);
router.delete('/delete', projectController.deleteProject);
router.post('/email/send', projectController.SendEmailProject);
router.post('/refcode', projectController.getRefCode);                //* RefCode
router.put('/sign/issue', projectController.signIssue);
router.put('/sign/check', projectController.signCheck);
router.put('/sign/approve', projectController.signApprove);
router.put('/sign/sopapprove', projectController.signSopApprove);
router.post('/user/check', projectController.checkUser);

//* Project Part List
router.post('/parts', projectPartController.getParts);
router.post('/part', projectPartController.getPart);
router.post('/part/add', projectPartController.uploadPartDocFile, projectPartController.addPart); //* Add Upload Doc
router.put('/part/edit', projectPartController.uploadPartDocFile, projectPartController.editPart);//* Add Upload Doc
router.delete('/part/delete', projectPartController.deletePart);
router.post('/part/revise/history', projectPartController.getReviseHistory);
router.post('/part/doc/view/history', projectPartController.getPrintHistory);
router.put('/part/doc/view', projectPartController.insertPrintHistory);
router.put('/part/upload/doc', projectPartController.uploadPartDocFile, projectPartController.uploadPartDoc); //! Deprecated
router.put('/part/sign/issue', projectPartController.signIssue);
router.put('/part/sign/check', projectPartController.signCheck);
router.put('/part/sign/approve', projectPartController.signApprove);

module.exports = router