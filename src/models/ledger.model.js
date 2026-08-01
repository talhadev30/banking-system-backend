const mongoose = require('mongoose');

const ledgerSchema = new mongoose.Schema({
    account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: [true, "Ledger must be associated with an account"],
        index: true,
        immutable: true
    },
    amount: {
        type: Number,
        required: [true, "Ledger must have an amount"],
        immutable: true     
    },

    transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "transaction",
        required: [true, "Ledger must be associated with a transaction"],
        index: true,
        immutable: true
    },
    type: {
        type: String,
        enum: {
            values: ['DEBIT', 'CREDIT'],
            message: "type should be either DEBIT or CREDIT"
        },
        required: [true, "Ledger is required "],
        immutable: true
    }
},{timestamps: true});


function prevenledgermodifecation(){
    throw new Error("ledger entries are immutable and cannot be  modified or deleted");
}

ledgerSchema.pre('findOneAndUpdate' , prevenledgermodifecation)
ledgerSchema.pre('updateOne' , prevenledgermodifecation)
ledgerSchema.pre('deleteOne' , prevenledgermodifecation)
ledgerSchema.pre('remove' , prevenledgermodifecation)
ledgerSchema.pre('deleteMany' , prevenledgermodifecation)
ledgerSchema.pre('updateMany' , prevenledgermodifecation)
ledgerSchema.pre('findOneAndDelete' , prevenledgermodifecation)
ledgerSchema.pre('findOneAndReplace' , prevenledgermodifecation)


const ledgerModel = mongoose.model('ledger' , ledgerSchema);

module.exports= ledgerModel;