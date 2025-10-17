export interface Message {
  sender: 'user' | 'expert' | 'ai';
  content: string;
  timestamp: string | Date;
}

export interface Conversation {
  _id?: string;
  userId: string;
  expertId?: string;
  isAI: boolean;
  messages: Message[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
  encryptedContent?: string;
}