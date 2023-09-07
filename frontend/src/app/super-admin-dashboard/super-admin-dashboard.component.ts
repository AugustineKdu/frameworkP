import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface ChatGroup {
  id: number;
  name: string;
  messages: { content: string }[];
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
    // Fetch all users from the server
    this.http.get<User[]>('http://localhost:3000/api/users').subscribe(data => {
      this.users = data;
    });

    // Fetch all chat groups from the server
    this.http.get<ChatGroup[]>('http://localhost:3000/api/chat-groups').subscribe(data => {
      this.chatGroups = data;
    });
  }


  // Delete a user by their ID
  deleteUser(userId: number) {
    this.http.delete(`http://localhost:3000/api/users/${userId}`).subscribe(() => {
      this.users = this.users.filter(user => user.id !== userId);
    });
  }

  changeUserRole(userId: number, newRole: string) {
    this.http.put<{ role: string }>(`http://localhost:3000/api/users/${userId}`, { role: newRole })
      .subscribe(
        (response) => {
          const user = this.users.find(u => u.id === userId);
          if (user) {
            user.role = response.role;
          }
        },
        (error) => {
          console.log('An error occurred', error);
        }
      );
  }

  // Delete a chat group by its ID
  deleteChatGroup(groupId: number) {
    this.http.delete(`http://localhost:3000/api/chat-groups/${groupId}`).subscribe(() => {
      this.chatGroups = this.chatGroups.filter(group => group.id !== groupId);
    });
  }

  // Add a user to a chat group
  addUserToChatGroup(groupId: number, username: string) {
    this.http.put(`http://localhost:3000/api/chat-groups/${groupId}/add-user`, { username })
      .subscribe(
        (response) => {
          const group = this.chatGroups.find(g => g.id === groupId);
          if (group) {
            group.usernames.push(username);
          }
        },
        (error) => {
          console.log('An error occurred', error);
        }
      );
  }

  // Remove a user from a chat group
  removeUserFromChatGroup(groupId: number, username: string) {
    this.http.put(`http://localhost:3000/api/chat-groups/${groupId}/remove-user`, { username })
      .subscribe(
        (response) => {
          const group = this.chatGroups.find(g => g.id === groupId);
          if (group) {
            const index = group.usernames.indexOf(username);
            if (index > -1) {
              group.usernames.splice(index, 1);
            }
          }
        },
        (error) => {
          console.log('An error occurred', error);
        }
      );
  }

}
