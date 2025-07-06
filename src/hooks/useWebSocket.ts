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
  const isConnectingRef = useRef(false);
  const lastReconnectTimeRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 2000;
  const minReconnectInterval = 3000;
  
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [stats, setStats] = useState<ServerStats | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

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
        try {
          wsRef.current.send(JSON.stringify({ type: 'ping' }));
        } catch (error) {
          console.error("error sending heartbeat:", error);
        }
      }
    }, 30000);
  }, [clearHeartbeat]);

  const connect = useCallback(() => {
    if (isConnectingRef.current || (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING)) {
      console.log("connection already in progress, skipping...");
      return;
    }

    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.log("max reconnection attempts reached, not connecting");
      return;
    }

    const now = Date.now();
    if (now - lastReconnectTimeRef.current < minReconnectInterval) {
      console.log("reconnection rate limited, skipping...");
      return;
    }
    lastReconnectTimeRef.current = now;

    isConnectingRef.current = true;
    setIsConnecting(true);
    setConnectionError(null);
    clearReconnectTimeout();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/servers/${serverId}/console/ws`;
    
    console.log("attempting websocket connection to:", wsUrl);
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      const connectionTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          console.error("websocket connection timeout");
          ws.close();
          setConnectionError("connection timeout");
          setIsConnecting(false);
          isConnectingRef.current = false;
        }
      }, 15000);

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log("connected to websocket proxy");
        setIsConnected(true);
        setIsConnecting(false);
        isConnectingRef.current = false;
        setConnectionError(null);
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
            setConnectionError(message.data);
          } else if (message.type === 'disconnect') {
            console.log("websocket disconnected:", message.data);
            setIsConnected(false);
            setIsConnecting(false);
            isConnectingRef.current = false;
            setConnectionError(message.data);
          } else if (message.type === 'pong') {
            console.log("heartbeat response received");
          }
        } catch (error) {
          console.error("error parsing websocket message:", error);
        }
      };

      ws.onclose = (event) => {
        clearTimeout(connectionTimeout);
        console.log("websocket connection closed", event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);
        isConnectingRef.current = false;
        clearHeartbeat();
        
        let errorMessage = null;
        if (event.code === 1006) {
          errorMessage = "connection lost unexpectedly";
        } else if (event.code === 1001) {
          errorMessage = "authentication failed";
        } else if (event.code === 1003) {
          errorMessage = "access denied";
        } else if (event.code === 1011) {
          errorMessage = "server error";
        } else if (event.code !== 1000) {
          errorMessage = `connection closed (${event.code})`;
        }
        
        setConnectionError(errorMessage);
        
        if (event.code === 1000 || event.code === 1001 || event.code === 1003) {
          console.log("websocket closed cleanly, not reconnecting");
          return;
        }
        
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.max(reconnectDelay * Math.pow(2, reconnectAttemptsRef.current), minReconnectInterval);
          console.log(`reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        } else {
          console.error("max reconnection attempts reached");
          setConnectionError("max reconnection attempts reached");
        }
      };

      ws.onerror = (error) => {
        clearTimeout(connectionTimeout);
        console.error("websocket error:", error);
        setIsConnected(false);
        setIsConnecting(false);
        isConnectingRef.current = false;
        setConnectionError("connection error");
      };
    } catch (error) {
      console.error("error creating websocket:", error);
      setIsConnecting(false);
      isConnectingRef.current = false;
      setConnectionError("failed to create connection");
    }
  }, [serverId, clearReconnectTimeout, clearHeartbeat]);

  useEffect(() => {
    connect();

    return () => {
      clearReconnectTimeout();
      clearHeartbeat();
      isConnectingRef.current = false;
      if (wsRef.current) {
        wsRef.current.close(1000, 'component unmounting');
        wsRef.current = null;
      }
    };
  }, [serverId, connect, clearReconnectTimeout, clearHeartbeat]);

  const sendCommand = useCallback((command: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ type: 'command', data: command }));
      } catch (error) {
        console.error("error sending command:", error);
        setConnectionError("failed to send command");
      }
    } else {
      console.warn("websocket not connected, cannot send command");
    }
  }, []);

  const reconnect = useCallback(() => {
    console.log("manual reconnect requested");
    clearReconnectTimeout();
    clearHeartbeat();
    if (wsRef.current) {
      wsRef.current.close();
    }
    reconnectAttemptsRef.current = 0;
    isConnectingRef.current = false;
    lastReconnectTimeRef.current = 0;
    setConnectionError(null);
    connect();
  }, [connect, clearReconnectTimeout, clearHeartbeat]);

  return {
    isConnected,
    isConnecting,
    messages,
    sendCommand,
    clearMessages: () => setMessages([]),
    stats,
    reconnect,
    connectionError,
  };
};

export default useWebSocket; 