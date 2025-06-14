import { AICommentStatus } from './ai-comment.dto';

export interface AIComment {
  id: string;
  correctionId: string;
  pageNumber: number;
  type: string;
  color: string;
  markdown: boolean;
  text: string;
  annotations: string[];
  status: AICommentStatus;
  createdByEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AICommentCreateParams {
  correctionId: string;
  pageNumber: number;
  type?: string;
  color?: string;
  markdown?: boolean;
  text: string;
  annotations?: string[];
  status: AICommentStatus;
  createdByEmail: string;
}

export interface AICommentUpdateParams {
  pageNumber?: number;
  type?: string;
  color?: string;
  markdown?: boolean;
  text?: string;
  annotations?: string[];
  status?: AICommentStatus;
} 