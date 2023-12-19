import data from "../data/index";
import { Score } from "../types/types";

// weak entity

// Create
// .insert() will return the newly created id (autoincrement is enabled).
const createItems = async (scores: Score[]): Promise<null | 1> => {
    if (scores.length === 0) {
        return null;
    }

    for (const score of scores) {
        await data.getKnex()(data.tables.scoreboard).insert(score);
    }
    return 1;
};

// Read
const find = async (attributeName: string, attributeValue: number, attributeName2?: string, attributeValue2?: number): Promise<Score[] | null> => {
    if ((attributeName === undefined) !== (attributeValue === undefined)) {
        throw new Error("You must provide both attributeName2 and attributeValue2"); // not returning null because this is a developer error.
    }

    let query = data.getKnex()(data.tables.scoreboard).select().where(attributeName, attributeValue);

    if (attributeName2 && attributeValue2) {
        query = query.andWhere(attributeName2, attributeValue2);
    }

    const result = await query; // query is a 'thenable' object

    if (result.length === 0) {
        return null;
    } else {
        return result;
    }
};

// Update
const updateItem = async (user_id: number, card_id: number, score: number): Promise<1 | null> => {
    let result = await data.getKnex()(data.tables.scoreboard).where("user_id", user_id).andWhere("card_id", card_id).update({
        score,
    });

    if (result === 0) {
        return null;
    }

    return 1;
};

// Delete
const deleteItem = async (user_id: number, card_id: number): Promise<1 | null> => {
    let result = await data.getKnex()(data.tables.scoreboard).where("user_id", user_id).andWhere("card_id", card_id).delete();

    if (result === 0) {
        return null;
    }

    return 1;
};

const deleteAll = async (attributeName?: string, attributeValue?: number): Promise<number> => {
    if ((attributeName === undefined) !== (attributeValue === undefined)) {
        throw new Error("You must provide both attributeName and attributeValue");
    } else if (attributeName && attributeValue) {
        return await data.getKnex()(data.tables.scoreboard).where(attributeName, attributeValue).delete();
    } else {
        return await data.getKnex()(data.tables.scoreboard).delete();
    }
};

export default { createItems, find, updateItem, deleteItem, deleteAll };
