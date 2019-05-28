import { Request, Response, NextFunction } from "express";
import router from "router";
import { isLoggedIn } from "services/authentication";
import { bindJob } from "middleware/bindings";


export function register() {
    router.get('/job/:job', bindJob, auth, getJob);
}

function auth(req: Request, res: Response, next: NextFunction) {
    if(isLoggedIn(req)){
        next();
    }
    else{
        res.status(401).send();
    }
}

function getJob(req: Request, res: Response) {
    res.json(req.bindings.job);
}