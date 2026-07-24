# Setting Up Automatic Updates

This guide explains how to configure and publish automatic updates for DevOS using Tauri's built-in updater with GitHub Actions for automated releases.

## Prerequisites

- GitHub repository for DevOS
- Tauri updater plugin configured (already done in this project)
- GitHub Actions enabled for your repository

## Initial Setup

### 1. Generate Signing Keys

Tauri requires signing updates to ensure security. Generate a key pair:

```bash
cargo install tauri-cli
tauri signer generate
```

This will generate:
- **Private key** (base64 encoded) - Keep this secret! Never commit it.
- **Public key** (base64 encoded) - This goes in your config.

### 2. Update tauri.conf.json

The configuration is already set up with your public key and repository path. Verify it matches your GitHub repository:

```json
{
  "plugins": {
    "updater": {
      "endpoints": [
        "https://github.com/YOUR_USERNAME/YOUR_REPO/releases/latest/download/latest.json"
      ],
      "dialog": true,
      "pubkey": "YOUR_PUBLIC_KEY_HERE"
    }
  }
}
```

### 3. Add GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

Add these secrets:

- **TAURI_PRIVATE_KEY**: Your private key (the base64 string from key generation)
- **TAURI_KEY_PASSWORD**: (Optional) If you set a password for your key

**Important:** Never commit your private key to the repository!

## Automated Release Workflow

The GitHub Actions workflow (`.github/workflows/release.yml`) is already configured to:

1. Build the application for Windows, macOS, and Linux
2. Sign the installers using your private key
3. Create a GitHub release with all installers
4. Generate and upload `latest.json` for automatic updates
5. Mark the release as a draft for review

## Publishing a New Release

### Step 1: Update Version Numbers

Update the version in all three places:

```bash
# package.json
"version": "1.0.1"

# src-tauri/Cargo.toml
version = "1.0.1"

# src-tauri/tauri.conf.json
"version": "1.0.1"
```

### Step 2: Commit and Tag

```bash
git add .
git commit -m "Release v1.0.1"
git tag v1.0.1
git push origin main
git push origin v1.0.1
```

### Step 3: GitHub Actions Builds Automatically

When you push a tag starting with `v`, GitHub Actions will:
- Trigger the release workflow
- Build installers for all platforms
- Sign them with your private key
- Create a draft release with all assets
- Generate `latest.json` with the signature

### Step 4: Review and Publish

1. Go to GitHub → Your Repo → Releases
2. Find the draft release (e.g., "DevOS v1.0.1")
3. Review the assets:
   - Windows: `DevOS_1.0.1_x64-setup.exe`, `DevOS_1.0.1_x64_en-US.msi`
   - macOS: `DevOS_1.0.1_x64.dmg`
   - Linux: `devos_1.0.1_amd64.AppImage`, `.deb`, `.rpm`
   - `latest.json` (for automatic updates)
4. Add release notes
5. Click "Publish release"

## How Automatic Updates Work

Once the release is published:

1. Users with an installed version click "Check for Updates" in Settings
2. The app fetches `latest.json` from GitHub releases
3. If a newer version exists, it shows the update with release notes
4. User clicks "Install & Restart"
5. The app downloads the signed installer
6. Verifies the signature using the public key
7. Installs the update and restarts

## Testing Updates Locally

To test the updater before publishing:

1. Build and sign locally:
   ```bash
   npm run tauri:build
   $env:TAURI_SIGNING_PRIVATE_KEY="YOUR_PRIVATE_KEY"
   cargo tauri signer sign .\src-tauri\target\release\bundle\nsis\DevOS_1.0.1_x64-setup.exe
   ```

2. Create a test release on GitHub with the signed installer and `latest.json`

3. Install the current version and test the update flow

## Troubleshooting

### GitHub Actions fails
- Check that `TAURI_PRIVATE_KEY` secret is set correctly
- Verify the secret is the base64 encoded private key (not the file path)
- Check the Actions logs for specific error messages

### Update not detected
- Ensure the release is published (not draft)
- Check that `latest.json` is in the release assets
- Verify the version numbers are correct

### Signature verification failed
- Ensure the public key in `tauri.conf.json` matches your private key
- Check that the installer was signed with the correct private key
- Verify `latest.json` contains the correct signature

### Release assets missing
- Check that GitHub Actions completed successfully
- Ensure all platforms built successfully in the workflow
- Verify the release contains all expected files

## Security Notes

- **NEVER** commit your private key to the repository
- Always use GitHub Secrets for sensitive data
- Rotate your keys if they're ever compromised
- The `tauri-action` automatically handles secure key usage in CI/CD
- Review draft releases before publishing to ensure everything is correct
