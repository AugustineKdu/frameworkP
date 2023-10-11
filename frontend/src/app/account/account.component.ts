import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})
export class AccountComponent implements OnInit {
  currentUser: any = null;
  userRoles: string[] = [];

  // Defining API URL directly in the component
  private apiUrl = 'http://localhost:3000';

  // Injecting HttpClient service
  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  loadCurrentUser() {
    // Making a GET request to fetch the current user data
    this.http.get(`${this.apiUrl}/current-user`).subscribe(
      (user: any) => {
        this.currentUser = user;
        this.loadRoles();
      },
      (error) => {
        console.error('Error fetching the user data', error);
      }
    );
  }

  loadRoles() {
    // Assigning user roles based on the user role type
    if (this.currentUser) {
      switch (this.currentUser.role) {
        case 'super-admin':
          this.userRoles = [
            'Can promote a chat user to a Group Admin role.',
            'Can remove any chat users.',
            'Can upgrade a chat user to Super Admin role.',
            'Has all of the functions of a group administrator'
          ];
          break;
        case 'group-admin':
          this.userRoles = [
            'Can create groups.',
            'Can create channels (subgroups) within groups.',
            'Can remove groups, channels, and chat users from groups they administer.',
            'Can delete a chat user (from a group they administer)',
            'Can only modify/delete a group that they created.',
            'Can ban a user from a channel and report to super admins.'
          ];
          break;
        default:
          this.userRoles = [
            'A user of the system can create a new chat user. (Usernames are unique)',
            'A chat user can join any channel in a group once they are members of a group.',
            'A chat user can register an interest in a group, to be added by the group admin.',
            'A chat user can leave a group or groups they belong to.',
            'A chat user can delete themselves',
            'A chat user is uniquely identified by their Username'
          ];
      }
    }
  }
}
