import folder from "../../repository/folder";
import jwtUse from "../../core/jwtUse";
import { jwts } from "./0000_user";

let folder_ids: number[] = [];

const seed = async () => {
    // add the entries
    folder_ids = (await folder.createItems([
        { name: "Math", public_boolean: 0, user_id: jwtUse.getUserID(jwts[0]) },
        { name: "Spanish", public_boolean: 0, user_id: jwtUse.getUserID(jwts[0]) },
        { name: "Russian", public_boolean: 0, user_id: jwtUse.getUserID(jwts[0]) },
        { name: "French", public_boolean: 1, user_id: jwtUse.getUserID(jwts[1]) },
        { name: "physics", public_boolean: 1, user_id: jwtUse.getUserID(jwts[2]) },
    ])) as number[]; // Add type assertion here
};

export { seed, folder_ids }; // We cannot use export default here because of the way knex handles migrations.
