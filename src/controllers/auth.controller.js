const usermodule = require('../models/user.model');
const jwt = require('jsonwebtoken');
const emailservice = require('../services/email.service');
const blackListModel = require('../models/blackList.model');

async function userregistercontroller(req, res) {

    const { email, password, name } = req.body

    const isExist = await usermodule.findOne({
        email: email
    })

    if (isExist) {
        return res.status(400).json({
            message: "user alrady exist with email",
            status: "failed"
        })
    }

    const user = await usermodule.create({
        email, password, name
    })
    const token = jwt.sign({ userid: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: "3d" })

    res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
    });
    res.status(201).json({
        message: "user created successfully",
        user: {
            _id: user._id,
            email: user.email,
            name: user.name,
            systemuser: user.systemUser
        },
        token
    })
    await emailservice.SendRegistrationMail(user.email, user.name)
}

async function userlogincontroller(req, res) {
    const { email, password } = req.body;

    const user = await usermodule.findOne({ email }).select("+password +systemUser")

    if (!user) {
        return res.status(401).json({
            message: "invalid email or password",
            status: "failed"
        })
    }

    const isvaliduser = await user.comparePassword(password)

    if (!isvaliduser) {
        return res.status(401).json({
            message: "invalid email or password",
            status: "failed"
        })
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: "3d" })

    res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
    });
    res.status(200).json({
        message: "user logged in successfully",
        user: {
            _id: user._id,
            email: user.email,
            name: user.name,
            systemUser: user.systemUser
        },
        token
    })
}
async function userlogoutcontroller(req, res) {

    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(400).json({
            message: "No token provided",
            status: "failed"
        });
    }

    await blackListModel.create({
        token: token
    });

    res.clearCookie("token");

    res.status(200).json({
        message: "User logged out successfully",
        status: "success"
    });
}

module.exports = {
    userregistercontroller,
    userlogincontroller,
    userlogoutcontroller
}