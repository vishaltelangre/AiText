const path = require("path");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const fs = require("fs");
const webpack = require("webpack");

// Determine output directory based on environment variable
const outputDir = process.env.BROWSER === "chrome" ? "dist-chrome" : "dist-firefox";

// Read the web extension polyfill content
const polyfillPath = require.resolve("webextension-polyfill/dist/browser-polyfill.min.js");
const polyfillContent = fs.readFileSync(polyfillPath, "utf8");

// Custom plugin to handle manifest and HTML files
class ExtensionPlugin {
  apply(compiler) {
    compiler.hooks.afterEmit.tap("ExtensionPlugin", () => {
      // Handle manifest file
      const manifestPath = path.resolve(__dirname, "manifest.json");
      const targetPath = path.resolve(__dirname, outputDir, "manifest.json");

      // Read and parse the manifest
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

      if (process.env.BROWSER === "chrome") {
        // For Chrome, remove the background.scripts field from background
        delete manifest.background.scripts;
      } else if (process.env.BROWSER === "firefox") {
        // For Firefox, remove the background.service_worker field from background
        delete manifest.background.service_worker;
      }

      // Write the modified manifest
      fs.writeFileSync(targetPath, JSON.stringify(manifest, null, 2));

      // Handle HTML files
      const htmlFiles = [
        { src: "popup/popup.html", dest: "popup/popup.html" },
        { src: "options/options.html", dest: "options/options.html" },
      ];

      htmlFiles.forEach(({ src, dest }) => {
        const sourcePath = path.resolve(__dirname, src);
        const targetPath = path.resolve(__dirname, outputDir, dest);

        // Ensure target directory exists
        fs.mkdirSync(path.dirname(targetPath), { recursive: true });

        // Copy the file
        fs.copyFileSync(sourcePath, targetPath);
      });

      // Copy icons folder
      const copyDir = (src, dest) => {
        // Create destination directory
        fs.mkdirSync(dest, { recursive: true });

        // Read directory contents
        const entries = fs.readdirSync(src, { withFileTypes: true });

        for (const entry of entries) {
          const srcPath = path.join(src, entry.name);
          const destPath = path.join(dest, entry.name);

          if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
          } else {
            fs.copyFileSync(srcPath, destPath);
          }
        }
      };

      const iconsSrc = path.resolve(__dirname, "icons");
      const iconsDest = path.resolve(__dirname, outputDir, "icons");
      copyDir(iconsSrc, iconsDest);
    });
  }
}

module.exports = {
  mode: process.env.NODE_ENV === "production" ? "production" : "development",
  devtool: "source-map",
  optimization: {
    minimize: false, // Disable minification
    minimizer: [], // Explicitly set empty minimizer
  },
  entry: {
    background: "./background.ts",
    content: "./content.ts",
    "popup/popup": "./popup/popup.tsx",
    "options/options": "./options/options.tsx",
  },
  output: {
    path: path.resolve(__dirname, outputDir),
    filename: "[name].js",
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: "ts-loader",
            options: {
              transpileOnly: true,
              compilerOptions: {
                jsx: "react-jsx",
              },
            },
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin({
      typescript: {
        diagnosticOptions: {
          semantic: true,
          syntactic: true,
        },
      },
    }),
    new ExtensionPlugin(),
    // Add the polyfill to the beginning of each output file
    new webpack.BannerPlugin({
      banner: polyfillContent,
      raw: true,
      include: /\.(js)$/,
    }),
  ],
};
