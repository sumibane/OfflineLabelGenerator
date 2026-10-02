import type { LabelJob } from "@/models/label-job";
import * as SQLite from "expo-sqlite";

const DATABASE_NAME = "rudrax.db";

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Performs the actual SQLite database initialization.
 * IMPORTANT:
 * This function must only be called through getDatabase().
 */
async function initializeDatabaseInternal(): Promise<SQLite.SQLiteDatabase> {
  console.log("Opening Rudrax database...");

  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

  console.log("Rudrax database opened.");

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS LabelJob (
      id TEXT PRIMARY KEY NOT NULL,
      docketNumber TEXT NOT NULL,
      locationId TEXT,
      locationText TEXT NOT NULL,
      boxCount INTEGER NOT NULL,
      createdAt TEXT NOT NULL,
      printStatus TEXT NOT NULL
    );
  `);

  console.log("Rudrax database schema ready.");

  return db;
}

/**
 * Single shared database connection/promise.
 *
 * Every part of the app MUST use this function.
 */
function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    console.log("Creating database initialization promise...");

    databasePromise = initializeDatabaseInternal().catch((error) => {
      console.error("Database initialization failed:", error);

      // Allow the next operation to retry initialization.
      databasePromise = null;

      throw error;
    });
  }

  return databasePromise;
}

/**
 * Public initialization function.
 *
 * _layout.tsx can call this safely.
 * It uses the SAME singleton database promise as all other operations.
 */
export async function initializeDatabase(): Promise<SQLite.SQLiteDatabase> {
  return getDatabase();
}

export async function saveLabelJob(job: LabelJob): Promise<void> {
  const db = await getDatabase();

  console.log("Saving LabelJob:", job.id);

  await db.runAsync(
    `
      INSERT INTO LabelJob (
        id,
        docketNumber,
        locationId,
        locationText,
        boxCount,
        createdAt,
        printStatus
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    job.id,
    job.docketNumber,
    job.locationId,
    job.locationText,
    job.boxCount,
    job.createdAt,
    "Pending",
  );

  console.log("LabelJob saved:", job.id);
}

export async function updateLabelJobStatus(
  id: string,
  printStatus: LabelJob["printStatus"],
): Promise<void> {
  const db = await getDatabase();

  console.log("Updating LabelJob status:", id, printStatus);

  await db.runAsync(
    `
      UPDATE LabelJob
      SET printStatus = ?
      WHERE id = ?
    `,
    printStatus,
    id,
  );

  console.log("LabelJob status updated:", id, printStatus);
}

export async function getAllLabelJobs(): Promise<LabelJob[]> {
  const db = await getDatabase();

  const jobs = await db.getAllAsync<LabelJob>(
    `
      SELECT
        id,
        docketNumber,
        locationId,
        locationText,
        boxCount,
        createdAt,
        printStatus
      FROM LabelJob
      ORDER BY createdAt DESC
    `,
  );

  return jobs;
}
