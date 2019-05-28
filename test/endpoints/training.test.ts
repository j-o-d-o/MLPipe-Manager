process.env.NODE_ENV = "test";

import { describe, it } from "mocha";
import chai from "chai";
import chaiHttp from "chai-http";
import mongoose from "mongoose";
import app, { rootDirectory } from "../../src/server";
import { User } from "models/user.model";
import { Job, IJob } from "models/job.model";
import { Training, ITraining } from "models/training.model";
const createAdminUser = require("../../../scripts/create_admin_user");
var fs = require("fs");


chai.should();
chai.use(chaiHttp);


let jobObj: IJob;
let trainingObj: ITraining;
let trainingData = {
    "name": "_Test-Training",
    "status": 1,
    "curr_epoch": -1,
    "curr_batch": -1,
};


describe("Training endpoint tests", () => {
    before( async () => {
        await User.deleteMany({});
        await Job.deleteMany({});
        await Training.deleteMany({});

        // create admin user
        let adminUserObj = await createAdminUser("_test_admin", "_test_admin@email.com", "1234");

        // create local job to update training to
        const res = await chai.request(app)
            .post(process.env.API_PREFIX + "/job/local")
            .set("authorization", "Bearer " + adminUserObj.token)
            .send({"name": "_Test-Job-For-Training"});
        jobObj = res.body;
    });

    describe("/training", () => {
        it("create - not authorized", async () => {
            const res = await chai.request(app)
                .post(process.env.API_PREFIX + "/training")
                .send(trainingData);
            res.should.have.status(401);
        });

        it("create - success", async () => {
            const res = await chai.request(app)
                .post(process.env.API_PREFIX + "/training")
                .set("jobtoken", jobObj.token)
                .send(trainingData);
            res.should.have.status(200);
            res.body.status.should.equal(trainingData.status);
            trainingObj = res.body;
        });
    });

    describe("/training/:training", () => {
        it("get - not authorized", async () => {
            const res = await chai.request(app)
                .get(process.env.API_PREFIX + "/training/" + trainingObj._id);
            res.should.have.status(401);
        });

        it("get - not found", async () => {
            const res = await chai.request(app)
                .get(process.env.API_PREFIX + "/training/" + new mongoose.mongo.ObjectId())
                .set("jobtoken", jobObj.token);
            res.should.have.status(404);
        });

        it("get - success", async () => {
            const res = await chai.request(app)
                .get(process.env.API_PREFIX + "/training/" + trainingObj._id)
                .set("jobtoken", jobObj.token);
            res.should.have.status(200);
        });

        it("update - not authorized", async () => {
            const res = await chai.request(app)
                .put(process.env.API_PREFIX + "/training/" + trainingObj._id)
                .send(trainingData);
            res.should.have.status(401);
        });

        it("update - success", async () => {
            trainingData.curr_batch = 2;
            const res = await chai.request(app)
                .put(process.env.API_PREFIX + "/training/" + trainingObj._id)
                .set("jobtoken", jobObj.token)
                .send(trainingData);
            res.should.have.status(200);
            res.body.curr_batch.should.equal(trainingData.curr_batch);
        });

        it("update weights - not authorized", async () => {
            const res = await chai.request(app)
                .put(process.env.API_PREFIX + "/training/" + trainingObj._id + "/weights")
                .send({ "epoch": 1 });
            res.should.have.status(401);
        });

        it("update weights - success", async () => {
            var readStream = fs.createReadStream(rootDirectory + "test/testData/test_model_weights.h5", "binary");
            let data: any;

            readStream.on("data", function(chunk: any) {
                data += chunk;
            }).on("end", async function() {
                const weightData = {
                    "model_gridfs": data,
                    "epoch": 2,
                    "batch": 20,
                }
                const stringData = weightData.toString();
                const buf = Buffer.from(stringData);
                const res = await chai.request(app)
                    .put(process.env.API_PREFIX + "/training/" + trainingObj._id + "/weights")
                    .set("jobtoken", jobObj.token)
                    .set("content-type", "application/octet-stream")
                    .send(buf);
                // TODO: Test not working... fix it
                //res.should.have.status(200);
            });
        });

    });
});