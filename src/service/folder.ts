import folderRepository from "../repository/folder";
import { DBCard, DBFolder, Score } from "../types/types";
import cardRepository from "../repository/card";
import scoreRepository from "../repository/score";

const findPublic = async (attributeName?: string, attributeValue?: string | number): Promise<null | DBFolder[]> => {
    const results = await folderRepository.findPublic(attributeName, attributeValue);

    if (results === null) {
        return null;
    }
    return results;
};

const findPublicCards = async (folderID: number, cardID?: number): Promise<null | DBCard[]> => {
    let publicFolder = await findPublic("id", folderID);

    if (publicFolder === null) {
        return null;
    }

    let cards = await cardRepository.find("folder_id", publicFolder[0].id);

    if (cards === null || cards.length === 0) {
        return null;
    }

    if (cardID === undefined) {
        return cards;
    }

    let card = cards.filter((card) => card.id === cardID);

    if (card.length === 0) {
        return null;
    } else {
        return card;
    }
};

const updateScore = async (folderID: number, cardID: number, user_id: number, score: number): Promise<1 | null> => {
    const publicCard = await findPublicCards(folderID, cardID);

    if (publicCard === null) {
        return null;
    }

    let result = await scoreRepository.updateItem(user_id!, publicCard[0].id, score);

    if (result === null) {
        return null;
    }

    return 1;
};

const findScore = async (cardID: number, user_id: number): Promise<null | number> => {
    const score = await scoreRepository.find("user_id", user_id, "card_id", cardID);

    if (score === null) {
        return null;
    }

    return score[0].score;
};

const createScore = async (folderID: number, cardID: number, user_id: number, score: number): Promise<1 | null | false> => {
    const publicCard = await findPublicCards(folderID, cardID);

    if (publicCard === null) {
        return null;
    }

    let scoreExists = await scoreRepository.find("user_id", user_id, "card_id", publicCard[0].id);

    if (scoreExists !== null) {
        return false;
    }

    let scoreObject = {
        card_id: publicCard[0].id,
        user_id: user_id,
        score,
    } as Score;

    let result = await scoreRepository.createItems([scoreObject]);

    if (result === null) {
        return null;
    }

    return 1;
};

const deleteScore = async (cardID: number, user_id: number): Promise<1 | null> => {
    let result = await scoreRepository.deleteItem(user_id, cardID);

    if (result === null) {
        return null;
    }

    return 1;
};

export default { findPublic, findPublicCards, updateScore, findScore, createScore, deleteScore };
