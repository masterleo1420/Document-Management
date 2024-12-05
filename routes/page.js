const express = require("express");
const router = express.Router();
const { ifNotLoggedIn, IsCookie,isAuthPageMasterSetting,isAuthPart } = require("../middleware/authenication/auth");
const { notification } = require('../Controller/notiController');

router.get("/", ifNotLoggedIn, IsCookie, (req, res) => {
  res.render("mstProject.html", { name: req.session.name });
});

router.get("/login", (req, res) => {
  res.render("login.html");
});

router.get("/ppc", ifNotLoggedIn, IsCookie, (req, res) => {
  res.render("ppc.html");
});

router.get("/ecn", ifNotLoggedIn, IsCookie, (req, res) => {
  res.render("ecn.html");
});

router.get("/mstDefault", ifNotLoggedIn, IsCookie,isAuthPageMasterSetting,(req, res) => {
  res.render("mstDefault.html");
});

router.get("/reviseHistory", ifNotLoggedIn,IsCookie,isAuthPart, (req, res) => {
  res.render("revise_history.html");
});

router.get("/stampApprove", ifNotLoggedIn,IsCookie, (req, res) => {
  res.render("stamping.html");
});

router.get("/projectRevise", ifNotLoggedIn,IsCookie,isAuthPart, (req, res) => {
  res.render("project_revise.html");
});

router.get('/notification', notification);

module.exports = router;
