import supertest from "supertest";
import createServer from "../../src/createServer";
import Koa from "koa";
import errorCodes from "../../src/core/textCodes";
import textCodes from "../../src/core/textCodes";
import testData from "../testdata";
// TEST DATA

// TESTS
let jwts: string[] = [];
let server: { getKoa: () => Koa; start: () => Promise<void>; stop: () => Promise<void> };
let request: supertest.SuperTest<supertest.Test>;
let test_data: { createTestData: () => Promise<void>; deleteTestData: () => Promise<void>; getJWTs: () => string[] };

beforeAll(async () => {
    server = await createServer();
    request = supertest(server.getKoa().callback()); // www.example.com{request} -> www.example.com/api/user/folder
});

beforeEach(async () => {
    test_data = await testData();
    await test_data.createTestData();
    jwts = test_data.getJWTs();
});

afterEach(async () => {
    await test_data.deleteTestData();
});

afterAll(async () => {
    await server.stop();
});

describe("/score", () => {
    it("GET - Should return a single card score for Solomon", async () => {
        let jwt = jwts[0]; // Solomon Reed's JWT

        const response = await request.get("/api/user/folder").set({
            Authorization: `Bearer ${jwt}`,
        });
        let folder_id = response.body[0].id;

        const response2 = await request.get(`/api/user/folder/${folder_id}/card`).set({
            Authorization: `Bearer ${jwt}`,
        });
        let card_id = response2.body[0].id;

        const response3 = await request.get(`/api/user/folder/${folder_id}/card/${card_id}/score`).set({
            Authorization: `Bearer ${jwt}`,
        });

        expect(response3.status).toBe(200);
        expect(response3.body).toBe(99);
    });
    it("GET - Should fail due to Solomon trying to access Rosalind's card while using a correct folder id.", async () => {
        let solomonJWT = jwts[0]; // Solomon Reed's JWT
        let rosalindJWT = jwts[1]; // Rosalind Myers' JWT

        // Solomon Reed
        const solomon = await request.get("/api/user/folder").set({
            Authorization: `Bearer ${solomonJWT}`,
        });
        let solomonFolderID = solomon.body[0].id;

        // Rosalind Myers
        const rosalind = await request.get("/api/user/folder").set({
            Authorization: `Bearer ${rosalindJWT}`, // Rosalind Myers
        });
        let rosalindFolderID = rosalind.body[0].id; // Rosalind Myers

        const rosalind2 = await request.get(`/api/user/folder/${rosalindFolderID}/card`).set({
            Authorization: `Bearer ${rosalindJWT}`, // Rosalind Myers
        });
        let rosalindCardID = rosalind2.body[0].id; // Rosalind Myers

        // Solomon Reed trying to access Rosalind's card.
        const response3 = await request.get(`/api/user/folder/${solomonFolderID}/card/${rosalindCardID}/score`).set({
            Authorization: `Bearer ${solomonJWT}`, // Solomon Reed
        });

        expect(response3.status).toBe(404);
        expect(response3.text).toBe(errorCodes.NOCARDFOUND); // We are filtering through Solomon's cards, so we should get a 404 and not 403.
    });

    describe("/create", () => {
        it("POST - Should create a score for So Mi", async () => {
            let jwt = jwts[2]; //  So Mi's JWT

            const response = await request.get("/api/user/folder").set({
                Authorization: `Bearer ${jwt}`,
            });
            let folder_id = response.body[0].id;

            const response2 = await request.get(`/api/user/folder/${folder_id}/card`).set({
                Authorization: `Bearer ${jwt}`,
            });
            let card_id = response2.body[2].id;

            const creationResponse = await request
                .post(`/api/user/folder/${folder_id}/card/${card_id}/score/create`)
                .set({
                    Authorization: `Bearer ${jwt}`,
                })
                .send({
                    score: 123456789,
                });

            expect(creationResponse.status).toBe(201);
            expect(creationResponse.body.message).toBe(textCodes.SCORECREATED);

            const response4 = await request.get(`/api/user/folder/${folder_id}/card/${card_id}/score`).set({
                Authorization: `Bearer ${jwt}`,
            });

            expect(response4.status).toBe(200);
            expect(response4.body).toBe(123456789);
        });
        it("POST - Should fail due to trying to create a score for someone else's card.", async () => {
            let solomonJWT = jwts[0]; // Solomon Reed's JWT
            let rosalindJWT = jwts[1]; // Rosalind Myers' JWT

            // Solomon Reed
            const solomon = await request.get("/api/user/folder").set({
                Authorization: `Bearer ${solomonJWT}`,
            });
            let solomonFolderID = solomon.body[0].id;

            // Rosalind Myers
            const rosalind = await request.get("/api/user/folder").set({
                Authorization: `Bearer ${rosalindJWT}`, // Rosalind Myers
            });
            let rosalindFolderID = rosalind.body[0].id; // Rosalind Myers

            const rosalind2 = await request.get(`/api/user/folder/${rosalindFolderID}/card`).set({
                Authorization: `Bearer ${rosalindJWT}`, // Rosalind Myers
            });
            let rosalindCardID = rosalind2.body[0].id; // Rosalind Myers

            // Solomon Reed trying to access Rosalind's card.
            const response3 = await request
                .post(`/api/user/folder/${solomonFolderID}/card/${rosalindCardID}/score/create`)
                .set({
                    Authorization: `Bearer ${solomonJWT}`, // Solomon Reed
                })
                .send({
                    score: 100,
                });

            expect(response3.status).toBe(404);
            expect(response3.text).toBe(errorCodes.NOCARDFOUND); // We are filtering through Solomon's cards, so we should get a 404 and not 403.
        });

        it("POST - Should fail due to trying to create a score for a card that already has a score.", async () => {
            let jwt = jwts[0]; // Solomon Reed's JWT

            const response = await request.get("/api/user/folder").set({
                Authorization: `Bearer ${jwt}`,
            });
            let folder_id = response.body[0].id;

            const response2 = await request.get(`/api/user/folder/${folder_id}/card`).set({
                Authorization: `Bearer ${jwt}`,
            });
            let card_id = response2.body[0].id;

            const creationResponse = await request
                .post(`/api/user/folder/${folder_id}/card/${card_id}/score/create`)
                .set({
                    Authorization: `Bearer ${jwt}`,
                })
                .send({
                    score: 123456789,
                });

            expect(creationResponse.status).toBe(400);
            expect(creationResponse.text).toBe(errorCodes.SCOREALREADYEXISTS);
        });
    });
    describe("/update", () => {
        it("PUT - Should update a score for So Mi", async () => {
            let jwt = jwts[2]; //  So Mi's JWT

            const response = await request.get("/api/user/folder").set({
                Authorization: `Bearer ${jwt}`,
            });
            let folder_id = response.body[0].id;

            const response2 = await request.get(`/api/user/folder/${folder_id}/card`).set({
                Authorization: `Bearer ${jwt}`,
            });
            let card_id = response2.body[1].id;
            let card_name = response2.body[1].front;

            const response3 = await request.get(`/api/user/folder/${folder_id}/card/${card_id}/score`).set({
                Authorization: `Bearer ${jwt}`,
            });

            expect(response3.status).toBe(200);
            expect(response3.body).toBe(7);

            const creationResponse = await request
                .put(`/api/user/folder/${folder_id}/card/${card_id}/score/update`)
                .set({
                    Authorization: `Bearer ${jwt}`,
                })
                .send({
                    score: 100,
                });

            expect(creationResponse.status).toBe(200);
            expect(creationResponse.body.message).toBe(textCodes.SCOREUPDATED);

            const response4 = await request.get(`/api/user/folder/${folder_id}/card/${card_id}/score`).set({
                Authorization: `Bearer ${jwt}`,
            });

            expect(response4.status).toBe(200);
            expect(response4.body).toBe(100);
        });

        it("PUT - Should fail to update a score for So Mi due to score not existing", async () => {
            let jwt = jwts[2]; //  So Mi's JWT

            const response = await request.get("/api/user/folder").set({
                Authorization: `Bearer ${jwt}`,
            });
            let folder_id = response.body[0].id;

            const response2 = await request.get(`/api/user/folder/${folder_id}/card`).set({
                Authorization: `Bearer ${jwt}`,
            });
            let card_id = response2.body[2].id;

            const creationResponse = await request
                .put(`/api/user/folder/${folder_id}/card/${card_id}/score/update`)
                .set({
                    Authorization: `Bearer ${jwt}`,
                })
                .send({
                    score: 987654321,
                });

            expect(creationResponse.status).toBe(404);
            expect(creationResponse.text).toBe(textCodes.NOCARDFOUND);

            const response4 = await request.get(`/api/user/folder/${folder_id}/card/${card_id}/score`).set({
                Authorization: `Bearer ${jwt}`,
            });

            expect(response4.status).toBe(404);
            expect(response4.text).toBe(textCodes.NOCARDFOUND);
        });
        it("PUT - Should fail due to trying to update a score for someone else's card.", async () => {
            let solomonJWT = jwts[0]; // Solomon Reed's JWT
            let rosalindJWT = jwts[1]; // Rosalind Myers' JWT

            // Solomon Reed
            const solomon = await request.get("/api/user/folder").set({
                Authorization: `Bearer ${solomonJWT}`,
            });
            let solomonFolderID = solomon.body[0].id;

            // Rosalind Myers
            const rosalind = await request.get("/api/user/folder").set({
                Authorization: `Bearer ${rosalindJWT}`, // Rosalind Myers
            });
            let rosalindFolderID = rosalind.body[0].id; // Rosalind Myers

            const rosalind2 = await request.get(`/api/user/folder/${rosalindFolderID}/card`).set({
                Authorization: `Bearer ${rosalindJWT}`, // Rosalind Myers
            });
            let rosalindCardID = rosalind2.body[0].id; // Rosalind Myers

            // Solomon Reed trying to access Rosalind's card.
            const response3 = await request
                .put(`/api/user/folder/${solomonFolderID}/card/${rosalindCardID}/score/update`)
                .set({
                    Authorization: `Bearer ${solomonJWT}`, // Solomon Reed
                })
                .send({
                    score: 100,
                });

            expect(response3.status).toBe(404);
            expect(response3.text).toBe(errorCodes.NOCARDFOUND); // We are filtering through Solomon's cards, so we should get a 404 and not 403.
        });
    });
    describe("/delete", () => {
        it("DELETE - Should delete a score for So Mi", async () => {
            let jwt = jwts[2]; //  So Mi's JWT

            const response = await request.get("/api/user/folder").set({
                Authorization: `Bearer ${jwt}`,
            });
            let folder_id = response.body[0].id;

            const response2 = await request.get(`/api/user/folder/${folder_id}/card`).set({
                Authorization: `Bearer ${jwt}`,
            });
            let card_id = response2.body[0].id;

            const response3 = await request.get(`/api/user/folder/${folder_id}/card/${card_id}/score`).set({
                Authorization: `Bearer ${jwt}`,
            });

            expect(response3.status).toBe(200);
            expect(response3.body).toBe(6);

            const creationResponse = await request.delete(`/api/user/folder/${folder_id}/card/${card_id}/score/delete`).set({
                Authorization: `Bearer ${jwt}`,
            });

            expect(creationResponse.status).toBe(200);
            expect(creationResponse.body.message).toBe(textCodes.SCOREDELETED);

            const response4 = await request.get(`/api/user/folder/${folder_id}/card/${card_id}/score`).set({
                Authorization: `Bearer ${jwt}`,
            });

            expect(response4.status).toBe(404);
            expect(response4.text).toBe(errorCodes.NOCARDFOUND);
        });
        it("DELETE - Should fail due to trying to delete a score for someone else's card.", async () => {
            let solomonJWT = jwts[0]; // Solomon Reed's JWT
            let rosalindJWT = jwts[1]; // Rosalind Myers' JWT

            // Solomon Reed
            const solomon = await request.get("/api/user/folder").set({
                Authorization: `Bearer ${solomonJWT}`,
            });
            let solomonFolderID = solomon.body[0].id;

            // Rosalind Myers
            const rosalind = await request.get("/api/user/folder").set({
                Authorization: `Bearer ${rosalindJWT}`, // Rosalind Myers
            });
            let rosalindFolderID = rosalind.body[0].id; // Rosalind Myers

            const rosalind2 = await request.get(`/api/user/folder/${rosalindFolderID}/card`).set({
                Authorization: `Bearer ${rosalindJWT}`, // Rosalind Myers
            });

            let rosalindCardID = rosalind2.body[0].id; // Rosalind Myers

            // Solomon Reed trying to access Rosalind's card.
            const response3 = await request.delete(`/api/user/folder/${solomonFolderID}/card/${rosalindCardID}/score/delete`).set({
                Authorization: `Bearer ${solomonJWT}`, // Solomon Reed
            });

            expect(response3.status).toBe(404);
            expect(response3.text).toBe(errorCodes.NOCARDFOUND); // We are filtering through Solomon's cards, so we should get a 404 and not 403.

            const response4 = await request.delete(`/api/user/folder/${rosalindFolderID}/card/${rosalindCardID}/score/delete`).set({
                Authorization: `Bearer ${solomonJWT}`, // Solomon Reed
            });
            expect(response4.status).toBe(404);
            expect(response4.text).toBe(errorCodes.NOCARDFOUND); // We are filtering through Solomon's cards, so we should get a 404 and not 403.
        });
    });
});
