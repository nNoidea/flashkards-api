import card from "../../repository/card";
import { folder_ids } from "./0001_folder";

let card_ids: number[] = [];

const seed = async () => {
    // add the entries
    card_ids = (await card.createItems([
        { front: "1+1", back: "2", folder_id: folder_ids[0] },
        { front: "1+2", back: "3", folder_id: folder_ids[0] },
        { front: "2+2", back: "4", folder_id: folder_ids[0] },

        { front: "a dog", back: "un perro", folder_id: folder_ids[1] },
        { front: "a cat", back: "un gato", folder_id: folder_ids[1] },
        { front: "JavaScript", back: "basura", folder_id: folder_ids[1] },

        { front: "a car", back: "автомобиль", folder_id: folder_ids[2] },
        { front: "a bicycle", back: "велосипед", folder_id: folder_ids[2] },
        { front: "a truck", back: "велосипед", folder_id: folder_ids[2] },

        { front: "Le soleil", back: "The sun", folder_id: folder_ids[3] },
        { front: "La Lune", back: "the moon", folder_id: folder_ids[3] },
        { front: "Les étoiles", back: "the stars", folder_id: folder_ids[3] },

        { front: "g", back: "9.81m/s^2", folder_id: folder_ids[4] },
        { front: "c", back: "2.9979*10^8 m/s", folder_id: folder_ids[4] },
        { front: "e", back: "1.60*10^-19 C", folder_id: folder_ids[4] },
    ])) as number[];
};

export { seed, card_ids }; // We cannot use export default here because of the way knex handles migrations.
