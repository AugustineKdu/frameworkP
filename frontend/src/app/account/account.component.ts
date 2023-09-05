import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})
export class AccountComponent implements OnInit {
  user: any;

  constructor() {
    // 임시로 로컬 스토리지에서 유저 정보를 가져옵니다.
    // 실제로는 백엔드에서 이 정보를 가져와야 합니다.
    this.user = JSON.parse(localStorage.getItem('currentUser') || '{}');
  }

  ngOnInit(): void {
  }
}
