import data from "../data/index";
import { Card, DBCard } from "../types/types";

// Create
// .insert() will return the newly created id (autoincrement is enabled).
const createItems = async (cards: Card[]): Promise<null | number[]> => {
    if (cards.length === 0) {
        return null;
    }

    const ids = []; // MySql will return only the last id, so we need to store all the ids and return them.
    for (const card of cards) {
        const [id] = await data.getKnex()(data.tables.card).insert(card);

        ids.push(id);
    }
    return ids;
};

// Read
const find = async (attributeName: string, attributeValue: string | number): Promise<null | DBCard[]> => {
    const result = await data.getKnex()(data.tables.card).select().where(attributeName, attributeValue);

    if (result.length === 0) {
        return null;
    } else {
        return result;
    }
};

const devFindAll = async (): Promise<DBCard[]> => {
    return await data.getKnex()(data.tables.card).select();
};

// Update
const updateSingleItem = async (id: number, { front, back, newFolder_id }: { front?: string; back?: string; newFolder_id?: number }): Promise<null | 1> => {
    if (front === undefined && back === undefined && newFolder_id === undefined) {
        return null;
    }

    let result = await data.getKnex()(data.tables.card).where("id", id).update({
        front,
        back,
        newFolder_id,
    });

    if (result === 0) {
        return null;
    }

    return 1;
};

// Delete
const deleteItems = async (attributeName?: string, attributeValue?: string | number): Promise<number> => {
    if ((attributeName === undefined) !== (attributeValue === undefined)) {
        throw new Error("You must provide both attributeName and attributeValue");
    } else if (attributeName && attributeValue) {
        return await data.getKnex()(data.tables.card).where(attributeName, attributeValue).delete();
    } else {
        return await data.getKnex()(data.tables.card).delete();
    }
};

export default { createItems, find, devFindAll, updateSingleItem, deleteItems };
