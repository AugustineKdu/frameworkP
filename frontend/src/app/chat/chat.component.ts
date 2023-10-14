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
  currentUser: any = null; // To store the current user's information

  constructor(private http: HttpClient) {
    // Initialize Socket.io
    this.socket = io('http://localhost:3000');

    // Listen for new messages and update the UI
    this.socket.on('new message', (data: { _id: number; message: string }) => {
      if (this.selectedGroup?.id === data._id) {
        this.selectedGroup.messages.push({ content: data.message });
        this.saveToLocalStorage(); // Save updated messages to local storage
      }
    });
  }

  ngOnInit(): void {
    // Load chat groups from local storage first
    this.chatGroups = this.loadFromLocalStorage();

    // Then update from the server
    this.http.get<ChatGroup[]>('http://localhost:3000/api/chat-groups').subscribe((groups) => {
      this.chatGroups = groups;
      this.saveToLocalStorage(); // Save to local storage
    });

    // Load the current user from session storage
    const user = sessionStorage.getItem('currentUser');
    if (user) {
      this.currentUser = JSON.parse(user);
    }
  }

  // Function to select a chat group
  selectGroup(_id: number): void {
    this.selectedGroup = this.chatGroups.find((group) => group.id === _id) || null;
    if (this.selectedGroup) {
      this.socket.emit('joinRoom', _id); // Join the selected chat room
    }
  }

  // Function to add a new chat group
  addGroup() {
    // Check if the user has the permission to add a group
    if (this.currentUser && (this.currentUser.role === 'group-admin' || this.currentUser.role === 'super-admin')) {
      const groupName = prompt('Enter new group name:');
      if (groupName) {
        this.http.post<ChatGroup>('http://localhost:3000/api/chat-groups', { name: groupName }).subscribe((newGroup) => {
          this.chatGroups.push(newGroup);
          this.saveToLocalStorage(); // Save to local storage
        });
      }
    } else {
      alert('You do not have permission to add a group.');
    }
  }

  // Function to delete a chat group
  deleteGroup(groupId: number) {
    // Check if the user has the permission to delete a group
    if (this.currentUser && (this.currentUser.role === 'group-admin' || this.currentUser.role === 'super-admin')) {
      this.http.delete(`http://localhost:3000/api/chat-groups/${groupId}`).subscribe(() => {
        const index = this.chatGroups.findIndex(group => group.id === groupId);
        if (index !== -1) {
          this.chatGroups.splice(index, 1);
          this.saveToLocalStorage(); // Save to local storage
        }
      });
    } else {
      alert('You do not have permission to delete a group.');
    }
  }

  // Function to send a message
  sendMessage(): void {
    // Check if the user is logged in
    if (this.currentUser && this.selectedGroup) {
      this.socket.emit('send message', { message: this.newMessage, _id: this.selectedGroup.id });
      this.newMessage = ''; // Clear the input field
    } else {
      alert('You must be logged in to send a message.');
    }
  }

  // Function to save chat groups to local storage
  saveToLocalStorage(): void {
    localStorage.setItem('chatGroups', JSON.stringify(this.chatGroups));
  }

  // Function to load chat groups from local storage
  loadFromLocalStorage(): ChatGroup[] {
    const storedGroups = localStorage.getItem('chatGroups');
    return storedGroups ? JSON.parse(storedGroups) : [];
  }
}
