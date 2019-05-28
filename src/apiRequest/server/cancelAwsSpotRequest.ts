import { Request, Response, NextFunction } from "express";
import router from "router";
import logger from "services/logger";
import { isLoggedIn } from "services/authentication";
import { dbError } from "services/errorHandler";
import { cancelSpotRequest, terminateInstances } from "services/awsService";
import { IAwsSpotRequest } from "models/awsSpotRequest.model";
import { bindAwsSpotRequest } from "middleware/bindings";


export function register() {
    router.delete('/server/awsspotrequest/:awsspotrequest', bindAwsSpotRequest, auth, cancelAWSSpotRequest);
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

async function _cleanUp(sr: IAwsSpotRequest) {
    try {
        // Cancel Spot Request (Does not terminate all instances)
        if(sr.spot_request_id != null) {
            sr.setup_log.push("Cancel Spot Request...");
            await sr.save();
            await cancelSpotRequest(sr.spot_request_id);
            sr.setup_log.push("Success");
            await sr.save();
        }

        // Terminate Instances
        if(sr.instance_ids.length > 0) {
            sr.setup_log.push("Terminate Instances...");
            await sr.save();
            await terminateInstances(sr.instance_ids);
            sr.setup_log.push("Success");
            await sr.save();
        }

        // Remove the Spot Request from the DB
        await sr.remove();
    }
    catch (err) {
        console.log(err);
        logger.error("AWSSpotRequestId: " + sr._id + " Error on canceling AWS Spot Instance", { error: err.toString() });

        sr.setup_log.push("[ERROR]: " + err.message);
        sr.in_error = true;
        sr.is_finished = true;
        await sr.save();
    }
}

async function cancelAWSSpotRequest(req: Request, res: Response) {
    try {
        // Cancel spot request and terminate instances
        var sr = req.bindings.awsSpotRequest;
        sr.is_canceling = true;
        await sr.save();
        _cleanUp(sr);
        res.json(true);
    }
    catch (err) {
        // istanbul ignore next
        dbError(res, err);
    }
}