import { Request, Response, NextFunction } from "express";
import { rootDirectory } from "server";
import router from "router";
import logger from "services/logger";
import { isLoggedIn } from "services/authentication";
import { dbError } from "services/errorHandler";
import { cancelSpotRequest, stopInstances } from "services/awsService";
import { connect, uploadFile, setupTraining, startTraining } from "services/serverService";
import { Job, IJob } from "models/job.model";
import { Training } from "models/training.model";
import { fileExists, isZip } from "middleware/customValidators";
import { Key } from "models/key.model";
import { valError } from "services/errorHandler";
const crypto = require('crypto');
const { check, validationResult } = require('express-validator');
const multer = require('multer')
const upload = multer({ dest: 'tmp/train_srcs/' });
const fs = require('fs');


export function register() {
    router.post('/job/remote', upload.single('train_src'), val, customCheckValidation, createJobRemote);
}

const val = [
    check('name', "Name is required").exists(),
    check('name', "Name can only have 30 characters or less").isLength({ max: 30 }),
    check('description', "Description can only have 800 characters or less").isLength({ max: 800 }),

    // Remote details
    check('exec_path', "Execution path is required").exists(),
    check('config_path', "Config path is required").exists(),
    check('conda_env', "Name of conda environment is required").exists(),
    check('key', "Key for server authentication is required").exists(),
    check('key', 'Key must be a valid Mongo ID').isMongoId(),
    check('user_name', "User for Remote server is required").exists(),
    check('ssh_port', "SSH port is required").exists(),
    check('ssh_port', "SSH port must be an integer").isNumeric(),
    check('server_ip', "IP of remote server is required").exists(),
    check('api_url', "API URL is required").exists(),

    // Check if is a zip file
    check('train_src', "Project sources are missing").custom((value: any, msg: any) => fileExists(msg.req.file)),
    check('train_src', "Project source must be ziped").custom((value: any, msg: any) => isZip(msg.req.file)),
]

function auth(req: Request, res: Response, next: NextFunction) {
    if(isLoggedIn(req)) {
        next();
    }
    else{
        res.status(401).send();
    }
}

function customCheckValidation(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        if(req.file !== undefined) {
            fs.unlink(req.file.path, function(err: any) {
                if (err) {
                    logger.error("Error on deleting Training ZIP file", {error: err});
                }
            });
        }
        valError(res, errors.array());
    }
    else {
        next();
    }
}

async function _startTraining(
        jobId: any,
        jobToken: string,
        remoteDetails: IJob["remote_details"],
        privateKey: Buffer,
        filePath: string)
    {
    try {
        // Connect to Remote Server
        const connection = await connect(
            remoteDetails.server_ip, 
            remoteDetails.ssh_port, 
            remoteDetails.user_name, 
            privateKey
        );

        // Upload source file to Server
        const source_folder = "mlpipe_prjs"; // Folder where all the expirments are unpacked on the remote server (relative to home folder)
        const proj_filename = "ziped_" + jobId
        await uploadFile(
            connection, 
            rootDirectory + "/" + filePath, 
            "/home/" + remoteDetails.user_name + "/" + proj_filename
        );
        logger.info("JobId: " + jobId + " Uploaded sources to Remote Server");
        fs.unlink(filePath, function(err: any) {
            if (err) {
                logger.error("Error on deleting Training ZIP file", {error: err});
            }
        });

        // Upload training setup script to Server
        await uploadFile(
            connection, 
            rootDirectory + "/scripts/setup_training.sh", 
            "/home/" + remoteDetails.user_name + "/setup_training.sh"
        ); 
        logger.info("JobId: " + jobId + " Uploaded training setup script to Remote Server");

        // Setup training on Remote Server
        const streamDataArr = await setupTraining(
            connection, 
            jobId, 
            jobToken, 
            source_folder, 
            proj_filename, 
            remoteDetails.conda_env, 
            remoteDetails.config_path, 
            remoteDetails.api_url
        );
        logger.info("JobId: " + jobId + " Training setup succesfull");

        // Save successfull setup to the job
        try {
            await Job.findOneAndUpdate(
                {_id: jobId }, 
                { $push: { setup_log: { $each: streamDataArr} }, $set: { in_error: false, is_finished: true }}
            );
        }
        catch (err) {
            logger.error("JobId: " + jobId + " Saving Job setup success and log failed", { error: err });
        }

        // Start training on Remote server, no need to await here
        logger.info("JobId: " + jobId + " Start Training...");

        const streamDataArrTrainingLog: any = await startTraining(
            connection, 
            jobId, 
            remoteDetails.conda_env, 
            remoteDetails.exec_path, 
            source_folder
        );
        logger.info("JobId: " + jobId + " Training finished");
        // Find latest training and update its training log with streamDataArrTrainingLog
        try {
            // Convert stream data from array to single string
            var stringLog = ""
            for (var line in streamDataArrTrainingLog) {
                stringLog = line + '\n';
            }
            await Training.findOneAndUpdate(
                { jobId: jobId },
                { log: stringLog },
                { sort: { 'createdAt': -1 } }
            );
        }
        catch (err) {
            logger.error("JobId: " + jobId + " Saving Training log failed", { error: err });
        }

        if(remoteDetails.aws_spot_request_id !== null && 
           remoteDetails.aws_spot_request_id !== undefined && 
           remoteDetails.aws_spot_request_id !== "") {
            logger.info("JobId: " + jobId + " Cancel AWS Spot Request...");
            await cancelSpotRequest(remoteDetails.aws_spot_request_id);
        }
        if(remoteDetails.aws_instance_id !== null && 
           remoteDetails.aws_instance_id !== undefined && 
           remoteDetails.aws_instance_id !== "") {
            logger.info("JobId: " + jobId + " Termiante AWS Instance...");
            await stopInstances([remoteDetails.aws_instance_id]);
         }
    }
    catch (err) {
        // [0] = STDOUT stream as array, [1]: error string
        console.log(err);
        logger.error("JobId: " + jobId + " Error on Starting Training", { error: err.toString() });
        try {
            await Job.findOneAndUpdate(
                {_id: jobId }, 
                { $push: { setup_log: err.toString() }, $set: { in_error: true, is_finished: true }}
            );
        }
        catch (err) {
            console.log(err);
            logger.error("JobId: " + jobId + " Error saving AWS Error to Job", { error: err });
        }
    }
}

async function createJobRemote(req: Request, res: Response) {
    // req.file is the `train_src` file

    var job = new Job();
    job.type = 1; // Type 1 = Remote job

    const buffer = await crypto.randomBytes(32);
    job.token = buffer.toString('hex');

    job.name = req.body.name;
    job.description = req.body.description;
    job.creator = req.authuser._id;

    // Add job details for remote type
    job.remote_details.aws_spot_request_id = req.body.aws_spot_request_id || null;
    job.remote_details.aws_instance_id = req.body.aws_instance_id || null;
    job.remote_details.exec_path = req.body.exec_path;
    job.remote_details.config_path = req.body.config_path;
    job.remote_details.api_url = req.body.api_url;
    job.remote_details.key = req.body.key;
    job.remote_details.server_ip = req.body.server_ip;
    job.remote_details.user_name = req.body.user_name;
    job.remote_details.ssh_port = req.body.ssh_port;
    job.remote_details.conda_env = req.body.conda_env;

    try {
        const filePath = req.file.path;  // path to uploaded project zip file

        // Get private key
        // TODO: should check if the key actually belongs to the logged in user!
        const key = await Key.findOne({ _id: job.remote_details.key }, "+private_key");
        if(!key) {
            throw { message: "Key does not exist!"};
        }
        const privateKeyBuffer = Buffer.from(key.private_key, 'utf8');

        const savedJob = await job.save();

        // Not awaiting to finish the training start as this can take a bit
        // of progress. Current status (e.g. errors) are saved to the log of the job
        _startTraining(
            savedJob._id,
            savedJob.token,
            savedJob.remote_details,
            privateKeyBuffer,
            filePath,
        );

        res.json(savedJob);
    }
    catch (err) {
        // istanbul ignore next
        dbError(res, err);
    }
}
