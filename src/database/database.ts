import type { LabelJob } from "@/models/label-job";
import * as SQLite from "expo-sqlite";

const DATABASE_NAME = "rudrax.db";

export async function initializeDatabase() {
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
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

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

export async function getAllLabelJobs(): Promise<LabelJob[]> {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

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
