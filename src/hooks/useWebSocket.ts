import { useEffect, useRef, useState, useCallback } from "react";

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
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 1000;
  
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [stats, setStats] = useState<ServerStats | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const clearHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    clearHeartbeat();
    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  }, [clearHeartbeat]);

  const connect = useCallback(() => {
    if (isConnecting || (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    setIsConnecting(true);
    clearReconnectTimeout();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/servers/${serverId}/console/ws`;
    
    console.log("attempting websocket connection to:", wsUrl);
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("connected to websocket proxy");
      setIsConnected(true);
      setIsConnecting(false);
      reconnectAttemptsRef.current = 0;
      startHeartbeat();
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
          setIsConnecting(false);
        } else if (message.type === 'pong') {
          console.log("heartbeat response received");
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onclose = (event) => {
      console.log("websocket connection closed", event.code, event.reason);
      setIsConnected(false);
      setIsConnecting(false);
      clearHeartbeat();
      
      if (event.code === 1000 || event.code === 1001 || event.code === 1003) {
        console.log("websocket closed cleanly, not reconnecting");
        return;
      }
      
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        const delay = reconnectDelay * Math.pow(2, reconnectAttemptsRef.current);
        console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current++;
          connect();
        }, delay);
      } else {
        console.error("Max reconnection attempts reached");
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
      setIsConnecting(false);
    };
  }, [serverId, isConnecting, clearReconnectTimeout, clearHeartbeat, startHeartbeat]);

  useEffect(() => {
    connect();

    return () => {
      clearReconnectTimeout();
      clearHeartbeat();
      if (wsRef.current) {
        wsRef.current.close(1000, 'component unmounting');
        wsRef.current = null;
      }
    };
  }, [serverId, connect, clearReconnectTimeout, clearHeartbeat]);

  const sendCommand = useCallback((command: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'command', data: command }));
    } else {
      console.warn("websocket not connected, cannot send command");
    }
  }, []);

  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  return {
    isConnected,
    isConnecting,
    messages,
    sendCommand,
    clearMessages: () => setMessages([]),
    stats,
    reconnect,
  };
};

export default useWebSocket; 