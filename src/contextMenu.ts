import {
  BrowserWindow,
  Menu,
  MenuItemConstructorOptions,
  shell,
} from "electron";

import { isDev } from "./config";

type Action =
  | "addToDictionary"
  | "copy"
  | "cut"
  | "inspect"
  | "lookUpSelection"
  | "paste"
  | "searchWithGoogle"
  | "separator"
  | "services";

const removeUnusedMenuItems = (menuTemplate: MenuItemConstructorOptions[]) => {
  const ret: MenuItemConstructorOptions[] = [];
  menuTemplate
    .filter((menuItem) => menuItem.visible === undefined || menuItem.visible)
    .forEach((val) => {
      if (val.type === "separator") {
        if (ret.length === 0 || ret[ret.length - 1].type === "separator")
          return;
      }
      ret.push(val);
    });
  while (ret.length > 0 && ret[ret.length - 1].type === "separator") ret.pop();
  return ret;
};

export const init = (window: BrowserWindow) => {
  window.webContents.on("context-menu", (evt, params) => {
    const { editFlags, isEditable } = params;
    const selectionText = params.selectionText.trim();
    const hasText = selectionText.length > 0;
    const isLink = Boolean(params.linkURL);

    const predefinedActions: Record<Action, MenuItemConstructorOptions> = {
      separator: { type: "separator" },
      addToDictionary: {
        label: "&Add to Dictionary",
        visible: Boolean(isEditable && hasText && params.misspelledWord),
        click: () => {
          window.webContents.session.addWordToSpellCheckerDictionary(
            params.misspelledWord,
          );
        },
      },
      lookUpSelection: {
        label: `Look Up "${selectionText}"`,
        visible: process.platform === "darwin" && hasText && !isLink,
        click: () => {
          if (process.platform === "darwin")
            window.webContents.showDefinitionForSelection();
        },
      },
      searchWithGoogle: {
        label: "&Search with Google",
        visible: hasText,
        click: () => {
          const url = new URL("https://www.google.com/search");
          url.searchParams.set("q", selectionText);
          shell.openExternal(url.toString());
        },
      },
      cut: {
        label: "Cu&t",
        enabled: editFlags.canCut,
        visible: isEditable,
        click: () => window.webContents.cut(),
        accelerator: "CmdOrCtrl+X",
      },
      copy: {
        label: "&Copy",
        enabled: editFlags.canCopy,
        visible: isEditable || hasText,
        click: () => window.webContents.copy(),
        accelerator: "CmdOrCtrl+C",
      },
      paste: {
        label: "&Paste",
        enabled: editFlags.canPaste,
        visible: isEditable,
        click: () => window.webContents.paste(),
        accelerator: "CmdOrCtrl+V",
      },
      inspect: {
        label: "I&nspect Element",
        visible: isDev,
        click: () => {
          window.webContents.inspectElement(params.x, params.y);
          if (window.webContents.isDevToolsOpened())
            window.webContents.devToolsWebContents?.focus();
        },
      },
      services: {
        label: "Services",
        role: "services",
        visible: process.platform === "darwin" && (isEditable || hasText),
      },
    };

    const menuTemplate = removeUnusedMenuItems([
      ...params.dictionarySuggestions.map((word) => ({
        label: word,
        visible: Boolean(isEditable && hasText && params.misspelledWord),
        click: () => window.webContents.replaceMisspelling(word),
      })),
      predefinedActions.separator,
      predefinedActions.addToDictionary,
      predefinedActions.lookUpSelection,
      predefinedActions.searchWithGoogle,
      predefinedActions.separator,
      predefinedActions.cut,
      predefinedActions.copy,
      predefinedActions.paste,
      predefinedActions.separator,
      predefinedActions.inspect,
    ]);

    if (menuTemplate.length > 0) {
      const menu = Menu.buildFromTemplate(menuTemplate);
      menu.popup();
    }
  });
};
