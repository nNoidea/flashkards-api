import supertest from "supertest";
import createServer from "../../src/createServer";
import Koa from "koa";
import testData from "../testdata";
import textCodes from "../../src/core/textCodes";
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

describe("/folder", () => {
    it("GET - We should get all the public folders in the DB", async () => {
        const response = await request.get("/api/folder");

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(2);
        expect(response.body[0].name).toBe("French");
        expect(response.body[1].name).toBe("physics");
    });
    describe("/:id", () => {
        it("GET - We should get the public folder with the given folderID.", async () => {
            const allFolders = await request.get("/api/folder");
            let folderID = allFolders.body[0].id;

            const singleFolder = await request.get(`/api/folder/${folderID}`);

            expect(singleFolder.status).toBe(200);
            expect(singleFolder.body.length).toBe(1);
            expect(singleFolder.body[0].name).toBe("French");
        });
        it("GET - We should not be able to access Solomon's private folder over the public router.", async () => {
            // get Solomon's private folder
            const response = await request.get("/api/user/folder").set({
                Authorization: `Bearer ${jwts[0]}`, // Solomon's jwt
            });

            let folderID = response.body[0].id;

            // try to get Solomon's private folder over the public router
            const singleFolder = await request.get(`/api/folder/${folderID}`);

            expect(singleFolder.status).toBe(404);
            expect(singleFolder.text).toBe(textCodes.NOFOLDERFOUND);
        });
        describe("/card", () => {
            it("GET - We should get all the public cards in the DB", async () => {
                const allFolders = await request.get("/api/folder");
                let folderID = allFolders.body[0].id;

                const response = await request.get(`/api/folder/${folderID}/card`);

                expect(response.status).toBe(200);
                expect(response.body.length).toBe(3);
                expect(response.body[0].front).toBe("Le soleil");
                expect(response.body[1].front).toBe("La Lune");
                expect(response.body[2].front).toBe("Les étoiles");
            });
            it("GET - We should not be able to access Solomon's private folder cards over the public router.", async () => {
                // get Solomon's private folder
                const response = await request.get("/api/user/folder").set({
                    Authorization: `Bearer ${jwts[0]}`, // Solomon's jwt
                });

                let folderID = response.body[0].id;

                // try to get Solomon's private folder over the public router
                const singleFolder = await request.get(`/api/folder/${folderID}/card`);

                expect(singleFolder.status).toBe(404);
                expect(singleFolder.text).toBe(textCodes.NOFOLDERFOUND);
            });
            describe("/:cardID", () => {
                it("GET - We should get the public card with the given cardID", async () => {
                    const allFolders = await request.get("/api/folder");
                    let folderID = allFolders.body[0].id;

                    const allCards = await request.get(`/api/folder/${folderID}/card`);
                    let cardID = allCards.body[0].id;

                    const singleCard = await request.get(`/api/folder/${folderID}/card/${cardID}`);

                    expect(singleCard.status).toBe(200);
                    expect(singleCard.body.length).toBe(1);
                    expect(singleCard.body[0].front).toBe("Le soleil");
                });
                describe("/score", () => {
                    it("GET - We should get the score of the given card with So Mi's jwt, she has a score for this public folder.", async () => {
                        const allFolders = await request.get("/api/folder");
                        let folderID = allFolders.body[1].id;

                        const allCards = await request.get(`/api/folder/${folderID}/card`);
                        let cardID = allCards.body[0].id;

                        const score = await request.get(`/api/folder/${folderID}/card/${cardID}/score`).set({
                            Authorization: `Bearer ${jwts[2]}`,
                        });

                        expect(score.status).toBe(200);
                        expect(score.body).toBe(6);
                    });
                    it("GET - We shouldn't get the score of the given card with Solomon's jwt", async () => {
                        const allFolders = await request.get("/api/folder");
                        let folderID = allFolders.body[1].id;

                        const allCards = await request.get(`/api/folder/${folderID}/card`);
                        let cardID = allCards.body[0].id;

                        const score = await request.get(`/api/folder/${folderID}/card/${cardID}/score`).set({
                            Authorization: `Bearer ${jwts[0]}`, // Solomon's jwt
                        });

                        expect(score.status).toBe(404);
                        expect(score.text).toBe(textCodes.NOSCOREFOUND);
                    });

                    describe("/create", () => {
                        it("POST - We should create a score for the given card with Solomon's jwt", async () => {
                            const allFolders = await request.get("/api/folder");
                            let folderID = allFolders.body[1].id;

                            const allCards = await request.get(`/api/folder/${folderID}/card`);
                            let cardID = allCards.body[0].id;

                            const scoreCreate = await request
                                .post(`/api/folder/${folderID}/card/${cardID}/score/create`)
                                .set({
                                    Authorization: `Bearer ${jwts[0]}`,
                                })
                                .send({ score: 654321 });

                            expect(scoreCreate.status).toBe(200);
                            expect(scoreCreate.body.message).toBe(textCodes.SCORECREATED);

                            const score2 = await request.get(`/api/folder/${folderID}/card/${cardID}/score`).set({
                                Authorization: `Bearer ${jwts[0]}`,
                            });

                            expect(score2.status).toBe(200);
                            expect(score2.body).toBe(654321);
                        });
                        it("POST - We shouldn't create a score for the given card with So Mi's jwt, she already has a score for this public folder.", async () => {
                            const allFolders = await request.get("/api/folder");
                            let folderID = allFolders.body[1].id;

                            const allCards = await request.get(`/api/folder/${folderID}/card`);
                            let cardID = allCards.body[0].id;

                            const score = await request.get(`/api/folder/${folderID}/card/${cardID}/score`).set({
                                Authorization: `Bearer ${jwts[2]}`,
                            });

                            expect(score.status).toBe(200);
                            expect(score.body).toBe(6);

                            const scoreCreate = await request
                                .post(`/api/folder/${folderID}/card/${cardID}/score/create`)
                                .set({
                                    Authorization: `Bearer ${jwts[2]}`,
                                })
                                .send({ score: 10 });

                            expect(scoreCreate.status).toBe(405);
                            expect(scoreCreate.text).toBe(textCodes.SCOREALREADYEXISTS);
                        });
                    });

                    describe("/update", () => {
                        it("PUT - We should update the score of the given card with So Mi's jwt, she has a score for this public folder.", async () => {
                            const allFolders = await request.get("/api/folder");
                            let folderID = allFolders.body[1].id;

                            const allCards = await request.get(`/api/folder/${folderID}/card`);
                            let cardID = allCards.body[0].id;

                            const score = await request.get(`/api/folder/${folderID}/card/${cardID}/score`).set({
                                Authorization: `Bearer ${jwts[2]}`,
                            });

                            expect(score.status).toBe(200);
                            expect(score.body).toBe(6);

                            const scoreCreate = await request
                                .put(`/api/folder/${folderID}/card/${cardID}/score/update`)
                                .set({
                                    Authorization: `Bearer ${jwts[2]}`,
                                })
                                .send({ score: 10 });

                            expect(scoreCreate.status).toBe(200);
                            expect(scoreCreate.body.message).toBe(textCodes.SCOREUPDATED);
                        });
                        it("PUT - We shouldn't update the score of the given card with Solomon's jwt", async () => {
                            const allFolders = await request.get("/api/folder");
                            let folderID = allFolders.body[1].id;

                            const allCards = await request.get(`/api/folder/${folderID}/card`);
                            let cardID = allCards.body[0].id;

                            const score = await request
                                .put(`/api/folder/${folderID}/card/${cardID}/score/update`)
                                .set({
                                    Authorization: `Bearer ${jwts[0]}`, // Solomon's jwt
                                })
                                .send({ score: 10 });

                            expect(score.status).toBe(404);
                            expect(score.text).toBe(textCodes.NOSCOREFOUND);
                        });
                        describe("/delete", () => {
                            it("DELETE - We should delete the score of the given card with So Mi's jwt, she has a score for this public folder.", async () => {
                                const allFolders = await request.get("/api/folder");
                                let folderID = allFolders.body[1].id;

                                const allCards = await request.get(`/api/folder/${folderID}/card`);
                                let cardID = allCards.body[0].id;

                                const score = await request.get(`/api/folder/${folderID}/card/${cardID}/score`).set({
                                    Authorization: `Bearer ${jwts[2]}`,
                                });

                                expect(score.status).toBe(200);
                                expect(score.body).toBe(6);

                                const scoreCreate = await request.delete(`/api/folder/${folderID}/card/${cardID}/score/delete`).set({
                                    Authorization: `Bearer ${jwts[2]}`,
                                });

                                expect(scoreCreate.status).toBe(200);
                                expect(scoreCreate.body.message).toBe(textCodes.SCOREDELETED);
                            });
                            it("DELETE - We shouldn't delete the score of the given card with Solomon's jwt", async () => {
                                const allFolders = await request.get("/api/folder");
                                let folderID = allFolders.body[1].id;

                                const allCards = await request.get(`/api/folder/${folderID}/card`);
                                let cardID = allCards.body[0].id;

                                const score = await request.delete(`/api/folder/${folderID}/card/${cardID}/score/delete`).set({
                                    Authorization: `Bearer ${jwts[0]}`, // Solomon's jwt
                                });

                                expect(score.status).toBe(404);
                                expect(score.text).toBe(textCodes.NOSCOREFOUND);
                            });
                        });
                    });
                });
            });
        });
    });
});
