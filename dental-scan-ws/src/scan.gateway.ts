import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    WebSocketServer,
    OnGatewayConnection,
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  
  @WebSocketGateway({ cors: true })
  export class ScanGateway implements OnGatewayConnection {
    @WebSocketServer()
    server: Server;
  
    handleConnection(client: Socket) {
      console.log(`Client connected: ${client.id}`);
    }
  
    @SubscribeMessage('join_scan')
    handleJoin(client: Socket, payload: string) {
      client.join(payload);
      console.log(`Client ${client.id} joined scan room: ${payload}`);
    }
  
    @SubscribeMessage('scan_chunk')
    handleScanChunk(@MessageBody() data: any) {
      const { scanId } = data;
      this.server.to(scanId).emit('scan_update', data);
    }
  }
  