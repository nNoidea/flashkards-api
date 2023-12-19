import config from "config";
import jwt from "jsonwebtoken";

const JWTSECRET: string = config.get("auth.jwt.secret");

const generateJWT = (user_id: number, expiresInSeconds?: number) => {
    let options = {
        expiresIn: "",
    };

    if (expiresInSeconds !== undefined) {
        options.expiresIn = `${expiresInSeconds}s`;
    } else {
        options.expiresIn = `1h`; // default expiration time is 1 hour.
    }

    const payload = {
        user_id: user_id, // user_id is on auto increment, so it is guaranteed to be unique and an already assigned id won't be used ever again by MySQL.
    };

    const jwtToken = jwt.sign(payload, JWTSECRET, options);

    return jwtToken;
};

// jwt.verify also checks for the expiration time.
const decodeVerifyJWT = (jwtToken: string) => {
    try {
        const checked = jwt.verify(jwtToken, JWTSECRET);

        return checked;
    } catch (err) {
        return false;
    }
};

const getUserID = (jwtToken: string) => {
    const decoded = decodeVerifyJWT(jwtToken);

    if (typeof decoded === "string" || decoded === false) {
        return false;
    } else {
        return decoded.user_id;
    }
};

export default {
    generateJWT,
    decodeVerifyJWT,
    getUserID,
};
