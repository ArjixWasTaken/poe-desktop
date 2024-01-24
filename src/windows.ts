import { app, BrowserWindow, Menu, nativeTheme, shell } from "electron";
import path from "path";

import { baseUrl, hideTitleBar } from "./config";
import { init as conextMenuInit } from "./contextMenu";
import store from "./store";
import { getUserAgent } from "./userAgent";

let waitingUrl: string | null = null;

let isQuitting = false;

export const setIsQuitting = (value: boolean) => {
  isQuitting = value;
};

const knownNonChatUrls = [
  `${baseUrl}/about`,
  `${baseUrl}/privacy`,
  `${baseUrl}/privacy_center`,
  `${baseUrl}/tos`,
  `${baseUrl}/usage_guidelines`,
  `${baseUrl}/contact`,
  `${baseUrl}/subscriber_tos`,
  `${baseUrl}/prompt_examples`,
];

const shouldOpenInApp = (url: string) => {
  let result = true;
  if (url.includes("/login?desktop_app_login_request_code=")) {
    // If it's desktop app login URL, open it in external browser
    result = false;
  }
  if (knownNonChatUrls.includes(url)) {
    // Allow opening a new window if the url is in the list
    result = false;
  }
  if (url.startsWith(baseUrl)) {
    const arr = url.split("/");
    if (arr.length == 5 && !isNaN(Number(arr[4]))) {
      // Rough algorithm to check if the URL is a shareable link
      // For example, https://poe.com/myungwoo/1512928000043224
      result = false;
    }
  } else {
    // If it's not a poe link (e.g. app store, twitter link)
    result = false;
  }
  return result;
};

app.on("browser-window-created", (event, window) => {
  window.on("page-title-updated", (evt) => {
    evt.preventDefault();
  });
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (shouldOpenInApp(url)) {
      createChatWindow({ url, showFirst: true });
    } else {
      shell.openExternal(url);
    }
    // All window openings should be denied as we are handling them in our own way.
    return {
      action: "deny",
    };
  });
});

const windows: BrowserWindow[] = [];

const getTitleBarOverlay = (shouldUseDarkColors: boolean) => {
  const height = 40;
  return shouldUseDarkColors
    ? {
        color: "#464e4e", // --pdl-bg-muted (dark mode)
        symbolColor: "#ffffff",
        height,
      }
    : {
        color: "#e4e7e7", // --pdl-bg-muted (light mode)
        symbolColor: "#000000",
        height,
      };
};

export const createChatWindow = async ({
  hidden = false,
  url = null,
  showFirst = false,
}: {
  hidden?: boolean;
  url?: string | null;
  showFirst?: boolean;
} = {}): Promise<BrowserWindow> => {
  const opt = {
    title: "",
    width: 800,
    height: 600,
    minWidth: 400,
    minHeight: 400,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
    show: showFirst,
  } as Electron.BrowserWindowConstructorOptions;

  if (hideTitleBar) {
    // Title bar setting
    Object.assign(opt, {
      frame: false,
      titleBarStyle: "hidden",
    });
    if (process.platform === "darwin") {
      Object.assign(opt, {
        // Adjust traffic light position based on the title bar height (40px)
        trafficLightPosition: {
          x: 12,
          y: 12,
        },
      });
    }
    if (process.platform === "win32") {
      Object.assign(opt, {
        titleBarOverlay: getTitleBarOverlay(false),
      });
    }
  }

  if (store.has("winBounds")) {
    Object.assign(opt, store.get("winBounds"));
  }
  const window = new BrowserWindow(opt);
  windows.push(window);

  if (hideTitleBar && process.platform === "win32") {
    // Change the color of overlay icons when the theme changed
    nativeTheme.on("updated", () => {
      window.setTitleBarOverlay(
        getTitleBarOverlay(nativeTheme.shouldUseDarkColors),
      );
    });
  }

  if (process.platform === "win32") {
    // Hide the menu bar on Windows
    // We should hide the menu bar instead of not creating it
    // to support a few shortcuts from menu bar
    // (e.g. open new window by Ctrl+N)
    window.setMenuBarVisibility(false);
  }

  // Setting the user agent
  const userAgent = await getUserAgent();
  window.webContents.setUserAgent(userAgent);

  if (!store.has("winBounds")) {
    window.maximize();
  }

  window.on("focus", () => {
    const menu = Menu.getApplicationMenu()?.getMenuItemById("floatOnTop");
    if (menu) menu.checked = window.isAlwaysOnTop();
  });

  window.webContents.on("dom-ready", () => {
    // If you want to polish the left-right margin, uncomment the below
    // const css = `:root {
    //   --desktop-page-wrapper-max-width: 100% !important;
    // }`;
    // window.webContents.insertCSS(css);
    window.webContents.executeJavaScript(
      "document.body.classList.add('desktop-app')",
    );
  });

  window.webContents.on("before-input-event", (evt, input) => {
    // Cmd+= works on macOS, but Ctrl+= does not work on Windows. However, Ctrl+Shift+= works on Windows.
    // This modification enables Ctrl+= to work on Windows.
    if (process.platform !== "win32") return;
    if (
      input.type === "keyDown" &&
      input.control &&
      !input.shift &&
      !input.alt &&
      !input.meta &&
      input.key === "="
    ) {
      evt.preventDefault();
      window.webContents.zoomLevel += 0.5;
    }
  });

  window.on("close", (evt) => {
    const idx = windows.indexOf(window);
    if (windows.length === 1) {
      store.set("winBounds", window?.getBounds());
      if (!isQuitting) {
        // Check if it's a regular window close other than app quit
        // Preserve the last window in case it opens again.
        window.hide();
        return evt.preventDefault();
      }
    }
    windows.splice(idx, 1);
  });

  window.on("ready-to-show", () => {
    if (!hidden) window.show();
  });

  conextMenuInit(window);

  await window.loadURL(url || waitingUrl || baseUrl);
  if (url === null && waitingUrl !== null) waitingUrl = null;
  return window;
};

export const createOrGetMainWindow = async (
  hidden: boolean = false,
): Promise<BrowserWindow> => {
  if (windows.length === 0) {
    return await createChatWindow({ hidden });
  }
  return windows[0];
};

export const setWaitingUrl = (url: string) => {
  waitingUrl = url;
};
