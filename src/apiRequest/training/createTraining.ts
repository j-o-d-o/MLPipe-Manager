import { Request, Response, NextFunction } from "express";
import router from "router";
import { isJobLoggedIn } from "services/authentication";
import { dbError } from "services/errorHandler";
import { Training } from "models/training.model";
import { checkValidation } from "middleware/checkValidation";
const { check } = require('express-validator/check');


export function register() {
    router.post('/training', auth, val, checkValidation, createTraining);
}

const val = [
    check('name', 'Name field is required').exists(),
    check('status', 'Status should be an integer').isInt(),
    check('curr_epoch', 'Current Epoch should be an integer').isInt(),
    check('curr_batch', 'Current Batch should be an integer').isInt(),
]

function auth(req: Request, res: Response, next: NextFunction) {
    if(isJobLoggedIn(req)){
        // Check if there is already an training for this job, if yes, forbid the creation
        // This needs to be removed in case multiple trainings are allowed per job
        if(req.authJob.trainings.length > 0) {
            res.status(403).json({
                error_code: "FORBIDDEN",
                data: "This job already has an training. Create a new Job for this training."
            });
            res.status(403).send();
        }
        else {
            next();
        }
    }
    else{
        res.status(401).send();
    }
}

async function createTraining(req: Request, res: Response){
    var exp = new Training(req.body);
    exp.job = req.authJob._id;

    try {
        const savedExp = await exp.save();
        req.authJob.trainings.push(savedExp._id);
        await req.authJob.save();
        res.json(savedExp);
    }
    catch (err) {
        // istanbul ignore next
        dbError(res, err);
    }
}