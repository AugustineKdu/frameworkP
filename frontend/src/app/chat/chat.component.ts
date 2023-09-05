import { Component, OnInit } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {
  socket: any;
  message: string = '';
  messages: string[] = [];

  constructor() {
    this.socket = io('http://localhost:3000');
  }

  ngOnInit(): void {
    this.socket.on('new message', (data: string) => {
      this.messages.push(data);
    });
  }

  sendMessage() {
    this.socket.emit('send message', this.message);
    this.message = '';
  }
}
