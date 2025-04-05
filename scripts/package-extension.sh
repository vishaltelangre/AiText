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

# Ensure archives directory exists
ARCHIVES_DIR="archives"
mkdir -p "$ARCHIVES_DIR"

create_package() {
    local browser=$1
    local dist_dir="dist-$browser"
    local zip_name="$ARCHIVES_DIR/ai-text-$browser-$NEW_VERSION.zip"

    echo "Creating package for $browser..."

    # Create a temporary directory for packaging
    local temp_dir="temp_package_$browser"
    rm -rf "$temp_dir"
    mkdir -p "$temp_dir"

    # Copy necessary files
    echo "Copying files for $browser..."
    cp -r "$dist_dir"/* "$temp_dir/"
    cp LICENSE "$temp_dir/"

    # Create the zip file
    echo "Creating zip file for $browser..."
    rm -f "$zip_name"
    cd "$temp_dir"
    zip -r "../$zip_name" ./*
    cd ..

    # Clean up
    echo "Cleaning up $browser package..."
    rm -rf "$temp_dir"

    echo "Package created successfully: $zip_name"
}

# Create packages for both browsers
create_package "firefox"
create_package "chrome"

# Create source code zip for Mozilla submission
echo "Creating source code zip for Mozilla submission..."
SOURCE_ZIP_NAME="$ARCHIVES_DIR/ai-text-source-$NEW_VERSION.zip"
rm -f "$SOURCE_ZIP_NAME"

# Create source zip excluding node_modules, branding, .git, and temp_package directories
zip -r "$SOURCE_ZIP_NAME" . \
    -x "node_modules/*" \
    -x "branding/*" \
    -x ".git/*" \
    -x "temp_package_*/*" \
    -x "$ARCHIVES_DIR/*" \
    -x "*.zip"

echo "Source code package created successfully: $SOURCE_ZIP_NAME"
