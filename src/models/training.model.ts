import mongoose, { Schema, Document } from "mongoose";
import { IJob } from "models/job.model";
const Grid = require('../services/gridfs-stream/index');


export interface ITraining extends Document {
    name: string,
    status: string,
    job: Schema.Types.ObjectId | IJob,
    log: string,
    curr_epoch: number,
    curr_batch: number,
    max_epochs: number,
    max_batches_per_epoch: number,
    keras_model: object,
    metrics: {
        training: {},
        validation: {},
        test: {},
    },
    weights: [{
        model_gridfs: Schema.Types.ObjectId,
        epoch: number,
        batch: number,
    }],
    updatedAt: mongoose.Schema.Types.Date,
    createdAt: mongoose.Schema.Types.Date,
}

const trainingSchema = new Schema({
    name: {type: String, required: true},
    // Status: -1: in setup, 100: training running, 1: training finished
    status: {type: Number, default: -1},
    job: {type: Schema.Types.ObjectId, ref: 'job'},
    log: {type: String},
    curr_epoch: {type: Number, default: -1},
    curr_batch: {type: Number, default: -1},
    max_epochs: {type: Number},
    max_batches_per_epoch: {type: Number},
    keras_model: {type: Object},
    metrics: {
        training: {},
        validation: {},
        test: {},
    },
    weights: [{
        model_gridfs: {type: Schema.Types.ObjectId, required: true},
        epoch: {type: Number, required: true},
        batch: {type: Number, required: true},
    }]
},
{
    timestamps: true
});

trainingSchema.pre<ITraining>('remove', function(next) {
    let conn = mongoose.connection;
    let mongoDriver = mongoose.mongo;
    let gfs = Grid(conn.db, mongoDriver);

    this.weights.forEach( weight => {
        const gridfsId = weight.model_gridfs;
        gfs.remove({ _id: gridfsId });
    });
    next();
});


export const Training = mongoose.model<ITraining>("training", trainingSchema);