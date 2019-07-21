import { Request, Response, NextFunction } from "express";
import router from "router";
import { isLoggedIn } from "services/authentication";
import { dbError } from "services/errorHandler";
import { Job } from "models/job.model";
import { checkValidation } from "middleware/checkValidation";
const { check } = require("express-validator");
const crypto = require('crypto');


export function register() {
    router.post("/job/local", auth, val, checkValidation, createLocalJob);
}

const val = [
    check("name", "Name is required").exists().isLength({ min: 1 }),
    check("name", "Name can only have 30 characters or less").isLength({ max: 30 }),
    check("description", "Description can only have 800 characters or less").isLength({ max: 800 }),
]

function auth(req: Request, res: Response, next: NextFunction) {
    if(isLoggedIn(req)){
        next();
    }
    else{
        res.status(401).send();
    }
}

async function createLocalJob(req: Request, res: Response) {
    let job = new Job();
    job.type = 0;
    job.creator = req.authuser._id;
    job.name = req.body.name;
    job.description = req.body.description;
    job.is_finished = true;

    const buffer = await crypto.randomBytes(32);
    job.token = buffer.toString('hex');

    try{
        const createdJob = await job.save();
        return res.json(createdJob);
    }
    catch(err) {
        // istanbul ignore next
        dbError(res, err);
    }
}