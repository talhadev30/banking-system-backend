const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, "email is required"],
            unique: [true, "email is already exist"],
            trim: true,
            lowercase: true,
            match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, "Please fill a valid email address"]
        },
        name: {
            type: String,
            required: [true, "name is required"]
        },
        password: {
            type: String,
            required: [true, "password is required"],
            minlength: [6, "password must be at least 6 characters long"],
            select: false
        },
        systemUser: {
            type: Boolean,
            default: false,
            immutable: true,
            select: false
        }
    },
    {
        timestamps: true
    }
);

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return;
    }

    const hash = await bcrypt.hash(this.password, 10);
    this.password = hash;
;
});

userSchema.methods.comparePassword = async function (password) {
    return bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
