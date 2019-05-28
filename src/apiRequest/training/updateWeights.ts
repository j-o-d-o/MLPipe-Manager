import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import router from "router";
import { isJobLoggedIn } from "services/authentication";
import { dbError } from "services/errorHandler";
import { bindTraining } from "middleware/bindings";
const stream = require("stream");
const BSON = require("bson");
const Grid = require("../../services/gridfs-stream/index");


export function register() {
    router.put('/training/:training/weights', bindTraining, auth, updateWeights);
}

function auth(req: Request, res: Response, next: NextFunction) {
    if(isJobLoggedIn(req)) {
        if(req.authJob.hasTraining(req.bindings.training._id)) {
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

function updateWeights(req: Request, res: Response) {
    let exp = req.bindings.training;

    let data = BSON.deserialize(req.body);

    let bufferStream = new stream.PassThrough();
    let weightsBuffer = data["weights"]["buffer"];
    bufferStream.end(weightsBuffer);

    let conn = mongoose.connection;
    let mongoDriver = mongoose.mongo;
    let gfs = Grid(conn.db, mongoDriver);

    const fileName = "training_weights_" + data["epoch"].toString() + "_" + data["batch"].toString() + "_" + exp._id + ".h5"
    let writestream = gfs.createWriteStream({ filename: fileName });
    bufferStream.pipe(writestream);

    writestream.on('close', async function(file: any) {
        const weights = {
            model_gridfs: file._id,
            epoch: data["epoch"],
            batch: data["batch"]
        }
        exp.weights.push(weights);

        try {
            const savedExp = await exp.save();
            res.json(savedExp);
        }
        catch (err) {
            // istanbul ignore next
            dbError(res, err);
        }
    })
}