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

export enum GitConfigValues {
  name = 'user.name',
  email = 'user.email',
  originUrl = 'remote.origin.url'
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
const GIT_PROJECT_PATTERN = /[-_a-zA-Z]+\.git[\/]{0,1}/g;
const GIT_ALL_PROJECT_PATTERN = /([-_a-zA-Z]+\.)+[a-zA-Z]{1,3}/g;

export async function execute(
  projectWorkspace: string | undefined,
  scope: GitConfigScope,
  configValues: GitConfigValues,
  cmd: GitCommands = GitCommands.set,
  userValue?: string
): Promise<string | undefined> {
  return new Promise((resolve, reject): void => {
    if (DEBUG) console.log(`With ${scope} and ${configValues} projectWorkspace: ${projectWorkspace}`);
    const parameters: string[] = ['config', scope];
    if (cmd && cmd.length > 0) parameters.push(cmd);
    parameters.push(configValues);
    if (userValue) parameters.push(`${userValue}`);
    const git = spawn(`git`, parameters, { cwd: projectWorkspace });

    git.on('exit', (code) => {
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
        (await execute(workspacePath, GitConfigScope.project, GitConfigValues.name)) ||
        `$(globe) ${await execute(workspacePath, GitConfigScope.global, GitConfigValues.name)}`;
      result.email =
        (await execute(workspacePath, GitConfigScope.project, GitConfigValues.email)) ||
        `$(globe) ${await execute(workspacePath, GitConfigScope.global, GitConfigValues.email)}`;
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
    result.name = `${await execute(undefined, GitConfigScope.global, GitConfigValues.name)}`;
    result.email = `${await execute(undefined, GitConfigScope.global, GitConfigValues.email)}`;
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
      await execute(workspacePath, GitConfigScope.project, GitConfigValues.name, GitCommands.unsetAll);
      await execute(workspacePath, GitConfigScope.project, GitConfigValues.email, GitCommands.unsetAll);
    } catch (error) {
      console.log(`removeProjectUserInfo exception: ${error}`);
    }
  }
}

export async function removeGlobalUserInfo(): Promise<void> {
  try {
    await execute(undefined, GitConfigScope.global, GitConfigValues.name, GitCommands.unsetAll);
    await execute(undefined, GitConfigScope.global, GitConfigValues.email, GitCommands.unsetAll);
  } catch (error) {
    console.log(`removeGlobalUserInfo exception: ${error}`);
  }
}

export async function readProjectOriginUrl(workspacePath?: string | null): Promise<string> {
  let url: string;
  if (workspacePath) {
    try {
      url = await execute(workspacePath, GitConfigScope.project, GitConfigValues.originUrl, GitCommands.get);
    } catch (error) {
      console.log(`removeProjectUserInfo exception: ${error}`);
    }
  }

  return url;
}

export async function getProjectFromOriginUrl(path: string): Promise<string> {
  const url = `${await readProjectOriginUrl(path)}`;
  const project: RegExpMatchArray = url.match(GIT_PROJECT_PATTERN);

  return project ? project.shift() : '';
}

export async function getHostFromOriginUrl(path: string): Promise<string> {
  const url = `${await readProjectOriginUrl(path)}`;
  const host: RegExpMatchArray = url.match(GIT_ALL_PROJECT_PATTERN);
  const project: RegExpMatchArray = url.match(GIT_PROJECT_PATTERN);

  const projectName: string = project ? project.shift() : '';

  const hostName = host
    ? host.filter((entry: string) => {
        return entry !== projectName;
      })
    : '';

  return hostName[0];
}
