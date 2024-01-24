import { app, globalShortcut, Menu } from "electron";

import store from "./store";
import { createOrGetMainWindow } from "./windows";

const acceleratorStoreKey = "globalShortcut.accelerator";
const aksedStoreKey = "globalShortcut.asked";
const enabledStoreKey = "globalShortcut.enabled";

const openMainWindow = () => {
  // The below console.log is workaround.
  // It makes global shortcut works faster.
  console.log("global shortcut is pressed.");
  app.focus();
  createOrGetMainWindow().then((mainWindow) => mainWindow.show());
};

export const getAccelerator = () => {
  if (!store.has(acceleratorStoreKey)) return "CmdOrCtrl+/";
  return store.get(acceleratorStoreKey) as string;
};

export const changeAccelerator = (newAccelerator: string) => {
  if (getEnabled()) {
    globalShortcut.unregister(getAccelerator());
    globalShortcut.register(newAccelerator, openMainWindow);
  }
  store.set(acceleratorStoreKey, newAccelerator);
};

export const getEnabled = () => {
  if (!store.has(aksedStoreKey)) {
    store.set(aksedStoreKey, true);
    store.set(enabledStoreKey, true);
  }
  return !!store.get(enabledStoreKey);
};

export const changeEnabled = (value: boolean) => {
  const menu = Menu.getApplicationMenu()?.getMenuItemById(
    "enableGlobalShortcut",
  );
  if (menu) menu.checked = value;
  store.set(enabledStoreKey, value);
  if (value) {
    globalShortcut.register(getAccelerator(), openMainWindow);
  } else {
    globalShortcut.unregister(getAccelerator());
  }
};

export const init = () => {
  app.on("will-quit", () => {
    // Unregister all shortcuts before quit
    globalShortcut.unregisterAll();
  });
  if (getEnabled()) {
    if (!globalShortcut.isRegistered(getAccelerator())) {
      globalShortcut.register(getAccelerator(), openMainWindow);
    }
  }
};
