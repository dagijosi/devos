# Setting Up Automatic Updates

This guide explains how to configure and publish automatic updates for DevOS using Tauri's built-in updater.

## Prerequisites

- GitHub repository for DevOS
- Tauri updater plugin configured (already done in this project)
- GitHub Personal Access Token with `repo` scope (for automated releases)

## Initial Setup

### 1. Generate Signing Keys

Tauri requires signing updates to ensure security. Generate a key pair:

```bash
# Install tauri-cli if not already installed
npm install -g @tauri-apps/cli

# Generate a private/public key pair
cargo install tauri-cli
tauri signer generate
```

This will generate:
- `private-key.pem` - Keep this secret! Never commit it.
- `public-key.pem` - This goes in your config.

### 2. Update tauri.conf.json

Replace `YOUR_PUBLIC_KEY_HERE` in `src-tauri/tauri.conf.json` with your public key:

```json
{
  "plugins": {
    "updater": {
      "endpoints": [
        "https://github.com/YOUR_USERNAME/YOUR_REPO/releases/latest/download/latest.json"
      ],
      "dialog": true,
      "pubkey": "YOUR_ACTUAL_PUBLIC_KEY_HERE"
    }
  }
}
```

**Important:** Replace `YOUR_USERNAME/YOUR_REPO` with your actual GitHub repository path.

### 3. Store Private Key Securely

Store your private key in a secure location:
- GitHub Secrets (recommended for CI/CD)
- Environment variables
- Secure key management service

For GitHub Actions, add it as a secret named `TAURI_PRIVATE_KEY`.

## Building for Release

### Manual Build

```bash
# Build the application
npm run tauri:build

# This creates:
# - src-tauri/target/release/bundle/nsis/DevOS_1.0.0_x64-setup.exe (Windows installer)
# - src-tauri/target/release/bundle/msi/DevOS_1.0.0_x64_en-US.msi (MSI installer)
# - src-tauri/target/release/bundle/dmg/DevOS_1.0.0_x64.dmg (macOS DMG)
# - src-tauri/target/release/bundle/appimage/devos_1.0.0_amd64.AppImage (Linux AppImage)
```

### Automated Build with GitHub Actions

Create `.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable
        
      - name: Install dependencies
        run: npm install
        
      - name: Build Tauri app
        env:
          TAURI_PRIVATE_KEY: ${{ secrets.TAURI_PRIVATE_KEY }}
        run: npm run tauri:build
        
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            src-tauri/target/release/bundle/nsis/*.exe
            src-tauri/target/release/bundle/msi/*.msi
          draft: false
          prerelease: false
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Publishing Updates

### Option 1: Manual GitHub Release

1. Build the application: `npm run tauri:build`
2. Go to GitHub → Your Repo → Releases
3. Click "Draft a new release"
4. Tag version: `v1.0.1` (must match version in config files)
5. Upload the built installers:
   - `DevOS_1.0.1_x64-setup.exe` (Windows NSIS)
   - `DevOS_1.0.1_x64_en-US.msi` (Windows MSI)
   - `DevOS_1.0.1_x64.dmg` (macOS)
   - `devos_1.0.1_amd64.AppImage` (Linux)
6. Add release notes
7. Publish the release

### Option 2: Automated with Tauri CLI

Tauri can automatically create the `latest.json` file needed for updates:

```bash
# Sign the installer and generate latest.json
tauri signer sign --private-key private-key.pem src-tauri/target/release/bundle/nsis/DevOS_1.0.1_x64-setup.exe

# This generates a signature file that should be included in the release
```

The `latest.json` file should be uploaded to the release and should look like:

```json
{
  "version": "1.0.1",
  "notes": "Release notes here...",
  "pub_date": "2024-01-15T12:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "DSA_SIGNATURE_HERE",
      "url": "https://github.com/YOUR_USERNAME/YOUR_REPO/releases/download/v1.0.1/DevOS_1.0.1_x64-setup.exe"
    }
  }
}
```

## Version Management

When releasing a new version:

1. Update version in all three places:
   - `package.json` → `"version": "1.0.1"`
   - `src-tauri/Cargo.toml` → `version = "1.0.1"`
   - `src-tauri/tauri.conf.json` → `"version": "1.0.1"`

2. Commit the changes
3. Create a git tag: `git tag v1.0.1`
4. Push the tag: `git push origin v1.0.1`
5. Build and release

## Testing Updates

To test the updater before releasing:

1. Build a test version with a higher version number (e.g., 1.0.1)
2. Create a GitHub release with the test version
3. Install the current version (1.0.0)
4. Click "Check for Updates" in the app
5. The app should detect the new version and offer to install

## Troubleshooting

### Update not detected
- Ensure version numbers are correct and synchronized
- Check that `latest.json` is accessible at the configured endpoint
- Verify the public key matches the one used to sign the update

### Signature verification failed
- Ensure you're using the correct private key for signing
- Check that the signature in `latest.json` matches the installer
- Verify the public key in `tauri.conf.json` is correct

### Installer download fails
- Check that the installer URL in `latest.json` is correct
- Ensure the release is published (not draft)
- Verify the file is actually attached to the release

## Security Notes

- **NEVER** commit your private key
- Use GitHub Secrets or environment variables for sensitive data
- Keep your private key secure - if compromised, generate a new key pair
- Always verify the source of updates before installing
