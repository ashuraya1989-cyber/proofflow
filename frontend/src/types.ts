export type Album = {
  id: string;
  name: string;
  created_at: string;
};

export type ImageUrls = {
  thumb: string;
  display: string;
  original: string;
};

export type ImageItem = {
  id: string;
  album_id: string;
  folder: string;
  filename: string;
  width: number;
  height: number;
  size: number;
  content_type: string;
  urls: ImageUrls;
  created_at: string;
};

export type Share = {
  token: string;
  url: string;
  requires_password: boolean;
  album_id: string;
  folder?: string | null;
  created_at: string;
};

export type UploadResult = {
  filename: string;
  status: "success" | "error";
  image?: ImageItem;
  error?: string;
};
