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

describe("/folder", () => {
    it("GET - We should get 2 folder for Solomon.", async () => {
        const response = await request.get("/api/user/folder").set({
            Authorization: `Bearer ${jwts[0]}`,
        });

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(2);
        expect(response.body[0].name).toBe("Math");
        expect(response.body[1].name).toBe("Math 2");
    });

    describe("/create", () => {
        it("POST - Should create a folder for Solomon.", async () => {
            let jwt = jwts[0]; // Solomon Reed's JWT

            const allFoldersResponse = await request.get("/api/user/folder").set({
                Authorization: `Bearer ${jwt}`,
            });

            expect(allFoldersResponse.body.length).toBe(2);
            expect(allFoldersResponse.status).toBe(200);

            const creationResponse = await request
                .post("/api/user/folder/create")
                .set({
                    Authorization: `Bearer ${jwt}`,
                })
                .send({
                    name: "English",
                    public_boolean: 0,
                });

            expect(creationResponse.status).toBe(201);
            expect(creationResponse.body.message).toBe(textCodes.FOLDERCREATED);

            const allFoldersResponse2 = await request.get("/api/user/folder").set({
                Authorization: `Bearer ${jwt}`,
            });

            expect(allFoldersResponse2.body.length).toBe(3);
            expect(allFoldersResponse2.status).toBe(200);
            expect(allFoldersResponse2.body[2].name).toBe("English");
        });
    });

    describe("/:id", () => {
        describe("/delete", () => {
            it("DELETE - Should fail due to trying to delete someone else's folder.", async () => {
                let solomonJWT = jwts[0]; // Solomon Reed's JWT
                let soJWT = jwts[2]; // So Mi's JWT

                const allFoldersResponse = await request.get("/api/user/folder").set({
                    Authorization: `Bearer ${soJWT}`,
                });

                expect(allFoldersResponse.body.length).toBe(1);
                expect(allFoldersResponse.status).toBe(200);
                expect(allFoldersResponse.body[0].name).toBe("physics");

                let folder_id = allFoldersResponse.body[0].id;

                const deletionResponse = await request.delete(`/api/user/folder/${folder_id}/delete`).set({
                    Authorization: `Bearer ${solomonJWT}`,
                });

                expect(deletionResponse.status).toBe(404);
                expect(deletionResponse.text).toBe(textCodes.NOFOLDERFOUND);

                const allFolder2Response = await request.get("/api/user/folder").set({
                    Authorization: `Bearer ${soJWT}`,
                });
                expect(allFolder2Response.body.length).toBe(1);
                expect(allFolder2Response.status).toBe(200);
                expect(allFolder2Response.body[0].name).toBe("physics");
            });

            it("DELETE - Should delete a folder for So Mi", async () => {
                let jwt = jwts[2]; // So Mi's JWT

                const allFoldersResponse = await request.get("/api/user/folder").set({
                    Authorization: `Bearer ${jwt}`,
                });

                expect(allFoldersResponse.body.length).toBe(1);
                expect(allFoldersResponse.status).toBe(200);
                expect(allFoldersResponse.body[0].name).toBe("physics");

                let folder_id = allFoldersResponse.body[0].id;

                const deletionResponse = await request.delete(`/api/user/folder/${folder_id}/delete`).set({
                    Authorization: `Bearer ${jwt}`,
                });

                expect(deletionResponse.status).toBe(200);
                expect(deletionResponse.body.message).toBe(textCodes.FOLDERDELETED);

                const allFolder2Response = await request.get("/api/user/folder").set({
                    Authorization: `Bearer ${jwt}`,
                });

                expect(allFolder2Response.status).toBe(404);
                expect(allFolder2Response.text).toBe(errorCodes.NOFOLDERFOUND);
            });
        });
        it("GET - Should get the first folder for Solomon named Math", async () => {
            const response = await request.get("/api/user/folder").set({
                Authorization: `Bearer ${jwts[0]}`,
            });
            let folder_id = response.body[0].id;

            const response2 = await request.get(`/api/user/folder/${folder_id}`).set({
                Authorization: `Bearer ${jwts[0]}`,
            });

            expect(response2.status).toBe(200);
            expect(typeof response2.body).toBe("object");
            expect(response2.body instanceof Array).toBe(false);
            expect(response2.body.name).toBe("Math");
        });
        it("GET - We should fail trying to access Rosalind's folders with Solomon's jwt", async () => {
            let solomonJWT = jwts[0]; // Solomon Reed's JWT
            let rosalindJWT = jwts[1]; // Rosalind Myers' JWT

            const rosalindResponse = await request.get("/api/user/folder").set({
                Authorization: `Bearer ${rosalindJWT}`,
            });
            let rosalindFolderID = rosalindResponse.body[0].id;

            const response2 = await request.get(`/api/user/folder/${rosalindFolderID}`).set({
                Authorization: `Bearer ${solomonJWT}`,
            });

            expect(response2.status).toBe(404);
            expect(response2.text).toBe(errorCodes.NOFOLDERFOUND);
        });

        describe("/update", () => {
            it("PUT - Should update the first folder for Solomon named Math to Algebra", async () => {
                let jwt = jwts[0]; // Solomon Reed's JWT

                const response = await request.get("/api/user/folder").set({
                    Authorization: `Bearer ${jwt}`,
                });
                let folder_id = response.body[0].id;
                expect(response.body[0].name).toBe("Math");
                expect(response.body[0].public_boolean).toBe(0);

                const response2 = await request
                    .put(`/api/user/folder/${folder_id}/update`)
                    .set({
                        Authorization: `Bearer ${jwt}`,
                    })
                    .send({
                        name: "Algebra",
                    });

                expect(response2.status).toBe(200);
                expect(response2.body.message).toBe(textCodes.FOLDERUPDATED);

                const response3 = await request.get(`/api/user/folder/${folder_id}`).set({
                    Authorization: `Bearer ${jwt}`,
                });

                expect(response3.status).toBe(200);
                expect(response3.body.name).toBe("Algebra");
            });
            it("PUT - Should update the first folder for Solomon named Math to Algebra and public_boolean to 1", async () => {
                let jwt = jwts[0]; // Solomon Reed's JWT

                const response = await request.get("/api/user/folder").set({
                    Authorization: `Bearer ${jwt}`,
                });
                let folder_id = response.body[0].id;

                expect(response.body[0].name).toBe("Math");
                expect(response.body[0].public_boolean).toBe(0);

                const response2 = await request
                    .put(`/api/user/folder/${folder_id}/update`)
                    .set({
                        Authorization: `Bearer ${jwt}`,
                    })
                    .send({
                        name: "Algebra",
                        public_boolean: 1,
                    });

                expect(response2.status).toBe(200);
                expect(response2.body.message).toBe(textCodes.FOLDERUPDATED);

                const response3 = await request.get(`/api/user/folder/${folder_id}`).set({
                    Authorization: `Bearer ${jwt}`,
                });

                expect(response3.status).toBe(200);
                expect(response3.body.name).toBe("Algebra");
                expect(response3.body.public_boolean).toBe(1);
            });
            it("PUT - Should fail due to trying to update someone else's folder.", async () => {
                let solomonJWT = jwts[0]; // Solomon Reed's JWT
                let rosalindJWT = jwts[1]; // Rosalind Myers' JWT

                const rosalindResponse = await request.get("/api/user/folder").set({
                    Authorization: `Bearer ${rosalindJWT}`, // Rosalind Myers
                });
                let rosalindFolderID = rosalindResponse.body[0].id;

                const response2 = await request
                    .put(`/api/user/folder/${rosalindFolderID}/update`)
                    .set({
                        Authorization: `Bearer ${solomonJWT}`, // Solomon Reed
                    })
                    .send({
                        name: "Algebra",
                    });

                expect(response2.status).toBe(404);
                expect(response2.text).toBe(errorCodes.NOFOLDERFOUND);

                const rosalindResponse2 = await request.get(`/api/user/folder/${rosalindFolderID}`).set({
                    Authorization: `Bearer ${rosalindJWT}`, // Rosalind Myers
                });

                expect(rosalindResponse2.status).toBe(200);
                expect(rosalindResponse2.body.name).toBe("French");
            });
        });
    });
});
