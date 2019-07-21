import { Request, Response, NextFunction } from "express";
import router from "router";
import { isLoggedIn } from "services/authentication";
import { dbError } from "services/errorHandler";
import { Job } from "models/job.model";
import { checkValidation } from "middleware/checkValidation";
const { query } = require('express-validator');


export function register() {
    router.get('/jobs', auth, val, checkValidation, getJobs);
}

const val = [
    query('user', "User ist not a valid MongoDB id").optional().isMongoId(),
]

function auth(req: Request, res: Response, next: NextFunction) {
    if(isLoggedIn(req)){
        next();
    }
    else{
        res.status(401).send();
    }
}

async function getJobs(req: Request, res: Response) {
    const userId = req.query.user;
    let searchQuery: any = {};
    if (userId !== undefined) {
        searchQuery["creator"] = userId;
    }

    try {
        const jobs = await Job.find(searchQuery)
        .populate('creator', { name: 1 })
        .populate('trainings', {
            log: 0, weights: 0, metrics: 0, keras_model: 0
        })
        .sort({createdAt: -1})
        .exec();
        res.json(jobs);
    }
    catch (err) {
        // istanbul ignore next
        dbError(res, err);
    }
}