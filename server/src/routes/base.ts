import { config } from "dotenv";
import mysql, { type QueryResult } from "mysql2/promise";

config({ quiet: true });

const [host, user, password, database] = [
    process.env.DB_HOST,
    process.env.DB_USER,
    process.env.DB_PASS ?? "",
    process.env.DB_NAME,
];
if (!host || !user || !database)
    throw new Error(
        ".env needs more values! Check for DB_HOST, DB_USER, DB_PASS and DB_NAME",
    );

const connection = await mysql.createConnection({
    host,
    user,
    password,
    database,
    connectTimeout: 60000,
});

export async function query<T = QueryResult>(
    sql: string,
    params?: any[],
): Promise<T> {
    const [results] = await connection.execute(sql, params);
    return results as T;
}
