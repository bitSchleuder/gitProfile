import { spawn } from 'child_process';

const DEBUG = false;
export interface UserProfile {
  name?: string;
  email?: string;
}
export enum GitConfigScope {
  global = '--global',
  project = '--local'
}

export enum GitUserInfo {
  name = 'user.name',
  email = 'user.email'
}

export enum GitCommands {
  set = '',
  unset = '--unset',
  unsetAll = '--unset-all',
  get = '--get',
  getAll = '--get-all',
  replace = '--replace',
  replaceAll = '--replace-all'
}

export async function execute(
  projectWorkspace: string | undefined,
  scope: GitConfigScope,
  userInfo: GitUserInfo,
  cmd: GitCommands = GitCommands.set,
  userValue?: string
): Promise<string | undefined> {
  return new Promise((resolve, reject): void => {
    if (DEBUG) console.log(`With ${scope} and ${userInfo} projectWorkspace: ${projectWorkspace}`);
    const parameters: string[] = ['config', scope];
    if (cmd && cmd.length > 0) parameters.push(cmd);
    parameters.push(userInfo);
    if (userValue) parameters.push(`${userValue}`);
    const git = spawn(`git`, parameters, { cwd: projectWorkspace });

    git.on('close', (code) => {
      if (code > 1) {
        console.error(`Error on close: ${code}`);
      }
      resolve();
    });
    git.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
      reject(data);
    });

    git.stdout.on('data', (data) => {
      resolve(data);
    });
  });
}

export async function getGitProjectInfo(workspacePath?: string | null): Promise<UserProfile | undefined> {
  const result: UserProfile | undefined = {};
  if (workspacePath) {
    try {
      result.name =
        (await execute(workspacePath, GitConfigScope.project, GitUserInfo.name)) ||
        `$(globe) ${await execute(workspacePath, GitConfigScope.global, GitUserInfo.name)}`;
      result.email =
        (await execute(workspacePath, GitConfigScope.project, GitUserInfo.email)) ||
        `$(globe) ${await execute(workspacePath, GitConfigScope.global, GitUserInfo.email)}`;
      if (DEBUG) console.log(`Name: ${result.name} Mail: ${result.email}`);
    } catch (error) {
      console.log(`getGitProjectInfo exception: ${error}`);
      return undefined;
    }
  }
  return result;
}

export async function getGitGlobalInfo(): Promise<UserProfile | undefined> {
  const result: UserProfile | undefined = {};
  try {
    result.name = `${await execute(undefined, GitConfigScope.global, GitUserInfo.name)}`;
    result.email = `${await execute(undefined, GitConfigScope.global, GitUserInfo.email)}`;
    if (DEBUG) console.log(`Name: ${result.name} Mail: ${result.email}`);
  } catch (error) {
    console.log(`getGitGlobalInfo exception: ${error}`);
    return undefined;
  }
  return result;
}

export async function removeProjectUserInfo(workspacePath?: string | null): Promise<void> {
  if (workspacePath) {
    try {
      await execute(workspacePath, GitConfigScope.project, GitUserInfo.name, GitCommands.unsetAll);
      await execute(workspacePath, GitConfigScope.project, GitUserInfo.email, GitCommands.unsetAll);
    } catch (error) {
      console.log(`removeProjectUserInfo exception: ${error}`);
    }
  }
}

export async function removeGlobalUserInfo(): Promise<void> {
  try {
    await execute(undefined, GitConfigScope.global, GitUserInfo.name, GitCommands.unsetAll);
    await execute(undefined, GitConfigScope.global, GitUserInfo.email, GitCommands.unsetAll);
  } catch (error) {
    console.log(`removeGlobalUserInfo exception: ${error}`);
  }
}
