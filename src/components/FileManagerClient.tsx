"use client";
import { useState, useEffect } from "react";
import { 
  Container, 
  Title, 
  Text, 
  Stack, 
  Button, 
  Group, 
  Paper, 
  TextInput, 
  Modal, 
  Loader, 
  ActionIcon, 
  Menu,
  Breadcrumbs,
  Anchor,
  Textarea,
  FileButton,
  Alert
} from "@mantine/core";
import Link from "next/link";
import { 
  IconFolder, 
  IconFile, 
  IconPlus, 
  IconTrash, 
  IconEdit, 
  IconDownload, 
  IconUpload,
  IconFolderPlus,
  IconArrowLeft,
  IconDotsVertical
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";

interface FileItem {
  attributes: {
    name: string;
    mode: string;
    modified_at: string;
    size: number;
    is_file: boolean;
    is_symlink: boolean;
    mimetype: string;
  };
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString();
}

export default function FileManagerClient({ serverId }: { serverId: string }) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState('/');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContents, setFileContents] = useState('');
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  const router = useRouter();

  const loadFiles = async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/servers/${serverId}/files?directory=${encodeURIComponent(path)}`);
      if (!response.ok) {
        throw new Error('failed to load files');
      }
      const data = await response.json();
      setFiles(data);
    } catch (err) {
      setError('failed to load files');
      console.error('error loading files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles(currentPath);
  }, [currentPath, serverId]);

  const handleFileClick = async (file: FileItem) => {
    const fileName = file.attributes.name;
    const filePath = currentPath === '/' ? `/${fileName}` : `${currentPath}/${fileName}`;
    
    if (file.attributes.is_file) {
      const textExtensions = ['.txt', '.json', '.yml', '.yaml', '.properties', '.conf', '.cfg', '.log', '.md', '.js', '.ts', '.jsx', '.tsx', '.css', '.html', '.xml'];
      const isTextFile = textExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
      
      if (isTextFile) {
        const pathSegments = filePath.startsWith('/') ? filePath.slice(1) : filePath;
        const encodedPath = pathSegments.split('/').map(encodeURIComponent).join('/');
        router.push(`/servers/${serverId}/files/${encodedPath}`);
      } else {
        try {
          const pathSegments = filePath.startsWith('/') ? filePath.slice(1) : filePath;
          const encodedPath = pathSegments.split('/').map(encodeURIComponent).join('/');
          const response = await fetch(`/api/servers/${serverId}/files/${encodedPath}?download=true`);
          if (!response.ok) throw new Error('failed to get download URL');
          const data = await response.json();
          window.open(data.downloadUrl, '_blank');
        } catch (err) {
          setError('failed to download file');
        }
      }
    } else {
      setCurrentPath(filePath);
      setSelectedFile(null);
      setFileContents('');
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      const response = await fetch(`/api/servers/${serverId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_folder',
          name: newFolderName,
          directory: currentPath
        })
      });
      
      if (!response.ok) throw new Error('failed to create folder');
      
      setShowCreateFolder(false);
      setNewFolderName('');
      loadFiles(currentPath);
    } catch (err) {
      setError('failed to create folder');
    }
  };

  const handleDeleteFile = async () => {
    if (!fileToDelete) return;
    
    try {
      const response = await fetch(`/api/servers/${serverId}/files?file=${encodeURIComponent(fileToDelete)}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('failed to delete file');
      
      setShowDeleteConfirm(false);
      setFileToDelete(null);
      loadFiles(currentPath);
      if (selectedFile === fileToDelete) {
        setSelectedFile(null);
        setFileContents('');
      }
    } catch (err) {
      setError('failed to delete file');
    }
  };

  const handleSaveFile = async () => {
    if (!selectedFile || !fileContents) return;
    
    setSaving(true);
    try {
      const pathSegments = selectedFile.startsWith('/') ? selectedFile.slice(1) : selectedFile;
      const encodedPath = pathSegments.split('/').map(encodeURIComponent).join('/');
      const response = await fetch(`/api/servers/${serverId}/files/${encodedPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: fileContents })
      });
      
      if (!response.ok) throw new Error('failed to save file');
      
      setEditingFile(null);
    } catch (err) {
      setError('failed to save file');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (files: File[]) => {
    if (!files || files.length === 0) return;
    
    setUploading(true);
    setError(null);
    setUploadProgress(`uploading ${files.length} file${files.length > 1 ? 's' : ''}...`);
    
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      
      const response = await fetch(`/api/servers/${serverId}/files?directory=${encodeURIComponent(currentPath)}`, {
        method: 'PUT',
        body: formData,
      });
      
      if (!response.ok) throw new Error('failed to upload files');
      
      const result = await response.json();
      const failures = result.results.filter((r: any) => !r.success);
      
      if (failures.length > 0) {
        setError(`failed to upload: ${failures.map((f: any) => f.name).join(', ')}`);
      } else {
        setUploadProgress(`successfully uploaded ${files.length} file${files.length > 1 ? 's' : ''}!`);
        setTimeout(() => setUploadProgress(''), 3000);
      }
      
      loadFiles(currentPath);
    } catch (err) {
      setError('failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const navigateToPath = (path: string) => {
    setCurrentPath(path);
    setSelectedFile(null);
    setFileContents('');
  };

  const breadcrumbItems = currentPath.split('/').filter(Boolean).map((segment, index, array) => {
    const path = '/' + array.slice(0, index + 1).join('/');
    return (
      <Anchor key={path} onClick={() => navigateToPath(path)} style={{ color: '#b3baff', cursor: 'pointer' }}>
        {segment}
      </Anchor>
    );
  });

  const sortedFiles = [...files].sort((a, b) => {
    if (a.attributes.is_file !== b.attributes.is_file) {
      return a.attributes.is_file ? 1 : -1;
    }
    return a.attributes.name.localeCompare(b.attributes.name);
  });

  return (
    <Container size="xl" py="xl" style={{ minHeight: "80vh" }}>
      <Stack gap="lg" style={{ width: "100%" }}>
        <Group justify="space-between" align="center">
          <Title order={2} style={{ color: "#b3baff", fontSize: "2rem" }}>
            file manager
          </Title>
          <Button component={Link} href={`/servers/${serverId}`} variant="subtle" color="gray" size="sm" style={{ textTransform: "lowercase" }}>
            ← back to server
          </Button>
        </Group>

        {error && (
          <Alert color="red" title="Error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {uploadProgress && (
          <Alert color="green" title="Upload Status">
            {uploadProgress}
          </Alert>
        )}

        <Paper withBorder p="lg" radius="lg" style={{ background: "rgba(35, 36, 58, 0.8)", backdropFilter: "blur(8px)", border: "1px solid rgba(179, 186, 255, 0.1)" }}>
          <Group justify="space-between" align="center" mb="md">
            <Breadcrumbs separator="→" style={{ color: '#ededed' }}>
              <Anchor onClick={() => navigateToPath('/')} style={{ color: '#b3baff', cursor: 'pointer' }}>
                root
              </Anchor>
              {breadcrumbItems}
            </Breadcrumbs>
            <Group gap="xs">
              <FileButton onChange={handleFileUpload} accept="*" multiple>
                {(props) => (
                  <Button 
                    {...props}
                    leftSection={<IconUpload size={16} />} 
                    size="xs" 
                    color="blue" 
                    loading={uploading}
                    style={{ textTransform: "lowercase" }}
                  >
                    upload files
                  </Button>
                )}
              </FileButton>
              <Button 
                leftSection={<IconFolderPlus size={16} />} 
                size="xs" 
                color="violet" 
                onClick={() => setShowCreateFolder(true)}
                style={{ textTransform: "lowercase" }}
              >
                new folder
              </Button>
            </Group>
          </Group>

          {loading ? (
            <Group justify="center" py="xl">
              <Loader color="violet" />
            </Group>
          ) : (
            <Stack gap="xs">
              {sortedFiles.map((file) => (
                <Paper
                  key={file.attributes.name}
                  p="sm"
                  radius="md"
                  style={{
                    background: "rgba(24, 25, 38, 0.5)",
                    border: "1px solid rgba(179, 186, 255, 0.1)",
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(24, 25, 38, 0.7)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "rgba(24, 25, 38, 0.5)"}
                >
                  <Group justify="space-between" align="center">
                    <Group
                      gap="sm"
                      onClick={() => handleFileClick(file)}
                      style={{ flex: 1, cursor: 'pointer' }}
                    >
                      {file.attributes.is_file ? (
                        <IconFile size={20} color="#b3baff" />
                      ) : (
                        <IconFolder size={20} color="#ffd1b3" />
                      )}
                      <div>
                        <Text size="sm" style={{ color: "#ededed", fontWeight: 500 }}>
                          {file.attributes.name}
                        </Text>
                        <Text size="xs" style={{ color: "#888" }}>
                          {file.attributes.is_file ? formatBytes(file.attributes.size) : 'folder'} • {formatDate(file.attributes.modified_at)}
                        </Text>
                      </div>
                    </Group>
                    <Menu shadow="md" width={150} position="bottom-end">
                      <Menu.Target>
                        <ActionIcon variant="subtle" size="sm">
                          <IconDotsVertical size={16} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        {file.attributes.is_file && (
                          <>
                            <Menu.Item 
                              leftSection={<IconDownload size={16} />}
                              onClick={() => handleFileClick(file)}
                            >
                              download
                            </Menu.Item>
                            <Menu.Item 
                              leftSection={<IconEdit size={16} />}
                              onClick={() => {
                                const filePath = currentPath === '/' ? `/${file.attributes.name}` : `${currentPath}/${file.attributes.name}`;
                                handleFileClick(file);
                                setEditingFile(filePath);
                              }}
                            >
                              edit
                            </Menu.Item>
                          </>
                        )}
                        <Menu.Item 
                          leftSection={<IconTrash size={16} />}
                          color="red"
                          onClick={() => {
                            const filePath = currentPath === '/' ? `/${file.attributes.name}` : `${currentPath}/${file.attributes.name}`;
                            setFileToDelete(filePath);
                            setShowDeleteConfirm(true);
                          }}
                        >
                          delete
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Group>
                </Paper>
              ))}
            </Stack>
          )}
        </Paper>

        {selectedFile && (
          <Paper withBorder p="lg" radius="lg" style={{ background: "rgba(35, 36, 58, 0.8)", backdropFilter: "blur(8px)", border: "1px solid rgba(179, 186, 255, 0.1)" }}>
            <Group justify="space-between" align="center" mb="md">
              <Text style={{ color: "#b3baff", fontWeight: 600 }}>
                {selectedFile.split('/').pop()}
              </Text>
              {editingFile === selectedFile ? (
                <Group gap="xs">
                  <Button 
                    size="xs" 
                    color="green" 
                    onClick={handleSaveFile}
                    loading={saving}
                    style={{ textTransform: "lowercase" }}
                  >
                    save
                  </Button>
                  <Button 
                    size="xs" 
                    variant="subtle" 
                    onClick={() => setEditingFile(null)}
                    style={{ textTransform: "lowercase" }}
                  >
                    cancel
                  </Button>
                </Group>
              ) : (
                <Button 
                  size="xs" 
                  color="violet" 
                  onClick={() => setEditingFile(selectedFile)}
                  style={{ textTransform: "lowercase" }}
                >
                  edit
                </Button>
              )}
            </Group>
            <Textarea
              value={fileContents}
              onChange={(e) => setFileContents(e.currentTarget.value)}
              readOnly={editingFile !== selectedFile}
              minRows={10}
              maxRows={20}
              style={{
                fontFamily: 'monospace',
                fontSize: 14,
                background: editingFile === selectedFile ? 'rgba(24, 25, 38, 0.8)' : 'rgba(24, 25, 38, 0.5)',
                border: '1px solid rgba(179, 186, 255, 0.2)',
                color: '#ededed'
              }}
            />
          </Paper>
        )}
      </Stack>

      <Modal opened={showCreateFolder} onClose={() => setShowCreateFolder(false)} title="create new folder" centered>
        <Stack gap="md">
          <TextInput
            label="folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.currentTarget.value)}
            placeholder="enter folder name"
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
          />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setShowCreateFolder(false)}>
              cancel
            </Button>
            <Button color="violet" onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              create
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="confirm deletion" centered>
        <Stack gap="md">
          <Text>
            are you sure you want to delete <strong>{fileToDelete?.split('/').pop()}</strong>? this action cannot be undone.
          </Text>
          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setShowDeleteConfirm(false)}>
              cancel
            </Button>
            <Button color="red" onClick={handleDeleteFile}>
              delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
} 