process.env.NODE_ENV = "test";

import { describe, it } from "mocha";
import chai from "chai";
import chaiHttp from "chai-http";
import mongoose from "mongoose";
import app from "../../src/server";
import { User, IUser } from "models/user.model";
import { Key, IKey } from "models/key.model";
const createAdminUser = require("../../../scripts/create_admin_user");

chai.should();
chai.use(chaiHttp);


let adminUserObj: IUser;
let keyObj: IKey;


describe("key endpoint tests", () => {
    before( async () => {
        await User.deleteMany({});
        await Key.deleteMany({});

        // create admin user
        adminUserObj = await createAdminUser("_test_admin", "_test_admin@email.com", "1234");
    }); 

    describe("/key", () => {
        it("create - not authorized", async () => {
            const res = await chai.request(app)
                .post(process.env.API_PREFIX + "/key")
                .send({name: "_test-key"});
            res.should.have.status(401);
        });

        it("create - success", async () => {
            const res = await chai.request(app)
                .post(process.env.API_PREFIX + "/key")
                .set("authorization", "Bearer " + adminUserObj.token)
                .send({name: "_test-key"});
            res.should.have.status(200);
            keyObj = res.body;
        });
    });

    describe("/keys", () => {
        it("get - not authorized", async () => {
            const res = await chai.request(app)
                .get(process.env.API_PREFIX + "/keys");
            res.should.have.status(401);
        });

        it("get - success", async () => {
            const res = await chai.request(app)
                .get(process.env.API_PREFIX + "/keys")
                .set("authorization", "Bearer " + adminUserObj.token);
            res.should.have.status(200);
        });
    });

    describe("/key/:key", () => {
        it("get - not authorized", async () => {
            const res = await chai.request(app)
                .get(process.env.API_PREFIX + "/key/" + keyObj._id);
            res.should.have.status(401);
        });

        it("get - not found", async () => {
            const res = await chai.request(app)
                .get(process.env.API_PREFIX + "/key/" + new mongoose.mongo.ObjectId())
                .set("authorization", "Bearer " + adminUserObj.token);
            res.should.have.status(404);
        });

        it("get - success", async () => {
            const res = await chai.request(app)
                .get(process.env.API_PREFIX + "/key/" + keyObj._id)
                .set("authorization", "Bearer " + adminUserObj.token);
            res.should.have.status(200);
        });

        it("delete - not authorized", async () => {
            const res = await chai.request(app)
                .delete(process.env.API_PREFIX + "/key/" + keyObj._id);
            res.should.have.status(401);
        });

        it("delete - success", async () => {
            const res = await chai.request(app)
                .delete(process.env.API_PREFIX + "/key/" + keyObj._id)
                .set("authorization", "Bearer " + adminUserObj.token);
            res.should.have.status(200);
        });
    });
});