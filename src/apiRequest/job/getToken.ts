import { Request, Response, NextFunction } from "express";
import router from "router";
import { isLoggedIn } from "services/authentication";
import { dbError } from "services/errorHandler";
import { Job } from "models/job.model";
import { bindJob } from "middleware/bindings";


export function register() {
    router.get('/job/:job/token', bindJob, auth, getToken);
}

function auth(req: Request, res: Response, next: NextFunction) {
    if(isLoggedIn(req)){
        const isAdmin = req.authuser.isAdmin();
        const isOwnToken = req.bindings.job.isCreatedBy(req.authuser._id);
        if(isAdmin || isOwnToken) {
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

async function getToken(req: Request, res: Response) {
    const _id = req.bindings.job._id;

    try {
        const job = await Job.findOne({"_id": _id}, {token: 1}).select("+token").exec();
        res.json(job);
    }
    catch(err) {
        // istanbul ignore next
        dbError(res, err);
    }
}