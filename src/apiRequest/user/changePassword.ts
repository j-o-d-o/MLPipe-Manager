import { Request, Response, NextFunction } from "express";
import router from "router";
import { bindUser } from "middleware/bindings";
import { isLoggedIn, sha512 } from "services/authentication";
import { dbError } from "services/errorHandler";
import { checkPwd } from "middleware/customValidators";
import { checkValidation } from "middleware/checkValidation";

const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { check } = require('express-validator');


export function register() {
    router.post('/user/:user/changePassword', bindUser, auth, val, checkValidation, chagenPassword);
}

const val = [
    check('newPassword', 'Password must be between 5 and 50 characters long').isLength({min: 5, max: 50}),
    check('oldPassword', 'Old Password is required').exists(),
    check('oldPassword', 'Wrong Password').custom((value: string, msg: any) => checkPwd(value, msg.req.bindings.user.email)), // Async check
]

var auth = function(req: Request, res: Response, next: NextFunction){
    if(isLoggedIn(req)){
        var isSameUser = req.authuser._id.equals(req.bindings.user._id);
        if (isSameUser) {
            next();
        }
        else {
            res.status(403).send();
        }
    }
    else {
        res.status(401).send();
    }
}

async function chagenPassword(req: Request, res: Response) {
    var user = req.bindings.user;
    var text = req.body.newPassword;

    var length = 64;    // salt length
    user.salt = crypto.randomBytes(Math.ceil(length/2)).toString('hex').slice(0,length);
    user.password = sha512(text, user.salt);
    user.token = jwt.sign({payload: user.email + user.updatedAt}, process.env.USER_TOKEN);

    try {
        await user.save();
        res.json(true);
    }
    catch (err) {
        // istanbul ignore next
        dbError(res, err);
    }
}