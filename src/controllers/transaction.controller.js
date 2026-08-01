const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const accountModel = require("../models/account.model");
const emailService = require("../services/email.service");
const userModel = require('../models/user.model')
const mongoose = require("mongoose");
const crypto = require("crypto");

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
    const toUser = await userModel.findById(toUserAccount.user);


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
    await emailService.SendTransactionMail(req.user.email, req.user.name, amount, toUser.name);
    await emailService.ReceiverTransactionMail(toUser.email, toUser.name, amount, req.user.name);

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
async function createWelcomeBalance(accountId) {

    const session = await mongoose.startSession();
    const systemUser = await userModel.findOne({
        systemUser: true
    }).select("+systemUser");
    const systemAccount = await accountModel.findOne({
        user: systemUser._id
    });
    try {

        session.startTransaction();

        const transaction = (await transactionModel.create([{
            fromAccount: systemAccount._id,
            toAccount: accountId,
            amount: 5000,
            idempotencyKey: crypto.randomUUID(),
            status: "PENDING"
        }], { session }))[0];

        // Debit
        await ledgerModel.create([{
            account: systemAccount._id,
            type: "DEBIT",
            amount: 5000,
            transaction: transaction._id
        }], { session });

        // Credit
        await ledgerModel.create([{
            account: accountId,
            type: "CREDIT",
            amount: 5000,
            transaction: transaction._id
        }], { session });

        transaction.status = "SUCCESS";
        await transaction.save({ session });
        await session.commitTransaction();


    } catch (err) {

        await session.abortTransaction();
        throw err;

    } finally {

        session.endSession();

    }
}
async function GetMonthlySummary(req, res) {
    const { accountId } = req.params;
    const account = await accountModel.findById(accountId);
    const user = await userModel.findById(account.user);

    const result = await ledgerModel.aggregate([
        {
            $match: {
                account: new mongoose.Types.ObjectId(accountId),
            },
        },
        {
            $group: {
                _id: {
                    month: { $month: "$createdAt" },
                    type: "$type"
                },
                total: { $sum: "$amount" }
            },
        }

    ])

    const months = {
        1: { name: "Jan", income: 0, expense: 0 },
        2: { name: "Feb", income: 0, expense: 0 },
        3: { name: "Mar", income: 0, expense: 0 },
        4: { name: "Apr", income: 0, expense: 0 },
        5: { name: "May", income: 0, expense: 0 },
        6: { name: "Jun", income: 0, expense: 0 },
        7: { name: "Jul", income: 0, expense: 0 },
        8: { name: "Aug", income: 0, expense: 0 },
        9: { name: "Sep", income: 0, expense: 0 },
        10: { name: "Oct", income: 0, expense: 0 },
        11: { name: "Nov", income: 0, expense: 0 },
        12: { name: "Dec", income: 0, expense: 0 },
    };


    result.forEach((item) => {

        if (!months[item._id.month]) {
            console.log("invalid month", item._id.month);
            return;
        }

        if (item._id.type === "CREDIT") {
            months[item._id.month].income = item.total;
        } else {
            months[item._id.month].expense = item.total;
        }

    })

    res.json({
        user: user.name,
        summary: Object.values(months),
    });
}

module.exports = { createTransaction, createInitialFundTransaction, createWelcomeBalance, GetMonthlySummary }
