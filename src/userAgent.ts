import { app, session } from "electron";
import si from "systeminformation";

import { isDev } from "./config";

export const getUserAgent = async () => {
  const env = isDev ? "dev" : "prod";
  const [{ model }, { arch, build, distro, release }] = await Promise.all([
    si.system(),
    si.osInfo(),
  ]);
  return `Poe ${app.getVersion()} rv:0 env:${env} (${model} ${arch}; ${distro} Version ${release} (Build ${build}); en_US)`;
  // Mac: Poe 1.1.1-dev rv:0 env:dev (MacBookPro18,1 arm64; macOS Version 13.4.1 (Build 22F82); en_US)
};

const isOurDomain = (hostname: string) => {
  return (
    hostname.endsWith("poe.com") ||
    hostname.endsWith("quora.com") ||
    hostname.endsWith("quora.net") ||
    hostname.endsWith("poecdn.net") ||
    hostname.endsWith("quoracdn.net")
  );
};

export const init = async () => {
  await app.whenReady();
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const hostname = new URL(details.url).hostname;
    if (!isOurDomain(hostname)) {
      // Use the default user agent for other domains
      // Some services like Google return 403 sometimes for the custom user agent
      details.requestHeaders["User-Agent"] = app.userAgentFallback;
    }
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });
};
