#!/bin/bash

# Exit on error
set -e

# Get current version from manifest.json
CURRENT_VERSION=$(grep '"version":' manifest.json | cut -d'"' -f4)
echo "Current version: $CURRENT_VERSION"

# Prompt for new version
read -p "Enter new version (press Enter to keep current version): " NEW_VERSION
if [ -z "$NEW_VERSION" ]; then
    NEW_VERSION=$CURRENT_VERSION
fi

# Update versions in both files
echo "Updating version to $NEW_VERSION..."

# Detect OS and use appropriate sed command
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" manifest.json
    sed -i '' "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" package.json
else
    # Linux
    sed -i "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" manifest.json
    sed -i "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" package.json
fi

# Check if files were modified
if ! git diff --quiet manifest.json package.json; then
    # Prompt for git commit
    read -p "Do you want to commit version changes to git? (y/N): " COMMIT_CHANGES
    if [[ $COMMIT_CHANGES =~ ^[Yy]$ ]]; then
        git add manifest.json package.json
        git commit -m "Bump version to v$NEW_VERSION"
        echo "Version changes committed to git"
    fi
fi

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
ZIP_NAME="ai-text-firefox-$NEW_VERSION.zip"
rm -f "$ZIP_NAME"
cd "$TEMP_DIR"
zip -r "../$ZIP_NAME" ./*
cd ..

# Clean up
echo "Cleaning up..."
rm -rf "$TEMP_DIR"

echo "Package created successfully: $ZIP_NAME"

# Create source code zip for Mozilla submission
echo "Creating source code zip for Mozilla submission..."
SOURCE_ZIP_NAME="ai-text-source-$NEW_VERSION.zip"
rm -f "$SOURCE_ZIP_NAME"

# Create source zip excluding node_modules, branding, .git, and temp_package directories
zip -r "$SOURCE_ZIP_NAME" . \
    -x "node_modules/*" \
    -x "branding/*" \
    -x ".git/*" \
    -x "temp_package/*" \
    -x "*.zip"

echo "Source code package created successfully: $SOURCE_ZIP_NAME"
