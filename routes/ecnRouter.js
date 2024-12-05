const express = require('express')
const router = express.Router()
const ecnController = require('../Controller/ecnController')
const { isAuthEditEn } = require('../middleware/authenication/auth')

//ECN
router.post('/', ecnController.getECN)
//issue
router.post('/issue', ecnController.getECNIssues)
router.post('/issue/add', ecnController.addECNIssue)
router.put('/issue/edit', ecnController.editECNIssues)
router.delete('/issue/delete', ecnController.deleteECNIssues)
router.post('/issue/sendemail', ecnController.sendMailECNIssue)
//approval
router.post('/approval', ecnController.getApproval)
router.put('/approval/edit', ecnController.editApproval)
router.post('/approval/sendemail', ecnController.sendMailECNApprove)
//sign
router.put('/approval/sign/issue', ecnController.signIssue)
router.put('/approval/sign/check',  ecnController.signCheck)
router.put('/approval/sign/approve' , ecnController.signApprove)
router.put('/approval/sign/dept', ecnController.signDept)

module.exports = router

