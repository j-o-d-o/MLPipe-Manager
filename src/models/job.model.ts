import mongoose, { Schema, Document } from "mongoose";
import { IUser } from "models/user.model";
import { ITraining } from "models/training.model";
import { IKey } from "models/key.model";


export interface IJob extends Document {
    name: string,
    description: string,
    creator: Schema.Types.ObjectId | IUser,
    token: string,
    // 0: Local, 1: Remote
    type: number,
    // For now there is a 1:1 relationship implemented for trainings and jobs
    // But for future purposes this is implemented as an array
    // trainings is not filled by default, only on getJob endpoint
    trainings: Array<Schema.Types.ObjectId | ITraining>,

    // This fields are only used if type = 1 (Remote)
    remote_details : {
        aws_spot_request_id: string,
        aws_instance_id: string,
        exec_path: string,
        config_path: string,
        api_url: string,
        key: Schema.Types.ObjectId | IKey,
        user_name: string,
        server_ip: string,
        ssh_port: number,
        conda_env: string,
    },

    // Fields needed to show user how the setup process is going
    in_error: boolean,
    is_finished: boolean, // is true if setup is done ( or if in error )
    setup_log: string[],
    updatedAt: mongoose.Schema.Types.Date,
    createdAt: mongoose.Schema.Types.Date,

    isCreatedBy: (userId: Schema.Types.ObjectId) => boolean,
    hasTraining: (trainingId: Schema.Types.ObjectId) => boolean,
}

const jobSchema = new Schema({
    name: {type: String, required: true},
    description: {type: String, default: ""},
    creator: {type: Schema.Types.ObjectId, ref: 'user', required: true},
    token: {type: String, unique: true, required: true, select: false},
    type: {type: Number, required: true},
    trainings: [{type: Schema.Types.ObjectId, ref: 'training'}],
    remote_details : {
        aws_spot_request_id: {type: String, default: null},
        aws_instance_id: {type: String, default: null},
        exec_path: {type: String, default: null},
        config_path: {type: String, default: null},
        api_url: {type: String, default: null},
        key: {type: Schema.Types.ObjectId, ref: 'keystore', default: null},
        user_name: {type: String, default: null},
        server_ip: {type: String, default: null},
        ssh_port: {type: Number, default: null},
        conda_env: {type: String, default: null},
    },
    in_error: {type: Boolean, default: false},
    is_finished: {type: Boolean, default: false},
    setup_log: [{type: String, default: null}],
},
{
    timestamps: true
});

jobSchema.methods.isCreatedBy = function(userId: Schema.Types.ObjectId) {
    return this.creator == userId;
}

jobSchema.methods.hasTraining = function(trainingId: mongoose.Types.ObjectId) {
    let found = false;
    this.trainings.forEach( (element: mongoose.Types.ObjectId) => {
        if(trainingId.equals(element))
            found = true;
    });
    return found;
}


export const Job = mongoose.model<IJob>("job", jobSchema);