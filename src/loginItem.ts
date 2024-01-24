import { app } from "electron";
import EventEmitter from "events";

import store from "./store";

const askedStoreKey = "loginItem.asked";
const launchTypeStoreKey = "loginItem.keepInBackground";

type LaunchType = "showPoeImmediately" | "keepInBackground";

interface Events {
  updated: (installed: boolean) => void;
  "type-updated": (type: LaunchType) => void;
}
declare interface LoginItemEmitterType {
  on<U extends keyof Events>(event: U, listener: Events[U]): this;
  emit<U extends keyof Events>(
    event: U,
    ...args: Parameters<Events[U]>
  ): boolean;
}
class LoginItemEmitter extends EventEmitter {}

export const LoginItem: LoginItemEmitterType = new LoginItemEmitter();

export const installLoginItemOnFirstLaunch = () => {
  // Ignore if it's not the first launch
  if (store.has(askedStoreKey)) return;
  store.set(askedStoreKey, true);
  installLoginItem();
};

export const isLoginItemInstalled = () => {
  const { openAtLogin, executableWillLaunchAtLogin } =
    app.getLoginItemSettings();
  return executableWillLaunchAtLogin || openAtLogin;
};

export const getLaunchType = () => {
  if (store.has(launchTypeStoreKey)) return "keepInBackground";
  return "showPoeImmediately";
};

export const setLaunchType = (type: LaunchType) => {
  if (type === "keepInBackground") store.set(launchTypeStoreKey, true);
  else store.delete(launchTypeStoreKey);
  LoginItem.emit("type-updated", type);
};

export const installLoginItem = () => {
  app.setLoginItemSettings({
    openAtLogin: true,
    args: ["--launched-on-login"],
  });
  LoginItem.emit("updated", true);
};

export const uninstallLoginItem = () => {
  app.setLoginItemSettings({
    openAtLogin: false,
  });
  LoginItem.emit("updated", false);
};
