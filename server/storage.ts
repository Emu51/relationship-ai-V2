import { User, Chat, InsertUser, UpdateUser } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, update: Partial<UpdateUser> & { 
    twoFactorSecret?: string | null;
    twoFactorEnabled?: boolean;
  }): Promise<User>;
  createChat(chat: Omit<Chat, "id" | "createdAt">): Promise<Chat>;
  getUserChats(userId: number): Promise<Chat[]>;
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private chats: Map<number, Chat>;
  private currentId: number;
  private currentChatId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.chats = new Map();
    this.currentId = 1;
    this.currentChatId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = {
      id,
      ...insertUser,
      relationshipStatus: "single",
      partnerId: null,
      partnerType: null,
      twoFactorSecret: null,
      twoFactorEnabled: false,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, update: Partial<UpdateUser> & {
    twoFactorSecret?: string | null;
    twoFactorEnabled?: boolean;
  }): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error("User not found");

    const updatedUser = { ...user, ...update };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async createChat(chat: Omit<Chat, "id" | "createdAt">): Promise<Chat> {
    const id = this.currentChatId++;
    const newChat: Chat = {
      ...chat,
      id,
      createdAt: new Date(),
    };
    this.chats.set(id, newChat);
    return newChat;
  }

  async getUserChats(userId: number): Promise<Chat[]> {
    return Array.from(this.chats.values())
      .filter(chat => chat.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export const storage = new MemStorage();