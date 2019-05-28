import { Request, Response, NextFunction } from "express";
import router from "router";
import logger from "services/logger";
import { isLoggedIn } from "services/authentication";
import { dbError } from "services/errorHandler";
import { testKeyPair, createSpotInstance, getIPfromInstance } from "services/awsService";
import { AwsSpotRequest, IAwsSpotRequest } from "models/awsSpotRequest.model";
import { checkValidation } from "middleware/checkValidation";
const { check } = require('express-validator/check');


export function register() {
    router.post('/server/awsspotrequest', auth, val, checkValidation, createAWSSpotRequest);
}

const val = [
    check('aws_config', "AWS Config is required").exists(),
]

function auth(req: Request, res: Response, next: NextFunction) {
    if(isLoggedIn(req)) {
         next();
    }
    else{
        res.status(401).send();
    }
}

async function _setupAWS(sr: IAwsSpotRequest) {
    const params = sr.aws_config;

    try {
        // Testing Key Pair
        const keyName = params["LaunchSpecification"]["KeyName"];
        if(keyName == undefined) {
            throw "KeyName not found in aws config!";
        }

        sr.setup_log.push("Testing Keypair...");
        await sr.save();
        await testKeyPair(keyName);
        logger.info("AWSSpotRequestId: " + sr._id + " Keypair test successful");
        sr.setup_log.push("Keypair test successful");
        await sr.save();

        // Create Spot Request and wait for instance to run
        sr.setup_log.push("Creating Spot Request and waiting for running Instance...");
        await sr.save();
        const [spotRequestId, instanceId] = await createSpotInstance(params);
        logger.info("AWSSpotRequestId: " + sr._id + " Created AWS Instance with Id: " + instanceId);
        sr.setup_log.push("Spot Request running with Instance Id: " + instanceId);
        sr.spot_request_id = spotRequestId;
        sr.instance_ids.push(instanceId);
        await sr.save();

        // Get Ip from Instance
        const instanceIp = await getIPfromInstance(instanceId);
        logger.info("AWSSpotRequestId: " + sr._id + " Instance running with IP Adress: " + instanceIp);
        sr.setup_log.push("Instance running with IP Adress: " + instanceIp);
        sr.instance_ips.push(instanceIp);
        sr.is_finished = true;
        sr.in_error = false;
        await sr.save();
    }
    catch (err) {
        logger.error("AWSSpotRequestId: " + sr._id + " Error on setting up AWS Spot Instance", { error: err.toString() });

        // TODO: Cancel Spot Request!

        sr.setup_log.push("[ERROR]: " + err.message);
        sr.in_error = true;
        sr.is_finished = true;
        try {
            await sr.save();
        }
        catch (err) {
            logger.error("AWSSpotRequestId: " + sr._id + " Error on saving error for AWS Spot Instance", { error: err.toString() });
        }
    }
}

async function createAWSSpotRequest(req: Request, res: Response){
    var spotRequest = new AwsSpotRequest();
    spotRequest.creator = req.authuser._id;
    spotRequest.aws_config = req.body.aws_config;

    try {
        const savedSpotRequest = await spotRequest.save();

        // Note, there is no "await" here on purpose! User should not need to wait until everything
        // is set up, but rather the spotRequest object is updated in the database over the time of set up
        _setupAWS(savedSpotRequest);

        res.json(savedSpotRequest);
    }
    catch (err) {
        // istanbul ignore next
        dbError(res, err);
    }
}