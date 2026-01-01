
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
}

async function resetDb() {
    console.log("Connecting to database...");
    const connection = await mysql.createConnection(process.env.DATABASE_URL!);

    const tables = [
        "analyses",
        "competitors",
        "industryBenchmarks",
        "sentimentAggregates",
        "socialMediaAlerts",
        "socialMediaMetrics",
        "socialMediaPosts",
        "users",
        "__drizzle_migrations", // Also drop migrations table if it exists
    ];

    console.log("Dropping tables...");

    // Disable foreign key checks to avoid ordering issues
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");

    for (const table of tables) {
        try {
            await connection.query(`DROP TABLE IF EXISTS \`${table}\``);
            console.log(`Dropped table: ${table}`);
        } catch (error) {
            console.error(`Error dropping table ${table}:`, error);
        }
    }

    await connection.query("SET FOREIGN_KEY_CHECKS = 1");
    console.log("All tables dropped successfully.");
    await connection.end();
}

resetDb().catch((err) => {
    console.error("Failed to reset database:", err);
    process.exit(1);
});
