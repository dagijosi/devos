const vscode = require('vscode');
const { execFile } = require('child_process');
const path = require('path');

function getCliPath() {
  return vscode.workspace.getConfiguration('devos').get('cliPath', 'devos-cli');
}

function runCli(args) {
  return new Promise((resolve, reject) => {
    const cli = getCliPath();
    execFile(cli, args, { timeout: 5000 }, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(stderr || err.message));
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand('devos.openInDevOS', async () => {
      const folder = vscode.workspace.workspaceFolders?.[0];
      if (!folder) {
        vscode.window.showWarningMessage('Open a workspace folder first');
        return;
      }
      try {
        await runCli(['open', folder.uri.fsPath]);
      } catch (e) {
        vscode.window.showErrorMessage(`DevOS: ${e.message}`);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('devos.openTerminal', async () => {
      try {
        await runCli(['terminal']);
      } catch (e) {
        vscode.window.showErrorMessage(`DevOS: ${e.message}`);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('devos.searchClipboard', async () => {
      try {
        await runCli(['clipboard']);
      } catch (e) {
        vscode.window.showErrorMessage(`DevOS: ${e.message}`);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('devos.sendSnippet', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('Open a file with a selection first');
        return;
      }
      const selection = editor.selection;
      const text = editor.document.getText(selection);
      if (!text) {
        vscode.window.showWarningMessage('Select some code first');
        return;
      }
      try {
        await runCli(['search', text]);
        vscode.window.showInformationMessage('Sent to DevOS!');
      } catch (e) {
        vscode.window.showErrorMessage(`DevOS: ${e.message}`);
      }
    })
  );

  // Status bar item
  const statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusItem.text = '$(tools) DevOS';
  statusItem.tooltip = 'DevOS Bridge — Click to open project';
  statusItem.command = 'devos.openInDevOS';
  statusItem.show();
  context.subscriptions.push(statusItem);

  // Check if CLI is available
  runCli(['status']).then((output) => {
    statusItem.text = '$(tools) DevOS';
    statusItem.tooltip = `DevOS: ${output}`;
  }).catch(() => {
    statusItem.text = '$(warning) DevOS';
    statusItem.tooltip = 'DevOS CLI not found — check devos.cliPath setting';
  });
}

function deactivate() {}

module.exports = { activate, deactivate };
