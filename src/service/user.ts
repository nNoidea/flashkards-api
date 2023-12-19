import argonPassword from "../core/argonPassword";
import textCodes from "../core/textCodes";
import jwtUse from "../core/jwtUse";
import userRepository from "../repository/user";
import { DBCard, DBFolder, PasswordlessUser } from "../types/types";
import folderRepository from "../repository/folder";
import cardRepository from "../repository/card";
import scoreRepository from "../repository/score";

// USER

// Register
// only 1 user can be created at a time.
const create = async ({ name, email, password }: { name: string; email: string; password: string }, expiresInSeconds?: number): Promise<string> => {
    let result = await userRepository.createItems([{ name, email, password }]);

    if (result === null) {
        return textCodes.INVALIDDATA;
    }

    let id = result[0];
    let token = jwtUse.generateJWT(id, expiresInSeconds);
    return token;
};

// Login
const login = async ({ email, password }: { email: string; password: string }): Promise<string> => {
    let result = await userRepository.find("email", email);

    if (result === null) {
        // user not found
        return textCodes.NOUSERFOUND;
    } else if (await argonPassword.verifyPassword(password, result[0].hashed_password)) {
        return jwtUse.generateJWT(result[0].id); // user found and password is correct, return a token.
    } else {
        return textCodes.WRONGPASSWORD; // user found but password is incorrect.
    }
};

const updateUser = async (user_id: number, { name, email, password }: { name?: string; email?: string; password?: string }): Promise<1 | null> => {
    return await userRepository.updateItem(user_id, { name, email, password });
};

const find = async (user_id: number): Promise<PasswordlessUser | null> => {
    const result = await userRepository.find("id", user_id);

    if (result === null) {
        return null;
    }

    let passwordlessUser = {
        id: result[0].id,
        name: result[0].name,
        email: result[0].email,
    };

    return passwordlessUser;
};

const deleteUser = async (user_id: number): Promise<number> => {
    return await userRepository.deleteItems("id", user_id);
};

// FOLDER

// user_id is impossible to be faked because it gets decoded and verified with a signature.
// The mainlogic is that every folder method will start from this method which requires the user_id which is impossible to be faked thanks to jwt.
const findAllFolders = async (user_id: number): Promise<null | DBFolder[]> => {
    const folders = await folderRepository.find("user_id", user_id);

    if (folders === null) {
        return null;
    }

    return folders;
};

// To be able to find a single folder's id, we have to check every folder the user has anyways.
const findSingleFolder = async (user_id: number, folder_id: number): Promise<null | DBFolder> => {
    const folders = await findAllFolders(user_id);

    if (folders === null) {
        return null;
    }

    let folder = folders.filter((folder: DBFolder) => folder.id === folder_id)[0];

    if (folder === undefined) {
        return null;
    }

    return folder;
};

const deleteFolder = async (user_id: number, folder_id: number): Promise<number | null> => {
    const folder = await findSingleFolder(user_id, folder_id);

    if (folder === null) {
        return null;
    }

    return await folderRepository.deleteItems("id", folder.id);
};

const updateSingleFolder = async (user_id: number, folder_id: number, { name, public_boolean }: { name?: string; public_boolean?: number }): Promise<1 | null> => {
    const folder = await findSingleFolder(user_id, folder_id);

    if (folder === null) {
        return null;
    }

    return await folderRepository.updateSingleItem(folder.id, { name, public_boolean });
};

// CARD
const findAllCardsInFolder = async (user_id: number, folder_id: number): Promise<null | DBCard[]> => {
    let userFolders = await findSingleFolder(user_id, folder_id);
    if (userFolders === null) {
        return null; // user does not have this folder.
    }

    const cards = await cardRepository.find("folder_id", folder_id);

    if (cards === null) {
        return null;
    }

    return cards;
};

const findSingleCard = async (user_id: number, folder_id: number, card_id: number): Promise<null | DBCard> => {
    // see all cards the user has in the folder with the folder_id.
    let cards = await findAllCardsInFolder(user_id, folder_id);

    if (cards === null) {
        return null;
    }

    // see if the user has the card with the card_id.
    let card = cards.filter((card: DBCard) => card.id === card_id)[0];

    if (card === undefined) {
        return null;
    }

    return card;
};

const deleteSingleCard = async (user_id: number, folder_id: number, card_id: number): Promise<number | null> => {
    let card = await findSingleCard(user_id, folder_id, card_id);

    if (card === null) {
        return null;
    }

    return await cardRepository.deleteItems("id", card.id); // 1 or 0
};

const updateSingleCard = async (user_id: number, folder_id: number, card_id: number, { front, back }: { front?: string; back?: string }): Promise<1 | null> => {
    let card = await findSingleCard(user_id, folder_id, card_id);

    if (card === null) {
        return null;
    }

    return await cardRepository.updateSingleItem(card.id, { front, back });
};

const createSingleFolder = async (user_id: number, { name, public_boolean }: { name: string; public_boolean: number }): Promise<number | null> => {
    let result = await folderRepository.createItems([{ user_id, name, public_boolean }]);

    if (result === null) {
        return null;
    }

    return result[0];
};

const createSingleCard = async (user_id: number, folder_id: number, { front, back }: { front?: string; back?: string }): Promise<number | null> => {
    if (front === undefined) {
        front = "";
    }
    if (back === undefined) {
        back = "";
    }

    let folder = await findSingleFolder(user_id, folder_id);

    if (folder === null) {
        return null;
    }

    let result = await cardRepository.createItems([{ folder_id: folder.id, front, back }]);

    if (result === null) {
        return null;
    }

    return result[0];
};

const getScoreOfCard = async (user_id: number, folder_id: number, card_id: number): Promise<null | number> => {
    let card = await findSingleCard(user_id, folder_id, card_id);

    if (card === null) {
        return null;
    }

    let score = await scoreRepository.find("user_id", user_id, "card_id", card.id);

    if (score === null) {
        return null;
    }

    return score[0].score;
};

const createScore = async (user_id: number, folder_id: number, card_id: number, score: number): Promise<1 | null | false> => {
    let card = await findSingleCard(user_id, folder_id, card_id);

    if (card === null) {
        return null;
    }

    let search = await scoreRepository.find("user_id", user_id, "card_id", card.id);

    if (search !== null) {
        return false;
    }

    let result = await scoreRepository.createItems([{ card_id: card.id, user_id, score }]);

    if (result === null) {
        return null;
    }

    return 1;
};

const updateScore = async (user_id: number, folder_id: number, card_id: number, score: number): Promise<1 | null> => {
    let card = await findSingleCard(user_id, folder_id, card_id);

    if (card === null) {
        return null;
    }

    let result = await scoreRepository.updateItem(user_id, card.id, score);

    if (result === null) {
        return null;
    }

    return 1;
};

const deleteScore = async (user_id: number, folder_id: number, card_id: number): Promise<1 | null> => {
    let card = await findSingleCard(user_id, folder_id, card_id);

    if (card === null) {
        return null;
    }

    let result = await scoreRepository.deleteItem(user_id, card.id);

    if (result === null) {
        return null;
    }

    return 1;
};

export default {
    create,
    login,
    updateUser,
    find,
    deleteUser,
    deleteFolder,
    findSingleFolder,
    findAllFolders,
    findAllCardsInFolder,
    findSingleCard,
    deleteSingleCard,
    updateSingleFolder,
    updateSingleCard,
    createSingleFolder,
    createSingleCard,
    getScoreOfCard,
    createScore,
    updateScore,
    deleteScore,
};
