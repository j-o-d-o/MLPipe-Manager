import { Request, Response, NextFunction } from "express";
import router from "router";
import { isLoggedIn, isJobLoggedIn } from "services/authentication";
import { bindTraining } from "middleware/bindings";


export function register() {
    router.get('/training/:training', bindTraining, auth, getTraining);
}

function auth(req: Request, res: Response, next: NextFunction) {
    if(isLoggedIn(req) || isJobLoggedIn(req)){
        next();
    }
    else{
        res.status(401).send();
    }
}

function getTraining(req: Request, res: Response) {
    res.json(req.bindings.training);
}