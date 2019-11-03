import { GitUserProfile } from './configHandler';
import {
  window,
  ConfigurationTarget,
  workspace,
  OutputChannel,
  CancellationToken,
  CancellationTokenSource
} from 'vscode';
import { execute, ConfigScope, UserInfo } from './gitHandler';
import { getWorkspaceInfo, WorkspaceInfo } from './workspaceInfo';

const DEBUG = false;
export interface GitUserProfile {
  profileName: string;
  gitUserConfig: {
    name: string;
    email: string;
  };
}

let outputChannel: OutputChannel;

const target: number = ConfigurationTarget.Global;

const GIT_PROFILE_SETTEING_KEY = 'gitprofile.userProfiles';

async function breakInput(action: string): Promise<void> {
  await window.showInformationMessage(`Action ${action} canceled!`);
}
export async function areUserProfilesAvailalbe(): Promise<boolean> {
  return workspace.getConfiguration().has(GIT_PROFILE_SETTEING_KEY);
}

async function getAllProfilesIfAvailable(): Promise<GitUserProfile[] | undefined> {
  let result: GitUserProfile[] | undefined;
  if (await areUserProfilesAvailalbe) {
    result = await workspace.getConfiguration().get(GIT_PROFILE_SETTEING_KEY);
  }
  return result;
}

function alreadyIn(profiles: GitUserProfile[], profileName: string): boolean {
  return (
    profiles.filter((profile: GitUserProfile): boolean => {
      return profile.profileName === profileName;
    }).length > 0
  );
}

export async function updateUserProfile(): Promise<void> {}

export async function getUserProfile(): Promise<GitUserProfile | undefined> {
  const profiles: GitUserProfile[] | undefined = await getAllProfilesIfAvailable();

  let result: GitUserProfile | undefined;

  if (profiles && profiles.length > 0) {
    const profileNames: string[] = profiles.map((entry: GitUserProfile): string => {
      return entry.profileName;
    });

    const selectedProfile = await window.showQuickPick(profileNames, {
      placeHolder: 'Select a profile name:'
    });

    if (!selectedProfile) {
      breakInput('Select user profile');
      return undefined;
    }

    result = profiles.filter((profile: GitUserProfile): boolean => {
      return profile.profileName === selectedProfile;
    })[0];
  }
  return result;
}

function formatOutputChannel(userProfile: GitUserProfile): void {
  outputChannel.appendLine(`Profile name: ${userProfile.profileName}`);
  outputChannel.appendLine(`User name: ${userProfile.gitUserConfig.name}`);
  outputChannel.appendLine(`User e-Mail: ${userProfile.gitUserConfig.email}`);
  outputChannel.appendLine('');
  outputChannel.appendLine('++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
  outputChannel.appendLine('');
}
export async function showUserProfile(): Promise<void> {
  const userProfile: GitUserProfile = await getUserProfile();

  if (!outputChannel) outputChannel = await window.createOutputChannel('gitProfile');

  outputChannel.show();
  console.log('Command: config.commands.showUserProfile');
  outputChannel.appendLine('Selected git user profile:');
  outputChannel.appendLine('');
  formatOutputChannel(userProfile);
}

export async function showUserProfiles(): Promise<void> {
  // return getAllProfilesIfAvailable();

  if (!outputChannel) outputChannel = await window.createOutputChannel('gitProfile');

  outputChannel.show();

  const profiles: GitUserProfile[] = await getAllProfilesIfAvailable();

  outputChannel.appendLine('Available git user profiles:');
  outputChannel.appendLine('');

  profiles.map((profile: GitUserProfile): void => {
    formatOutputChannel(profile);
  });
}
async function createUserProfile(profileName: string, userName: string, userMail: string): Promise<boolean> {
  const CREATED = true;

  if (!(profileName || userName || userMail)) return !CREATED;

  const profiles: GitUserProfile[] = await getAllProfilesIfAvailable();

  if (alreadyIn(profiles, profileName)) return !CREATED;

  const newProfile: GitUserProfile = { profileName: '', gitUserConfig: { name: '', email: '' } };
  newProfile.profileName = profileName;
  newProfile.gitUserConfig.name = userName;
  newProfile.gitUserConfig.email = userMail;

  profiles.push(newProfile);

  await workspace.getConfiguration().update(GIT_PROFILE_SETTEING_KEY, profiles, target);

  return CREATED;
}

export async function setUserProfileToGit(): Promise<void> {
  const openGitProjectFolder: WorkspaceInfo = await getWorkspaceInfo();

  const pickers: string[] = [`global`];
  if (openGitProjectFolder) {
    pickers.push('project');
  }
  const level: string | undefined = await window.showQuickPick(pickers, {
    placeHolder: 'Select the level of git user data.'
  });

  if (!level) {
    breakInput('Set user profile');
    return undefined;
  }

  const selectedProfile: GitUserProfile | undefined = await getUserProfile();

  if (workspace.workspaceFolders) {
    if (level && selectedProfile) {
      execute(openGitProjectFolder.path, ConfigScope[level], UserInfo.name, selectedProfile.gitUserConfig.name);
      execute(openGitProjectFolder.path, ConfigScope[level], UserInfo.email, selectedProfile.gitUserConfig.email);
    }
  }
}

export async function createUserProfileUI(): Promise<void> {
  const profileName: string = await window.showInputBox({ prompt: 'Profile name:' });
  if (!profileName) {
    breakInput('Create Profile');
    return undefined;
  }
  const userName: string = await window.showInputBox({ prompt: 'Git config user name:' });
  if (!userName) {
    breakInput('Create Profile');
    return undefined;
  }
  const userMail: string = await window.showInputBox({ prompt: 'Git config user e-mail:' });
  if (!userMail) {
    breakInput('Create Profile');
    return undefined;
  }

  if (DEBUG) console.log(`createUserProfile: Input profileName: ${profileName}, name: ${userName}, email: ${userMail}`);

  const created: boolean = await createUserProfile(profileName, userName, userMail);

  if (created) {
    await window.showInformationMessage(`New profile with name ${profileName} created!`);
  } else {
    await window.showErrorMessage(`Can't create profile with same name (${profileName}) twice!`);
  }
}
