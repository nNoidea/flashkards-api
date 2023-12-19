import data from "../data/index";
import { DBCard, DBFolder, Folder } from "../types/types";

// Create
// .insert() will return the newly created id (autoincrement is enabled).
const createItems = async (folders: Folder[]): Promise<null | number[]> => {
    const ids = []; // MySql will return only the last id, so we need to store all the ids and return them.

    if (folders.length === 0) {
        return null;
    }

    for (const folder of folders) {
        const [id] = await data.getKnex()(data.tables.folder).insert(folder);

        ids.push(id);
    }
    return ids;
};

// .select() will return array of objects where the objects are the rows from the database.
const devFindAll = async (): Promise<DBFolder[]> => {
    return await data.getKnex()(data.tables.folder).select();
};

// Read
const find = async (attributeName: string, attributeValue: string | number): Promise<null | DBFolder[]> => {
    const result = await data.getKnex()(data.tables.folder).select().where(attributeName, attributeValue);

    if (result.length === 0) {
        return null;
    }

    return result;
};

// I don't want someone creating billion folders in private mode to slow down search process, so we're going to hardcode search for public folders.
const findPublic = async (attributeName?: string, attributeValue?: string | number): Promise<null | DBFolder[]> => {
    if (attributeName === undefined && attributeValue === undefined) {
        const allResults = await data.getKnex()(data.tables.folder).select().where("public_boolean", 1);

        if (allResults.length === 0) {
            return null;
        }

        return allResults;
    }

    if (attributeName === undefined || attributeValue === undefined) {
        throw new Error("You must provide both attributeName and attributeValue"); // not returning null because this is a developer error.
    }

    const result = await data.getKnex()(data.tables.folder).select().where("public_boolean", 1).andWhere(attributeName, attributeValue);

    if (result.length === 0) {
        return null;
    }

    return result;
};

// Update
const updateSingleItem = async (id: number, { name, public_boolean }: { name?: string; public_boolean?: number }): Promise<null | 1> => {
    if (name === undefined && public_boolean === undefined) {
        return null;
    }

    let result = await data.getKnex()(data.tables.folder).where("id", id).update({
        name,
        public_boolean,
    });

    if (result === 0) {
        return null;
    }

    return 1;
};

// Delete
const deleteItems = async (attributeName?: string, attributeValue?: string | number): Promise<number> => {
    if ((attributeName === undefined) !== (attributeValue === undefined)) {
        throw new Error("You must provide both attributeName and attributeValue"); // not returning null because this is a developer error.
    } else if (attributeName && attributeValue) {
        return await data.getKnex()(data.tables.folder).where(attributeName, attributeValue).delete();
    } else {
        return await data.getKnex()(data.tables.folder).delete();
    }
};

export default { createItems, find, findPublic, devFindAll, updateSingleItem, deleteItems };
