import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface ChatGroup {
  _id: string;
  name: string;
  messages: Message[];
}
// Define a message type
interface Message {
  sender: string;
  content: string;
  timestamp: Date;
  fileUrl?: string | ArrayBuffer;
}
interface User {
  username: string;
  avatarPath: string;
  // ... other properties ...
}


@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {
  socket: Socket;
  newMessage = '';
  chatGroups: ChatGroup[] = [];
  selectedGroup: ChatGroup | null = null;
  currentUser: any = null;
  users: User[] = [];
  previewImage: string | ArrayBuffer | null = null;
  previewVideo: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;
  constructor(private http: HttpClient) {
    this.socket = io('http://localhost:3000');

    this.socket.on('new message', (data: { roomId: string; message: Message }) => {
      const group = this.chatGroups.find(g => g._id === data.roomId);
      if (group) {
        group.messages.push(data.message);
      }
    });

  }

  ngOnInit(): void {
    this.http.get<ChatGroup[]>('http://localhost:3000/api/chat-groups').subscribe((groups) => {
      this.chatGroups = groups;
    });

    const user = sessionStorage.getItem('currentUser');
    if (user) {
      this.currentUser = JSON.parse(user);
    }
  }

  selectGroup(_id: string): void {
    this.selectedGroup = this.chatGroups.find((group) => group._id === _id) || null;
    if (this.selectedGroup) {
      this.socket.emit('joinRoom', _id);
    }
  }

  addGroup() {
    if (this.currentUser && (this.currentUser.role === 'group-admin' || this.currentUser.role === 'super-admin')) {
      const groupName = prompt('Enter new group name:');
      if (groupName) {
        this.http.post<ChatGroup>('http://localhost:3000/api/chat-groups', { name: groupName }).subscribe((newGroup) => {
          this.chatGroups.push(newGroup);
        });
      }
    } else {
      alert('You do not have permission to add a group.');
    }
  }

  deleteGroup(groupId: string) {
    if (this.currentUser && (this.currentUser.role === 'group-admin' || this.currentUser.role === 'super-admin')) {
      this.http.delete(`http://localhost:3000/api/chat-groups/${groupId}`).subscribe(() => {
        const index = this.chatGroups.findIndex(group => group._id === groupId);
        if (index !== -1) {
          this.chatGroups.splice(index, 1);
        }
      });
    } else {
      alert('You do not have permission to delete a group.');
    }
  }
  changeAvatar(event: any): void {
    const newAvatarFile = event.target.files[0];
    if (newAvatarFile) {
      const reader = new FileReader();
      reader.onload = () => {
        if (this.currentUser) {

          // Replace with your actual server API endpoint URL
          const apiUrl = 'http://localhost:3000/api/update-avatar';

          this.http.post(apiUrl, {
            username: this.currentUser.username,
            newAvatar: reader.result
          }).subscribe((response) => {
            console.log('Avatar updated', response);

            // Update the avatar path in the local user object
            this.currentUser.avatarPath = reader.result as string;
          });
        }
      };
      reader.readAsDataURL(newAvatarFile);
    }
  }

  getAvatarPath(sender: string): string {
    // Logic to get avatar path. Example:
    const user = this.users.find(u => u.username === sender);
    return user ? user.avatarPath : 'path/to/default/avatar.png';
  }
  uploadFile(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);

    // Assuming your API returns the URL of the uploaded file
    return this.http.post<{ fileUrl: string }>('YOUR_SERVER_URL', formData).pipe(
      map(response => response.fileUrl)
    );
  }

  sendMessage(): void {
    if (this.currentUser && this.selectedGroup) {
      const newMessageObj: Message = {
        content: this.newMessage,
        sender: this.currentUser.username,
        timestamp: new Date(),
        fileUrl: this.previewImage || this.previewVideo || undefined,
      };

      if (this.selectedFile) {
        this.uploadFile(this.selectedFile).subscribe((uploadedFileUrl: string) => {
          newMessageObj.fileUrl = uploadedFileUrl;
          this.socket.emit('send message', { message: newMessageObj, roomId: this.selectedGroup?._id });
        });
      } else {
        this.socket.emit('send message', { message: newMessageObj, roomId: this.selectedGroup?._id });
      }

      this.newMessage = '';
      this.previewImage = null;
      this.previewVideo = null;
      this.selectedFile = null;
    } else {
      alert('You must be logged in to send a message.');
    }
  }



  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      if (this.selectedFile) {  // Check if selectedFile is not null
        if (this.selectedFile.type.startsWith('image')) {
          this.previewImage = reader.result;
          this.previewVideo = null;
        } else if (this.selectedFile.type.startsWith('video')) {
          this.previewVideo = reader.result;
          this.previewImage = null;
        }
      }
    };
    if (this.selectedFile) {  // Check if selectedFile is not null
      reader.readAsDataURL(this.selectedFile);
    }
  }


  isMedia(content: string): boolean {
    return content.endsWith('.jpg') || content.endsWith('.png') || content.endsWith('.mp4');
  }

  isImage(content: string): boolean {
    return content.endsWith('.jpg') || content.endsWith('.png');
  }

  isVideo(content: string): boolean {
    return content.endsWith('.mp4');
  }




}
