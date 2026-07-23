# DevOS Release Checklist

## Pre-Release Testing

### Core Functionality
- [ ] Dashboard loads with correct data
- [ ] All sidebar navigation links work
- [ ] Theme switching (light/dark) works
- [ ] Command palette (Ctrl+K) opens and searches
- [ ] Responsive layout at 1280px, 1024px, 768px, 375px
- [ ] All route transitions work without errors

### Features
- [ ] Projects: CRUD, detail view, form validation
- [ ] Knowledge: Folders, notes, snippets, bugs — all CRUD
- [ ] Toolbox: All 13 tools render, favorites persist, search filters
- [ ] Automation: Workflow builder, runner, history, pre-builts
- [ ] AI Assistant: Chat, streaming, provider switching, conversation history
- [ ] Analytics: Session tracking, time stats, charts, CSV export
- [ ] Backup & Restore: Manual backup, encrypted backup, restore wizard, auto-backup settings

### Settings
- [ ] Theme settings persist across reloads
- [ ] Performance options (reduced motion, reduced transparency)
- [ ] Accessibility options (font size, high contrast)
- [ ] Log viewer filters and exports correctly
- [ ] Update checker contacts GitHub and reports result

### Error Handling
- [ ] Error boundary catches route crashes and shows recovery UI
- [ ] Crash recovery overlay shows after simulated crash
- [ ] 404 page renders for unknown routes
- [ ] Database connection falls back gracefully

### Performance
- [ ] Initial load under 3s on modern hardware
- [ ] All pages lazy-loaded (verify via network tab)
- [ ] No uncaught console errors
- [ ] Memory usage under 200MB idle

## Build Verification

- [ ] `npm run build` completes without errors
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `npm run lint` passes
- [ ] `npx tauri build` produces platform installer
- [ ] Installer installs and launches correctly
- [ ] App icon displays correctly in taskbar/dock

## Deployment

1. Verify version bumps in `package.json` and `tauri.conf.json`
2. Tag release: `git tag v1.0.0`
3. Push: `git push && git push --tags`
4. GitHub Action builds all platform installers
5. Publish draft release with release notes
6. Update `devos.app` website with download links

## Post-Release

- [ ] Monitor issue tracker for crash reports
- [ ] Verify auto-update notification works from GitHub releases
- [ ] Collect feedback on first 100 users
