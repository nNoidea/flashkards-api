let user_id: number | null = null;

const resetUserID = () => {
    user_id = null;
};

const getUserID = () => {
    return user_id;
};

const setUserID = (id: number) => {
    user_id = id;
};

export default { resetUserID, getUserID, setUserID };
