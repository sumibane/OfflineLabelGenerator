import { Buffer } from "buffer";
import BluetoothClassic from "react-native-bluetooth-classic";

import type { LabelJob } from "@/models/label-job";
import { getSelectedPrinter } from "../bluetooth/bluetooth-printer-storage";
import type { PrintProgress, PrintResult } from "../print-types";
import type { LabelPrinterService } from "../printer-service";
import {
  RUDRAX_LOGO_BITMAP,
  RUDRAX_LOGO_HEIGHT,
  RUDRAX_LOGO_WIDTH_BYTES,
} from "./tsc-image";

/**
 * 70 mm x 70 mm label.
 *
 * 203 DPI TSC printers are approximately 560 dots across 70 mm.
 *
 * The physical print showed that the printer's usable origin is not
 * perfectly aligned with the theoretical 0,0 position. Therefore we
 * keep one conservative outer frame and use the same left/right
 * coordinates for every section.
 */
const LABEL_WIDTH_DOTS = 560;

/**
 * The previous print showed the usable print area is slightly biased
 * to the left. We therefore move the complete design 5 dots to the
 * right and make the frame a little narrower.
 *
 * One outer border is used for the entire label.
 */
const OUTER_LEFT = 40;
const OUTER_RIGHT = 525;
const OUTER_TOP = 12;
const OUTER_BOTTOM = 535;

const CONTENT_LEFT = 52;
const CONTENT_RIGHT = 513;
const CONTENT_WIDTH = CONTENT_RIGHT - CONTENT_LEFT;

/**
 * Section separators.
 *
 * Logo       : 12  -> 180
 * Docket     : 180 -> 285
 * Location   : 285 -> 445
 * Box        : 445 -> 535
 */
const LOGO_SEPARATOR_Y = 180;
const DOCKET_SEPARATOR_Y = 260;
const LOCATION_SEPARATOR_Y = 445;

const LOGO_TOP = 28;

/**
 * Text positions.
 *
 * Docket is deliberately a SINGLE line:
 *     Docket: 123456
 *
 * Location gets three lines maximum.
 */
const DOCKET_Y = 215;

const LOCATION_LABEL_Y = 275;
const LOCATION_FIRST_LINE_Y = 305;

const BOX_Y = 475;

type TextStyle = {
  font: string;
  xScale: number;
  yScale: number;
  lineHeight: number;
  maxChars: number;
};

const LABEL_TEXT_STYLE: Record<"docket" | "location" | "box", TextStyle> = {
  docket: {
    font: "3",
    xScale: 1,
    yScale: 1,
    lineHeight: 0,
    maxChars: 14,
  },

  location: {
    font: "3",
    xScale: 1,
    yScale: 1,
    lineHeight: 30,
    maxChars: 28,
  },

  box: {
    font: "3",
    xScale: 2,
    yScale: 2,
    lineHeight: 0,
    maxChars: 14,
  },
};

function escapeTsplText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, " ")
    .trim();
}

function breakLongWord(word: string, maxChars: number): string[] {
  if (word.length <= maxChars) {
    return [word];
  }

  const parts: string[] = [];

  for (let i = 0; i < word.length; i += maxChars) {
    parts.push(word.slice(i, i + maxChars));
  }

  return parts;
}

function wrapText(value: string, maxChars: number): string[] {
  const cleanValue = value.replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();

  if (!cleanValue) {
    return [""];
  }

  const words = cleanValue.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const originalWord of words) {
    const wordParts = breakLongWord(originalWord, maxChars);

    for (const wordPart of wordParts) {
      if (!currentLine) {
        currentLine = wordPart;
        continue;
      }

      const candidate = `${currentLine} ${wordPart}`;

      if (candidate.length <= maxChars) {
        currentLine = candidate;
      } else {
        lines.push(currentLine);
        currentLine = wordPart;
      }
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function getSafeMaxChars(style: TextStyle): number {
  const approximateCharWidth =
    style.font === "3" ? 12 * style.xScale : 10 * style.xScale;

  const physicalCapacity = Math.max(
    1,
    Math.floor(CONTENT_WIDTH / approximateCharWidth),
  );

  return Math.min(style.maxChars, physicalCapacity);
}

function textCommand(
  x: number,
  y: number,
  style: TextStyle,
  value: string,
): string {
  return `TEXT ${x},${y},"${style.font}",0,${style.xScale},${style.yScale},"${escapeTsplText(value)}"`;
}

/**
 * Center text approximately using the configured TSPL font.
 *
 * TSPL built-in fonts have fixed character widths, so this is a good
 * practical approximation and is much more reliable than hard-coding
 * an X coordinate such as 235.
 */
function centeredTextX(value: string, style: TextStyle): number {
  const approximateCharWidth =
    style.font === "3" ? 16 * style.xScale : 12 * style.xScale;

  const estimatedWidth = value.length * approximateCharWidth;

  return Math.max(
    OUTER_LEFT + 1,
    Math.round((LABEL_WIDTH_DOTS - estimatedWidth) / 2),
  );
}

function buildTestLabel(job: LabelJob, boxNumber: number): Buffer {
  const docketStyle = LABEL_TEXT_STYLE.docket;
  const locationStyle = LABEL_TEXT_STYLE.location;
  const boxStyle = LABEL_TEXT_STYLE.box;

  /**
   * Location is intentionally constrained to 16 characters per line.
   *
   * Example:
   *
   * ABCD EFGH IJKL
   * MNOP QRST UVWX
   * YZ
   *
   * This is safer than trying to squeeze 20+ characters into a line
   * using horizontal scaling.
   */
  const locationLines = wrapText(
    job.locationText,
    getSafeMaxChars(locationStyle),
  );

  const visibleLocationLines = locationLines.slice(0, 3);

  /**
   * Docket is a six-digit identifier.
   *
   * Render the label and number as ONE TEXT command so there is no
   * possibility of the two pieces overlapping vertically.
   */
  const docketValue = escapeTsplText(job.docketNumber)
    .replace(/\D/g, "")
    .slice(0, 6);

  const docketText = `Docket: ${docketValue}`;

  const boxText = `BOX ${boxNumber}/${job.boxCount}`;

  /**
   * Center the logo using its actual bitmap width.
   */
  const logoWidthDots = RUDRAX_LOGO_WIDTH_BYTES * 8;

  const logoX = Math.max(
    OUTER_LEFT + 1,
    Math.round(OUTER_LEFT + (OUTER_RIGHT - OUTER_LEFT - logoWidthDots) / 2),
  );

  const header =
    [
      "SIZE 70mm,70mm",
      "GAP 2,0",
      "CLS",

      `BITMAP ${logoX},${LOGO_TOP},${RUDRAX_LOGO_WIDTH_BYTES},${RUDRAX_LOGO_HEIGHT},0,`,
    ].join("\r\n") + "\r\n";

  /**
   * Docket.
   *
   * x=52 keeps it safely inside the outer frame.
   * Font 3, 2x horizontal and 1x vertical gives a readable number
   * without making the text too tall.
   */
  const docketCommands = [
    textCommand(CONTENT_LEFT, DOCKET_Y, docketStyle, docketText),
  ];

  /**
   * Location.
   *
   * Font 3 at 1x/1x avoids the stretched appearance caused by the
   * previous font 2 / 2x horizontal scaling.
   */
  const locationCommands = [
    textCommand(CONTENT_LEFT, LOCATION_LABEL_Y, locationStyle, "Location:"),

    ...visibleLocationLines.map((line, index) =>
      textCommand(
        CONTENT_LEFT,
        LOCATION_FIRST_LINE_Y + locationStyle.lineHeight * index,
        locationStyle,
        line,
      ),
    ),
  ];

  /**
   * Box.
   *
   * Font 3 at 2x/2x makes it clearly readable while still leaving
   * plenty of horizontal room for values such as BOX 10/10.
   */
  const boxX = centeredTextX(boxText, boxStyle);

  const boxCommands = [textCommand(boxX, BOX_Y, boxStyle, boxText)];

  /**
   * ONE outer frame + THREE separators.
   *
   * There are no separate rectangles around individual sections.
   */
  const borderThickness = 2;

  const sectionBorders = [
    // Complete label border. This also provides the TOP border.
    `BOX ${OUTER_LEFT},${OUTER_TOP},${OUTER_RIGHT},${OUTER_BOTTOM},${borderThickness}`,

    // Logo / Docket
    `BAR ${OUTER_LEFT},${LOGO_SEPARATOR_Y},${OUTER_RIGHT - OUTER_LEFT},${borderThickness}`,

    // Docket / Location
    `BAR ${OUTER_LEFT},${DOCKET_SEPARATOR_Y},${OUTER_RIGHT - OUTER_LEFT},${borderThickness}`,

    // Location / Box
    `BAR ${OUTER_LEFT},${LOCATION_SEPARATOR_Y},${OUTER_RIGHT - OUTER_LEFT},${borderThickness}`,
  ];

  const footer = [
    "",
    ...sectionBorders,
    "",
    ...docketCommands,
    "",
    ...locationCommands,
    "",
    ...boxCommands,
    "",
    "PRINT 1",
    "",
  ].join("\r\n");

  return Buffer.concat([
    Buffer.from(header, "utf8"),
    RUDRAX_LOGO_BITMAP,
    Buffer.from(footer, "utf8"),
  ]);
}

async function writeInChunks(
  device: Awaited<ReturnType<typeof BluetoothClassic.connectToDevice>>,
  data: Buffer,
): Promise<void> {
  const CHUNK_SIZE = 128;

  for (let offset = 0; offset < data.length; offset += CHUNK_SIZE) {
    const chunk = data.subarray(
      offset,
      Math.min(offset + CHUNK_SIZE, data.length),
    );

    await device.write(Buffer.from(chunk));

    if (offset + CHUNK_SIZE < data.length) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
}

export class TscLabelPrinter implements LabelPrinterService {
  async print(
    job: LabelJob,
    onProgress?: (progress: PrintProgress) => void,
  ): Promise<PrintResult> {
    const printer = await getSelectedPrinter();

    if (!printer) {
      return {
        status: "failed",
        error: "No printer selected.",
      };
    }

    if (printer.protocol !== "tspl") {
      return {
        status: "failed",
        error: `Unsupported printer protocol: ${printer.protocol}`,
      };
    }

    let device;

    try {
      console.log("=== TSC PRINT START ===");
      console.log("Printer:", printer.name);
      console.log("Address:", printer.address);

      device = await BluetoothClassic.connectToDevice(printer.address);

      if (!device) {
        throw new Error("Unable to connect to the TSC printer.");
      }

      for (let boxNumber = 1; boxNumber <= job.boxCount; boxNumber += 1) {
        const tspl = buildTestLabel(job, boxNumber);

        console.log(`Sending TSPL for box ${boxNumber}/${job.boxCount}`);
        console.log("TSPL bytes:", tspl.length);
        console.log("Logo bytes:", RUDRAX_LOGO_BITMAP.length);

        await writeInChunks(device, tspl);

        onProgress?.({
          currentBox: boxNumber,
          totalBoxes: job.boxCount,
        });

        if (boxNumber < job.boxCount) {
          await new Promise((resolve) => setTimeout(resolve, 150));
        }
      }

      console.log("=== TSC PRINT COMPLETE ===");

      return {
        status: "completed",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      console.error("TSC printing failed:", error);

      return {
        status: "failed",
        error: message,
      };
    } finally {
      try {
        if (device) {
          await device.disconnect();
        }
      } catch (disconnectError) {
        console.warn("Bluetooth disconnect failed:", disconnectError);
      }
    }
  }
}
