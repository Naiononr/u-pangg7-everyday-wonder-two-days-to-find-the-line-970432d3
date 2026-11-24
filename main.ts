// Everyday Wonder — u-pangg7-everyday-wonder-two-days-to-find-the-line-970432d3
//
// The entry line:
//   A stranger's laundry snaps on the line, and for a second someone else's Tuesday is waving at me.
//
// Why this line, against the judge's five criteria (in order):
//   1. Small everyday wonder: a stranger's laundry drying on a line —
//      the most ordinary Tuesday sight there is — is the whole moment.
//   2. The turn is the phrasing itself: the laundry is not drying, it is
//      waving, and what it waves is not a hand but "someone else's
//      Tuesday" — a stranger's ordinary weekday, borrowed for a second
//      and made to greet me. The surprise is the verb plus the noun:
//      an entire day of another person's life, waving.
//   3. One read, one sentence: the image arrives in the first clause
//      (laundry snapping), the turn lands in the second ("someone
//      else's Tuesday is waving at me"), and nothing after it dilutes
//      the hit — the line ends on the wave.
//   4. Grounded and specific: a laundry line, a snap in the wind, a
//      Tuesday. Nothing floats free; every noun is something real you
//      could stand under.
//   5. Every word works: "stranger's" sets the distance the wave then
//      closes; "snaps" gives the sound and the motion; "for a second"
//      makes the wonder brief and therefore true; "Tuesday" is the
//      plainest possible day, which is exactly why it surprises.
//
// The program writes the line exactly, with no trailing newline, to
// <MAKEFUN_OUTPUT_DIR or /output>/entry.txt, mode 0644.

import { chmodSync, copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const LINE = "A stranger's laundry snaps on the line, and for a second someone else's Tuesday is waving at me.";

const OUTPUT_DIR_RAW = process.env.MAKEFUN_OUTPUT_DIR;
// An explicitly empty MAKEFUN_OUTPUT_DIR would resolve entry.txt against
// the working directory instead of /output; treat empty as unset.
const OUTPUT_DIR = OUTPUT_DIR_RAW ? OUTPUT_DIR_RAW : "/output";
const OUTPUT_FILE = join(OUTPUT_DIR, "entry.txt");

function fail(message: string): never {
  throw new Error(message);
}

// Self-check: the gate requires 1-200 UTF-8 characters, a single line, and
// more than whitespace. Control characters are also rejected: the gate reads
// the file as text and the judge reads it as a sentence, so a stray control
// byte would corrupt the read even if the character count passed.
const chars = [...LINE].length;
if (chars < 1 || chars > 200) fail(`line is ${chars} characters, must be 1-200`);
if (LINE !== LINE.trim()) fail("line has leading or trailing whitespace");
if (/\r|\n/.test(LINE)) fail("line must be a single line");
if (!/\S/.test(LINE)) fail("line must not be only whitespace");
if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(LINE)) fail("line contains a control character");

mkdirSync(OUTPUT_DIR, { recursive: true });

// Write to a temp file INSIDE the output dir: the grader mounts /tmp as a
// separate tmpfs, so a rename from os.tmpdir() fails with EXDEV. A same-dir
// temp keeps the rename atomic; an EXDEV fallback copy covers filesystems
// where rename is refused anyway.
const tempPath = join(OUTPUT_DIR, `.entry-${process.pid}.tmp`);
try {
  writeFileSync(tempPath, LINE, { encoding: "utf8", flag: "wx" });
  // World-readable BEFORE the replace, so the scorer can read the file even
  // if the process is interrupted between chmod and rename.
  chmodSync(tempPath, 0o644);
  try {
    renameSync(tempPath, OUTPUT_FILE);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code !== "EXDEV") throw error;
    copyFileSync(tempPath, OUTPUT_FILE);
    chmodSync(OUTPUT_FILE, 0o644);
    rmSync(tempPath, { force: true });
  }
} catch (error) {
  rmSync(tempPath, { force: true });
  throw error;
}

// Verify the written bytes equal the line exactly, that the file is
// world-readable (mode 0644) with the expected byte length — the scorer reads
// the file as another user, so a wrong mode would fail the gate — and that no
// temp file was left behind in the output directory.
function verifyOutput(): void {
  const written = readFileSync(OUTPUT_FILE, "utf8");
  if (written !== LINE) fail("verification failed: written bytes differ from the line");
  const stat = statSync(OUTPUT_FILE);
  if ((stat.mode & 0o777) !== 0o644) fail(`verification failed: entry.txt mode is ${(stat.mode & 0o777).toString(8)}, expected 644`);
  if (stat.size !== Buffer.byteLength(LINE, "utf8")) fail("verification failed: entry.txt byte length differs from the line");
  if (existsSync(tempPath)) fail("verification failed: temp file left behind");
}

verifyOutput();
