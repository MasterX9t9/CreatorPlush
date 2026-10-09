import { describe, it, expect } from "vitest";
import { parseIsoDuration, formatDuration } from "../../lib/providers/youtube/youtube.provider";

describe("YouTube Duration Utilities", () => {
  it("parses standard ISO 8601 durations into total seconds", () => {
    expect(parseIsoDuration("PT15M33S")).toBe(933);
    expect(parseIsoDuration("PT59S")).toBe(59);
    expect(parseIsoDuration("PT1H2M3S")).toBe(3723);
    expect(parseIsoDuration("")).toBe(0);
  });

  it("formats seconds into MM:SS and HH:MM:SS strings", () => {
    expect(formatDuration(59)).toBe("0:59");
    expect(formatDuration(933)).toBe("15:33");
    expect(formatDuration(3723)).toBe("1:02:03");
  });
});
