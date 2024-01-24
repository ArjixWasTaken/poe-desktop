import { ipcMain } from "electron";

import {
  changeAccelerator,
  changeEnabled,
  getAccelerator,
  getEnabled,
} from "./globalShortcut";

export const init = () => {
  ipcMain.handle("loadPreferences", () => {
    return {
      globalShortcutEnabled: getEnabled(),
      globalShortcutAccelerator: getAccelerator(),
    };
  });
  ipcMain.on(
    "updatePreferences",
    (evt, options: { [key: string]: unknown }) => {
      for (const [key, value] of Object.entries(options)) {
        if (key === "globalShortcutAccelerator") {
          if (typeof value !== "string") continue;
          changeAccelerator(value);
        }
        if (key === "globalShortcutEnabled") {
          if (typeof value !== "boolean") continue;
          changeEnabled(value);
        }
      }
    },
  );
};
