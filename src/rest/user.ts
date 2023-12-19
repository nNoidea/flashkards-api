import { Context } from "koa";
import userService from "../service/user";
import Router from "@koa/router";
import textCodes from "../core/textCodes";
import Joi from "joi";
import validation from "../core/validation";
import parameters from "../core/parameters";
import userIDHandler from "../core/userIDHandler";

const getUser = async (ctx: Context) => {
    ctx.body = await userService.find(userIDHandler.getUserID()!);
    ctx.status = 200;
};

const getFolder = {
    execute: async (ctx: Context) => {
        const { folderID } = parameters.getParams(ctx);

        // if folderID is undefined, return all folders.
        if (folderID === undefined) {
            let allFolders = await userService.findAllFolders(userIDHandler.getUserID()!);
            if (allFolders === null) {
                ctx.throw(404, textCodes.NOFOLDERFOUND);
            }
            ctx.status = 200;
            ctx.body = allFolders;
            return;
        }

        // if folderID is defined, return the folder with the given id.
        let folder = await userService.findSingleFolder(userIDHandler.getUserID()!, folderID);

        if (folder === null) {
            ctx.throw(404, textCodes.NOFOLDERFOUND);
        }

        ctx.body = folder;
    },
    schema: {
        params: Joi.object({
            folderID: Joi.number().optional(),
        }),
    },
};

const getCardsInFolder = {
    execute: async (ctx: Context) => {
        let { cardID, folderID } = parameters.getParams(ctx);

        // if cardID is undefined, return all cards in the folder.
        if (cardID === undefined) {
            let allCards = await userService.findAllCardsInFolder(userIDHandler.getUserID()!, folderID!);

            if (allCards === null) {
                ctx.throw(404, textCodes.NOCARDFOUND);
            }
            ctx.status = 200;
            ctx.body = allCards;
            return;
        }

        // if cardID is defined, return the card with the given id.
        let cards = await userService.findSingleCard(userIDHandler.getUserID()!, folderID!, cardID);

        if (cards === null) {
            ctx.throw(404, textCodes.NOCARDFOUND);
        }
        ctx.body = cards;
    },
    schema: {
        params: Joi.object({
            folderID: Joi.number().required(),
            cardID: Joi.number().optional(),
        }),
    },
};

const updateUser = {
    execute: async (ctx: Context) => {
        const { name, email, password } = ctx.request.body as { name?: string; email?: string; password?: string };

        let response: number | null = null;
        try {
            response = await userService.updateUser(userIDHandler.getUserID()!, { name, email, password });
        } catch (err) {
            ctx.throw(405, textCodes.EMAILALREADYEXISTS);
        }

        if (response === null) {
            ctx.throw(404, textCodes.INVALIDDATA);
        }

        ctx.status = 200;
    },
    schema: {
        body: Joi.object({
            name: Joi.string().optional(),
            email: Joi.string().email().optional(),
            password: Joi.string().optional(),
        }).or("name", "email", "password"),
    },
};

const deleteUser = async (ctx: Context) => {
    let result = await userService.deleteUser(userIDHandler.getUserID()!);

    if (result === 0) {
        ctx.throw(404, textCodes.USERMISSING);
    }
    ctx.status = 200;
    ctx.body = { message: "User deleted" };
};

const deleteFolder = {
    execute: async (ctx: Context) => {
        let { folderID } = parameters.getParams(ctx);

        let result = await userService.deleteFolder(userIDHandler.getUserID()!, folderID!);

        if (result === null) {
            ctx.throw(404, textCodes.NOFOLDERFOUND);
        }

        ctx.status = 200;
        ctx.body = { message: textCodes.FOLDERDELETED };
    },
    schema: {
        params: Joi.object({
            folderID: Joi.number().required(),
        }),
    },
};

const deleteCard = {
    execute: async (ctx: Context) => {
        let { folderID, cardID } = parameters.getParams(ctx);

        let result = await userService.deleteSingleCard(userIDHandler.getUserID()!, folderID!, cardID!);

        if (result === null) {
            ctx.throw(404, textCodes.NOCARDFOUND);
        }

        ctx.status = 200;
        ctx.body = { message: textCodes.CARDDELETED };
    },
    schema: {
        params: Joi.object({
            folderID: Joi.number().required(),
            cardID: Joi.number().required(),
        }),
    },
};

const updateUserFolder = {
    execute: async (ctx: Context) => {
        let { folderID } = parameters.getParams(ctx);
        let { name, public_boolean } = ctx.request.body as { name?: string; public_boolean?: number };

        let result = await userService.updateSingleFolder(userIDHandler.getUserID()!, folderID!, { name, public_boolean });

        if (result === null) {
            ctx.throw(404, textCodes.NOFOLDERFOUND);
        }

        ctx.status = 200;
        ctx.body = { message: textCodes.FOLDERUPDATED };
    },
    schema: {
        params: Joi.object({
            folderID: Joi.number().required(),
        }),
        body: Joi.object({
            name: Joi.string().optional(),
            public_boolean: Joi.number().optional(),
        }).or("name", "public_boolean"),
    },
};

const updateUserCard = {
    execute: async (ctx: Context) => {
        let { folderID, cardID } = parameters.getParams(ctx);
        let { front, back } = ctx.request.body as { front?: string; back?: string };

        let result = await userService.updateSingleCard(userIDHandler.getUserID()!, folderID!, cardID!, { front, back });

        if (result === null) {
            ctx.throw(404, textCodes.NOCARDFOUND);
        }

        ctx.status = 200;
        ctx.body = { message: textCodes.CARDUPDATED };
    },
    schema: {
        params: Joi.object({
            folderID: Joi.number().required(),
            cardID: Joi.number().required(),
        }),
        body: Joi.object({
            front: Joi.string().optional(),
            back: Joi.string().optional(),
        }).or("front", "back"),
    },
};

const createFolder = {
    execute: async (ctx: Context) => {
        const { name, public_boolean } = ctx.request.body as { name: string; public_boolean: number };

        let result = await userService.createSingleFolder(userIDHandler.getUserID()!, { name, public_boolean });

        if (result === null) {
            ctx.throw(400, textCodes.INVALIDDATA);
        }

        ctx.status = 201;
        ctx.body = { message: textCodes.FOLDERCREATED };
    },
    schema: {
        body: Joi.object({
            name: Joi.string().required(),
            public_boolean: Joi.number().required(),
        }),
    },
};

const createCard = {
    execute: async (ctx: Context) => {
        let { folderID } = parameters.getParams(ctx);
        const { front, back } = ctx.request.body as { front?: string; back?: string };

        let result = await userService.createSingleCard(userIDHandler.getUserID()!, folderID!, { front, back });

        if (result === null) {
            ctx.throw(400, textCodes.INVALIDDATA);
        }

        ctx.status = 201;
        ctx.body = { message: textCodes.CARDCREATED };
    },
    schema: {
        params: Joi.object({
            folderID: Joi.number().required(),
        }),
        body: Joi.object({
            front: Joi.string().optional(),
            back: Joi.string().optional(),
        }).or("front", "back"),
    },
};

const getScoreOfCard = {
    execute: async (ctx: Context) => {
        let { folderID, cardID } = parameters.getParams(ctx);

        let result = await userService.getScoreOfCard(userIDHandler.getUserID()!, folderID!, cardID!);

        if (result === null) {
            ctx.throw(404, textCodes.NOCARDFOUND);
        }

        ctx.status = 200;
        ctx.body = result;
    },
    schema: {
        params: Joi.object({
            folderID: Joi.number().required(),
            cardID: Joi.number().required(),
        }),
    },
};

const createScore = {
    execute: async (ctx: Context) => {
        let { folderID, cardID } = parameters.getParams(ctx);
        let { score } = ctx.request.body as { score: number };

        let result = await userService.createScore(userIDHandler.getUserID()!, folderID!, cardID!, score);

        if (result === null) {
            ctx.throw(404, textCodes.NOCARDFOUND);
        } else if (result === false) {
            ctx.throw(400, textCodes.SCOREALREADYEXISTS);
        }

        ctx.status = 201;
        ctx.body = { message: textCodes.SCORECREATED };
    },
    schema: {
        params: Joi.object({
            folderID: Joi.number().required(),
            cardID: Joi.number().required(),
        }),
        body: Joi.object({
            score: Joi.number().required(),
        }),
    },
};

const updateScore = {
    execute: async (ctx: Context) => {
        let { folderID, cardID } = parameters.getParams(ctx);
        let { score } = ctx.request.body as { score: number };

        let result = await userService.updateScore(userIDHandler.getUserID()!, folderID!, cardID!, score);

        if (result === null) {
            ctx.throw(404, textCodes.NOCARDFOUND);
        }

        ctx.status = 200;
        ctx.body = { message: textCodes.SCOREUPDATED };
    },
    schema: {
        params: Joi.object({
            folderID: Joi.number().required(),
            cardID: Joi.number().required(),
        }),
        body: Joi.object({
            score: Joi.number().required(),
        }),
    },
};

const deleteScore = {
    execute: async (ctx: Context) => {
        let { folderID, cardID } = parameters.getParams(ctx);
        let result = await userService.deleteScore(userIDHandler.getUserID()!, folderID!, cardID!);

        if (result === null) {
            ctx.throw(404, textCodes.NOCARDFOUND);
        }

        ctx.status = 200;
        ctx.body = { message: textCodes.SCOREDELETED };
    },
    schema: {
        params: Joi.object({
            folderID: Joi.number().required(),
            cardID: Joi.number().required(),
        }),
    },
};

const installRouter = (parentRouter: Router) => {
    const router = new Router({
        prefix: "/user",
    });

    router.use(validation.validateSchema(validation.headerAuthorizationSchema));

    router.get("/", getUser);
    router.get("/folder/:folderID?", validation.validateSchema(getFolder.schema), getFolder.execute);
    router.get("/folder/:folderID/card/:cardID?", validation.validateSchema(getCardsInFolder.schema), getCardsInFolder.execute);
    router.get("/folder/:folderID/card/:cardID/score", validation.validateSchema(getScoreOfCard.schema), getScoreOfCard.execute);

    router.post("/folder/create", validation.validateSchema(createFolder.schema), createFolder.execute);
    router.post("/folder/:folderID/card/create", validation.validateSchema(createCard.schema), createCard.execute);
    router.post("/folder/:folderID/card/:cardID/score/create", validation.validateSchema(createScore.schema), createScore.execute);

    router.put("/update", validation.validateSchema(updateUser.schema), updateUser.execute);
    router.put("/folder/:folderID/update", validation.validateSchema(updateUserFolder.schema), updateUserFolder.execute);
    router.put("/folder/:folderID/card/:cardID/update", validation.validateSchema(updateUserCard.schema), updateUserCard.execute);
    router.put("/folder/:folderID/card/:cardID/score/update", validation.validateSchema(updateScore.schema), updateScore.execute);

    router.delete("/delete", deleteUser);
    router.delete("/folder/:folderID/delete", validation.validateSchema(deleteFolder.schema), deleteFolder.execute);
    router.delete("/folder/:folderID/card/:cardID/delete", validation.validateSchema(deleteCard.schema), deleteCard.execute);
    router.delete("/folder/:folderID/card/:cardID/score/delete", validation.validateSchema(deleteScore.schema), deleteScore.execute);

    parentRouter.use(router.routes()).use(router.allowedMethods());
};

export default { installRouter };
