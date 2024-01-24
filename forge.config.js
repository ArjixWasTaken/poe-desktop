const path = require("path");

module.exports = {
  packagerConfig: {
    name: "Poe",
    executableName: "Poe",
    appBundleId: "com.quora.poe.electron",
    appCategoryType: "public.app-category.productivity",
    protocols: [
      {
        name: "Poe deep links",
        schemes: ["poe-app"],
      },
    ],
    asar: true,
    icon: path.resolve(__dirname, "build", "icons", "icon"),
    osxSign: {
      optionsForFile: () => {
        return {
          entitlements: "build/entitlements.mac.plist",
        };
      },
    },
    osxNotarize: {
      tool: "notarytool",
      appleId: process.env.appleId,
      appleIdPassword: process.env.appleIdPassword,
      teamId: process.env.appleTeamId,
    },
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        iconUrl: "https://desktop-app.poecdn.net/icon.ico",
        loadingGif: path.resolve(__dirname, "build", "loading.gif"),
        setupIcon: path.resolve(__dirname, "build", "icons", "icon.ico"),
        // CERTIFICATE_PATH should be in the Windows path format
        // (e.g. C:\Users\user\cert.crt)
        signWithParams: `/csp "DigiCert Signing Manager KSP" /kc key_542942066 /f ${process.env.CERTIFICATE_PATH} /tr http://timestamp.digicert.com /td SHA256 /fd SHA256`,
      },
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
      config: {},
    },
    {
      name: "@electron-forge/maker-dmg",
      config: {
        background: "build/background.tiff",
        contents: (opts) => [
          {
            x: 395,
            y: 160,
            type: "link",
            path: "/Applications",
          },
          {
            x: 155,
            y: 160,
            type: "file",
            path: opts.appPath,
          },
        ],
        format: "ULFO",
        icon: path.resolve(__dirname, "build", "icons", "icon.icns"),
        window: {
          size: {
            width: 550,
            height: 380,
          },
        },
      },
    },
  ],
  plugins: [
    {
      name: "@electron-forge/plugin-auto-unpack-natives",
      config: {},
    },
  ],
};
