const usermoddel = require('../models/user.model');
const jwt = require('jsonwebtoken');
const blackListModel = require('../models/blackList.model');

async function authmiddleware(req, res, next) {

    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "unauthorized user token is missing",
        })
    }
    const blacklistedToken = await blackListModel.findOne({ token });

    if (blacklistedToken) {
        return res.status(400).json({
            message: "unauthorized access token is invalid",
        })
    }

    try {
       
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const user = await usermoddel.findById(decoded.userId);

        req.user = user;
        return next();

    } catch (err) {
        return res.status(401).json({
            message: "unauthorized user token is invalid",
        })
    }

}

async function authsystemUsermiddleware(req, res, next) {

    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "unauthorized user token is missing",
        })
    }

    const blacklistedToken = await blackListModel.findOne({ token });

    if (blacklistedToken) {
        return res.status(401).json({
            message: "unauthorized user token is invalid",
        })
    }

    try {
       
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const user = await usermoddel.findById(decoded.userId).select('+systemUser');

        if (!user.systemUser) {
            return res.status(403).json({
                message: "access denied. only system users can access this resource",
            });
        }

        req.user = user;
        return next();

    } catch (err) {
        return res.status(401).json({
            message: "unauthorized user token is invalid",
        })
    }
}



module.exports = {
    authmiddleware,
    authsystemUsermiddleware    
};

