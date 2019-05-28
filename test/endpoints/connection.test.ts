process.env.NODE_ENV = "test";

import { describe, it } from "mocha";
import chai from "chai";
import chaiHttp from "chai-http";
import app from "../../src/server";

chai.should();
chai.use(chaiHttp);


describe('Connection Test', () => {
    describe('/test', () => {
        it('reaching the api', async () => {
            const res = await chai.request(app).get(process.env.API_PREFIX + '/test');
            res.should.have.status(200);
        });
    });
});