export type Post = {
  _id: string;
  title: string;
  body: string;
  senderID: string | { _id: string; username: string; profilePicture?: string };
  date: string;
  imageUrl: string;
};

export type Like = {
  _id: string;
  postID: string;
  senderID: string;
  date: string;
};

export type Comment = {
  _id: string;
  postID: string;
  userID: string | { _id: string; username: string; profilePicture?: string };
  content: string;
  date: string;
};
