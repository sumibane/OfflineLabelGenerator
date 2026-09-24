import type { LabelJob } from "@/models/label-job";
import type { LabelProtocol } from "../label-protocol";

const LABEL_WIDTH_INCHES = 3;
const LABEL_HEIGHT_INCHES = 4;

const DPI = 203;

const LABEL_WIDTH_DOTS = Math.round(LABEL_WIDTH_INCHES * DPI);
const LABEL_HEIGHT_DOTS = Math.round(LABEL_HEIGHT_INCHES * DPI);

function escapeTsplText(value: string): string {
  return value.replace(/"/g, '\\"');
}

function buildLabelCommands(job: LabelJob, boxNumber: number): string {
  const docketNumber = escapeTsplText(job.docketNumber);
  const location = escapeTsplText(job.locationText);
  const boxText = `${boxNumber}/${job.boxCount}`;

  return [
    `SIZE ${LABEL_WIDTH_INCHES},${LABEL_HEIGHT_INCHES}`,
    "GAP 0,0",
    "DIRECTION 1",
    "CLS",
    `TEXT 40,40,"0",0,3,3,"DOCKET NUMBER"`,
    `TEXT 40,100,"0",0,3,3,"${docketNumber}"`,
    `TEXT 40,180,"0",0,3,3,"LOCATION"`,
    `TEXT 40,240,"0",0,3,3,"${location}"`,
    `TEXT 40,${LABEL_HEIGHT_DOTS - 120},"0",0,4,4,"BOX ${boxText}"`,
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
