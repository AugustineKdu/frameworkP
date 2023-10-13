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
  currentUser: any = null;
  // Setting the base URL as a property of the component
  baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {
    this.socket = io(this.baseUrl);

    this.socket.on('new message', (data: { roomId: number; message: string }) => {
      if (this.selectedGroup?.id === data.roomId) {
        this.selectedGroup.messages.push({ content: data.message });
      }
    });
  }

  ngOnInit(): void {
    this.chatGroups = this.loadFromLocalStorage();

    // Using the base URL in the HTTP request
    this.http.get<ChatGroup[]>(`${this.baseUrl}/api/chat-groups`).subscribe((groups) => {
      this.chatGroups = groups;
      this.saveToLocalStorage();
    });

    const user = sessionStorage.getItem('currentUser');
    if (user) {
      this.currentUser = JSON.parse(user);
    }
  }

  selectGroup(groupId: number): void {
    this.selectedGroup = this.chatGroups.find((group) => group.id === groupId) || null;
    if (this.selectedGroup) {
      this.socket.emit('joinRoom', groupId);
    }
  }

  addGroup() {
    if (this.currentUser && (this.currentUser.role === 'group-admin' || this.currentUser.role === 'super-admin')) {
      const groupName = prompt('Enter new group name:');
      if (groupName) {
        this.http.post<ChatGroup>(`${this.baseUrl}/api/chat-groups`, { name: groupName }).subscribe((newGroup) => {
          this.chatGroups.push(newGroup);
          this.saveToLocalStorage();
        });
      }
    } else {
      alert('You do not have permission to add a group.');
    }
  }

  deleteGroup(groupId: number) {
    if (this.currentUser && (this.currentUser.role === 'group-admin' || this.currentUser.role === 'super-admin')) {
      this.http.delete(`${this.baseUrl}/api/chat-groups/${groupId}`).subscribe(() => {
        const index = this.chatGroups.findIndex(group => group.id === groupId);
        if (index !== -1) {
          this.chatGroups.splice(index, 1);
          this.saveToLocalStorage();
        }
      });
    } else {
      alert('You do not have permission to delete a group.');
    }
  }

  sendMessage(): void {
    if (this.currentUser && this.selectedGroup) {
      this.socket.emit('send message', { message: this.newMessage, roomId: this.selectedGroup.id });
      this.newMessage = '';
    } else {
      alert('You must be logged in to send a message.');
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
