const express = require("express");
const router = express.Router();
const { login, logout } = require("../../Controller/userController/userController");

router.post("/login", login);
router.get("/logout", logout);

module.exports = router

