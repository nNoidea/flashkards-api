import { Context } from "koa";
import Router from "@koa/router";
import folderService from "../service/folder";
import textCodes from "../core/textCodes";
import Joi from "joi";
import validation from "../core/validation";
import parameters from "../core/parameters";
import userIDHandler from "../core/userIDHandler";

const getFolder = {
    execute: async (ctx: Context) => {
        const { folderID } = parameters.getParams(ctx);

        // if folderID is undefined, return all folders.
        if (folderID === undefined) {
            let allPublicFolders = await folderService.findPublic();

            ctx.body = allPublicFolders;
            return;
        }

        // if folderID is defined, return the folder with the given folderID.
        const publicFolder = await folderService.findPublic("id", folderID);

        if (publicFolder === null) {
            ctx.throw(404, textCodes.NOFOLDERFOUND);
        }
        ctx.body = publicFolder;
    },
    schema: {
        params: Joi.object({
            folderID: Joi.number().optional(),
        }),
    },
};

const getCard = {
    execute: async (ctx: Context) => {
        const { folderID, cardID } = parameters.getParams(ctx);

        const publicFolder = await folderService.findPublic("id", folderID);

        if (publicFolder === null) {
            ctx.throw(404, textCodes.NOFOLDERFOUND);
        }

        // if cardID is undefined, return all cards in the folder.
        if (cardID === undefined) {
            let allPublicCards = await folderService.findPublicCards(folderID!);
            if (allPublicCards === null) {
                ctx.throw(404, textCodes.NOCARDFOUND);
            }

            ctx.body = allPublicCards;
            return;
        }

        // if cardID is defined, return the card with the given cardID.
        const publicCard = await folderService.findPublicCards(folderID!, cardID);

        if (publicCard === null) {
            ctx.throw(404, textCodes.NOCARDFOUND);
        }

        ctx.status = 200;
        ctx.body = publicCard;
    },
    schema: {
        params: Joi.object({
            folderID: Joi.number().required(),
            cardID: Joi.number().optional(),
        }),
    },
};

const getScore = {
    execute: async (ctx: Context) => {
        const { cardID } = parameters.getParams(ctx);
        const user_id = userIDHandler.getUserID();

        const score = await folderService.findScore(cardID!, user_id!);

        if (score === null) {
            ctx.throw(404, textCodes.NOSCOREFOUND);
        }

        ctx.status = 200;
        ctx.body = score;
    },
    schema: {
        params: Joi.object({
            folderID: Joi.number().required(),
            cardID: Joi.number().required(),
        }),
    },
};

const updateScore = {
    execute: async (ctx: Context) => {
        const { folderID, cardID } = parameters.getParams(ctx);
        const user_id = userIDHandler.getUserID();

        const publicCard = await folderService.updateScore(folderID!, cardID!, user_id!, 10);

        if (publicCard === null) {
            ctx.throw(404, textCodes.NOSCOREFOUND);
        }

        ctx.status = 200;
        ctx.body = { message: textCodes.SCOREUPDATED };
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
        const { folderID, cardID } = parameters.getParams(ctx);
        let { score } = ctx.request.body as { score: number };
        const user_id = userIDHandler.getUserID();

        const publicCard = await folderService.findPublicCards(folderID!, cardID);

        if (publicCard === null) {
            ctx.throw(404, textCodes.NOCARDFOUND);
        }

        let scoreResult = await folderService.createScore(folderID!, cardID!, user_id!, score);

        if (scoreResult === null) {
            ctx.throw(404, textCodes.NOFOLDERFOUND);
        } else if (scoreResult === false) {
            ctx.throw(405, textCodes.SCOREALREADYEXISTS);
        }

        ctx.status = 200;
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

const deleteScore = {
    execute: async (ctx: Context) => {
        const { cardID } = parameters.getParams(ctx);
        const user_id = userIDHandler.getUserID();

        let scoreResult = await folderService.deleteScore(cardID!, user_id!);

        if (scoreResult === null) {
            ctx.throw(404, textCodes.NOSCOREFOUND);
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
        prefix: "/folder", // does endpoint does not care about the session folderID.
    });

    router.get("/:folderID?", validation.validateSchema(getFolder.schema), getFolder.execute); // question mark makes folderID optional
    router.get("/:folderID/card/:cardID?", validation.validateSchema(getCard.schema), getCard.execute); // question mark makes folderID optional
    router.get("/:folderID/card/:cardID/score", validation.validateSchema(validation.headerAuthorizationSchema, getScore.schema), getScore.execute); // question mark makes folderID optional

    router.put("/:folderID/card/:cardID/score/update", validation.validateSchema(validation.headerAuthorizationSchema, updateScore.schema), updateScore.execute); // question mark makes folderID optional

    router.post("/:folderID/card/:cardID/score/create", validation.validateSchema(validation.headerAuthorizationSchema, createScore.schema), createScore.execute); // question mark makes folderID optional

    router.delete("/:folderID/card/:cardID/score/delete", validation.validateSchema(validation.headerAuthorizationSchema, deleteScore.schema), deleteScore.execute); // question mark makes folderID optional

    parentRouter.use(router.routes()).use(router.allowedMethods());
};

export default { installRouter };
