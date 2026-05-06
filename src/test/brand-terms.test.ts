import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";

describe("PINCH 브랜드 용어 정합성", () => {
  it("코드베이스에 금칙어('한마디','박제') 및 잘못된 브랜드 표기가 없어야 한다", () => {
    let output = "";
    let failed = false;
    try {
      output = execSync("node scripts/scan-brand-terms.mjs", {
        cwd: process.cwd(),
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (err: unknown) {
      const e = err as { stdout?: string; stderr?: string };
      output = (e.stdout ?? "") + (e.stderr ?? "");
      failed = true;
    }
    expect(failed, output).toBe(false);
  });
});
