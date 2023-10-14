import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  constructor(private http: HttpClient) { }

  // 채팅 그룹 생성 API 호출
  createGroupChannel(channelName: string, userIds: string[]): Observable<any> {
    return this.http.post('http://localhost:3000/api/chat-groups', { name: channelName, userIds });
  }

  // 사용자의 모든 채팅 그룹을 가져오는 API 호출
  getMyGroupChannels(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:3000/api/chat-groups');
  }
}
