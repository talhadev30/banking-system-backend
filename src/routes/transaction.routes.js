const { Router } = require("express");
const authmiddleware = require("../middleware/auth.middleware");
const transactionController = require("../controllers/transaction.controller");
const transactionRoutes = Router();

/**
 * Post /api/transaction/
 * Create a new transaction
 */
transactionRoutes.post('/' , authmiddleware.authmiddleware , transactionController.createTransaction) 

/**
 * Post /api/transaction/system/initial-fund
 * Create a new transaction for initial fund by system user
 * This route is protected and can only be accessed by system users
 * The system user must have a valid JWT token in the request cookie
 */
transactionRoutes.post('/system/initial-fund' , authmiddleware.authsystemUsermiddleware , transactionController.createInitialFundTransaction)

/**
 * GET /api/transaction/monthly-summary/:accountId
 * Get the monthly summary of transactions for a specific account by accountId
 * This route is protected and can only be accessed by authenticated users
 * The user must have a valid JWT token in the request cookie
 */

transactionRoutes.get("/monthly-summary/:accountId", authmiddleware.authmiddleware, transactionController.GetMonthlySummary);

module.exports = transactionRoutes;