import { app } from "electron";
import path from "path";

import { baseUrl } from "./config";
import { createOrGetMainWindow, setWaitingUrl } from "./windows";

const protocol = "poe-app";

const openUrl = (url: string) => {
  if (!url.startsWith(protocol)) return;

  const webUrl = url.replace(`${protocol}://`, "https://");
  // do nothing if the given URL doesn't start with the base URL
  if (!webUrl.startsWith(baseUrl)) return;

  if (!app.isReady()) {
    // if app is not ready yet,
    // set waiting url instead of creating window
    // (the app will crash on creating a new window before the app is ready)
    setWaitingUrl(webUrl);
  } else {
    createOrGetMainWindow().then((mainWindow) => {
      mainWindow.loadURL(webUrl);
      mainWindow.show();
    });
  }
};

export const init = () => {
  // Register deep linking
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(protocol, process.execPath, [
        path.resolve(process.argv[1]),
      ]);
    }
  } else {
    app.setAsDefaultProtocolClient(protocol);
  }

  // Block multiple instances on Windows
  const gotTheLock = app.requestSingleInstanceLock();
  if (!gotTheLock) {
    app.quit();
  } else {
    app.on("second-instance", (evt, commandLine) => {
      createOrGetMainWindow().then((mainWindow) => mainWindow.show());
      const url = commandLine.pop();
      if (url !== undefined && url.startsWith(protocol)) openUrl(url);
    });
  }

  if (process.platform == "win32") {
    // Open the deep link when app is opened
    const url = process.argv[process.argv.length - 1];
    if (url.startsWith(protocol)) openUrl(url);
  }

  app.on("open-url", (evt, url) => {
    // handle deep links on macOS
    openUrl(url);
  });
};
