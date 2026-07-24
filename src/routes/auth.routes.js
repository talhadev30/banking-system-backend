const express = require("express");
const authcontroller = require("../controllers/auth.controller");

const routes = express.Router();

routes.post('/register', authcontroller.userregistercontroller )
routes.post('/login', authcontroller.userlogincontroller )
routes.post('/logout', authcontroller.userlogoutcontroller )


module.exports = routes;