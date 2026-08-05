const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const accountModel = require("../models/account.model");
const emailService = require("../services/email.service");
const userModel = require('../models/user.model')
const mongoose = require("mongoose");
const crypto = require("crypto");

async function createTransaction(req, res) {

    const { toAccount, amount, idempotencyKey } = req.body;

    if (!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "toAccount amount idempotencyKey are required"
        })
    }

    const formUserAccount = await accountModel.findOne({
        user: req.user._id
    })

    if (!mongoose.Types.ObjectId.isValid(toAccount)) {
        return res.status(404).json({
            message: "Account not found"
        });
    }


    const toUserAccount = await accountModel.findOne({
        _id: toAccount
    })

    if (!formUserAccount) {
        return res.status(403).json({
            message: "You are not authorized to use this account"
        });
    }

    if (!toUserAccount) {
        return res.status(400).json({
            message: "Account not found"
        })
    }
    const fromAccount = formUserAccount._id;

    if (fromAccount.toString() === toAccount.toString()) {
        return res.status(400).json({
            message: "You cannot transfer money to your own account"
        });
    }

    if (amount < 1) {
        return res.status(400).json({
            message:"amount must be grater than 0"
        })
    }


    const toUser = await userModel.findById(toUserAccount.user);


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
            return new Promise(resolve => setTimeout(resolve, 1 * 1000));
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

    if (!mongoose.Types.ObjectId.isValid(toAccount)) {
        return res.status(404).json({
            message: "Account not found"
        });
    }


    const toUserAccount = await accountModel.findById(toAccount);

    if (!toUserAccount) {
        return res.status(404).json({
            message: "Account not found"
        });
    }

    const formUserAccount = await accountModel.findOne({
        user: req.user._id
    })

    if (!formUserAccount) {
        return res.status(400).json({
            message: "System user account not found"
        })
    }
    if (formUserAccount._id.toString() === toAccount.toString()) {
        return res.status(400).json({
            message: "You cannot transfer money to your own account"
        });
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

    return res.status(200).json({
        message: "Transaction Completed Successfully",
        transaction
    });
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
async function GetRecentTransactions(req, res) {
    const { accountId } = req.params;

    try {
        const transactions = await transactionModel.find({
            $or: [
                { fromAccount: accountId },
                { toAccount: accountId }
            ],
            status: "SUCCESS"
        })
            .populate({
                path: "fromAccount",
                populate: {
                    path: "user",
                    select: "name"
                }
            })
            .populate({
                path: "toAccount",
                populate: {
                    path: "user",
                    select: "name"
                }
            })
            .sort({ createdAt: -1 })
            .limit(10);

        res.status(200).json({
            transactions,
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: error.message,
        });
    }

}


module.exports = { createTransaction, createInitialFundTransaction, createWelcomeBalance, GetMonthlySummary, GetRecentTransactions }
