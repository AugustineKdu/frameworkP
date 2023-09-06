import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { io, Socket } from 'socket.io-client';

interface ChatGroup {
  id: number;
  name: string;
  messages: { content: string }[];
}

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {
  socket: Socket;
  newMessage = '';
  chatGroups: ChatGroup[] = [];
  selectedGroup: ChatGroup | null = null;

  constructor(private http: HttpClient) {
    this.socket = io('http://localhost:3000');

    this.socket.on('new message', (data: { roomId: number; message: string }) => {
      if (this.selectedGroup?.id === data.roomId) {
        this.selectedGroup.messages.push({ content: data.message });
        this.saveToLocalStorage();
      }
    });
  }

  ngOnInit(): void {
    // Load from local storage first
    this.chatGroups = this.loadFromLocalStorage();

    // Then update from server
    this.http.get<ChatGroup[]>('http://localhost:3000/api/chat-groups').subscribe((groups) => {
      this.chatGroups = groups;
      this.saveToLocalStorage();
    });
  }

  selectGroup(groupId: number): void {
    this.selectedGroup = this.chatGroups.find((group) => group.id === groupId) || null;
    if (this.selectedGroup) {
      this.socket.emit('joinRoom', groupId);
    }
  }

  addGroup() {
    const groupName = prompt('Enter new group name:');
    if (groupName) {
      this.http.post<ChatGroup>('http://localhost:3000/api/chat-groups', { name: groupName }).subscribe((newGroup) => {
        this.chatGroups.push(newGroup);
        this.saveToLocalStorage();
      });
    }
  }

  deleteGroup(groupId: number) {
    this.http.delete(`http://localhost:3000/api/chat-groups/${groupId}`).subscribe(() => {
      const index = this.chatGroups.findIndex(group => group.id === groupId);
      if (index !== -1) {
        this.chatGroups.splice(index, 1);
        this.saveToLocalStorage();
      }
    });
  }

  sendMessage(): void {
    if (this.selectedGroup) {
      this.socket.emit('send message', { message: this.newMessage, roomId: this.selectedGroup.id });
      this.newMessage = '';
    }
  }

  saveToLocalStorage(): void {
    localStorage.setItem('chatGroups', JSON.stringify(this.chatGroups));
  }

  loadFromLocalStorage(): ChatGroup[] {
    const storedGroups = localStorage.getItem('chatGroups');
    return storedGroups ? JSON.parse(storedGroups) : [];
  }
}

