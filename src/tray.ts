import { app, Menu, nativeImage, nativeTheme, Tray } from "electron";
import path from "path";

import {
  getLaunchType,
  installLoginItem,
  isLoginItemInstalled,
  LoginItem,
  setLaunchType,
  uninstallLoginItem,
} from "./loginItem";
import { addUpdaterMenu, checkForUpdate, quitAndInstall } from "./updater";
import { createOrGetMainWindow } from "./windows";

let tray: Tray | null = null;

const coloredIcon = nativeImage.createFromPath(
  path.join(__dirname, "../build/icons/tray_colored.ico"),
);
const whiteIcon = nativeImage.createFromPath(
  path.join(__dirname, "../build/icons/tray_white.ico"),
);

const getTrayIcon = () => {
  return nativeTheme.shouldUseDarkColors ? whiteIcon : coloredIcon;
};

export const init = () => {
  // Enable tray icon only on Windows
  if (process.platform !== "win32") return;

  tray = new Tray(getTrayIcon());
  nativeTheme.on("updated", () => {
    tray?.setImage(getTrayIcon());
  });
  const contextMenu = Menu.buildFromTemplate([
    { role: "about" },
    {
      label: "Launch Control",
      submenu: [
        {
          id: "launchOnLogin",
          type: "checkbox",
          label: "Launch on Login",
          checked: isLoginItemInstalled(),
          click: (menuItem) => {
            if (menuItem.checked) installLoginItem();
            else uninstallLoginItem();
          },
        },
        {
          type: "separator",
        },
        {
          id: "showPoeImmediately",
          type: "radio",
          label: "Show Poe Immediately",
          enabled: isLoginItemInstalled(),
          checked: getLaunchType() === "showPoeImmediately",
          click: () => setLaunchType("showPoeImmediately"),
        },
        {
          id: "keepInBackground",
          type: "radio",
          label: "Keep in Background",
          enabled: isLoginItemInstalled(),
          checked: getLaunchType() === "keepInBackground",
          click: () => setLaunchType("keepInBackground"),
        },
      ],
    },
    {
      id: "checkForUpdate",
      label: "Check for updates...",
      click: () => checkForUpdate(true),
    },
    {
      id: "updateDownloading",
      label: "Downloading latest update...",
      visible: false,
    },
    {
      id: "restartToUpdate",
      label: "Restart Poe to use the latest version",
      click: quitAndInstall,
      visible: false,
    },
    {
      label: "Quit",
      click: app.quit,
    },
  ]);
  tray.on("click", () => {
    createOrGetMainWindow().then((window) => window.show());
  });
  tray.setToolTip(app.getName());
  tray.setContextMenu(contextMenu);
  addUpdaterMenu(contextMenu);
  LoginItem.on("updated", (installed) => {
    const launchOnLogin = contextMenu.getMenuItemById("launchOnLogin");
    const showPoeImmediately =
      contextMenu.getMenuItemById("showPoeImmediately");
    const keepInBackground = contextMenu.getMenuItemById("keepInBackground");
    if (installed) {
      if (launchOnLogin) launchOnLogin.checked = true;
      if (showPoeImmediately) showPoeImmediately.enabled = true;
      if (keepInBackground) keepInBackground.enabled = true;
    } else {
      if (launchOnLogin) launchOnLogin.checked = false;
      if (showPoeImmediately) showPoeImmediately.enabled = false;
      if (keepInBackground) keepInBackground.enabled = false;
    }
  });
  LoginItem.on("type-updated", (type) => {
    const showPoeImmediately =
      contextMenu.getMenuItemById("showPoeImmediately");
    const keepInBackground = contextMenu.getMenuItemById("keepInBackground");
    if (type === "keepInBackground") {
      if (showPoeImmediately) showPoeImmediately.checked = false;
      if (keepInBackground) keepInBackground.checked = true;
    } else {
      if (keepInBackground) keepInBackground.checked = false;
      if (showPoeImmediately) showPoeImmediately.checked = true;
    }
  });
};
