const accountModel = require('../models/account.model');
const createWelcomeBalance = require('../controllers/transaction.controller')

async function CreateAccountController(req, res) {

    const user = req.user;

    const existingAccount = await accountModel.findOne({
        user: user._id,
    });

    if (existingAccount) {
        return res.status(200).json({
            message: "Account already exists.",
            account: existingAccount,
        });
    }

    const account = await accountModel.create({
        user: user._id,
    });

    await createWelcomeBalance.createWelcomeBalance(account._id)

    return res.status(201).json({
        message: "Account created successfully",
        account,
    })

}


async function GetAllAccountsController(req, res) {

    const accounts = await accountModel.find({
        user: req.user._id
    });

    return res.status(200).json({
        accounts
    });
}

async function GetAccountBalanceController(req, res) {

    const { accountId } = req.params;

    const account = await accountModel.findOne({
        _id: accountId,
        user: req.user._id
    });


    if (!account) {
        return res.status(404).json({
            message: "Account not found"
        });
    }

    const balance = await account.getBalance();

    return res.status(200).json({
        accountId: account._id,
        balance: balance
    });

}
module.exports = {
    CreateAccountController,
    GetAllAccountsController,
    GetAccountBalanceController
}