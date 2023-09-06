import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})
// ... 기존 코드
export class AccountComponent implements OnInit {
  currentUser: any = null;
  userRoles: string[] = [];

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadRoles();
  }

  loadCurrentUser() {
    const user = sessionStorage.getItem('currentUser');
    if (user) {
      this.currentUser = JSON.parse(user);
    }
  }

  loadRoles() {
    if (this.currentUser) {
      if (this.currentUser.role === 'super-admin') {
        this.userRoles = [
          'A user of the system can create a new chat user. (Usernames are unique)',
          'A chat user can join any channel in a group once they are members of a group.',
          'A chat user can register an interest in a group, to be added by the group admin.',
          'A chat user can leave a group or groups they belong to.',
          'A chat user can delete themselves',
          'A chat user is uniquely identified by their Username'
        ];
      } else if (this.currentUser.role === 'group-admin') {
        this.userRoles = [
          'A Group Admin can create groups.',
          'A Group Admin will create channels (subgroups) within groups.',
          'A Group Admin can remove groups, channels, and chat users from groups they administer.',
          'A group admin can delete a chat user (from a group they administer)',
          'A group admin can only modify/delete a group that they created.',
          'A group admin can ban a user from a channel and report to super admins.'
        ];
      } else {
        this.userRoles = [
          'A Super Admin can promote a chat user to a Group Admin role.',
          'A Super Admin can remove any chat users.',
          'A Super Admin can upgrade a chat user to Super Admin role.',
          'A Super Admin has all of the functions of a group administrator'
        ];
      }
    }
  }
}
