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

describe("/card", () => {
    it("GET - Should return all cards for Solomon (3 in total).", async () => {
        let jwt = jwts[0]; // Solomon Reed's JWT

        const response = await request.get("/api/user/folder").set({
            Authorization: `Bearer ${jwt}`,
        });
        let folder_id = response.body[0].id;

        const response2 = await request.get(`/api/user/folder/${folder_id}/card`).set({
            Authorization: `Bearer ${jwt}`,
        });

        expect(response2.status).toBe(200);
        expect(response2.body.length).toBe(3);
        expect(response2.body[0].front).toBe("1+1");
        expect(response2.body[1].front).toBe("1+2");
        expect(response2.body[2].front).toBe("2+2");
    });
    it("GET - Should fail due to not having access to someone else's folder.", async () => {
        let solomonJWT = jwts[0]; // Solomon Reed's JWT
        let rosalindJWT = jwts[1]; // Rosalind Myers' JWT

        const rosalindResponse = await request.get("/api/user/folder").set({
            Authorization: `Bearer ${rosalindJWT}`, // Rosalind Myers
        });
        let rosalindFolderID = rosalindResponse.body[0].id;

        const solomonResponse = await request.get(`/api/user/folder/${rosalindFolderID}/card`).set({
            Authorization: `Bearer ${solomonJWT}`, // Solomon Reed
        });

        expect(solomonResponse.status).toBe(404);
        expect(solomonResponse.text).toBe(errorCodes.NOCARDFOUND);
    });

    describe("/create", () => {
        it("POST - Should create a card for Solomon", async () => {
            let jwt = jwts[0]; // Solomon Reed's JWT

            const response = await request.get("/api/user/folder").set({
                Authorization: `Bearer ${jwt}`,
            });
            let folder_id = response.body[0].id;

            const response2 = await request.get(`/api/user/folder/${folder_id}/card`).set({
                Authorization: `Bearer ${jwt}`,
            });

            expect(response2.status).toBe(200);
            expect(response2.body.length).toBe(3);

            const creationResponse = await request
                .post(`/api/user/folder/${folder_id}/card/create`)
                .set({
                    Authorization: `Bearer ${jwt}`,
                })
                .send({
                    front: "1+3",
                    back: "4",
                });

            expect(creationResponse.status).toBe(201);
            expect(creationResponse.body.message).toBe(textCodes.CARDCREATED);

            const response3 = await request.get(`/api/user/folder/${folder_id}/card`).set({
                Authorization: `Bearer ${jwt}`,
            });

            expect(response3.status).toBe(200);
            expect(response3.body.length).toBe(4);
            expect(response3.body[3].front).toBe("1+3");
            expect(response3.body[3].back).toBe("4");
        });
        it("POST - Should fail due to trying to create a card for someone else's folder.", async () => {
            let solomonJWT = jwts[0]; // Solomon Reed's JWT
            let rosalindJWT = jwts[1]; // Rosalind Myers' JWT

            const rosalindResponse = await request.get("/api/user/folder").set({
                Authorization: `Bearer ${rosalindJWT}`, // Rosalind Myers
            });
            let rosalindFolderID = rosalindResponse.body[0].id;

            const solomonResponse = await request
                .post(`/api/user/folder/${rosalindFolderID}/card/create`)
                .set({
                    Authorization: `Bearer ${solomonJWT}`, // Solomon Reed
                })
                .send({
                    front: "1+3",
                    back: "4",
                });

            expect(solomonResponse.status).toBe(400);
            expect(solomonResponse.text).toBe(errorCodes.INVALIDDATA);
        });
    });

    describe("/:id", () => {
        it("GET - Should return a single card for Solomon", async () => {
            let jwt = jwts[0]; // Solomon Reed's JWT

            const response = await request.get("/api/user/folder").set({
                Authorization: `Bearer ${jwt}`,
            });
            let folder_id = response.body[0].id;

            const response2 = await request.get(`/api/user/folder/${folder_id}/card`).set({
                Authorization: `Bearer ${jwt}`,
            });
            let card_id = response2.body[0].id;

            const response3 = await request.get(`/api/user/folder/${folder_id}/card/${card_id}`).set({
                Authorization: `Bearer ${jwt}`,
            });

            expect(response3.status).toBe(200);
            expect(Object.keys(response3.body)).toStrictEqual(["id", "front", "back", "folder_id"]);
            expect(response3.body.front).toBe("1+1");
        });
        it("GET - Should fail due to Solomon trying to access Rosalind's card while using a correct folder id.", async () => {
            // Solomon Reed
            const solomon = await request.get("/api/user/folder").set({
                Authorization: `Bearer ${jwts[0]}`,
            });
            let solomonFolderID = solomon.body[0].id;

            // Rosalind Myers
            const rosalind = await request.get("/api/user/folder").set({
                Authorization: `Bearer ${jwts[1]}`, // Rosalind Myers
            });
            let rosalindFolderID = rosalind.body[0].id; // Rosalind Myers

            const rosalind2 = await request.get(`/api/user/folder/${rosalindFolderID}/card`).set({
                Authorization: `Bearer ${jwts[1]}`, // Rosalind Myers
            });
            let rosalindCardID = rosalind2.body[0].id; // Rosalind Myers

            // Solomon Reed trying to access Rosalind's card.
            const response3 = await request.get(`/api/user/folder/${solomonFolderID}/card/${rosalindCardID}`).set({
                Authorization: `Bearer ${jwts[0]}`, // Solomon Reed
            });

            expect(response3.status).toBe(404);
            expect(response3.text).toBe(errorCodes.NOCARDFOUND); // We are filtering through Solomon's cards, so we should get a 404 and not 403.
        });

        describe("/update", () => {
            it("PUT - Should update a single card for Solomon", async () => {
                let jwt = jwts[0]; // Solomon Reed's JWT

                const response = await request.get("/api/user/folder").set({
                    Authorization: `Bearer ${jwt}`,
                });
                let folder_id = response.body[0].id;

                const response2 = await request.get(`/api/user/folder/${folder_id}/card`).set({
                    Authorization: `Bearer ${jwt}`,
                });
                let card_id = response2.body[0].id;

                const response3 = await request
                    .put(`/api/user/folder/${folder_id}/card/${card_id}/update`)
                    .set({
                        Authorization: `Bearer ${jwt}`,
                    })
                    .send({
                        front: "987 654",
                        back: "999 999",
                    });

                expect(response3.status).toBe(200);
                expect(response3.body.message).toBe(textCodes.CARDUPDATED);

                const response4 = await request.get(`/api/user/folder/${folder_id}/card/${card_id}`).set({
                    Authorization: `Bearer ${jwt}`,
                });

                expect(response4.status).toBe(200);
                expect(response4.body.front).toBe("987 654");
                expect(response4.body.back).toBe("999 999");
            });
            it("PUT - Should fail due to trying to update someone else's card.", async () => {
                let solomonJWT = jwts[0]; // Solomon Reed's JWT
                let rosalindJWT = jwts[1]; // Rosalind Myers' JWT

                const rosalindFolderResponse = await request.get("/api/user/folder").set({
                    Authorization: `Bearer ${rosalindJWT}`, // Rosalind Myers
                });
                let rosalindFolderID = rosalindFolderResponse.body[0].id;

                const rosalindCardResponse = await request.get(`/api/user/folder/${rosalindFolderID}/card`).set({
                    Authorization: `Bearer ${rosalindJWT}`, // Rosalind Myers
                });
                let rosalindCardID = rosalindCardResponse.body[0].id; // Rosalind Myers

                expect(rosalindCardResponse.status).toBe(200);
                expect(rosalindCardResponse.body.length).toBe(3);
                expect(rosalindCardResponse.body[0].front).toBe("Le soleil");
                expect(rosalindCardResponse.body[1].front).toBe("La Lune");

                // Solomon Reed trying to access Rosalind's card.
                const falseUpdateResponse = await request
                    .put(`/api/user/folder/${rosalindFolderID}/card/${rosalindCardID}/update`)
                    .set({
                        Authorization: `Bearer ${solomonJWT}`, // Solomon Reed
                    })
                    .send({
                        front: "1+2",
                        back: "3",
                    });

                expect(falseUpdateResponse.status).toBe(404);
                expect(falseUpdateResponse.text).toBe(errorCodes.NOCARDFOUND); // We are filtering through Solomon's cards, so we should get a 404 and not 403.

                const rosalindCardResponse2 = await request.get(`/api/user/folder/${rosalindFolderID}/card/${rosalindCardID}`).set({
                    Authorization: `Bearer ${rosalindJWT}`, // Rosalind Myers
                });

                expect(rosalindCardResponse2.status).toBe(200);
                expect(rosalindCardResponse2.body.front).toBe("Le soleil");
                expect(rosalindCardResponse2.body.back).toBe("The sun");
            });
        });

        describe("/delete", () => {
            it("DELETE - Should delete a single card for ", async () => {
                let jwt = jwts[0]; // Solomon Reed's JWT

                const allFoldersResponse = await request.get("/api/user/folder").set({
                    Authorization: `Bearer ${jwt}`,
                });
                let folder_id = allFoldersResponse.body[0].id;

                const allCardsResponse = await request.get(`/api/user/folder/${folder_id}/card`).set({
                    Authorization: `Bearer ${jwt}`,
                });
                let card_id = allCardsResponse.body[0].id;

                const deletionResponse = await request.delete(`/api/user/folder/${folder_id}/card/${card_id}/delete`).set({
                    Authorization: `Bearer ${jwt}`,
                });

                expect(deletionResponse.status).toBe(200);
                expect(deletionResponse.body.message).toBe(textCodes.CARDDELETED);

                const allCardsResponse2 = await request.get(`/api/user/folder/${folder_id}/card`).set({
                    Authorization: `Bearer ${jwt}`,
                });

                expect(allCardsResponse2.status).toBe(200);
                expect(allCardsResponse2.body.length).toBe(2);
            });
            it("DELETE - Should fail due to trying to delete someone else's card.", async () => {
                let solomonJWT = jwts[0]; // Solomon Reed's JWT
                let rosalindJWT = jwts[1]; // Rosalind Myers' JWT

                const rosalindFolderResponse = await request.get("/api/user/folder").set({
                    Authorization: `Bearer ${rosalindJWT}`, // Rosalind Myers
                });
                let rosalindFolderID = rosalindFolderResponse.body[0].id;

                const rosalindCardResponse = await request.get(`/api/user/folder/${rosalindFolderID}/card`).set({
                    Authorization: `Bearer ${rosalindJWT}`, // Rosalind Myers
                });
                let rosalindCardID = rosalindCardResponse.body[0].id; // Rosalind Myers

                // Solomon Reed trying to access Rosalind's card.
                const falseDeletionResponse = await request.delete(`/api/user/folder/${rosalindFolderID}/card/${rosalindCardID}/delete`).set({
                    Authorization: `Bearer ${solomonJWT}`, // Solomon Reed
                });

                expect(falseDeletionResponse.status).toBe(404);
                expect(falseDeletionResponse.text).toBe(errorCodes.NOCARDFOUND); // We are filtering through Solomon's cards, so we should get a 404 and not 403.
            });
        });
    });
});
