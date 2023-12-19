import { Knex } from "knex";
import data from "../index";

const up = async (knex: Knex) => {
    await knex.schema.createTable(data.tables.folder, (table) => {
        table.increments("id");

        table.string("name", 255).notNullable();

        table.boolean("public_boolean").notNullable().defaultTo(false);

        table.integer("user_id").unsigned().notNullable();

        // Give this foreign key a name for better error handling in service layer
        // .foreign() is a knex method that basically creates a relation on the table to nothing initially.
        // .references() is a knex method then links the relation to another table.
        // .onDelete("CASCADE") is a knex method that deletes all the rows in the child table when the parent table is deleted.
        table.foreign("user_id", "fk_folder_user").references(`${data.tables.user}.id`).onDelete("CASCADE");
    });
};

const down = (knex: Knex) => {
    return knex.schema.dropTableIfExists(data.tables.folder);
};

export { up, down }; // We cannot use export default here because of the way knex handles migrations. It directly looks for the up and down functions and not a custom "name".