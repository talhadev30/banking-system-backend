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
    user: req.user._id,
  });

  const accountsWithBalance = await Promise.all(
    accounts.map(async (account) => ({
      ...account.toObject(),
      balance: await account.getBalance(), // existing function reuse
    }))
  );

  return res.status(200).json({
    accounts: accountsWithBalance,
  });
}

module.exports = {
    CreateAccountController,
    GetAllAccountsController
}