import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title(title: any) {
    throw new Error('Method not implemented.');
  }
  isLoggedIn = false;

  constructor(private router: Router) { }

  ngOnInit() {
    this.checkLoginStatus();
  }

  checkLoginStatus() {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    this.isLoggedIn = !!user;

    if (this.isLoggedIn) {

      const role = user.role;
      if (role === 'super-admin') {
        this.router.navigate(['/super-admin-dashboard']);
      } else if (role === 'group-admin') {
        this.router.navigate(['/group-admin-dashboard']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    }
  }

  logout() {
    sessionStorage.clear();
    this.isLoggedIn = false;
    this.router.navigate(['/login']);
  }
}
