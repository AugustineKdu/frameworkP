import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface Message {
  content: string;
}

interface Channel {
  id: number;
  name: string;
  messages: Message[];
  usernames: string[];
}

interface ChatGroup {
  id: number;
  name: string;
  channels: Channel[];
  usernames: string[];
}

@Component({
  selector: 'app-super-admin-dashboard',
  templateUrl: './super-admin-dashboard.component.html',
  styleUrls: ['./super-admin-dashboard.component.css']
})
export class SuperAdminDashboardComponent implements OnInit {
  users: User[] = [];
  chatGroups: ChatGroup[] = [];

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.http.get<User[]>('http://localhost:3000/api/users').subscribe(data => {
      this.users = data;
    });

    this.http.get<ChatGroup[]>('http://localhost:3000/api/chat-groups').subscribe(data => {
      this.chatGroups = data;
    });
  }

  // Other existing methods ...

  // Add a channel to a chat group
  addChannelToChatGroup(groupId: number, channelName: string) {
    this.http.post<Channel>(`http://localhost:3000/api/chat-groups/${groupId}/channels`, { name: channelName })
      .subscribe(
        (newChannel) => {
          const group = this.chatGroups.find(g => g.id === groupId);
          if (group) {
            group.channels.push(newChannel);
          }
        },
        (error) => {
          console.log('An error occurred', error);
        }
      );
  }

  // Delete a channel from a chat group
  deleteChannelFromChatGroup(groupId: number, channelId: number) {
    this.http.delete(`http://localhost:3000/api/chat-groups/${groupId}/channels/${channelId}`).subscribe(() => {
      const group = this.chatGroups.find(g => g.id === groupId);
      if (group) {
        group.channels = group.channels.filter(channel => channel.id !== channelId);
      }
    });
  }

  // Add a message to a channel
  addMessageToChannel(groupId: number, channelId: number, content: string) {
    this.http.post<Message>(`http://localhost:3000/api/chat-groups/${groupId}/channels/${channelId}/messages`, { content })
      .subscribe(
        (newMessage) => {
          const group = this.chatGroups.find(g => g.id === groupId);
          const channel = group?.channels.find(c => c.id === channelId);
          if (channel) {
            channel.messages.push(newMessage);
          }
        },
        (error) => {
          console.log('An error occurred', error);
        }
      );
  }
}
