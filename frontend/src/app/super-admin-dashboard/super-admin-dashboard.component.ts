import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface User {
  username: string;
  email: string;
  role: string;
}

interface ChatGroup {
  _id: string;
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

  // Delete a user by their username
  deleteUser(username: string) {
    this.http.delete(`http://localhost:3000/api/users/${username}`).subscribe(() => {
      this.users = this.users.filter(user => user.username !== username);
    });
  }

  // Change a user's role by their username
  changeUserRole(username: string, newRole: string) {
    this.http.put<{ role: string }>(`http://localhost:3000/api/users/${username}/role`, { newRole })
      .subscribe(
        (response) => {
          const user = this.users.find(u => u.username === username);
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
  deleteChatGroup(groupId: string) {
    this.http.delete(`http://localhost:3000/api/chat-groups/${groupId}`).subscribe(
      () => {
        this.chatGroups = this.chatGroups.filter((group) => group._id !== groupId);
        console.log('Group deleted successfully');
      },
      (error) => {
        console.error('An error occurred', error);
        // Optionally: Notify the user about the error
      }
    );
  }

  // Add a user to a chat group
  addUserToChatGroup(groupId: string, username: string) {
    // Check if groupId and username are defined and non-empty
    if (!groupId || !username) {
      console.error('GroupId or Username is not defined');
      // Optionally: Notify the user about the error
      return;
    }

    this.http.put(`http://localhost:3000/api/chat-groups/${groupId}/add-user`, { username }).subscribe(
      (response: any) => {
        const group = this.chatGroups.find((group) => group._id === groupId);
        if (group) {
          group.usernames.push(username);
          console.log('User added successfully');
        }
      },
      (error) => {
        console.error('An error occurred', error);
        // Optionally: Notify the user about the error
      }
    );
  }
  // Remove a user from a chat group
  removeUserFromChatGroup(groupId: string, username: string) {
    if (!groupId || !username) {
      console.error('GroupId or Username is not defined');
      // Optionally: Notify the user about the error
      return;
    }

    this.http.put(`http://localhost:3000/api/chat-groups/${groupId}/remove-user`, { username }).subscribe(
      (response: any) => {
        const group = this.chatGroups.find((group) => group._id === groupId);
        if (group) {
          const index = group.usernames.indexOf(username);
          if (index > -1) {
            group.usernames.splice(index, 1);
            console.log('User removed successfully');
          }
        }
      },
      (error) => {
        console.error('An error occurred', error);
        // Optionally: Notify the user about the error
      }
    );
  }
}
