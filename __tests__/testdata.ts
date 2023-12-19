import jwtUse from "../src/core/jwtUse";
import card from "../src/repository/card";
import folder from "../src/repository/folder";
import userService from "../src/service/user";
import userRepository from "../src/repository/user";
import scoreRepository from "../src/repository/score";

// TEST DATA

let jwts: string[] = [];

const testData = async () => {
    const getJWTs = () => {
        return jwts;
    };

    const createTestData = async () => {
        jwts = [];
        let userData = [
            { name: "Solomon Reed", email: `solomonreed@email.com`, password: "therealslimshady" },
            { name: "Rosalind Myers", email: "rosalindmyers@email.com", password: "paperplanes" },
            { name: "So Mi", email: "somi@email.com", password: "thepretender" },
        ];

        for (let user of userData) {
            let jwt = await userService.create(user);

            jwts.push(jwt);
        }

        let folder_ids = await folder.createItems([
            { name: "Math", public_boolean: 0, user_id: jwtUse.getUserID(jwts[0]) }, // folder 0
            { name: "Math 2", public_boolean: 0, user_id: jwtUse.getUserID(jwts[0]) }, // folder 1
            { name: "French", public_boolean: 1, user_id: jwtUse.getUserID(jwts[1]) }, // folder 2
            { name: "physics", public_boolean: 1, user_id: jwtUse.getUserID(jwts[2]) }, //   folder 3
        ]);

        let card_ids = await card.createItems([
            { front: "1+1", back: "2", folder_id: folder_ids![0] },
            { front: "1+2", back: "3", folder_id: folder_ids![0] },
            { front: "2+2", back: "4", folder_id: folder_ids![0] },

            { front: "x + 1", back: "2x - 3", folder_id: folder_ids![1] },
            { front: "2y + 3", back: "4y - 1", folder_id: folder_ids![1] },
            { front: "3z + 2", back: "6z - 4", folder_id: folder_ids![1] },

            { front: "Le soleil", back: "The sun", folder_id: folder_ids![2] },
            { front: "La Lune", back: "the moon", folder_id: folder_ids![2] },
            { front: "Les étoiles", back: "the stars", folder_id: folder_ids![2] },

            { front: "g", back: "9.81m/s^2", folder_id: folder_ids![3] },
            { front: "c", back: "2.9979*10^8 m/s", folder_id: folder_ids![3] },
            { front: "e", back: "1.60*10^-19 C", folder_id: folder_ids![3] },
        ]);

        await scoreRepository.createItems([
            { score: 99, user_id: jwtUse.getUserID(jwts[0]), card_id: card_ids![0] },
            { score: 1, user_id: jwtUse.getUserID(jwts[0]), card_id: card_ids![1] },
            { score: 2, user_id: jwtUse.getUserID(jwts[0]), card_id: card_ids![2] },

            { score: 3, user_id: jwtUse.getUserID(jwts[0]), card_id: card_ids![3] },
            { score: 4, user_id: jwtUse.getUserID(jwts[0]), card_id: card_ids![4] },
            { score: 5, user_id: jwtUse.getUserID(jwts[0]), card_id: card_ids![5] },

            { score: 6, user_id: jwtUse.getUserID(jwts[1]), card_id: card_ids![6] },
            { score: 7, user_id: jwtUse.getUserID(jwts[1]), card_id: card_ids![7] },
            { score: 8, user_id: jwtUse.getUserID(jwts[1]), card_id: card_ids![8] },

            { score: 6, user_id: jwtUse.getUserID(jwts[2]), card_id: card_ids![9] },
            { score: 7, user_id: jwtUse.getUserID(jwts[2]), card_id: card_ids![10] },
        ]);
    };

    const deleteTestData = async () => {
        // deleting users will delete everything else due to foreign key constraints.
        for (let jwt of jwts) {
            let id = jwtUse.getUserID(jwt);
            await userRepository.deleteItems("id", id);
        }
    };

    return { createTestData, deleteTestData, getJWTs };
};

export default testData;
