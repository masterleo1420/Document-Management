const router = require("express").Router();
const ppcController = require("../Controller/ppcController");
const { isAuthEditEn, isAuthSignNotEn } = require("../middleware/authenication/auth");
//logPPC
router.post("/getppc", ppcController.getPPCS); //TODO ใช้ URL:/getppc?CusConfirm=0 เมื่อเป็น External

//request
router.post("/request", ppcController.getRequest);
router.post("/request/add", ppcController.addRequestPPC);
router.put("/request/edit", isAuthEditEn, ppcController.editRequestPPC);
router.delete("/request/delete", isAuthEditEn, ppcController.deleteRequestPPC);
router.put("/request/sign/requestby", isAuthEditEn, ppcController.signRequestBy);
router.post("/request/sendmail", isAuthEditEn, ppcController.sendmailRequest);
//engineer reply
router.post("/engreply", ppcController.getEngreply);
router.post("/engreply/sendmail", isAuthEditEn, ppcController.sendmailEngReply);
router.put("/engreply/edit", isAuthEditEn, ppcController.editEngReply);
router.put("/engreply/sign/reply", isAuthEditEn, ppcController.signEngReplyBy);

//approve plan
router.post("/approveplan", ppcController.getApprovePlan);
router.post("/approveplan/sendmail", isAuthEditEn, ppcController.sendMailApprove);
router.put("/approveplan/edit", isAuthEditEn, ppcController.editApprovePlan);
router.put("/approveplan/sign/approveby", isAuthEditEn, ppcController.signApproveBy);
router.put("/approveplan/sign/submitplanby", isAuthEditEn, ppcController.signApproveSubmitPlanby);
router.put("/approveplan/sign/chcekBy", isAuthEditEn, ppcController.signChcekBy);
router.put("/approveplan/sign/concernDeptApprove", ppcController.conDeptApprovePlan);

//approve strat new Condition
router.post("/approvestart", ppcController.getApproveStart);
router.put("/approvestart/edit", ppcController.editApproveStart);
router.put("/approvestart/sign/approveby", isAuthEditEn, ppcController.signStartApproveBy);
router.put("/approvestart/sign/checkby", isAuthEditEn, ppcController.signStartCheckBy);
router.put("/approvestart/sign/concernDeptStart", ppcController.conDeptStart);
router.post("/approvestart/sendmail", isAuthEditEn, ppcController.sendMailStart);

module.exports = router;
