const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const accountModel = require("../models/account.model");
const emailService = require("../services/email.service");
const mongoose = require("mongoose");

async function createTransaction(req, res) {

    const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: " fromAccount toAccount amount idempotencyKey are required"
        })
    }

    const formUserAccount = await accountModel.findOne({
        _id: fromAccount
    })
    const toUserAccount = await accountModel.findOne({
        _id: toAccount
    })


    if (!fromAccount || !toAccount) {
        return res.status(400).json({
            message: "invalid FromAccount and toAccount"
        })
    }

    const IsTransactionAlreadyExists = await transactionModel.findOne({
        idempotencyKey: idempotencyKey
    })

    if (IsTransactionAlreadyExists) {

        if (IsTransactionAlreadyExists.status === "SUCCESS") {
            return res.status(200).json({
                message: "Transaction already processed",
                transaction: IsTransactionAlreadyExists
            })
        }
        if (IsTransactionAlreadyExists.status === "PENDING") {
            return res.status(200).json({
                message: "Transaction is still processing"
            })
        }
        if (IsTransactionAlreadyExists.status === "FAILED") {
            return res.status(200).json({
                message: "Transaction processing is failed please retry"
            })
        }
        if (IsTransactionAlreadyExists.status === "REVERSED") {
            return res.status(200).json({
                message: "Transaction was reversed please retry"
            })
        }

    }

    const balance = await formUserAccount.getBalance();

    if (balance < amount) {
        return res.status(400).json({
            message: `Insufficient Balance. Current Balance is this ${balance} Requested Amount is this ${amount}   `
        })
    }

    let transaction;

    try {
        

    const session = await mongoose.startSession();
    session.startTransaction();


    transaction = (await transactionModel.create([{
        fromAccount,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING"
    }], { session }))[0]

    const DebitLedger = await ledgerModel.create([{
        account: fromAccount,
        type: "DEBIT",
        amount: amount,
        transaction: transaction._id
    }], { session });


    await (() => {
        return new Promise(resolve => setTimeout(resolve, 15 * 1000));
    })()


    const CreditLedger = await ledgerModel.create([{
        account: toAccount,
        type: "CREDIT",
        amount: amount,
        transaction: transaction._id
    }], { session })

    await transactionModel.findOneAndUpdate(
        { _id: transaction._id },
        { status: "SUCCESS" },
        { session }
    )


    await session.commitTransaction()
    session.endSession()

    } catch (error) {
        return res.status(400).json({
            message: "Transaction is pending please retry after some time",
        })   
    }

    await emailService.SendTransactionMail(req.user.email, req.user.name, amount, toAccount)

    return res.status(200).json({
        message: "Transaction Completed Successfully",
        transaction: transaction
    })



}
async function createInitialFundTransaction(req, res) {

    const { toAccount, amount, idempotencyKey } = req.body;

    if (!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: " toAccount amount idempotencyKey are required"
        })
    }

    const toUserAccount = await accountModel.findOne({
        _id: toAccount
    })

    const accounts = await accountModel.find().select("_id user");

    console.log(accounts);


    if (!toUserAccount) {
        return res.status(400).json({
            message: "invalid toAccount"
        })
    }

    const formUserAccount = await accountModel.findOne({
        user: req.user._id
    })

    if (!formUserAccount) {
        return res.status(400).json({
            message: "System user account not found"
        })
    }


    const session = await mongoose.startSession();
    session.startTransaction();

    const transaction = new transactionModel({
        fromAccount: formUserAccount._id,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING"
    })

    const DebitLedger = await ledgerModel.create([{
        account: formUserAccount._id,
        type: "DEBIT",
        amount: amount,
        transaction: transaction._id
    }], { session });

    const CreditLedger = await ledgerModel.create([{
        account: toAccount,
        type: "CREDIT",
        amount: amount,
        transaction: transaction._id
    }], { session })


    transaction.status = "SUCCESS"
    await transaction.save({ session })
    await session.commitTransaction()
    session.endSession()
}

module.exports = { createTransaction, createInitialFundTransaction }
