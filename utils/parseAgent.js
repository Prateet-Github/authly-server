import * as UAParser from "ua-parser-js";

export const parseAgent = (userAgent = "") => {
  const parser = new UAParser.UAParser(userAgent);
  const r = parser.getResult();

  return {
    browser: r.browser.name
      ? `${r.browser.name} ${r.browser.version || ""}`.trim()
      : "Unknown",
    os: r.os.name
      ? `${r.os.name} ${r.os.version || ""}`.trim()
      : "Unknown",
    device: r.device.type || "desktop",
  };
};