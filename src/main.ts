import { app, ipcMain } from "electron";
import squirrelStartup from "electron-squirrel-startup";

import { hideTitleBar } from "./config";
import { init as deepLinkInit } from "./deepLink";
import { init as globalShortcutInit } from "./globalShortcut";
import { setKeepInDockOnFirstLaunch } from "./keepInDock";
import { getLaunchType, installLoginItemOnFirstLaunch } from "./loginItem";
import { init as menuInit } from "./menu";
import { init as preferencesInit } from "./preferences";
import { init as trayInit } from "./tray";
import { init as updaterInit } from "./updater";
import { init as userAgentInit } from "./userAgent";
import { createOrGetMainWindow, setIsQuitting } from "./windows";

// For Squirrel.Windows
if (squirrelStartup) app.quit();

const isLaunchOnLogin =
  process.argv.includes("--launched-on-login") ||
  app.getLoginItemSettings().wasOpenedAtLogin;

// Setting the app name
app.setName("Poe");

updaterInit();
menuInit();
deepLinkInit();
userAgentInit();
preferencesInit();

app.whenReady().then(() => {
  const hidden = isLaunchOnLogin && getLaunchType() === "keepInBackground";
  createOrGetMainWindow(hidden);
  globalShortcutInit();
  installLoginItemOnFirstLaunch();
  setKeepInDockOnFirstLaunch();
  trayInit();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin" && process.platform !== "win32") {
    // This will be never reached.
    app.quit();
  }
});

app.on("activate", () => {
  createOrGetMainWindow().then((window) => window.show());
});

app.on("before-quit", () => setIsQuitting(true));

ipcMain.on("getInfo", (evt) => {
  evt.returnValue = {
    appVersion: app.getVersion(),
    platform: process.platform,
    hideTitleBar,
  };
});

ipcMain.on("canGoBack", (evt) => {
  evt.returnValue = evt.sender.canGoBack();
});

ipcMain.on("canGoForward", (evt) => {
  evt.returnValue = evt.sender.canGoForward();
});
