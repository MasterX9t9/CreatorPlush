import { google } from "googleapis";
import { AttributedMetric, MetricAttribution, OutlierAnalysis } from "@/lib/types";
import { calculateExpectedViews, calculateOutlierScore } from "@/lib/algorithms/outliers";
import { quotaCache, QuotaTracker } from "@/lib/cache/quota-cache";
import { verifyAuthToken } from "@/lib/auth/jwt";
import { userKeysRepository } from "@/lib/repositories/user-keys-repository";

export const YOUTUBE_CATEGORIES: Record<string, string> = {
  "1": "Film & Animation",
  "2": "Autos & Vehicles",
  "10": "Music",
  "15": "Pets & Animals",
  "17": "Sports",
  "18": "Short Movies",
  "19": "Travel & Events",
  "20": "Gaming",
  "21": "Videoblogging",
  "22": "People & Blogs",
  "23": "Comedy",
  "24": "Entertainment",
  "25": "News & Politics",
  "26": "Howto & Style",
  "27": "Education",
  "28": "Science & Technology",
  "29": "Nonprofits & Activism",
  "30": "Movies",
  "31": "Anime/Animation",
  "32": "Action/Adventure",
  "33": "Classics",
  "34": "Comedy",
  "35": "Documentary",
  "36": "Drama",
  "37": "Family",
  "38": "Foreign",
  "39": "Horror",
  "40": "Sci-Fi/Fantasy",
  "41": "Thriller",
  "42": "Shorts",
  "43": "Shows",
  "44": "Trailers",
};

export interface YouTubeVideoItem {
  id: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  thumbnailUrl: string;
  durationSec: number;
  durationFormatted: string;
  isShort: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  tags?: string[];
  categoryId?: string;
  categoryName?: string;
  defaultAudioLanguage?: string;
  defaultLanguage?: string;
  hasCaptions?: boolean;
  definition?: string;
  licensedContent?: boolean;
  outlierAnalysis?: OutlierAnalysis;
  attribution: MetricAttribution;
}

export interface YouTubeChannelItem {
  id: string;
  title: string;
  customUrl?: string;
  description: string;
  publishedAt?: string;
  avatarUrl: string;
  bannerUrl?: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  avgViewsPerVideo?: number;
  attribution: MetricAttribution;
}

export interface VideoSearchOptions {
  q: string;
  maxResults?: number;
  pageToken?: string;
  order?: "relevance" | "date" | "viewCount" | "rating";
  videoDuration?: "any" | "short" | "medium" | "long";
  publishedAfter?: string;
  publishedBefore?: string;
}

/**
 * Parses ISO 8601 duration (e.g. PT15M33S, PT59S) into seconds.
 */
export function parseIsoDuration(durationStr: string): number {
  if (!durationStr) return 0;
  const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Formats seconds into HH:MM:SS or MM:SS
 */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export class YouTubeProvider {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.YOUTUBE_API_KEY || "";
  }

  getQuotaStatus(): QuotaTracker {
    return quotaCache.getQuota();
  }

  private getClient() {
    const key = this.apiKey || process.env.YOUTUBE_API_KEY || "";
    if (!key) {
      throw new Error(
        "YouTube API Key is missing. Please configure your YouTube Data API key in Settings > API Keys to query YouTube data."
      );
    }
    return google.youtube({
      version: "v3",
      auth: key,
    });
  }

  /**
   * Search videos with caching and quota tracking
   */
  async searchVideos(options: VideoSearchOptions): Promise<{
    items: YouTubeVideoItem[];
    nextPageToken?: string;
    totalResults?: number;
    attribution: MetricAttribution;
  }> {
    const cacheKey = `search_v_${JSON.stringify(options)}`;
    const cached = quotaCache.get<any>(cacheKey);

    if (cached) {
      return {
        ...cached.value,
        attribution: {
          ...cached.value.attribution,
          timestamp: cached.createdAt,
        },
      };
    }

    const youtube = this.getClient();
    const nowIso = new Date().toISOString();

    const attribution: MetricAttribution = {
      source: "youtube_data_api",
      dataType: "official",
      timestamp: nowIso,
      confidence: 1.0,
    };

    try {
      // Record search quota: 100 units
      quotaCache.recordQuota(100);

      // 1. Execute search query (costs 100 quota units)
      const searchRes = await youtube.search.list({
        part: ["snippet"],
        q: options.q,
        type: ["video"],
        maxResults: options.maxResults || 20,
        pageToken: options.pageToken,
        order: options.order || "relevance",
        videoDuration: options.videoDuration === "any" ? undefined : options.videoDuration,
        publishedAfter: options.publishedAfter,
        publishedBefore: options.publishedBefore,
      });

      const videoIds = (searchRes.data.items || [])
        .map((item) => item.id?.videoId)
        .filter((id): id is string => Boolean(id));

      if (videoIds.length === 0) {
        const emptyResult = {
          items: [],
          nextPageToken: searchRes.data.nextPageToken || undefined,
          totalResults: searchRes.data.pageInfo?.totalResults || 0,
          attribution,
        };
        quotaCache.set(cacheKey, emptyResult, 3600, "youtube_data_api");
        return emptyResult;
      }

      // Record video details quota: 1 unit
      quotaCache.recordQuota(1);

      // 2. Fetch full video statistics and duration (costs 1 quota unit for up to 50 videos)
      const videosRes = await youtube.videos.list({
        part: ["snippet", "contentDetails", "statistics"],
        id: videoIds,
      });

      const videoItems: YouTubeVideoItem[] = (videosRes.data.items || []).map(
        (v) => {
          const durationSec = parseIsoDuration(v.contentDetails?.duration || "");
          const isShort = durationSec > 0 && durationSec <= 60;
          const viewCount = parseInt(v.statistics?.viewCount || "0", 10);
          const likeCount = parseInt(v.statistics?.likeCount || "0", 10);
          const commentCount = parseInt(v.statistics?.commentCount || "0", 10);

          return {
            id: v.id || "",
            title: v.snippet?.title || "Untitled Video",
            description: v.snippet?.description || "",
            channelId: v.snippet?.channelId || "",
            channelTitle: v.snippet?.channelTitle || "Unknown Channel",
            publishedAt: v.snippet?.publishedAt || "",
            thumbnailUrl:
              v.snippet?.thumbnails?.maxres?.url ||
              v.snippet?.thumbnails?.high?.url ||
              v.snippet?.thumbnails?.medium?.url ||
              "",
            durationSec,
            durationFormatted: formatDuration(durationSec),
            isShort,
            viewCount,
            likeCount,
            commentCount,
            tags: v.snippet?.tags || [],
            categoryId: v.snippet?.categoryId || undefined,
            categoryName: v.snippet?.categoryId
              ? YOUTUBE_CATEGORIES[v.snippet.categoryId] || "General"
              : undefined,
            defaultAudioLanguage: v.snippet?.defaultAudioLanguage || undefined,
            defaultLanguage: v.snippet?.defaultLanguage || undefined,
            hasCaptions: v.contentDetails?.caption === "true",
            definition: v.contentDetails?.definition || "hd",
            licensedContent: Boolean(v.contentDetails?.licensedContent),
            attribution,
          };
        }
      );

      const searchResult = {
        items: videoItems,
        nextPageToken: searchRes.data.nextPageToken || undefined,
        totalResults: searchRes.data.pageInfo?.totalResults || videoItems.length,
        attribution,
      };

      quotaCache.set(cacheKey, searchResult, 21600, "youtube_data_api");
      return searchResult;
    } catch (error: any) {
      if (error?.code === 403 && error?.message?.includes("quota")) {
        throw new Error(
          "YOUTUBE_QUOTA_EXCEEDED: YouTube API quota limit reached. Please check Google Cloud Console quotas or try again tomorrow."
        );
      }
      throw error;
    }
  }

  /**
   * Fetch single channel details with official statistics and caching
   */
  async getChannel(channelId: string): Promise<YouTubeChannelItem | null> {
    const cacheKey = `channel_${channelId}`;
    const cached = quotaCache.get<YouTubeChannelItem>(cacheKey);
    if (cached) {
      return {
        ...cached.value,
        attribution: {
          ...cached.value.attribution,
          timestamp: cached.createdAt,
        },
      };
    }

    const youtube = this.getClient();
    const nowIso = new Date().toISOString();

    const attribution: MetricAttribution = {
      source: "youtube_data_api",
      dataType: "official",
      timestamp: nowIso,
      confidence: 1.0,
    };

    try {
      quotaCache.recordQuota(1);

      let item: any = null;
      let cleanInput = channelId.trim();
      try {
        cleanInput = decodeURIComponent(cleanInput).trim();
      } catch {
        // Keep raw
      }

      // 1. If user pasted a video URL, resolve the channel through the video
      if (
        cleanInput.includes("watch?v=") ||
        cleanInput.includes("youtu.be/") ||
        cleanInput.includes("youtube.com/shorts/")
      ) {
        let videoId = "";
        if (cleanInput.includes("watch?v=")) {
          videoId = cleanInput.split("watch?v=")[1].split("&")[0].split("?")[0].split("#")[0];
        } else if (cleanInput.includes("youtu.be/")) {
          videoId = cleanInput.split("youtu.be/")[1].split("/")[0].split("?")[0].split("#")[0];
        } else if (cleanInput.includes("youtube.com/shorts/")) {
          videoId = cleanInput.split("youtube.com/shorts/")[1].split("/")[0].split("?")[0].split("#")[0];
        }
        if (videoId) {
          try {
            const vRes = await youtube.videos.list({
              part: ["snippet"],
              id: [videoId],
            });
            const foundChId = vRes.data.items?.[0]?.snippet?.channelId;
            if (foundChId) {
              cleanInput = foundChId;
            }
          } catch {
            // Fall through to standard parsing
          }
        }
      }

      // 2. Extract identifier from channel URLs (/..., /videos, /shorts, query params)
      if (cleanInput.includes("/@")) {
        cleanInput = "@" + cleanInput.split("/@")[1].split("/")[0].split("?")[0].split("#")[0];
      } else if (cleanInput.includes("/channel/")) {
        cleanInput = cleanInput.split("/channel/")[1].split("/")[0].split("?")[0].split("#")[0];
      } else if (cleanInput.includes("/c/")) {
        cleanInput = cleanInput.split("/c/")[1].split("/")[0].split("?")[0].split("#")[0];
      } else if (cleanInput.includes("/user/")) {
        cleanInput = cleanInput.split("/user/")[1].split("/")[0].split("?")[0].split("#")[0];
      } else if (cleanInput.includes("youtube.com/")) {
        const segment = cleanInput.split("youtube.com/")[1].split("/")[0].split("?")[0].split("#")[0];
        if (segment) cleanInput = segment;
      }

      // 3. Query strategy A: Direct @handle lookup
      if (cleanInput.startsWith("@")) {
        const handle = cleanInput.substring(1);
        try {
          const res = await youtube.channels.list({
            part: ["snippet", "statistics", "brandingSettings"],
            forHandle: handle,
          });
          item = res.data.items?.[0];
        } catch {
          // Fall through
        }
      }

      // 4. Query strategy B: Standard 24-character YouTube Channel ID (UC...)
      if (!item && /^UC[\w-]{22}$/.test(cleanInput)) {
        try {
          const res = await youtube.channels.list({
            part: ["snippet", "statistics", "brandingSettings"],
            id: [cleanInput],
          });
          item = res.data.items?.[0];
        } catch {
          // Fall through
        }
      }

      // 5. Query strategy C: Handle without leading @
      if (!item) {
        try {
          const res = await youtube.channels.list({
            part: ["snippet", "statistics", "brandingSettings"],
            forHandle: cleanInput,
          });
          item = res.data.items?.[0];
        } catch {
          // Fall through
        }
      }

      // 6. Query strategy D: Standard ID fallback
      if (!item) {
        try {
          const res = await youtube.channels.list({
            part: ["snippet", "statistics", "brandingSettings"],
            id: [cleanInput],
          });
          item = res.data.items?.[0];
        } catch {
          // Fall through
        }
      }

      // 7. Query strategy E: Search by channel name or title keyword
      if (!item) {
        try {
          const searchRes = await youtube.search.list({
            part: ["snippet"],
            q: cleanInput,
            type: ["channel"],
            maxResults: 1,
          });
          const foundId = searchRes.data.items?.[0]?.id?.channelId;
          if (foundId) {
            const chRes = await youtube.channels.list({
              part: ["snippet", "statistics", "brandingSettings"],
              id: [foundId],
            });
            item = chRes.data.items?.[0];
          }
        } catch {
          // Fall through
        }
      }

      if (!item) return null;

      const subCount = parseInt(item.statistics?.subscriberCount || "0", 10);
      const viewCount = parseInt(item.statistics?.viewCount || "0", 10);
      const videoCount = parseInt(item.statistics?.videoCount || "0", 10);
      const avgViews = videoCount > 0 ? Math.round(viewCount / videoCount) : 0;

      const channelItem: YouTubeChannelItem = {
        id: item.id || channelId,
        title: item.snippet?.title || "Unknown Channel",
        customUrl: item.snippet?.customUrl || undefined,
        description: item.snippet?.description || "",
        publishedAt: item.snippet?.publishedAt || undefined,
        avatarUrl:
          item.snippet?.thumbnails?.high?.url ||
          item.snippet?.thumbnails?.medium?.url ||
          "",
        bannerUrl: item.brandingSettings?.image?.bannerExternalUrl || undefined,
        subscriberCount: subCount,
        viewCount,
        videoCount,
        avgViewsPerVideo: avgViews,
        attribution,
      };

      quotaCache.set(cacheKey, channelItem, 43200, "youtube_data_api");
      return channelItem;
    } catch (error: any) {
      if (error?.code === 403 && error?.message?.includes("quota")) {
        throw new Error("YOUTUBE_QUOTA_EXCEEDED: Daily YouTube quota exceeded.");
      }
      throw error;
    }
  }

  /**
   * Fetch single video details with official statistics and caching
   */
  async getVideo(videoId: string): Promise<YouTubeVideoItem | null> {
    const cacheKey = `video_${videoId}`;
    const cached = quotaCache.get<YouTubeVideoItem>(cacheKey);
    if (cached) {
      return {
        ...cached.value,
        attribution: {
          ...cached.value.attribution,
          timestamp: cached.createdAt,
        },
      };
    }

    const youtube = this.getClient();
    const nowIso = new Date().toISOString();

    const attribution: MetricAttribution = {
      source: "youtube_data_api",
      dataType: "official",
      timestamp: nowIso,
      confidence: 1.0,
    };

    try {
      quotaCache.recordQuota(1);

      const res = await youtube.videos.list({
        part: ["snippet", "contentDetails", "statistics"],
        id: [videoId],
      });

      const v = res.data.items?.[0];
      if (!v) return null;

      const durationSec = parseIsoDuration(v.contentDetails?.duration || "");
      const isShort = durationSec > 0 && durationSec <= 60;
      const viewCount = parseInt(v.statistics?.viewCount || "0", 10);
      const likeCount = parseInt(v.statistics?.likeCount || "0", 10);
      const commentCount = parseInt(v.statistics?.commentCount || "0", 10);

      const videoItem: YouTubeVideoItem = {
        id: v.id || videoId,
        title: v.snippet?.title || "Untitled Video",
        description: v.snippet?.description || "",
        channelId: v.snippet?.channelId || "",
        channelTitle: v.snippet?.channelTitle || "Unknown Channel",
        publishedAt: v.snippet?.publishedAt || "",
        thumbnailUrl:
          v.snippet?.thumbnails?.maxres?.url ||
          v.snippet?.thumbnails?.high?.url ||
          v.snippet?.thumbnails?.medium?.url ||
          "",
        durationSec,
        durationFormatted: formatDuration(durationSec),
        isShort,
        viewCount,
        likeCount,
        commentCount,
        tags: v.snippet?.tags || [],
        categoryId: v.snippet?.categoryId || undefined,
        categoryName: v.snippet?.categoryId
          ? YOUTUBE_CATEGORIES[v.snippet.categoryId] || "General"
          : undefined,
        defaultAudioLanguage: v.snippet?.defaultAudioLanguage || undefined,
        defaultLanguage: v.snippet?.defaultLanguage || undefined,
        hasCaptions: v.contentDetails?.caption === "true",
        definition: v.contentDetails?.definition || "hd",
        licensedContent: Boolean(v.contentDetails?.licensedContent),
        attribution,
      };

      quotaCache.set(cacheKey, videoItem, 21600, "youtube_data_api");
      return videoItem;
    } catch (error: any) {
      if (error?.code === 403 && error?.message?.includes("quota")) {
        throw new Error("YOUTUBE_QUOTA_EXCEEDED: Daily YouTube quota exceeded.");
      }
      throw error;
    }
  }

  /**
   * Fetch public video comments via official commentThreads API
   */
  async getVideoComments(
    videoId: string,
    maxResults = 50
  ): Promise<{
    disabled: boolean;
    comments: Array<{
      id: string;
      author: string;
      text: string;
      likeCount: number;
      publishedAt: string;
    }>;
    attribution: MetricAttribution;
  }> {
    const youtube = this.getClient();
    const nowIso = new Date().toISOString();

    const attribution: MetricAttribution = {
      source: "youtube_data_api",
      dataType: "official",
      timestamp: nowIso,
      confidence: 1.0,
    };

    try {
      quotaCache.recordQuota(1);

      const res = await youtube.commentThreads.list({
        part: ["snippet"],
        videoId,
        maxResults: Math.min(maxResults, 100),
        order: "relevance",
        textFormat: "plainText",
      });

      const comments = (res.data.items || []).map((thread) => {
        const top = thread.snippet?.topLevelComment?.snippet;
        return {
          id: thread.id || "",
          author: top?.authorDisplayName || "Anonymous",
          text: top?.textDisplay || top?.textOriginal || "",
          likeCount: top?.likeCount || 0,
          publishedAt: top?.publishedAt || "",
        };
      });

      return {
        disabled: false,
        comments,
        attribution,
      };
    } catch (error: any) {
      if (
        error?.code === 403 &&
        (error?.message?.includes("commentsDisabled") || error?.errors?.[0]?.reason === "commentsDisabled")
      ) {
        return {
          disabled: true,
          comments: [],
          attribution,
        };
      }
      if (error?.code === 403 && error?.message?.includes("quota")) {
        throw new Error("YOUTUBE_QUOTA_EXCEEDED: Daily YouTube quota exceeded.");
      }
      throw error;
    }
  }

  /**
   * Search channels by keyword
   */
  async searchChannels(query: string, maxResults = 10): Promise<{
    items: YouTubeChannelItem[];
    attribution: MetricAttribution;
  }> {
    const youtube = this.getClient();
    const nowIso = new Date().toISOString();

    const attribution: MetricAttribution = {
      source: "youtube_data_api",
      dataType: "official",
      timestamp: nowIso,
      confidence: 1.0,
    };

    try {
      const searchRes = await youtube.search.list({
        part: ["snippet"],
        q: query,
        type: ["channel"],
        maxResults,
      });

      const channelIds = (searchRes.data.items || [])
        .map((item) => item.id?.channelId)
        .filter((id): id is string => Boolean(id));

      if (channelIds.length === 0) {
        return { items: [], attribution };
      }

      const channelsRes = await youtube.channels.list({
        part: ["snippet", "statistics", "brandingSettings"],
        id: channelIds,
      });

      const items: YouTubeChannelItem[] = (channelsRes.data.items || []).map((item) => {
        const subCount = parseInt(item.statistics?.subscriberCount || "0", 10);
        const viewCount = parseInt(item.statistics?.viewCount || "0", 10);
        const videoCount = parseInt(item.statistics?.videoCount || "0", 10);

        return {
          id: item.id || "",
          title: item.snippet?.title || "Unknown Channel",
          customUrl: item.snippet?.customUrl || undefined,
          description: item.snippet?.description || "",
          publishedAt: item.snippet?.publishedAt || undefined,
          avatarUrl:
            item.snippet?.thumbnails?.high?.url ||
            item.snippet?.thumbnails?.medium?.url ||
            "",
          bannerUrl: item.brandingSettings?.image?.bannerExternalUrl || undefined,
          subscriberCount: subCount,
          viewCount,
          videoCount,
          avgViewsPerVideo: videoCount > 0 ? Math.round(viewCount / videoCount) : 0,
          attribution,
        };
      });

      return { items, attribution };
    } catch (error: any) {
      if (error?.code === 403 && error?.message?.includes("quota")) {
        throw new Error("YOUTUBE_QUOTA_EXCEEDED: Daily YouTube quota exceeded.");
      }
      throw error;
    }
  }

  /**
   * Fetch recent videos from a channel and compute genuine outlier scores
   */
  async getChannelVideosWithOutliers(
    channelId: string,
    maxVideos = 30
  ): Promise<{
    videos: YouTubeVideoItem[];
    channelMedianViews: number;
    attribution: MetricAttribution;
  }> {
    const youtube = this.getClient();
    const nowIso = new Date().toISOString();

    const attribution: MetricAttribution = {
      source: "youtube_data_api",
      dataType: "official",
      timestamp: nowIso,
      confidence: 1.0,
    };

    let canonicalId = channelId.trim();
    if (!/^UC[\w-]{22}$/.test(canonicalId)) {
      const resolved = await this.getChannel(canonicalId);
      if (resolved) {
        canonicalId = resolved.id;
      }
    }

    // 1. Search recent uploads from the channel
    const searchRes = await youtube.search.list({
      part: ["snippet"],
      channelId: canonicalId,
      maxResults: maxVideos,
      order: "date",
      type: ["video"],
    });

    const videoIds = (searchRes.data.items || [])
      .map((item) => item.id?.videoId)
      .filter((id): id is string => Boolean(id));

    if (videoIds.length === 0) {
      return { videos: [], channelMedianViews: 0, attribution };
    }

    // 2. Fetch statistics
    const videosRes = await youtube.videos.list({
      part: ["snippet", "contentDetails", "statistics"],
      id: videoIds,
    });

    const parsedVideos: YouTubeVideoItem[] = (videosRes.data.items || []).map((v) => {
      const durationSec = parseIsoDuration(v.contentDetails?.duration || "");
      const isShort = durationSec > 0 && durationSec <= 60;
      const viewCount = parseInt(v.statistics?.viewCount || "0", 10);
      const likeCount = parseInt(v.statistics?.likeCount || "0", 10);
      const commentCount = parseInt(v.statistics?.commentCount || "0", 10);

      return {
        id: v.id || "",
        title: v.snippet?.title || "Untitled Video",
        description: v.snippet?.description || "",
        channelId: v.snippet?.channelId || channelId,
        channelTitle: v.snippet?.channelTitle || "Channel",
        publishedAt: v.snippet?.publishedAt || "",
        thumbnailUrl:
          v.snippet?.thumbnails?.maxres?.url ||
          v.snippet?.thumbnails?.high?.url ||
          v.snippet?.thumbnails?.medium?.url ||
          "",
        durationSec,
        durationFormatted: formatDuration(durationSec),
        isShort,
        viewCount,
        likeCount,
        commentCount,
        tags: v.snippet?.tags || [],
        categoryId: v.snippet?.categoryId || undefined,
        categoryName: v.snippet?.categoryId
          ? YOUTUBE_CATEGORIES[v.snippet.categoryId] || "General"
          : undefined,
        defaultAudioLanguage: v.snippet?.defaultAudioLanguage || undefined,
        defaultLanguage: v.snippet?.defaultLanguage || undefined,
        hasCaptions: v.contentDetails?.caption === "true",
        definition: v.contentDetails?.definition || "hd",
        licensedContent: Boolean(v.contentDetails?.licensedContent),
        attribution,
      };
    });

    // 3. Compute baseline median
    const viewCounts = parsedVideos.map((v) => v.viewCount);
    const medianViews = calculateExpectedViews(viewCounts);

    // 4. Attach statistical outlier analysis to each video
    parsedVideos.forEach((v) => {
      v.outlierAnalysis = calculateOutlierScore(v.viewCount, medianViews);
    });

    return {
      videos: parsedVideos,
      channelMedianViews: medianViews,
      attribution: {
        source: "internal_calculation",
        dataType: "calculated",
        timestamp: nowIso,
        confidence: 0.95,
      },
    };
  }
}

export const youtubeProvider = new YouTubeProvider();

/**
 * Resolves the effective YouTube API key for a request:
 * 1. Checks 'x-youtube-api-key' request header (from browser client state)
 * 2. Checks active authenticated user's saved encrypted key in userKeysRepository
 * 3. Falls back to process.env.YOUTUBE_API_KEY
 */
export async function resolveYouTubeApiKey(request?: Request): Promise<string | undefined> {
  if (!request) return undefined;
  try {
    const headerKey = request.headers.get("x-youtube-api-key");
    if (headerKey && headerKey.trim()) {
      return headerKey.trim();
    }

    const cookieHeader = request.headers.get("cookie") || "";
    if (cookieHeader.includes("cp_session=")) {
      const match = cookieHeader.match(/cp_session=([^;]+)/);
      if (match && match[1]) {
        const payload = verifyAuthToken(match[1]);
        if (payload?.userId) {
          const userKey = await userKeysRepository.getRawKey(payload.userId, "youtube");
          if (userKey) {
            return userKey;
          }
        }
      }
    }
  } catch {
    // fallback
  }
  return undefined;
}

export async function getEffectiveYouTubeProvider(request?: Request): Promise<YouTubeProvider> {
  const customKey = await resolveYouTubeApiKey(request);
  if (customKey) {
    return new YouTubeProvider(customKey);
  }
  return youtubeProvider;
}

