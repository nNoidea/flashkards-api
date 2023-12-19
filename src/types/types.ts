type User = { name: string; email: string; password: string };
type PasswordlessUser = {
    id: number;
    name: string;
    email: string;
};

type DBUser = { id: number; name: string; email: string; hashed_password: string };
type Folder = { name: string; public_boolean: Number; user_id: number };
type DBFolder = { id: number; name: string; public_boolean: Number; user_id: number };
type Card = { front: string; back: string; folder_id: number };
type DBCard = { id: number; front: string; back: string; folder_id: number };
type Score = { card_id: number; user_id: number; score: number };
type DBScore = { id: number; card_id: number; user_id: number; score: number; date: Date };

export { User, PasswordlessUser, DBUser, Folder, DBFolder, Card, DBCard, Score, DBScore };
