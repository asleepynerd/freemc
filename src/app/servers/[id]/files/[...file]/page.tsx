"use client";
import { useState, useEffect, useRef } from "react";
import {
  Container,
  Title,
  Button,
  Group,
  Loader,
  Alert,
  Badge,
  rem
} from "@mantine/core";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { IconArrowLeft, IconDeviceFloppy, IconFileText } from "@tabler/icons-react";
import dynamic from "next/dynamic";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

export default function FileEditPage() {
  const params = useParams();
  const router = useRouter();
  const serverId = params.id as string;
  const filePathArray = params.file as string[];
  const filePath = filePathArray.join('/');

  const [fileContents, setFileContents] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [saved, setSaved] = useState(false);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    loadFile();
    // eslint-disable-next-line
  }, [serverId, filePath]);

  const loadFile = async () => {
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const pathSegments = filePath.startsWith('/') ? filePath.slice(1) : filePath;
      const encodedPath = pathSegments.split('/').map(encodeURIComponent).join('/');
      const response = await fetch(`/api/servers/${serverId}/files/${encodedPath}`);
      if (!response.ok) {
        throw new Error('Failed to load file');
      }
      const data = await response.json();
      setFileContents(data.contents);
      setHasChanges(false);
    } catch (err) {
      setError('Failed to load file contents');
      console.error('Error loading file:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const pathSegments = filePath.startsWith('/') ? filePath.slice(1) : filePath;
      const encodedPath = pathSegments.split('/').map(encodeURIComponent).join('/');
      const response = await fetch(`/api/servers/${serverId}/files/${encodedPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: fileContents })
      });
      if (!response.ok) throw new Error('Failed to save file');
      setHasChanges(false);
      setError(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError('Failed to save file');
    } finally {
      setSaving(false);
    }
  };

  const handleContentChange = (value: string | undefined) => {
    setFileContents(value ?? '');
    setHasChanges(true);
    setSaved(false);
  };

  const handleBack = () => {
    if (hasChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        router.push(`/servers/${serverId}/files`);
      }
    } else {
      router.push(`/servers/${serverId}/files`);
    }
  };

  const getLanguage = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (["js", "jsx", "ts", "tsx"].includes(ext!)) return "typescript";
    if (["json"].includes(ext!)) return "json";
    if (["yml", "yaml"].includes(ext!)) return "yaml";
    if (["md"].includes(ext!)) return "markdown";
    if (["html", "htm"].includes(ext!)) return "html";
    if (["css", "scss", "sass"].includes(ext!)) return "css";
    if (["sh", "bash"].includes(ext!)) return "shell";
    if (["properties", "conf", "cfg"].includes(ext!)) return "ini";
    if (["xml"].includes(ext!)) return "xml";
    return "plaintext";
  };

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Group justify="center" py="xl">
          <Loader color="violet" />
        </Group>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl" style={{ minHeight: "80vh" }}>
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 1100,
        margin: '0 auto',
        background: 'rgba(24, 25, 38, 0.92)',
        border: '1.5px solid #23243a',
        borderRadius: 16,
        minHeight: 480,
        boxShadow: '0 2px 16px 0 rgba(24,25,38,0.10)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <Button
          leftSection={<IconDeviceFloppy size={16} />}
          color="violet"
          onClick={handleSave}
          loading={saving}
          disabled={!hasChanges}
          style={{
            position: 'absolute',
            top: 18,
            right: 18,
            zIndex: 2,
            textTransform: 'lowercase',
            fontWeight: 600,
            minWidth: 90,
            opacity: hasChanges ? 1 : 0.7
          }}
        >
          save
        </Button>
        <Group gap="md" style={{ padding: '18px 24px 0 24px', alignItems: 'center' }}>
          <Button
            component={Link}
            href={`/servers/${serverId}/files`}
            variant="subtle"
            color="gray"
            size="sm"
            leftSection={<IconArrowLeft size={16} />}
            style={{ textTransform: "lowercase", background: 'none', boxShadow: 'none', paddingLeft: 0 }}
            onClick={e => {
              e.preventDefault();
              handleBack();
            }}
          >
            back to files
          </Button>
          <IconFileText size={20} color="#b3baff" />
          <Title order={4} style={{ color: "#b3baff", fontSize: "1.1rem", fontWeight: 700, marginLeft: 2, letterSpacing: 0.5 }}>
            {filePath.split('/').pop()}
          </Title>
          {hasChanges && <Badge color="yellow" variant="filled">unsaved</Badge>}
          {saved && <Badge color="green" variant="filled">saved</Badge>}
        </Group>
        {error && (
          <Alert color="red" title="Error" onClose={() => setError(null)} style={{ margin: '18px 24px 0 24px' }}>
            {error}
          </Alert>
        )}
        <div style={{ flex: 1, minHeight: 400, margin: '18px 0 0 0', padding: '0 24px 24px 24px', display: 'flex' }}>
          <MonacoEditor
            language={getLanguage(filePath)}
            value={fileContents}
            theme="vs-dark"
            options={{
              fontSize: 15,
              fontFamily: 'JetBrains Mono, Fira Mono, monospace',
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              lineNumbers: 'on',
              roundedSelection: false,
              cursorBlinking: 'smooth',
              scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
              formatOnPaste: true,
              formatOnType: true,
              padding: { top: 18, bottom: 18 },
              overviewRulerLanes: 0,
              lineDecorationsWidth: 8,
              lineNumbersMinChars: 3,
              tabSize: 2,
              folding: true,
              showFoldingControls: 'always',
              renderWhitespace: 'boundary',
              contextmenu: true,
              codeLens: false,
              dragAndDrop: false,
              links: true,
              acceptSuggestionOnEnter: 'on',
              autoClosingBrackets: 'always',
              autoClosingQuotes: 'always',
              autoIndent: 'advanced',
              matchBrackets: 'always',
              glyphMargin: false,
              hideCursorInOverviewRuler: true,
              renderControlCharacters: false,
              renderFinalNewline: "on",
              scrollBeyondLastColumn: 2,
              useTabStops: true,
              mouseWheelZoom: true,
              accessibilitySupport: 'auto',
            }}
            onChange={handleContentChange}
            loading="Loading..."
            height="400px"
          />
        </div>
      </div>
    </Container>
  );
}
