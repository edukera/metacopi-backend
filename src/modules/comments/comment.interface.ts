export interface Comment {
  id: string;
  correctionId: string;
  pageNumber: number;
  type: string;
  color: string;
  markdown: boolean;
  text: string;
  annotations: string[];
  createdByEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentCreateParams {
  correctionId: string;
  pageNumber: number;
  type?: string;
  color?: string;
  markdown?: boolean;
  text: string;
  annotations?: string[];
  createdByEmail: string;
}

export interface CommentUpdateParams {
  pageNumber?: number;
  type?: string;
  color?: string;
  markdown?: boolean;
  text?: string;
  annotations?: string[];
} 