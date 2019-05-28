import { Request, Response, NextFunction } from "express";
import router from "router";
import { isLoggedIn } from "services/authentication";
import { dbError } from "services/errorHandler";
import { bindJob } from "middleware/bindings";


export function register() {
    router.delete('/job/:job', bindJob, auth, deleteJob);
}

function auth(req: Request, res: Response, next: NextFunction) {
    if(isLoggedIn(req)) {
        const isAdmin = req.authuser.isAdmin();
        const isOwnJob = req.bindings.job.isCreatedBy(req.authuser._id);
        if(isAdmin || isOwnJob) {
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

async function deleteJob(req: Request, res: Response) {
    const job = req.bindings.job;

    // pre hook for deleting jobs also deletes its trainings (in job schema)
    try {
        await job.remove();
        return res.json(true);
    }
    catch(err) {
        // istanbul ignore next
        dbError(res, err);
    }
}