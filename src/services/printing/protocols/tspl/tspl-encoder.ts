import type { LabelJob } from "@/models/label-job";
import type { LabelProtocol } from "../label-protocol";

const LABEL_WIDTH_INCHES = 3;
const LABEL_HEIGHT_INCHES = 4;
const DPI = 203;

const LABEL_WIDTH_DOTS = Math.round(LABEL_WIDTH_INCHES * DPI);
const LABEL_HEIGHT_DOTS = Math.round(LABEL_HEIGHT_INCHES * DPI);

function escapeTsplText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r/g, " ")
    .replace(/\n/g, " ");
}

function buildLabelCommands(job: LabelJob, boxNumber: number): string {
  const docketNumber = escapeTsplText(job.docketNumber);
  const location = escapeTsplText(job.locationText);
  const boxText = `${boxNumber}/${job.boxCount}`;

  return [
    `SIZE ${LABEL_WIDTH_INCHES},${LABEL_HEIGHT_INCHES}`,
    "GAP 0,0",
    "DIRECTION 1",
    "REFERENCE 0,0",
    "CLS",

    // Header
    `TEXT 40,35,"0",0,2,2,"RUDRAX LOGISTICS SERVICES"`,

    // Docket number
    `TEXT 40,100,"0",0,2,2,"DOCKET NUMBER"`,
    `TEXT 40,145,"0",0,3,3,"${docketNumber}"`,

    // Location
    `TEXT 40,225,"0",0,2,2,"LOCATION"`,
    `TEXT 40,270,"0",0,3,3,"${location}"`,

    // Box number
    `TEXT 40,${LABEL_HEIGHT_DOTS - 150},"0",0,2,2,"BOX"`,

    `TEXT 40,${LABEL_HEIGHT_DOTS - 95},"0",0,5,5,"${boxText}"`,

    "PRINT 1",
  ].join("\r\n");
}

export class TsplEncoder implements LabelProtocol {
  encode(job: LabelJob): Uint8Array {
    const commands: string[] = [];

    for (let boxNumber = 1; boxNumber <= job.boxCount; boxNumber += 1) {
      commands.push(buildLabelCommands(job, boxNumber));
    }

    const commandText = `${commands.join("\r\n")}\r\n`;

    return new TextEncoder().encode(commandText);
  }
}
