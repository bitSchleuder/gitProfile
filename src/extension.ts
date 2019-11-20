/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable eqeqeq */
/* eslint-disable-next-line handle-callback-err */
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import {
  WorkspaceFoldersChangeEvent,
  TextEditor,
  ConfigurationChangeEvent,
  TextDocument,
  StatusBarItem,
  ExtensionContext,
  commands,
  window,
  StatusBarAlignment,
  workspace,
  Disposable,
  TextEditorViewColumnChangeEvent
} from 'vscode';
import { getGitProjectInfo, UserProfile } from './gitHandler';
import { getWorkspaceInfo } from './workspaceInfo';
import {
  showProfilesUI,
  showProfileUI,
  createProfileUI,
  setUserProfileToGitUI,
  deleteProfileUI,
  updateProfileUI,
  readGitGlobalUserProfile,
  readGitProjectUserProfile,
  removeGitGlobalUserProfile,
  removeGitProjectUserProfile,
  getGitProjectOriginUrl
} from './configHandler';

export const DEBUG = false;

let gitRiderStatusBarItem: StatusBarItem;

async function updateStatusBarItem(): Promise<void> {
  if (DEBUG) console.info(`updateStatusBarItem triggered.`);
  const info = await getWorkspaceInfo();

  if (info) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const profile: UserProfile | undefined = await getGitProjectInfo(info.path);
    if (profile) {
      if (DEBUG) console.log(`UserProfile: ${profile}`);
      const worskpaceTxt = info.text ? `${info.text}: ` : '';
      gitRiderStatusBarItem.text = `${worskpaceTxt}${profile.email}`;
      gitRiderStatusBarItem.color = info.color;
      gitRiderStatusBarItem.tooltip = `${profile.name ? String(profile.name).replace('$(globe)', 'global') : ''}: ${
        profile.email ? String(profile.email).replace('$(globe)', 'global') : ''
      }`;
      gitRiderStatusBarItem.show();
    } else {
      gitRiderStatusBarItem.hide();
    }
  } else {
    gitRiderStatusBarItem.hide();
  }
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: ExtensionContext): Promise<void> {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "git-profile" is now active!');

  gitRiderStatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 1000);

  const showProfilesCommand = 'extension.showGitProfiles';
  context.subscriptions.push(
    commands.registerCommand(showProfilesCommand, async () => {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      window.showInformationMessage(`Used git user: ${gitRiderStatusBarItem.tooltip}`);
    })
  );
  gitRiderStatusBarItem.command = showProfilesCommand;
  context.subscriptions.push(gitRiderStatusBarItem);

  // Update status bar item based on events for multi root folder changes
  context.subscriptions.push(
    workspace.onDidChangeWorkspaceFolders(
      async (_e: WorkspaceFoldersChangeEvent): Promise<void> => {
        await updateStatusBarItem();
      }
    )
  );

  // Update status bar item based on events for configuration
  context.subscriptions.push(
    workspace.onDidChangeConfiguration(
      async (_e: ConfigurationChangeEvent): Promise<void> => {
        await updateStatusBarItem();
      }
    )
  );

  // Update status bar item based on events around the active editor
  context.subscriptions.push(
    window.onDidChangeActiveTextEditor(
      async (_e: TextEditor | undefined): Promise<void> => {
        await updateStatusBarItem();
      }
    )
  );
  context.subscriptions.push(
    window.onDidChangeTextEditorViewColumn(
      async (_e: TextEditorViewColumnChangeEvent | undefined): Promise<void> => {
        await updateStatusBarItem();
      }
    )
  );
  context.subscriptions.push(
    workspace.onDidOpenTextDocument(
      async (_e: TextDocument): Promise<void> => {
        await updateStatusBarItem();
      }
    )
  );
  context.subscriptions.push(
    workspace.onDidCloseTextDocument(
      async (_e: TextDocument): Promise<void> => {
        await updateStatusBarItem();
      }
    )
  );

  commands.registerCommand('config.commands.showUserProfile', async () => {
    await showProfileUI();
  });

  commands.registerCommand('config.commands.showProfiles', async () => {
    console.log('Command: config.commands.showProfiles');
    await showProfilesUI();
  });

  commands.registerCommand('config.commands.createProfile', async () => {
    console.log('Command: config.commands.createProfile');
    await createProfileUI();
  });

  commands.registerCommand('config.commands.updateProfile', async () => {
    console.log('Command: config.commands.updateProfile');
    await updateProfileUI();
  });

  commands.registerCommand('config.commands.deleteProfile', async () => {
    console.log('Command: config.commands.deleteProfile');
    await deleteProfileUI();
  });

  commands.registerCommand('config.commands.setGitUserProfile', async () => {
    console.log('Command: config.commands.setGitUserProfile');
    await setUserProfileToGitUI();
    await updateStatusBarItem();
  });

  commands.registerCommand('config.commands.showGlobalUser', async () => {
    console.log('Command: config.commands.showGlobalUser');
    await readGitGlobalUserProfile();
  });

  commands.registerCommand('config.commands.showProjectUser', async () => {
    console.log('Command: config.commands.showProjectUser');
    await readGitProjectUserProfile();
  });

  commands.registerCommand('config.commands.removeGitGlobalUserProfile', async () => {
    console.log('Command: config.commands.removeGitGlobalUserProfile');
    await removeGitGlobalUserProfile();
    await updateStatusBarItem();
  });

  commands.registerCommand('config.commands.removeGitProjectUserProfile', async () => {
    console.log('Command: config.commands.removeGitProjectUserProfile');
    await removeGitProjectUserProfile();
    await updateStatusBarItem();
  });

  commands.registerCommand('config.commands.readGitProjectOriginUrl', async () => {
    console.log('Command: config.commands.readGitProjectOriginUrl');
    await getGitProjectOriginUrl();
  });

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  await updateStatusBarItem();
}

// this method is called when your extension is deactivated
export function deactivate() {}
