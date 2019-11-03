import { basename } from 'path';
import { TextEditor, window, workspace, WorkspaceFolder, Uri } from 'vscode';

const DEBUG = false;
export interface WorkspaceInfo {
  text?: string | undefined;
  path?: string | undefined;
  color?: string | undefined;
}

function getherWorkspaceInfo(folder: WorkspaceFolder | undefined): WorkspaceInfo | undefined {
  let result: WorkspaceInfo | undefined;
  if (folder) {
    result = {};
    result.text = `$(logo-github) ${basename(folder.uri.fsPath)}`;
    result.path = folder.uri.path;
  }
  return result;
}
function resolveWorkspaceFromFile(editor: TextEditor | undefined): WorkspaceFolder | undefined {
  let result: WorkspaceFolder | undefined;
  if (editor) {
    const resource = editor.document.uri;
    if (resource.scheme === 'file') {
      result = workspace.getWorkspaceFolder(resource);
    }
  }
  return result;
}

function resolveSingleProjectFolder(folders: WorkspaceFolder[]): WorkspaceFolder | undefined {
  return folders && folders.length === 1 ? folders[0] : undefined;
}

async function isAGitRepo(currentFolder: WorkspaceFolder): Promise<boolean> {
  let hasARepo = true;
  try {
    await workspace.fs.stat(Uri.file(currentFolder.uri.fsPath.concat('/.git')));
  } catch (err) {
    hasARepo = false;
  }
  return currentFolder && hasARepo;
}

async function noAppropriateWorkspace(currentFolder: WorkspaceFolder): Promise<boolean> {
  return !(currentFolder && (await isAGitRepo(currentFolder)));
}
export async function getWorkspaceInfo(): Promise<WorkspaceInfo | undefined> {
  const editor = window.activeTextEditor;

  // If no workspace is opened or just a single folder, we return without any status label
  // because our extension only works when more than one folder is opened in a workspace.
  const currentFolder: WorkspaceFolder =
    resolveSingleProjectFolder(workspace.workspaceFolders) || resolveWorkspaceFromFile(editor);

  if (await noAppropriateWorkspace(currentFolder)) {
    return undefined;
  }

  console.debug(`getWorkspaceInfo: has an editor: ${!!editor} and ${workspace.workspaceFolders.length} workspaces.`);

  const result: WorkspaceInfo | undefined = getherWorkspaceInfo(currentFolder);

  return result;
}
