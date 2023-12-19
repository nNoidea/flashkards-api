import jwtUse from "../../core/jwtUse";
import scoreaboard from "../../repository/score";
import { jwts } from "./0000_user";
import { card_ids } from "./0002_card";

const seed = async () => {
    // add the entries
    await scoreaboard.createItems([
        { score: 1, user_id: jwtUse.getUserID(jwts[0]), card_id: card_ids[0] },
        { score: 1, user_id: jwtUse.getUserID(jwts[0]), card_id: card_ids[1] },
        { score: 2, user_id: jwtUse.getUserID(jwts[0]), card_id: card_ids[2] },
        { score: 3, user_id: jwtUse.getUserID(jwts[0]), card_id: card_ids[3] },
        { score: 4, user_id: jwtUse.getUserID(jwts[0]), card_id: card_ids[4] },
        { score: 5, user_id: jwtUse.getUserID(jwts[0]), card_id: card_ids[5] },
        { score: 6, user_id: jwtUse.getUserID(jwts[0]), card_id: card_ids[6] },
        { score: 7, user_id: jwtUse.getUserID(jwts[0]), card_id: card_ids[7] },
        { score: 8, user_id: jwtUse.getUserID(jwts[0]), card_id: card_ids[8] },
        { score: 8, user_id: jwtUse.getUserID(jwts[1]), card_id: card_ids[9] },
        { score: 8, user_id: jwtUse.getUserID(jwts[1]), card_id: card_ids[10] },
        { score: 8, user_id: jwtUse.getUserID(jwts[1]), card_id: card_ids[11] },
        { score: 8, user_id: jwtUse.getUserID(jwts[2]), card_id: card_ids[12] },
        { score: 8, user_id: jwtUse.getUserID(jwts[2]), card_id: card_ids[13] },
        { score: 8, user_id: jwtUse.getUserID(jwts[2]), card_id: card_ids[14] },
    ]);
};

export { seed }; // We cannot use export default here because of the way knex handles migrations.
