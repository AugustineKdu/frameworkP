import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})
export class AccountComponent implements OnInit {
  currentUser: any = null;

  constructor() { }

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  loadCurrentUser() {
    const user = sessionStorage.getItem('currentUser');
    if (user) {
      this.currentUser = JSON.parse(user);
    }
  }
}
