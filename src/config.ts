import { app } from "electron";

export const baseUrl = process.env.POE_APP_BASE_URL || "https://poe.com";
export const hideTitleBar = !!process.env.POE_APP_HIDE_TITLE_BAR;
export const overrideUpdaterUrl = process.env.POE_APP_OVERRIDE_UPDATER_URL;
export const isDev =
  !app.isPackaged ||
  app.getVersion().includes("dev") ||
  !!process.env.POE_APP_DEBUG;
