const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({

    fromAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: [true, "transaction must be associated with a from account"],
        index: true
    },
    toAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: [true, "transaction must be associated with a to account"],
        index: true
    },
    status: {
        type: String,
        enum: {
            values: ["PENDING", "SUCCESS", "FAILED", 'REVERSED'],
            message: "status should be either PENDING , SUCCESS , FAILED or REVERSED",
        },
        default: "PENDING",
    },
    amount: {
        type: Number,
        required: [true, "amount is required to create a transaction"],
        min: [1, "transaction amount should be greater than 0"],
    },
    idempotencyKey: {
        type: String,
        required: [true, "idempotencyKey is required to create a transaction"],
        unique: true,
        index: true
    },
}, {
    timestamps: true
})


const transactionModel = mongoose.model("transaction", transactionSchema)

module.exports = transactionModel