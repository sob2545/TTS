export const YOUTUBE_THUMBNAIL_URL =
  "https://img.youtube.com/vi/<VIDEO_ID>/0.jpg";

export const getYoutubeThumbnail = (videoId: string) =>
  YOUTUBE_THUMBNAIL_URL.replace("<VIDEO_ID>", videoId);
