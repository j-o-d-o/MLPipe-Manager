process.env.NODE_ENV = "test";

import { describe, it } from "mocha";
import chai from "chai";
import chaiHttp from "chai-http";
import mongoose from "mongoose";
import app from "../../src/server";
import { User, IUser } from "models/user.model";
import { AwsSpotRequest, IAwsSpotRequest } from "models/awsSpotRequest.model";
const createAdminUser = require("../../../scripts/create_admin_user");

chai.should();
chai.use(chaiHttp);


let adminUserObj: IUser;
let awsSpotRequest: IAwsSpotRequest;

const requestConfig = {
    InstanceCount: 1,
    LaunchSpecification: {
        ImageId: "ami-080d9b616b110f759",  // miniconda ami
        InstanceType: "t2.micro",  // small instance
        KeyName: "mlpipe_key",  // has to be added beforehand
        SecurityGroupIds: [
            "sg-0570de247174f8b49"
        ]
    },
    SpotPrice: "0.1", 
    Type: "one-time",
    DryRun: true
}


describe("AWS endpoint tests", () => {
    before( async () => {
        await User.deleteMany({});
        await AwsSpotRequest.deleteMany({});

        // create admin user
        adminUserObj = await createAdminUser("_test_admin", "_test_admin@email.com", "1234");
    }); 

    describe("/server/awsspotrequest", () => {
        it("create - not authorized", async () => {
            const res = await chai.request(app)
                .post(process.env.API_PREFIX + "/server/awsspotrequest")
                .send({aws_config: requestConfig});
            res.should.have.status(401);
        });

        it("create - success", async () => {
            const res = await chai.request(app)
                .post(process.env.API_PREFIX + "/server/awsspotrequest")
                .set("authorization", "Bearer " + adminUserObj.token)
                .send({aws_config: requestConfig});
            res.should.have.status(200);
            awsSpotRequest = res.body;
        });

        it("get - not authorized", async () => {
            const res = await chai.request(app)
                .get(process.env.API_PREFIX + "/server/awsspotrequest");
            res.should.have.status(401);
        });

        it("get - success", async () => {
            const res = await chai.request(app)
                .get(process.env.API_PREFIX + "/server/awsspotrequest")
                .set("authorization", "Bearer " + adminUserObj.token);
            res.should.have.status(200);
        });
    });

    describe("/server/awsspotrequest/:awsspotrequest", () => {
        it("get - not authorized", async () => {
            const res = await chai.request(app)
                .get(process.env.API_PREFIX + "/server/awsspotrequest/" + awsSpotRequest._id);
            res.should.have.status(401);
        });

        it("get - not found", async () => {
            const res = await chai.request(app)
                .get(process.env.API_PREFIX + "/server/awsspotrequest/" + new mongoose.mongo.ObjectId())
                .set("authorization", "Bearer " + adminUserObj.token);
            res.should.have.status(404);
        });

        it("get - success", async () => {
            const res = await chai.request(app)
                .get(process.env.API_PREFIX + "/server/awsspotrequest/" + awsSpotRequest._id)
                .set("authorization", "Bearer " + adminUserObj.token);
            res.should.have.status(200);
        });

        it("delete - not authorized", async () => {
            const res = await chai.request(app)
                .delete(process.env.API_PREFIX + "/server/awsspotrequest/" + awsSpotRequest._id);
            res.should.have.status(401);
        });

        it("delete - success", async () => {
            const res = await chai.request(app)
                .delete(process.env.API_PREFIX + "/server/awsspotrequest/" + awsSpotRequest._id)
                .set("authorization", "Bearer " + adminUserObj.token);
            res.should.have.status(200);
        });
    });
});