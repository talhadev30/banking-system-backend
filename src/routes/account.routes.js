const express = require('express');
const authmiddleware = require('../middleware/auth.middleware');
const accountController = require('../controllers/account.controller');

const router = express.Router();

/**
 * POST /api/accounts/
 * create a new account for the logged in user
 */

router.post('/', authmiddleware.authmiddleware, accountController.CreateAccountController);

/**
 * GET /api/accounts/
 * get all accounts of the logged in user
 */

router.get('/', authmiddleware.authmiddleware, accountController.GetAllAccountsController);



module.exports = router;