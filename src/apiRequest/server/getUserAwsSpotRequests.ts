import { Request, Response, NextFunction } from "express";
import router from "router";
import logger from "services/logger";
import { isLoggedIn } from "services/authentication";
import { dbError } from "services/errorHandler";
import { AwsSpotRequest } from "models/awsSpotRequest.model";
import { getSpotRequests, getIPfromInstance } from "services/awsService";


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

/*
async function findSpotRequests(savedRequests) {
    try {
        const data = await getSpotRequests({});
        for (let request of data.SpotInstanceRequests) {
            // Only create new spotrequest if it is not already available in the database
            var spotRequest = new AwsSpotRequest();
            spotRequest.spot_request_id = request.SpotInstanceRequestId;
            spotRequest.instance_ids.push(request.InstanceId);

            spotRequest.instance_ips;
            spotRequest.creator;
        }
    }
    catch (err) {
        logger.error("Error on getting AWS Spot requests", { error: err.toString() });
    }
}
*/

async function getUserAWSSpotRequests(req: Request, res: Response){
    // TODO: also fetch AWS and check for any other spot requests / servers and add these here (which were created by hand)

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