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
  currentUser: any = null; // 현재 사용자 정보를 저장할 변수

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

    // Load current user from session storage
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
    if (this.currentUser) {
      if (this.currentUser.role === 'group-admin' || this.currentUser.role === 'super-admin') {
        const groupName = prompt('Enter new group name:');
        if (groupName) {
          this.http.post<ChatGroup>('http://localhost:3000/api/chat-groups', { name: groupName }).subscribe((newGroup) => {
            this.chatGroups.push(newGroup);
            this.saveToLocalStorage();
          });
        }
      } else {
        alert('You do not have permission to add a group.');
      }
    } else {
      alert('You are not logged in.');
    }
  }

  deleteGroup(groupId: number) {
    if (this.currentUser) {
      if (this.currentUser.role === 'group-admin' || this.currentUser.role === 'super-admin') {
        this.http.delete(`http://localhost:3000/api/chat-groups/${groupId}`).subscribe(() => {
          const index = this.chatGroups.findIndex(group => group.id === groupId);
          if (index !== -1) {
            this.chatGroups.splice(index, 1);
            this.saveToLocalStorage();
          }
        });
      } else {
        alert('You do not have permission to delete a group.');
      }
    } else {
      alert('You are not logged in.');
    }
  }


  sendMessage(): void {
    if (this.currentUser) {
      if (this.selectedGroup) {
        this.socket.emit('send message', { message: this.newMessage, roomId: this.selectedGroup.id });
        this.newMessage = '';
      }
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
