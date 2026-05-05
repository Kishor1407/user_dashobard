import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Editor' | 'Viewer';
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  // Initial dummy data
  private initialUsers: User[] = [
    { id: '1', name: 'Alice Smith', email: 'alice@example.com', role: 'Admin' },
    { id: '2', name: 'Bob Johnson', email: 'bob@example.com', role: 'Editor' },
    { id: '3', name: 'Charlie Brown', email: 'charlie@example.com', role: 'Viewer' }
  ];

  // State management using BehaviorSubject
  private usersSubject = new BehaviorSubject<User[]>(this.getInitialState());
  
  // Observable for components to subscribe to
  users$: Observable<User[]> = this.usersSubject.asObservable();

  constructor() { }

  private getInitialState(): User[] {
    const savedUsers = localStorage.getItem('dashboard_users');
    if (savedUsers) {
      try {
        return JSON.parse(savedUsers);
      } catch (e) {
        console.error('Error parsing users from local storage', e);
      }
    }
    return this.initialUsers;
  }

  get users(): User[] {
    return this.usersSubject.getValue();
  }

  addUser(user: Omit<User, 'id'>) {
    const newUser: User = {
      ...user,
      id: Math.random().toString(36).substring(2, 9)
    };
    const currentUsers = this.usersSubject.getValue();
    const updatedUsers = [...currentUsers, newUser];
    this.usersSubject.next(updatedUsers);
    this.saveToStorage(updatedUsers);
  }

  private saveToStorage(users: User[]) {
    localStorage.setItem('dashboard_users', JSON.stringify(users));
  }
}
