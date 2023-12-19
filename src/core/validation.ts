import Joi from "joi";
import { Context, Next } from "koa";
import userRepository from "../repository/user";
import jwtUse from "./jwtUse";
import textCodes from "./textCodes";
import parameters from "./parameters";
import userIDHandler from "./userIDHandler";

interface Schema {
    headers?: Joi.StringSchema<string>;
    body?: Joi.ObjectSchema<any>;
    params?: Joi.ObjectSchema<any>;
}

const validateSchema = (...schemas: Schema[]) => {
    return async (ctx: Context, next: Next) => {
        let authorizationInput = ctx.request.headers.authorization;
        let bodyInput = ctx.request.body;
        let paramsInput = parameters.getParams(ctx);

        for (let schema of schemas) {
            if (schema.headers !== undefined) {
                let { error } = schema.headers.validate(authorizationInput);

                if (error && error.details[0].type === "any.required") {
                    // any.required is the error type for undefined.
                    ctx.throw(401, textCodes.NOJWT);
                } else if (error) {
                    ctx.throw(500, error);
                } else {
                    let token = authorizationInput!.split(" ")[1]; // Bearer <token>

                    let user_id = jwtUse.getUserID(token);

                    if (!user_id) {
                        ctx.throw(401, textCodes.INVALIDJWT);
                    } else if (!(await userRepository.find("id", user_id))) {
                        ctx.throw(401, textCodes.USERMISSING);
                    } else {
                        userIDHandler.setUserID(user_id);
                    }
                }
            }

            if (schema.body !== undefined) {
                let { error } = schema.body.validate(bodyInput);

                if (error) {
                    ctx.throw(400, error);
                }
            }

            if (schema.params !== undefined) {
                let { error } = schema.params.validate(paramsInput);

                if (error) {
                    ctx.throw(400, error);
                }
            }
        }
        return next(); // Normally we would have to await next(), but returning it has the same effect. I don't know why, but don't care enough to find out.
    };
};

const headerAuthorizationSchema = {
    headers: Joi.string()
        .required()
        .pattern(/^Bearer\s[\w-]+\.[\w-]+\.[\w-]+$/),
};

export default { validateSchema, headerAuthorizationSchema };
