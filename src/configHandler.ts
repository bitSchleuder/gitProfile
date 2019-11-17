import { window, ConfigurationTarget, workspace, OutputChannel } from 'vscode';
import {
  execute,
  GitConfigScope,
  GitUserInfo,
  UserProfile,
  getGitProjectInfo,
  getGitGlobalInfo,
  GitCommands,
  removeGlobalUserInfo,
  removeProjectUserInfo
} from './gitHandler';
import { getWorkspaceInfo, WorkspaceInfo } from './workspaceInfo';

const DEBUG = false;

const ESCAPE_UPDATE_USER_PROFILE = 'Update user profile';
const ESCAPE_CREATE_USER_PROFILE = 'Create user profile';
const ESCAPE_CREATE_USER_PROFILE_SELECT = 'Select profile to create';
const ESCAPE_UPDATE_USER_PROFILE_SELECT = 'Select profile to update';
const ESCAPE_DELETE_USER_PROFILE_SELECT = 'Select profile to delete';

const PLACE_HOLDER_SELECT_PROFILE = 'Select profile:';
const PLACE_HOLDER_PROFILE_NAME = 'Profile name:';
const PLACE_HOLDER_GIT_USER_NAME = 'Git config user name:';
const PLACE_HOLDER_GIT_USER_EMAIL = 'Git config user e-mail:';
const PLACE_HOLDER_SELECT_LEVEL = 'Select the level of git user data:';

const GET_USER_PROFILE_SELECT = 'Select profile to show';
const SET_GIT__USER_PROFILE_SELECT = 'Set user profile';

const GIT_PROFILE_SETTING_KEY = 'gitprofile.userProfiles';

const OUTPUT_CHANNEL = 'gitProfile';

export interface GitUserProfile {
  profileName: string;
  gitUserConfig: {
    name: string;
    email: string;
  };
}

let outputChannel: OutputChannel;

const target: number = ConfigurationTarget.Global;

async function breakInput(action: string): Promise<void> {
  await window.showInformationMessage(`Action ${action} canceled!`);
}
export async function areUserProfilesAvailalbe(): Promise<boolean> {
  return workspace.getConfiguration().has(GIT_PROFILE_SETTING_KEY);
}

async function getAllProfilesIfAvailable(): Promise<GitUserProfile[] | undefined> {
  let result: GitUserProfile[] | undefined;
  if (await areUserProfilesAvailalbe) {
    result = await workspace.getConfiguration().get(GIT_PROFILE_SETTING_KEY);
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

async function addProfile(profiles: GitUserProfile[], newProfile: GitUserProfile): Promise<void> {
  profiles.push(newProfile);
  await workspace.getConfiguration().update(GIT_PROFILE_SETTING_KEY, profiles, target);
}

async function removeProfile(profiles: GitUserProfile[], profile: GitUserProfile): Promise<void> {
  profiles.splice(profiles.indexOf(profile));
  await workspace.getConfiguration().update(GIT_PROFILE_SETTING_KEY, profiles, target);
}

async function getAvailableProfileNames(): Promise<string[]> {
  const profiles: GitUserProfile[] | undefined = await getAllProfilesIfAvailable();
  if (profiles && profiles.length > 0) {
    return profiles.map((entry: GitUserProfile): string => {
      return entry.profileName;
    });
  }

  return [];
}

function getProfileFromName(profiles: GitUserProfile[], selectedProfile: string): GitUserProfile {
  return profiles.filter((profile: GitUserProfile): boolean => {
    return profile.profileName === selectedProfile;
  })[0];
}

async function selectProfileNameFromInput(): Promise<string> {
  const profileNames: string[] = await getAvailableProfileNames();
  if (profileNames.length === 0) return undefined;
  return window.showQuickPick(profileNames, {
    placeHolder: PLACE_HOLDER_SELECT_PROFILE
  });
}

async function getProfileNameFromInput(updateProfile?: GitUserProfile): Promise<string> {
  return window.showInputBox({
    prompt: PLACE_HOLDER_PROFILE_NAME,
    value: updateProfile ? updateProfile.profileName : ''
  });
}

async function getUserNameFromInput(updateProfile?: GitUserProfile): Promise<string> {
  return window.showInputBox({
    prompt: PLACE_HOLDER_GIT_USER_NAME,
    value: updateProfile ? updateProfile.gitUserConfig.name : ''
  });
}

async function getEMailFromInput(updateProfile?: GitUserProfile): Promise<string> {
  return window.showInputBox({
    prompt: PLACE_HOLDER_GIT_USER_EMAIL,
    value: updateProfile ? updateProfile.gitUserConfig.email : ''
  });
}

async function selectGitProfileLevel(levels: string[]): Promise<string> {
  return window.showQuickPick(levels, {
    placeHolder: PLACE_HOLDER_SELECT_LEVEL
  });
}

function escapeInputFlowIfNull(step: string, condition: any): boolean {
  if (!condition) {
    breakInput(step);
    return true;
  }
  return false;
}

async function createLevels(): Promise<string[]> {
  const levels: string[] = [`global`];

  const openGitProjectFolder: WorkspaceInfo = await getWorkspaceInfo();
  if (openGitProjectFolder) {
    levels.push('project');
  }

  return levels;
}

async function writeToGitUserProfile(level: string, selectedProfile: GitUserProfile): Promise<void> {
  if (workspace.workspaceFolders) {
    if (level && selectedProfile) {
      const openGitProjectFolder: WorkspaceInfo = await getWorkspaceInfo();
      execute(
        openGitProjectFolder.path,
        GitConfigScope[level],
        GitUserInfo.name,
        GitCommands.replaceAll,
        selectedProfile.gitUserConfig.name
      );
      execute(
        openGitProjectFolder.path,
        GitConfigScope[level],
        GitUserInfo.email,
        GitCommands.replaceAll,
        selectedProfile.gitUserConfig.email
      );
    }
  }
}
async function createProfile(profileName: string, userName: string, userMail: string): Promise<boolean> {
  const CREATED = true;

  if (!(profileName || userName || userMail)) return !CREATED;

  const profiles: GitUserProfile[] = await getAllProfilesIfAvailable();

  if (alreadyIn(profiles, profileName)) return !CREATED;

  const newProfile: GitUserProfile = {
    profileName: '',
    gitUserConfig: { name: '', email: '' }
  };
  newProfile.profileName = profileName;
  newProfile.gitUserConfig.name = userName;
  newProfile.gitUserConfig.email = userMail;

  await addProfile(profiles, newProfile);

  return CREATED;
}

async function writeToOutputChannelIntro(intro: string[]): Promise<void> {
  if (!outputChannel) outputChannel = await window.createOutputChannel(OUTPUT_CHANNEL);

  outputChannel.show();

  intro.map((line: string) => {
    outputChannel.appendLine(line);
  });
}

async function writeToOutputChannel(userProfile: GitUserProfile): Promise<void> {
  if (!outputChannel) outputChannel = await window.createOutputChannel('gitProfile');

  outputChannel.show();
  outputChannel.appendLine('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
  outputChannel.appendLine(`Profile name: ${userProfile.profileName}`);
  outputChannel.appendLine(`User name: ${userProfile.gitUserConfig.name}`);
  outputChannel.appendLine(`User e-Mail: ${userProfile.gitUserConfig.email}`);
  outputChannel.appendLine('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
  outputChannel.appendLine('');
}
export async function updateProfileUI(): Promise<void> {
  const selectedProfile: string = await selectProfileNameFromInput();
  if (escapeInputFlowIfNull(ESCAPE_UPDATE_USER_PROFILE_SELECT, selectedProfile)) return undefined;
  const profiles: GitUserProfile[] | undefined = await getAllProfilesIfAvailable();
  const toUpdate: GitUserProfile = getProfileFromName(profiles, selectedProfile);

  const profileName: string = await getProfileNameFromInput(toUpdate);
  if (escapeInputFlowIfNull(ESCAPE_UPDATE_USER_PROFILE, profileName)) return undefined;
  const userName: string = await getUserNameFromInput(toUpdate);
  if (escapeInputFlowIfNull(ESCAPE_UPDATE_USER_PROFILE, userName)) return undefined;
  const userEMail: string = await getEMailFromInput(toUpdate);
  if (escapeInputFlowIfNull(ESCAPE_UPDATE_USER_PROFILE, userEMail)) return undefined;

  await removeProfile(profiles, toUpdate);

  toUpdate.profileName = profileName;
  toUpdate.gitUserConfig.name = userName;
  toUpdate.gitUserConfig.email = userEMail;

  await addProfile(profiles, toUpdate);
  await window.showInformationMessage(`Profile ${selectedProfile} updated!`);
}

export async function deleteProfileUI(): Promise<void> {
  const profiles: GitUserProfile[] | undefined = await getAllProfilesIfAvailable();
  const selectedProfile: string = await selectProfileNameFromInput();
  if (escapeInputFlowIfNull(ESCAPE_DELETE_USER_PROFILE_SELECT, selectedProfile)) return undefined;
  const toDelete: GitUserProfile = getProfileFromName(profiles, selectedProfile);

  await removeProfile(profiles, toDelete);
  await window.showInformationMessage(`Profile ${selectedProfile} deleted!`);
}

export async function getProfileUI(): Promise<GitUserProfile | undefined> {
  const profiles: GitUserProfile[] | undefined = await getAllProfilesIfAvailable();
  const selectedProfile: string = await selectProfileNameFromInput();
  if (escapeInputFlowIfNull(GET_USER_PROFILE_SELECT, selectedProfile)) return undefined;
  return getProfileFromName(profiles, selectedProfile);
}
export async function showProfileUI(): Promise<void> {
  const userProfile: GitUserProfile = await getProfileUI();
  await writeToOutputChannel(userProfile);
}

export async function showProfilesUI(): Promise<void> {
  await writeToOutputChannelIntro(['Available git user profiles:', '']);

  const profiles: GitUserProfile[] = await getAllProfilesIfAvailable();
  profiles.map(
    async (profile: GitUserProfile): Promise<void> => {
      await writeToOutputChannel(profile);
    }
  );
}

export async function setUserProfileToGitUI(): Promise<void> {
  const levels: string[] = await createLevels();
  const level: string | undefined = await selectGitProfileLevel(levels);
  if (escapeInputFlowIfNull(SET_GIT__USER_PROFILE_SELECT, level)) return undefined;
  const selectedProfile: GitUserProfile | undefined = await getProfileUI();

  await writeToGitUserProfile(level, selectedProfile);
}

export async function createProfileUI(): Promise<void> {
  const profileName: string = await getProfileNameFromInput();
  if (escapeInputFlowIfNull(ESCAPE_CREATE_USER_PROFILE_SELECT, profileName)) return undefined;
  const userName: string = await getUserNameFromInput();
  if (escapeInputFlowIfNull(ESCAPE_CREATE_USER_PROFILE, userName)) return undefined;
  const userMail: string = await getEMailFromInput();
  if (escapeInputFlowIfNull(ESCAPE_CREATE_USER_PROFILE, userMail)) return undefined;

  if (DEBUG) console.log(`createUserProfile: Input profileName: ${profileName}, name: ${userName}, email: ${userMail}`);

  const created: boolean = await createProfile(profileName, userName, userMail);

  if (created) {
    await window.showInformationMessage(`New profile with name ${profileName} created!`);
  } else {
    await window.showErrorMessage(`Can't create profile with same name (${profileName}) twice!`);
  }
}

export async function readGitGlobalUserProfile(): Promise<void> {
  const profile: UserProfile | undefined = await getGitGlobalInfo();
  if (profile) await window.showInformationMessage(`Global git user profile: ${profile.name} : ${profile.email}`);
}

export async function removeGitGlobalUserProfile(): Promise<void> {
  await removeGlobalUserInfo();
  await window.showInformationMessage(`Global git user profile removed.`);
}

export async function readGitProjectUserProfile(): Promise<void> {
  if (workspace.workspaceFolders) {
    const openGitProjectFolder: WorkspaceInfo = await getWorkspaceInfo();

    const profile: UserProfile | undefined = await getGitProjectInfo(openGitProjectFolder.path);
    if (profile) await window.showInformationMessage(`Project git user profile: ${profile.name} : ${profile.email}`);
  }
}

export async function removeGitProjectUserProfile(): Promise<void> {
  if (workspace.workspaceFolders) {
    const openGitProjectFolder: WorkspaceInfo = await getWorkspaceInfo();

    await removeProjectUserInfo(openGitProjectFolder.path);
    await window.showInformationMessage(`Project git user profile removed.`);
  }
}
