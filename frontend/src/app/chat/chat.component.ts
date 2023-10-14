import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { io, Socket } from 'socket.io-client';

// Define the structure of a chat group
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

  constructor(private http: HttpClient) {
    // Initialize Socket.io
    this.socket = io('http://localhost:3000');

    // Listen for new messages and update the UI
    this.socket.on('new message', (data: { _id: number; message: string }) => {
      if (this.selectedGroup?.id === data._id) {
        this.selectedGroup.messages.push({ content: data.message });
      }
    });
  }

  ngOnInit(): void {
    // Update chat groups from the server
    this.http.get<ChatGroup[]>('http://localhost:3000/api/chat-groups').subscribe((groups) => {
      this.chatGroups = groups;
    });

    // Load the current user from session storage
    const user = sessionStorage.getItem('currentUser');
    if (user) {
      this.currentUser = JSON.parse(user);
    }
  }

  selectGroup(_id: number): void {
    this.selectedGroup = this.chatGroups.find((group) => group.id === _id) || null;
    if (this.selectedGroup) {
      this.socket.emit('joinRoom', _id);
    }
  }

  addGroup() {
    if (this.currentUser && (this.currentUser.role === 'group-admin' || this.currentUser.role === 'super-admin')) {
      const groupName = prompt('Enter new group name:');
      if (groupName) {
        this.http.post<ChatGroup>('http://localhost:3000/api/chat-groups', { name: groupName }).subscribe((newGroup) => {
          this.chatGroups.push(newGroup);
        });
      }
    } else {
      alert('You do not have permission to add a group.');
    }
  }

  deleteGroup(groupId: number) {
    if (this.currentUser && (this.currentUser.role === 'group-admin' || this.currentUser.role === 'super-admin')) {
      this.http.delete(`http://localhost:3000/api/chat-groups/${groupId}`).subscribe(() => {
        const index = this.chatGroups.findIndex(group => group.id === groupId);
        if (index !== -1) {
          this.chatGroups.splice(index, 1);
        }
      });
    } else {
      alert('You do not have permission to delete a group.');
    }
  }

  sendMessage(): void {
    if (this.currentUser && this.selectedGroup) {
      this.socket.emit('send message', { message: this.newMessage, _id: this.selectedGroup.id });
      this.newMessage = '';
    } else {
      alert('You must be logged in to send a message.');
    }
  }
}
