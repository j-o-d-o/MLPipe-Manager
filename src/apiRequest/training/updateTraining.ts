import { Request, Response, NextFunction } from "express";
import router from "router";
import { isJobLoggedIn } from "services/authentication";
import { dbError } from "services/errorHandler";
import { checkValidation } from "middleware/checkValidation";
import { bindTraining } from "middleware/bindings";
const { check } = require('express-validator');


export function register() {
    router.put('/training/:training', bindTraining, auth, val, checkValidation, updateTraining);
}

const val = [
    check('status', 'Status should be an integer').isInt().optional(),
    check('curr_epoch', 'Current Epoch should be an integer').isInt().optional(),
    check('curr_batch', 'Current Batch should be an integer').isInt().optional()
]

function auth(req: Request, res: Response, next: NextFunction) {
    if(isJobLoggedIn(req)) {
        if(req.authJob.hasTraining(req.bindings.training._id)) {
            next();
        }
        else {
            res.status(403).send();
        }
    }
    else{
        res.status(401).send();
    }
}

async function updateTraining(req: Request, res: Response) {
    let exp = req.bindings.training;
    exp.set(req.body);

    try {
        const savedExp = await exp.save();
        res.json(savedExp);
    }
    catch (err) {
        // istanbul ignore next
        dbError(res, err);
    }
}