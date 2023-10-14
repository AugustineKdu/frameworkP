
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  constructor(private http: HttpClient) { }

  createGroupChannel(channelName: string, userIds: string[]) {
    return this.http.post('/api/createGroupChannel', { channelName, userIds });
  }

  getMyGroupChannels() {
    return this.http.get('/api/getMyGroupChannels');
  }

  // 로컬 저장소에 채널 정보 저장
  saveChannelsToLocalStorage(channels: any[]) {
    localStorage.setItem('channels', JSON.stringify(channels));
  }

  // 로컬 저장소에서 채널 정보 불러오기
  loadChannelsFromLocalStorage(): any[] {
    const channels = localStorage.getItem('channels');
    return channels ? JSON.parse(channels) : [];
  }
}
