import type { LabelJob } from "@/models/label-job";
import * as SQLite from "expo-sqlite";

const DATABASE_NAME = "rudrax.db";

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = initializeDatabase();
  }

  return databasePromise;
}

export async function initializeDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

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

  return db;
}

export async function saveLabelJob(job: LabelJob) {
  const db = await getDatabase();

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
}

export async function updateLabelJobStatus(
  id: string,
  printStatus: LabelJob["printStatus"],
) {
  const db = await getDatabase();

  await db.runAsync(
    `
      UPDATE LabelJob
      SET printStatus = ?
      WHERE id = ?
    `,
    printStatus,
    id,
  );
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
