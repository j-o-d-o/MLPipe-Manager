import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import router from "router";
import { isLoggedIn, isJobLoggedIn } from "services/authentication";
import { bindTraining } from "middleware/bindings";
const Grid = require("../../services/gridfs-stream/index");


export function register() {
    router.get('/training/:training/download/:epoch/:batch', bindTraining, auth, downloadModel);
}

function auth(req: Request, res: Response, next: NextFunction) {
    if(isLoggedIn(req) || isJobLoggedIn(req)){
        next();
    }
    else{
        res.status(401).send();
    }
}

function downloadModel(req: Request, res: Response) {
    let gridfsId = null;
    const epoch: number = parseInt(req.params.epoch, 10);
    const batch: number = parseInt(req.params.batch, 10);
    for(let i = 0; i < req.bindings.training.weights.length; ++i) {
        if(gridfsId === null || (epoch <= req.bindings.training.weights[i].epoch && batch <= req.bindings.training.weights[i].batch)) {
            gridfsId = req.bindings.training.weights[i].model_gridfs;
        }
    }

    let conn = mongoose.connection;
    let mongoDriver = mongoose.mongo;
    let gfs = Grid(conn.db, mongoDriver);

    const readStream = gfs.createReadStream({ _id: gridfsId });
    readStream.on('error', function (err: any) {
        console.log('An error occurred!', err);
        res.status(500).send(err);
    });

    readStream.pipe(res);
}