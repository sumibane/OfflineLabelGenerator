import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";

import type { LabelJob } from "@/models/label-job";

const LABEL_WIDTH_POINTS = 216;
const LABEL_HEIGHT_POINTS = 288;

const LABEL_WIDTH_CSS = 288;
const LABEL_HEIGHT_CSS = 384;

const LABEL_MARGIN_CSS = 8;

let logoDataUri: string | null = null;

async function getLogoDataUri(): Promise<string> {
  if (logoDataUri) {
    return logoDataUri;
  }

  const asset = Asset.fromModule(
    require("@/assets/images/RudraxLogisticsLogo-Thermal-Header.png"),
  );

  await asset.downloadAsync();

  const localUri = asset.localUri ?? asset.uri;

  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  logoDataUri = `data:image/png;base64,${base64}`;

  return logoDataUri;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function createLabelHtml(
  job: LabelJob,
  boxNumber: number,
  logoUri: string,
): string {
  const labelWidth = LABEL_WIDTH_CSS - LABEL_MARGIN_CSS * 2;
  const labelHeight = LABEL_HEIGHT_CSS - LABEL_MARGIN_CSS * 2;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />

        <style>
          @page {
            size: 216pt 288pt;
            margin: 0;
          }

          html,
          body {
            margin: 0;
            padding: 0;
            width: ${LABEL_WIDTH_CSS}px;
            height: ${LABEL_HEIGHT_CSS}px;
            background: #ffffff;
          }

          * {
            box-sizing: border-box;
          }

          .page {
            width: ${LABEL_WIDTH_CSS}px;
            height: ${LABEL_HEIGHT_CSS}px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #ffffff;
          }

          .label {
            width: ${labelWidth}px;
            height: ${labelHeight}px;
            margin: 0;
            padding: 16px;
            background: #ffffff;
            border: 1px solid #000000;
            font-family: Arial, Helvetica, sans-serif;
            color: #000000;
            display: flex;
            flex-direction: column;
          }

          .header {
            width: 100%;
            height: 88px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .header img {
            width: 92%;
            height: 100%;
            object-fit: contain;
          }

          .divider {
            width: 100%;
            height: 1px;
            flex-shrink: 0;
            background: #000000;
          }

          .field {
            width: 100%;
            padding: 18px 0;
          }

          .field-label {
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.8px;
            color: #333333;
            margin-bottom: 6px;
          }

          .docket {
            font-size: 27px;
            line-height: 32px;
            font-weight: 900;
            word-break: break-word;
          }

          .location {
            font-size: 20px;
            line-height: 25px;
            font-weight: 800;
            word-break: break-word;
          }

          .box-section {
            width: 100%;
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-end;
            padding-bottom: 4px;
          }

          .box-label {
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.8px;
            color: #333333;
            margin-bottom: 2px;
          }

          .box-number {
            font-size: 34px;
            line-height: 40px;
            font-weight: 900;
            letter-spacing: 0.5px;
          }
        </style>
      </head>

      <body>
        <div class="page">
          <div class="label">

            <div class="header">
              <img
                src="${logoUri}"
                alt="Rudrax Logistics Services"
              />
            </div>

            <div class="divider"></div>

            <div class="field">
              <div class="field-label">DOCKET NUMBER</div>

              <div class="docket">
                ${escapeHtml(job.docketNumber)}
              </div>
            </div>

            <div class="divider"></div>

            <div class="field">
              <div class="field-label">LOCATION</div>

              <div class="location">
                ${escapeHtml(job.locationText)}
              </div>
            </div>

            <div class="box-section">
              <div class="box-label">BOX</div>

              <div class="box-number">
                ${boxNumber}/${job.boxCount}
              </div>
            </div>

          </div>
        </div>
      </body>
    </html>
  `;
}

export async function generateLabelPdf(job: LabelJob) {
  const logoUri = await getLogoDataUri();

  const pages: string[] = [];

  for (let boxNumber = 1; boxNumber <= job.boxCount; boxNumber += 1) {
    pages.push(createLabelHtml(job, boxNumber, logoUri));
  }

  const html = pages.join(`
    <div style="page-break-after: always;"></div>
  `);

  return Print.printToFileAsync({
    html,
    width: LABEL_WIDTH_POINTS,
    height: LABEL_HEIGHT_POINTS,
  });
}

export async function saveLabelPdf(job: LabelJob): Promise<string> {
  const pdfResult = await generateLabelPdf(job);

  try {
    const downloadUri =
      FileSystem.StorageAccessFramework.getUriForDirectoryInRoot("Download");

    const permissions =
      await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(
        downloadUri,
      );

    if (!permissions.granted) {
      throw new Error("Folder access was cancelled.");
    }

    const selectedDirectoryUri = permissions.directoryUri;

    const safeDocketNumber = job.docketNumber.replace(/[^a-zA-Z0-9_-]/g, "_");

    const fileName = `Rudrax_${safeDocketNumber}_${job.id}.pdf`;

    const destinationUri =
      await FileSystem.StorageAccessFramework.createFileAsync(
        selectedDirectoryUri,
        fileName,
        "application/pdf",
      );

    const base64 = await FileSystem.readAsStringAsync(pdfResult.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    await FileSystem.writeAsStringAsync(destinationUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return destinationUri;
  } finally {
    // Remove the temporary PDF generated by expo-print.
    try {
      await FileSystem.deleteAsync(pdfResult.uri, {
        idempotent: true,
      });
    } catch (cleanupError) {
      console.warn("Temporary PDF cleanup failed:", cleanupError);
    }
  }
}
