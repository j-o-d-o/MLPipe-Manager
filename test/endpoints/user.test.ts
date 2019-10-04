process.env.NODE_ENV = "test";

import { describe, it } from "mocha";
import chai from "chai";
import chaiHttp from "chai-http";
import mongoose from "mongoose";
import app from "../../src/server";
import { User, IUser } from "models/user.model";
const createAdminUser = require("../../../scripts/create_admin_user");

chai.should();
chai.use(chaiHttp);


const userData = {
    "name": "_test_user",
    "email": "_test_user@email.com",
    "password": "my_password"
};
let userObj: IUser;
let adminUserObj: IUser;


describe("user endpoint tests", () => {
    before( async () => {
        await User.deleteMany({});

        // create admin user
        adminUserObj = await createAdminUser("_test_admin", "_test_admin@email.com", "1234");
    }); 

    describe("/user/register", () => {
        // Currently only admins can create users
        it("register - not authorized", async () => {
            const res = await chai.request(app)
                .post(process.env.API_PREFIX + "/user/register")
                .send({ user: userData });
            res.should.have.status(401);
        });

        it("register - success", async () => {
            const res = await chai.request(app)
                .post(process.env.API_PREFIX + "/user/register")
                .set("Authorization", "Bearer " + adminUserObj.token)
                .send({ user: userData });
            res.should.have.status(200);
            res.body.should.be.a("object");
            // save body to global userObj
            userObj = res.body;
        });

        it("register - validation error (email already exists)", async () => {
            const res = await chai.request(app)
                .post(process.env.API_PREFIX + "/user/register")
                .set("Authorization", "Bearer " + adminUserObj.token)
                .send({ user: userData });
            res.should.have.status(400);
        });

    });

    describe("/user/login", () => {
        it("login - wrong credentials", async () => {
            const res = await chai.request(app)
                .post(process.env.API_PREFIX + "/user/login")
                .send({
                    email: userData.email,
                    password: "wrong_password!"
                });
            res.should.have.status(400);
        });

        it("login - success", async () => {
            const res = await chai.request(app)
                .post(process.env.API_PREFIX + "/user/login")
                .send({
                    email: userData.email,
                    password: userData.password
                });
            res.should.have.status(200);
            res.body.token.should.equal(userObj.token);
        });
    });

    describe("/user/:user" , () => {
        it("get - not authorized", async () => {
            const res = await chai.request(app)
                .get(process.env.API_PREFIX + "/user/" + userObj._id);
            res.should.have.status(401);
        });

        it("get - not found", async () => {
            const res = await chai.request(app)
                .get(process.env.API_PREFIX + "/user/" + new mongoose.mongo.ObjectId())
                .set("authorization", "Bearer " + userObj.token);
            res.should.have.status(404);
        });

        it("get - success", async () => {
            const res = await chai.request(app)
                .get(process.env.API_PREFIX + "/user/" + userObj._id)
                .set("authorization", "Bearer " + userObj.token)
            res.should.have.status(200);
        });

        it("update - not authorized", async () => {
            const res = await chai.request(app)
                .put(process.env.API_PREFIX + "/user/" + userObj._id)
                .send({ user: userData });
            res.should.have.status(401);
        });

        it("update - success", async () => {
            const updateData = { 
                name: "_test_name_changed",
                default_job_data: {
                    remote_details: {
                        exec_path: "src/train.py",
                    }
                }
            };
            const res = await chai.request(app)
                .put(process.env.API_PREFIX + "/user/" + userObj._id)
                .set("Authorization", "Bearer " + userObj.token)
                .send({ user: updateData });
            res.should.have.status(200);
            res.body.name.should.equal(updateData.name);
            res.body.email.should.equal(userData.email);
            res.body.default_job_data.remote_details.exec_path.should.equal(updateData.default_job_data.remote_details.exec_path);
        });

        it("reset default data - success", async () => {
            const updateData = { 
                default_job_data: {}
            };
            const res = await chai.request(app)
                .put(process.env.API_PREFIX + "/user/" + userObj._id)
                .set("Authorization", "Bearer " + userObj.token)
                .send({ user: updateData });
            res.should.have.status(200);
            res.body.should.not.contain.key("default_job_data");
        });
    });

    describe("/user/:user/changePassword", () => {
        const newPassword = "new_password";

        it("change password - not authorized", async () => {
            const res = await chai.request(app)
                .post(process.env.API_PREFIX + "/user/" + userObj._id + "/changePassword")
                .send({
                    newPassword: newPassword,
                    oldPassword: userData.password
                });
            res.should.have.status(401);
        });

        it("change password - forbidden", async () => {
            // Also admins should not be able to change any user passwords via the API!
            const res = await chai.request(app)
                .post(process.env.API_PREFIX + "/user/" + userObj._id + "/changePassword")
                .set("authorization", "Bearer " + adminUserObj.token)
                .send({
                    newPassword: newPassword,
                    oldPassword: userData.password
                });
            res.should.have.status(403);
        });

        it("change password - success", async () => {
            const res = await chai.request(app)
                .post(process.env.API_PREFIX + "/user/" + userObj._id + "/changePassword")
                .set("authorization", "Bearer " + userObj.token)
                .send({
                    newPassword: newPassword,
                    oldPassword: userData.password
                });
            res.should.have.status(200);
        });

        it("change password - check login with new password", async () => {
            // Login with new password and test if token has changed
            const res = await chai.request(app)
                .post(process.env.API_PREFIX + "/user/login")
                .send({
                    email: userObj.email,
                    password: newPassword
                });
            res.should.have.status(200);
            res.body.token.should.not.equal(userObj.token);
            userObj = res.body;
        });
    });

    describe("/users", () => {
        it("get user list - not authorized", async () => {
            // Login with new password and test if token has changed
            const res = await chai.request(app)
                .get(process.env.API_PREFIX + "/users");
            res.should.have.status(401);
        });

        it("get user list - forbidden", async () => {
            // Login with new password and test if token has changed
            const res = await chai.request(app)
                .get(process.env.API_PREFIX + "/users")
                .set("authorization", "Bearer " + userObj.token);
            res.should.have.status(403);
        });

        it("get user list - success", async () => {
            // Login with new password and test if token has changed
            const res = await chai.request(app)
                .get(process.env.API_PREFIX + "/users")
                .set("authorization", "Bearer " + adminUserObj.token);
            res.should.have.status(200);
        });
    });

    describe("/user/:user/setInactive", () => {
        it("set inactive - not authorized", async () => {
            const res = await chai.request(app)
                .put(process.env.API_PREFIX + "/user/" + userObj._id + "/setInactive");
            res.should.have.status(401);
        });

        it("set inactive - success", async () => {
            const res = await chai.request(app)
                .put(process.env.API_PREFIX + "/user/" + userObj._id + "/setInactive")
                .set("authorization", "Bearer " + userObj.token);
            res.should.have.status(200);
            res.body.should.equal(true);
        });
    });
});