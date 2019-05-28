import { Request, Response, NextFunction } from "express";
import router from "router";
import { isLoggedIn } from "services/authentication";
import { bindAwsSpotRequest } from "middleware/bindings";


export function register() {
    router.get('/server/awsspotrequest/:awsspotrequest', bindAwsSpotRequest, auth, getAWSSpotRequest);
}

function auth(req: Request, res: Response, next: NextFunction) {
    if(isLoggedIn(req)){
        const isAdmin = req.authuser.isAdmin();
        const isOwnRequest = req.bindings.awsSpotRequest.isCreatedBy(req.authuser._id);
        if(isAdmin || isOwnRequest) {
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

function getAWSSpotRequest(req: Request, res: Response) {
    res.json(req.bindings.awsSpotRequest);
}