export interface Review {
  id: number;
  courseId: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    id: number;
    username: string;
    avatar: string;
  };
}
