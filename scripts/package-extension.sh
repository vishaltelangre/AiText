#!/bin/bash

# Exit on error
set -e

# Build the extension
echo "Building the extension..."
pnpm build

# Create a temporary directory for packaging
echo "Creating package directory..."
TEMP_DIR="temp_package"
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

# Copy necessary files
echo "Copying files..."
cp manifest.json "$TEMP_DIR/"
cp -r dist "$TEMP_DIR/"
cp -r icons "$TEMP_DIR/"
mkdir -p "$TEMP_DIR/popup"
mkdir -p "$TEMP_DIR/options"
cp -r popup/*.html "$TEMP_DIR/popup/"
cp -r options/*.html "$TEMP_DIR/options/"
cp LICENSE "$TEMP_DIR/"

# Create the zip file
echo "Creating zip file..."
ZIP_NAME="ai-text-firefox-$(grep '"version":' manifest.json | cut -d'"' -f4).zip"
rm -f "$ZIP_NAME"
cd "$TEMP_DIR"
zip -r "../$ZIP_NAME" ./*
cd ..

# Clean up
echo "Cleaning up..."
rm -rf "$TEMP_DIR"

echo "Package created successfully: $ZIP_NAME"
