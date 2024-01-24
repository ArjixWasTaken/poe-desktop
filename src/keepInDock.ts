import { exec } from "child_process";
import path from "path";

import store from "./store";

const storeKey = "keepInDock.asked";

const setKeepInDock = () => {
  const appBundleIdentifier = "com.quora.poe.electron"; // Replace with your app's bundle identifier
  const execPath = process.execPath;
  const appBundlePath = path.dirname(path.dirname(path.dirname(execPath)));

  const dockListCommand = `defaults read com.apple.dock persistent-apps`;
  const dockUpdateCommand = `defaults write com.apple.dock persistent-apps -array-add '<dict><key>tile-data</key><dict><key>file-data</key><dict><key>_CFURLString</key><string>${appBundlePath}</string><key>_CFURLStringType</key><integer>0</integer></dict></dict></dict>' && killall Dock`;

  exec(dockListCommand, (error, stdout) => {
    if (error) return;
    const isAlreadyInDock = stdout.includes(appBundleIdentifier);
    if (isAlreadyInDock) return;
    exec(dockUpdateCommand);
  });
};

export const setKeepInDockOnFirstLaunch = () => {
  // Ignore this if it's not on MacOS
  if (process.platform !== "darwin") return;
  // Ignore if it's not the first launch
  if (store.has(storeKey)) return;
  store.set(storeKey, true);
  setKeepInDock();
};
