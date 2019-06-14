import { Router } from "express";
import { getToken, loggIn, getJobToken, loggInJob } from "./services/authentication";
import { dbError } from "services/errorHandler";

const router = Router();

router.get("/test", (req, res) => {
    res.json({ message: "Reached API!"});
});

// Login the user, valid for all the routes that are following
router.use(async function(req, res, next) {
    const token = getToken(req);
    if (token != null){
        try {
            await loggIn(req, token);
            next();
        }
        catch (err) {
            // istanbul ignore next
            dbError(res, err);
        }
    }
    else{
        next();
    }
});

// Check if there is a custom job token included to update/create related trainings
router.use(async function(req, res, next) {
    const token = getJobToken(req);
    if(token != null){
        try {
            await loggInJob(req, token);
            next();
        }
        catch (err) {
            // istanbul ignore next
            dbError(res, err);
        }
    }
    else{
        next();
    }
});

export default router;


// Register API Endpoints here
require("apiRequest/user/login").register();
require("apiRequest/user/createUser").register();
require("apiRequest/user/updateUser").register();
require("apiRequest/user/getUser").register();
require("apiRequest/user/getUsers").register();
require("apiRequest/user/changePassword").register();
require("apiRequest/user/setInactive").register();

require("apiRequest/key/createKey").register();
require("apiRequest/key/deleteKey").register();
require("apiRequest/key/getPublicKey").register();
require("apiRequest/key/getUserKeys").register();

require("apiRequest/job/getToken").register();
require("apiRequest/job/getJob").register();
require("apiRequest/job/getJobs").register();
require("apiRequest/job/deleteJob").register();
require("apiRequest/job/createRemoteJob").register();
require("apiRequest/job/createLocalJob").register();

require("apiRequest/training/createTraining").register();
require("apiRequest/training/getTraining").register();
require("apiRequest/training/downloadModel").register();
require("apiRequest/training/updateTraining").register();
require("apiRequest/training/updateWeights").register();