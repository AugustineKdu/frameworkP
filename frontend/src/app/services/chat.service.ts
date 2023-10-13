import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiBaseUrl = 'http://localhost:3000/api'; // Define the base API URL

  constructor(private http: HttpClient) { }

  createGroupChannel(channelName: string, userIds: string[]) {
    return this.http.post(`${this.apiBaseUrl}/createGroupChannel`, { channelName, userIds });
  }

  getMyGroupChannels() {
    return this.http.get(`${this.apiBaseUrl}/getMyGroupChannels`);
  }

  // Save channel information to local storage
  saveChannelsToLocalStorage(channels: any[]) {
    localStorage.setItem('channels', JSON.stringify(channels));
  }

  // Load channel information from local storage
  loadChannelsFromLocalStorage(): any[] {
    const channels = localStorage.getItem('channels');
    return channels ? JSON.parse(channels) : [];
  }
}
