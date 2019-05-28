process.env.NODE_ENV = "test";

import { describe, it } from "mocha";
import chai from "chai";
import chaiHttp from "chai-http";
import mongoose from "mongoose";
import app from "../../src/server";
import { User, IUser } from "models/user.model";
import { Job, IJob } from "models/job.model";
const createAdminUser = require("../../../scripts/create_admin_user");

chai.should();
chai.use(chaiHttp);


let adminUserObj: IUser;
let jobObj: IJob;
const jobData = {
    "name": "_Test-Job",
    "descript": "_ test description",
}


describe("Job endpoint tests", () => {
    before( async () => {
        await User.deleteMany({});
        await Job.deleteMany({});

        // create admin user
        adminUserObj = await createAdminUser("_test_admin", "_test_admin@email.com", "1234");
    });

    describe("/job/local", () => {
        it("create - not authorized", async () => {
            const res = await chai.request(app)
                .post(process.env.API_PREFIX + "/job/local")
                .send(jobData);
            res.should.have.status(401);
        });

        it("create - success", async () => {
            const res = await chai.request(app)
                .post(process.env.API_PREFIX + "/job/local")
                .set("authorization", "Bearer " + adminUserObj.token)
                .send(jobData);
            res.should.have.status(200);
            jobObj = res.body;
        });
    });

    describe("/jobs", () => {
        it("get list - not authorized", async () => {
            const res = await chai.request(app)
                .get(process.env.API_PREFIX + "/jobs");
            res.should.have.status(401);
        });

        it("get list - success", async () => {
            const res = await chai.request(app)
                .get(process.env.API_PREFIX + "/jobs")
                .set("authorization", "Bearer " + adminUserObj.token);
            res.should.have.status(200);
        });
    });

    describe("/job/:job/token", () => {
        it("get - not authorized", async () => {
            const res = await chai.request(app)
                .get(process.env.API_PREFIX + "/job/" + jobObj._id + "/token");
            res.should.have.status(401);
        });

        it("get - success", async () => {
            const res = await chai.request(app)
                .get(process.env.API_PREFIX + "/job/" + jobObj._id + "/token")
                .set("authorization", "Bearer " + adminUserObj.token);
            res.should.have.status(200);
        });
    });

    describe("/job/:job", () => {
        it("get - not authorized", async () => {
            const res = await chai.request(app)
                .get(process.env.API_PREFIX + "/job/" + jobObj._id);
            res.should.have.status(401);
        });

        it("get - not found", async () => {
            const res = await chai.request(app)
                .get(process.env.API_PREFIX + "/job/" + new mongoose.mongo.ObjectId())
                .set("authorization", "Bearer " + adminUserObj.token);
            res.should.have.status(404);
        });

        it("get - success", async () => {
            const res = await chai.request(app)
                .get(process.env.API_PREFIX + "/job/" + jobObj._id)
                .set("authorization", "Bearer " + adminUserObj.token);
            res.should.have.status(200);
        });

        it("delete - not authorized", async () => {
            const res = await chai.request(app)
                .delete(process.env.API_PREFIX + "/job/" + jobObj._id);
            res.should.have.status(401);
        });

        it("delete - success", async () => {
            const res = await chai.request(app)
                .delete(process.env.API_PREFIX + "/job/" + jobObj._id)
                .set("authorization", "Bearer " + adminUserObj.token);
            res.should.have.status(200);
        });
    });
});