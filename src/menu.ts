import { app, BrowserWindow, Menu } from "electron";

import { isDev } from "./config";
import { addUpdaterMenu, checkForUpdate, quitAndInstall } from "./updater";
import { createChatWindow } from "./windows";

const isMac = process.platform === "darwin";

export const init = () => {
  const template: Electron.MenuItemConstructorOptions[] = [
    ...((isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" },
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
              { type: "separator" },
              { role: "services" },
              { type: "separator" },
              { role: "hide" },
              { role: "hideOthers" },
              { role: "unhide" },
              { type: "separator" },
              { role: "quit" },
            ],
          },
        ]
      : []) as Electron.MenuItemConstructorOptions[]),
    // { role: 'fileMenu' },
    {
      label: "File",
      submenu: [
        {
          label: "New Window",
          accelerator: "CmdOrCtrl+N",
          click: () => createChatWindow({ showFirst: true }),
        },
        isMac ? { role: "close" } : { role: "quit" },
      ],
    },
    // { role: 'editMenu' },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        ...((isMac
          ? [
              { role: "pasteAndMatchStyle" },
              { role: "delete" },
              { role: "selectAll" },
              { type: "separator" },
              {
                label: "Speech",
                submenu: [{ role: "startSpeaking" }, { role: "stopSpeaking" }],
              },
            ]
          : [
              { role: "delete" },
              { type: "separator" },
              { role: "selectAll" },
            ]) as Electron.MenuItemConstructorOptions[]),
      ],
    },
    // { role: 'viewMenu' },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        ...((isDev
          ? [{ role: "toggleDevTools" }]
          : []) as Electron.MenuItemConstructorOptions[]),
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "History",
      submenu: [
        {
          label: "Back",
          accelerator: "CmdOrCtrl+[",
          click: () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow && focusedWindow.webContents.canGoBack()) {
              focusedWindow.webContents.goBack();
            }
          },
        },
        {
          label: "Forward",
          accelerator: "CmdOrCtrl+]",
          click: () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow && focusedWindow.webContents.canGoForward()) {
              focusedWindow.webContents.goForward();
            }
          },
        },
      ],
    },
    // { role: 'windowMenu' },
    {
      label: "Window",
      submenu: [
        {
          id: "floatOnTop",
          label: "Float on Top",
          type: "checkbox",
          click: (menuItem, focusedWindow) => {
            const checked = menuItem.checked;
            focusedWindow?.setAlwaysOnTop(checked);
          },
        },
        { type: "separator" },
        { role: "minimize" },
        { role: "zoom" },
        ...((isMac
          ? [
              { type: "separator" },
              { role: "front" },
              { type: "separator" },
              { role: "window" },
            ]
          : [{ role: "close" }]) as Electron.MenuItemConstructorOptions[]),
      ],
    },
    {
      role: "help",
      // submenu: [
      //   {
      //     label: 'Learn More',
      //     click: async () => {
      //       const { shell } = require('electron')
      //       await shell.openExternal('https://electronjs.org')
      //     }
      //   }
      // ]
    },
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  addUpdaterMenu(menu);
};
