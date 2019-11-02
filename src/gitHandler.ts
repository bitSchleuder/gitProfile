import { spawn } from 'child_process';

const DEBUG = false;
export interface UserProfile {
  name?: string;
  email?: string;
}
enum ConfigScope {
  global = '--global',
  local = '--local'
}

enum UserInfo {
  name = 'user.name',
  email = 'user.email'
}

async function execute(
  projectWorkspace: string | undefined,
  scope: ConfigScope,
  userInfo: UserInfo
): Promise<string | undefined> {
  return new Promise((resolve, reject): void => {
    if (DEBUG) console.log(`With ${scope} and ${userInfo} projectWorkspace: ${projectWorkspace}`);
    const git = spawn(`git`, ['config', scope, userInfo], { cwd: projectWorkspace });

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

export async function getGitInfo(workspacePath?: string | null): Promise<UserProfile | undefined> {
  const result: UserProfile | undefined = {};
  if (workspacePath) {
    try {
      result.name =
        (await execute(workspacePath, ConfigScope.local, UserInfo.name)) ||
        `$(globe) ${await execute(workspacePath, ConfigScope.global, UserInfo.name)}`;
      result.email =
        (await execute(workspacePath, ConfigScope.local, UserInfo.email)) ||
        `$(globe) ${await execute(workspacePath, ConfigScope.global, UserInfo.email)}`;
      if (DEBUG) console.log(`Name: ${result.name} Mail: ${result.email}`);
    } catch (error) {
      console.log(`getGitInfo exception: ${error}`);
      return undefined;
    }
  }
  return result;
}
