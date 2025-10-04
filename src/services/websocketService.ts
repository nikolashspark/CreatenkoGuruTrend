// WebSocket Service for real-time communication with Railway backend
class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    this.connect();
  }

  private connect() {
    const railwayUrl = import.meta.env.VITE_RAILWAY_API_URL || 'https://createnkogurutrend-production.up.railway.app';
    const wsUrl = railwayUrl.replace('https://', 'wss://').replace('http://', 'ws://');
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('🔌 WebSocket connected to Railway');
        this.reconnectAttempts = 0;
      };
      
      this.ws.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        this.reconnect();
      };
      
      this.ws.onerror = (error) => {
        console.error('🔌 WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.reconnect();
    }
  }

  private reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('❌ Max reconnection attempts reached');
    }
  }

  public sendClaudeRequest(payload: any, onResponse: (data: any) => void, onError: (error: string) => void) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = {
        type: 'claude_request',
        payload: payload
      };
      
      this.ws.send(JSON.stringify(message));
      
      // Set up one-time listener for response
      const handleMessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'claude_response') {
            onResponse(data.data);
            this.ws?.removeEventListener('message', handleMessage);
          } else if (data.type === 'error') {
            onError(data.error);
            this.ws?.removeEventListener('message', handleMessage);
          }
        } catch (error) {
          onError('Failed to parse WebSocket response');
          this.ws?.removeEventListener('message', handleMessage);
        }
      };
      
      this.ws.addEventListener('message', handleMessage);
    } else {
      onError('WebSocket not connected');
    }
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export default WebSocketService;
