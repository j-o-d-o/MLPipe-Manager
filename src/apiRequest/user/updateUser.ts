import { Request, Response, NextFunction } from "express";
import router from "router";
import { isLoggedIn } from "services/authentication";
import { dbError } from "services/errorHandler";
import { isUniqueEmail, isUniqueName } from "middleware/customValidators";
import { checkValidation } from "middleware/checkValidation";
import { bindUser } from "middleware/bindings";

const jwt = require("jsonwebtoken");
const { check } = require('express-validator');


export function register() {
    router.put('/user/:user', bindUser, auth, val, checkValidation, updateUser);
}

const val = [
    check('user', 'The user object is missing').exists(),
    check('user.name', 'Username must be between 2 and 25 characters').isLength({min: 2, max: 25}).optional(),
    check('user.name', 'Username is already taken').custom((value: string, msg: any ) => isUniqueName(value, msg.req.bindings.user._id)).optional(), // Async check
    check('user.email', 'Email has wrong format').isEmail().optional(),
    check('user.email', 'Email must be between 3 and 50 characters long').isLength({min: 3, max: 50}).optional(),
    check('user.email', 'Email is already registered').custom((value: string, msg: any) => isUniqueEmail(value, msg.req.bindings.user._id)).optional(), // Async check
    check('user.role', 'Specified role not known').isLength({min: 0, max: 100}).optional(),
]

function auth(req: Request, res: Response, next: NextFunction) {
    if(isLoggedIn(req)) {
        const isSameUser = req.authuser._id.equals(req.bindings.user._id);
        const isAdmin = req.authuser.isAdmin();
        if (isSameUser || isAdmin) {
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

async function updateUser(req: Request, res: Response) {
    var user = req.bindings.user;
    user.name = req.body.user.name || user.name;
    user.email = req.body.user.email || user.email;
    user.default_aws_config = req.body.user.default_aws_config || user.default_aws_config;
    user.email = user.email.toLowerCase();

    if(req.authuser.isAdmin() && req.body.user.role !== undefined) {
        user.role = req.body.user.role;
        user.token = jwt.sign({payload: user.email}, process.env.USER_TOKEN);
    }

    try {
        const savedUser = await user.save();
        res.json(savedUser);
    }
    catch (err) {
        // istanbul ignore next
        dbError(res, err);
    }
}