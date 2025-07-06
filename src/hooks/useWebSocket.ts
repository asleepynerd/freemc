import { useEffect, useRef, useState } from "react";

interface ServerStats {
  memory_bytes: number;
  memory_limit_bytes: number;
  cpu_absolute: number;
  network: { rx_bytes: number; tx_bytes: number };
  uptime: number;
  state: string;
  disk_bytes: number;
}

const useWebSocket = (serverId: string) => {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [stats, setStats] = useState<ServerStats | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/servers/${serverId}/console/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("Connected to WebSocket proxy");
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'console') {
          const lines = message.data.split('\n');
          setMessages(prev => [...prev, ...lines.filter((line: string) => line.length > 0)]);
        } else if (message.type === 'stats' || message.event === 'stats') {
          let statsData = message.args ? message.args[0] : message.data;
          if (typeof statsData === 'string') {
            statsData = JSON.parse(statsData);
          }
          setStats(statsData);
        } else if (message.type === 'error') {
          console.error("WebSocket error:", message.data);
        } else if (message.type === 'disconnect') {
          console.log("WebSocket disconnected:", message.data);
          setIsConnected(false);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [serverId]);

  const sendCommand = (command: string) => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify({ type: 'command', data: command }));
    }
  };

  return {
    isConnected,
    messages,
    sendCommand,
    clearMessages: () => setMessages([]),
    stats,
  };
};

export default useWebSocket; 