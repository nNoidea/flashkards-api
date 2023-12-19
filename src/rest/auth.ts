import Router from "@koa/router";
import textCodes from "../core/textCodes";
import user from "../service/user";
import { Context } from "koa";
import Joi from "joi";
import validation from "../core/validation";

const createUser = {
    execute: async (ctx: Context) => {
        const { name, email, password } = ctx.request.body as { name: string; email: string; password: string };

        if (password.length < 8) {
            ctx.throw(400, textCodes.SHORTPASSWORD);
        }

        let token;
        try {
            token = await user.create({ name, email, password });
        } catch (error) {
            ctx.throw(400, textCodes.INVALIDDATA);
        }

        ctx.set("Authorization", `Bearer ${token}`);
        ctx.status = 200;
    },
    schema: {
        body: Joi.object({
            name: Joi.string().required(),
            email: Joi.string().email().required(),
            password: Joi.string().required(),
        }),
    },
};

const loginUser = {
    execute: async (ctx: Context) => {
        const { email, password } = ctx.request.body as { email: string; password: string };

        const token = await user.login({ email, password });
        ctx.set("Authorization", `Bearer ${token}`);
        ctx.status = 200;
    },
    schema: {
        body: Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().required(),
        }),
    },
};

const installRouter = (parentRouter: Router) => {
    const router = new Router({
        prefix: "/auth",
    });

    router.post("/register", validation.validateSchema(createUser.schema), createUser.execute); // POST .../api/data/
    router.post("/login", validation.validateSchema(loginUser.schema), loginUser.execute); // POST .../api/data/

    parentRouter.use(router.routes()).use(router.allowedMethods());
};

export default { installRouter };
