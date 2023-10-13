import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { io, Socket } from 'socket.io-client';

interface ChatMessage {
  sender: string;
  content: string;
  timestamp: string;  // Using string to store the ISO string of the date
  avatarUrl: string;
  mediaUrl?: string | null;
}


interface ChatGroup {
  id: number;
  name: string;
  messages: ChatMessage[];
}


@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {
  socket: Socket;
  newMessage = '';
  selectedFile: File | null = null;
  selectedMediaUrl?: string | null = null;
  chatGroups: ChatGroup[] = [];
  selectedGroup: ChatGroup | null = null;
  currentUser: any = null;

  constructor(private http: HttpClient) {
    this.socket = io('http://localhost:3000');
    this.socket.on('new message', (data: { roomId: number; message: ChatMessage }) => {
      if (this.selectedGroup?.id === data.roomId) {
        this.selectedGroup.messages.push(data.message);
        this.saveToLocalStorage();
      }
    });
  }

  ngOnInit(): void {
    this.chatGroups = this.loadFromLocalStorage();
    this.http.get<ChatGroup[]>('http://localhost:3000/api/chat-groups').subscribe((groups) => {
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

  addGroup(): void {
    if (this.currentUser && ['group-admin', 'super-admin'].includes(this.currentUser.role)) {
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
  }

  deleteGroup(groupId: number): void {
    if (this.currentUser && ['group-admin', 'super-admin'].includes(this.currentUser.role)) {
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
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  sendMessage(): void {
    if (this.currentUser && this.selectedGroup) {
      const message: ChatMessage = {
        sender: this.currentUser.username,
        content: this.newMessage,
        timestamp: new Date().toISOString(),
        avatarUrl: this.currentUser.avatarUrl,
        mediaUrl: this.selectedMediaUrl || null  // Handle undefined
      };
      this.socket.emit('send message', { message, roomId: this.selectedGroup.id });
      this.newMessage = '';
      this.selectedMediaUrl = null;
    } else {
      alert('You must be logged in to send a message.');
    }
  }


  actualSendMessage(fileUrl: string | null): void {
    if (this.currentUser && this.selectedGroup) {
      const message: ChatMessage = {
        content: this.newMessage,
        sender: this.currentUser.username,
        timestamp: new Date().toISOString(),
        avatarUrl: this.currentUser.avatarUrl,
        mediaUrl: fileUrl
      };
      this.socket.emit('send message', { message, roomId: this.selectedGroup.id });
      this.newMessage = '';
      this.selectedFile = null;
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
