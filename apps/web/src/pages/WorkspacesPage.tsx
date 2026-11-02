import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { useWorkspaces } from '../hooks/useWorkspaces';
import { workspaceRepo } from '../db/repositories/WorkspaceRepository';

export function WorkspacesPage(): React.ReactElement {
  const {
    workspaces,
    activeWorkspaceId,
    setActiveWorkspaceId,
    createWorkspace,
    deleteWorkspace,
    isLoading,
  } = useWorkspaces();
  const [name, setName] = useState('');
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (!name.trim()) {
      setError('Enter a workspace name.');
      return;
    }
    try {
      const created = await createWorkspace(name.trim());
      setName('');
      setMessage(`Workspace “${created.name}” created.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the workspace.');
    }
  };

  const handleRename = async (event: React.FormEvent, id: string) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (!renameName.trim()) {
      setError('Enter a workspace name.');
      return;
    }
    try {
      await workspaceRepo.update(id, { name: renameName.trim() });
      setRenameId(null);
      setMessage('Workspace renamed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not rename the workspace.');
    }
  };

  const handleDelete = async (id: string, workspaceName: string) => {
    if (
      !window.confirm(
        `Delete workspace “${workspaceName}” and all its segments, observations and photos stored locally? This cannot be undone.`,
      )
    ) {
      return;
    }
    setError(null);
    setMessage(null);
    try {
      await deleteWorkspace(id);
      setMessage(`Workspace “${workspaceName}” deleted.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the workspace.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">Workspaces</h1>
        <p className="text-sm text-slate-600 mt-1">
          Workspaces group your verge segments. Everything here is stored on this device only.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}

      <form
        onSubmit={handleCreate}
        className="bg-white p-6 rounded-lg border border-slate-200 space-y-4"
      >
        <Input
          id="workspace-name"
          label="New workspace name"
          placeholder="e.g. North parish verges"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button type="submit">Create workspace</Button>
      </form>

      {isLoading ? (
        <p className="text-sm text-slate-600">Loading workspaces…</p>
      ) : workspaces.length === 0 ? (
        <Alert variant="info">No workspaces yet. Create one above.</Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workspaces.map((workspace) => (
            <Card key={workspace.id}>
              <CardHeader>
                <CardTitle>{workspace.name}</CardTitle>
                <CardDescription>
                  Created {new Date(workspace.createdAt).toLocaleDateString()}
                  {workspace.isDemo ? ' · Synthetic demo data' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {workspace.id === activeWorkspaceId && (
                    <span className="text-xs font-semibold text-emerald-800">Active workspace</span>
                  )}
                  {workspace.isDemo && <Badge variant="demo" />}
                </div>
                {renameId === workspace.id ? (
                  <form onSubmit={(e) => void handleRename(e, workspace.id)} className="space-y-3">
                    <Input
                      id={`rename-${workspace.id}`}
                      label="Workspace name"
                      value={renameName}
                      onChange={(e) => setRenameName(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button type="submit" size="sm">
                        Save name
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setRenameId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={workspace.id === activeWorkspaceId ? 'primary' : 'secondary'}
                      onClick={() => void setActiveWorkspaceId(workspace.id)}
                    >
                      {workspace.id === activeWorkspaceId ? 'Active' : 'Set active'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setRenameId(workspace.id);
                        setRenameName(workspace.name);
                      }}
                    >
                      Rename
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => void handleDelete(workspace.id, workspace.name)}
                    >
                      Delete
                    </Button>
                    <Link to="/survey">
                      <Button type="button" size="sm" variant="secondary">
                        Open survey
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
