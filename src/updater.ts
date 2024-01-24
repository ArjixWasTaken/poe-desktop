import { app, autoUpdater, dialog, Menu } from "electron";

import { overrideUpdaterUrl } from "./config";
import { setIsQuitting } from "./windows";

const isMac = process.platform === "darwin";
const platform = process.platform + "_" + process.arch;
const version = app.getVersion();

// 0 - can check the update
// 1 - downloading in progress
// 2 - update is downloaded
let _status = 0;
let _verbose = false;

const updaterMenus: Menu[] = [];

function setUpdateStatus(newStatus: number) {
  _status = newStatus;
  for (const menu of updaterMenus) {
    const menuItems = [
      menu.getMenuItemById("checkForUpdate"),
      menu.getMenuItemById("updateDownloading"),
      menu.getMenuItemById("restartToUpdate"),
    ];
    menuItems.forEach((menuItem, idx) => {
      if (!menuItem) return;
      if (idx == _status) menuItem.visible = true;
      else menuItem.visible = false;
    });
  }
}

export const addUpdaterMenu = (menu: Menu) => {
  updaterMenus.push(menu);
};

export const getUpdateStatus = () => {
  return _status;
};

export const checkForUpdate = (verbose = false) => {
  if (verbose) _verbose = true;
  if (getUpdateStatus() !== 0) return;
  _verbose = verbose;
  autoUpdater.checkForUpdates();
};

export const quitAndInstall = () => {
  if (getUpdateStatus() !== 2) return;
  setIsQuitting(true);
  autoUpdater.quitAndInstall();
};

export const init = () => {
  const updaterUrl =
    overrideUpdaterUrl ||
    (isMac
      ? `https://updater.poe.com/${platform}/${version}`
      : `https://desktop-app.poecdn.net/updates/${platform}`);
  autoUpdater.setFeedURL({ url: updaterUrl });

  autoUpdater.on("update-available", () => {
    setUpdateStatus(1);
    if (_verbose) {
      dialog.showMessageBox({
        type: "info",
        message: "Update available",
        detail: `New version is available. You have ${app.getVersion()}.`,
      });
    }
  });

  autoUpdater.on("update-not-available", () => {
    setUpdateStatus(0); // just in case
    if (_verbose) {
      dialog.showMessageBox({
        type: "info",
        message: "You are up to date",
        detail: `You are on the latest version ${app.getVersion()}.`,
      });
    }
  });

  autoUpdater.on("update-downloaded", () => {
    setUpdateStatus(2);
    if (_verbose) {
      const dialogOpts = {
        type: "info",
        buttons: ["Restart", "Later"],
        message: "Update is available",
        detail: "Restart Poe to use the newest version",
      } as Electron.MessageBoxOptions;
      dialog.showMessageBox(dialogOpts).then((returnValue) => {
        if (returnValue.response === 0) quitAndInstall();
      });
    }
  });

  autoUpdater.on("error", (message) => {
    setUpdateStatus(0);
    if (_verbose) {
      dialog.showMessageBox({
        type: "error",
        message: "Application Update Failure",
        detail: message.message,
      });
    }
  });

  setTimeout(checkForUpdate, 60 * 1000); // Run it 1 minute after the app starts
  setInterval(checkForUpdate, 60 * 60 * 1000); // And repeat it every 1 hour
};
