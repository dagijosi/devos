# DevOS Build Scripts

## Available Scripts

### `dev` / `tauri:dev`
Run the application in development mode with hot reload.

### `build`
Build the web frontend for production.

```bash
npm run build
```

### `tauri:build`
Build the full Tauri desktop application for distribution.

```bash
npm run tauri:build
```

### `release.sh`
Automated release script that:
1. Runs linter, TypeScript check, and frontend build
2. Bumps version (patch/minor/major)
3. Syncs Tauri config version
4. Builds Tauri installer
5. Outputs next steps for tagging and publishing

```bash
# Patch release (default)
./scripts/release.sh

# Minor release
./scripts/release.sh minor

# Major release
./scripts/release.sh major
```

## CI/CD

The GitHub Actions workflow (`.github/workflows/release.yml`) handles:
- Building for Windows, macOS, and Linux
- Creating a draft GitHub release with platform artifacts
- Triggered by pushing `v*` tags

## Installer Output

Platform installers are output to `src-tauri/target/release/`:
- Windows: `DevOS_x.y.z_x64-setup.exe` (NSIS) + `.msi` (WiX)
- macOS: `DevOS_x.y.z_x64.dmg`
- Linux: `devos_x.y.z_amd64.deb` + `.rpm`
