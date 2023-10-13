import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface ChatGroup {
  id: number;
  name: string;
  messages: { content: string }[];
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = 'http://localhost:3000/api'; // assuming this is your API endpoint

  constructor(private http: HttpClient) { }

  // Create a new chat group channel
  createGroupChannel(channelName: string, userIds: string[]): Observable<ChatGroup> {
    return this.http.post<ChatGroup>(`${this.apiUrl}/chat-groups`, { name: channelName, userIds });
  }

  // Get the chat groups of the current user
  getMyGroupChannels(): Observable<ChatGroup[]> {
    return this.http.get<ChatGroup[]>(`${this.apiUrl}/chat-groups`);
  }

  // Send a message to a chat group
  sendMessage(groupId: number, message: ChatMessage): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.apiUrl}/chat-groups/${groupId}/messages`,
      message
    );
  }

  // Upload a file and get the file URL
  uploadFile(file: File): Observable<{ fileUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ fileUrl: string }>(`${this.apiUrl}/upload`, formData);
  }

  // Save chat groups to local storage
  saveChannelsToLocalStorage(channels: ChatGroup[]): void {
    localStorage.setItem('channels', JSON.stringify(channels));
  }

  // Load chat groups from local storage
  loadChannelsFromLocalStorage(): ChatGroup[] {
    const channels = localStorage.getItem('channels');
    return channels ? JSON.parse(channels) : [];
  }
}

interface ChatMessage {
  sender: string;
  content: string;
  timestamp: string;
  avatarUrl: string;
  mediaUrl?: string;
}
