import { Request, Response, NextFunction } from "express";
import router from "router";
import { dbError } from "services/errorHandler";
import { User } from "models/user.model";
import { checkPwd } from "middleware/customValidators";
import { checkValidation } from "middleware/checkValidation";
const { check } = require('express-validator/check');


export function register() {
    router.post('/user/login', val, checkValidation, login);
}

const val = [
    check('email', 'Email is required').exists(),
    check('password', 'Password is required').exists(),
    check('password', 'Wrong Password').custom((value: string, incomming: any) => checkPwd(value, incomming.req.body.email)), // Async check
]

async function login(req: Request, res: Response){
    // User login is already checked in validation
    // This one time the token needs to be serverd to the client
    var param = req.body.email.toLowerCase();
    try {
        const user = await User.findOne({ $and : [ 
            {$or : [
                {email: new RegExp('^'+param+'$', 'i')},
                {name: new RegExp('^'+param+'$', 'i')}
            ]}, 
            { is_active : true },
        ]})
        .select("+token")
        .exec();
        res.json(user);
    }
    catch (err){
        // istanbul ignore next
        dbError(res, err);
    }
}
