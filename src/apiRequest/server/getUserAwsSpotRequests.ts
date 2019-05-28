import { Request, Response, NextFunction } from "express";
import router from "router";
import { isLoggedIn } from "services/authentication";
import { dbError } from "services/errorHandler";
import { AwsSpotRequest } from "models/awsSpotRequest.model";


export function register() {
    router.get('/server/awsspotrequest', auth, getUserAWSSpotRequests);
}

function auth(req: Request, res: Response, next: NextFunction) {
    if(isLoggedIn(req)){
        next();
    }
    else{
        res.status(401).send();
    }
}

async function getUserAWSSpotRequests(req: Request, res: Response){
    const userId = req.authuser._id;

    try {
        const requests = await AwsSpotRequest
            .find({'creator': userId})
            .sort({createdAt: -1})
            .exec();
        return res.json(requests);
    }
    catch (err) {
        // istanbul ignore next
        dbError(res, err);
    }
}