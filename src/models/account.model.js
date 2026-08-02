const mongoose = require('mongoose');
const ledgerModel = require("./ledger.model")

const accountSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "user is required"],
        index: true
    },
    status: {
        type: String,
        enum: ["ACTIVE", "Frozen", "Closed"],
        message: "status should be either ACTIVE , Frozen or Closed",
        default: "ACTIVE"
    },
    currency: {
        type: String,
        required: [true, "currency is required"],
        default: "USD"
    }
}, {
    timestamps: true
})

accountSchema.index({ user: 1, status: 1 });

accountSchema.methods.getBalance = async function () {

    const balanceData = await ledgerModel.aggregate([
        { $match: { account: this._id } },

        {
            $group: {
                _id: null,
                totalDebit: {
                    $sum: {
                        $cond: [
                            { $eq: ['$type', "DEBIT"] },
                            '$amount',
                            0
                        ]
                    }
                },
                totalCredit: {
                    $sum: {
                        $cond: [
                            { $eq: ['$type', "CREDIT"] },
                            '$amount',
                            0
                        ]
                    }
                }
            }
        },
        {
            $project: {
                _id : 0,
                balance:{$subtract : [ "$totalCredit", "$totalDebit" ]}
            }
        }
    ])

    if (balanceData.length === 0) {
        return 0
    }

    return balanceData[0].balance

}

const AccountModel = mongoose.model("account", accountSchema)

module.exports = AccountModel