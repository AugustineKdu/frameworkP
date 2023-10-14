import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { io, Socket } from 'socket.io-client';

interface ChatGroup {
  _id: string;
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
    this.socket = io('http://localhost:3000');

    this.socket.on('new message', (data: { roomId: string; message: string }) => {
      const group = this.chatGroups.find(g => g._id === data.roomId);
      if (group) {
        group.messages.push({ content: data.message });
      }
    });
  }

  ngOnInit(): void {
    this.http.get<ChatGroup[]>('http://localhost:3000/api/chat-groups').subscribe((groups) => {
      this.chatGroups = groups;
    });

    const user = sessionStorage.getItem('currentUser');
    if (user) {
      this.currentUser = JSON.parse(user);
    }
  }

  selectGroup(_id: string): void {
    this.selectedGroup = this.chatGroups.find((group) => group._id === _id) || null;
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

  deleteGroup(groupId: string) {
    if (this.currentUser && (this.currentUser.role === 'group-admin' || this.currentUser.role === 'super-admin')) {
      this.http.delete(`http://localhost:3000/api/chat-groups/${groupId}`).subscribe(() => {
        const index = this.chatGroups.findIndex(group => group._id === groupId);
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
      this.socket.emit('send message', { message: this.newMessage, roomId: this.selectedGroup._id });
      this.newMessage = '';
    } else {
      alert('You must be logged in to send a message.');
    }
  }
}
