import { basename } from 'path';
import { TextEditor, window, workspace, WorkspaceFolder } from 'vscode';

const DEBUG = false;
interface WorkspaceInfo {
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
export function getWorkspaceInfo(): WorkspaceInfo | undefined {
  const editor = window.activeTextEditor;
  // If no workspace is opened or just a single folder, we return without any status label
  // because our extension only works when more than one folder is opened in a workspace.
  if (!workspace.workspaceFolders) {
    return undefined;
  }
  if (DEBUG)
    console.log(`getWorkspaceInfo: has an editor: ${!!editor} and ${workspace.workspaceFolders.length} workspaces.`);
  let result: WorkspaceInfo | undefined;
  const isAProject: boolean = workspace.workspaceFolders.length === 1;
  if (isAProject) {
    result = getherWorkspaceInfo(workspace.workspaceFolders[0]);
  } else if (editor && workspace.workspaceFolders.length > 1) {
    // If we have a file:// resource we resolve the WorkspaceFolder this file is from and update
    // the status accordingly.
    result = getherWorkspaceInfo(resolveWorkspaceFromFile(editor));
  }
  return result;
}
