import { Request, Response, NextFunction } from "express";
import router from "router";
import { isLoggedIn, sha512 } from "services/authentication";
import { dbError } from "services/errorHandler";
import { User } from "models/user.model";
import { isUniqueEmail, isUniqueName } from "middleware/customValidators";
import { checkValidation } from "middleware/checkValidation";

const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { check } = require('express-validator/check');


export function register() {
    router.post('/user/register', auth, val, checkValidation, createUser);
}

const val = [
    check('user', 'The user object is missing').exists(),
    check('user.name', 'Username must not be empty').exists(),
    check('user.name', 'Username must be between 2 and 25 characters').isLength({min: 2, max: 25}),
    check('user.name', 'Username is already taken').custom((value: string) => isUniqueName(value, null)), // Async check
    check('user.password', 'Password must be between 5 and 50 characters long').isLength({min: 5, max: 50}),
    check('user.email', 'Email is required').exists(),
    check('user.email', 'Email has wrong format').isEmail(),
    check('user.email', 'Email must be between 3 and 50 characters long').isLength({min: 3, max: 50}),
    check('user.role', 'Specified role not known').isLength({min: 0, max: 100}),
    check('user.email', 'Email is already registered').custom((value: string) => isUniqueEmail(value, null)), // Async check
]

function auth(req: Request, res: Response, next: NextFunction) {
    // Currently it is only possible for admins to add new users 
    if(isLoggedIn(req)){
        const isAdmin = req.authuser.isAdmin();
        if (isAdmin) {
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

async function createUser(req: Request, res: Response) {
    var user = new User();
    user.name = req.body.user.name;
    user.email = req.body.user.email.toLowerCase();
    if(req.authuser.isAdmin()) {
        user.role = req.body.user.role;
    }

    // Creating password
    const saltLength = 64;
    user.salt = crypto.randomBytes(Math.ceil(saltLength/2)).toString('hex').slice(0, saltLength);
    user.password = sha512(req.body.user.password, user.salt);
    user.token = jwt.sign({payload: user.email}, process.env.USER_TOKEN);
    user.is_active = true;

    try {
        const savedUser = await user.save();
        savedUser.salt = undefined;
        savedUser.password = undefined;
        res.json(savedUser);
    }
    catch (err){
        // istanbul ignore next
        dbError(res, err);
    }
}