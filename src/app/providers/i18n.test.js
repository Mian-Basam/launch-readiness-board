import { describe, it, expect } from "vitest";
import { translate } from "./i18n.js";

describe("i18n", () => {
  it("interpolates placeholders and falls back sensibly", () => {
    expect(translate("en", "queued", { n: 3 })).toBe("Queued offline actions: 3");
    expect(translate("en", "showing", { n: 1, total: 2 })).toBe("1 of 2 issues");
    expect(translate("fr", "done")).toBe("Done");
    expect(translate("en", "missingKey")).toBe("missingKey");
    expect(translate("en", "daysLeft", {})).toBe("{n} days left");
  });
});
