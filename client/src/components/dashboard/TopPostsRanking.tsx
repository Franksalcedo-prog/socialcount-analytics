import React from 'react';
import { ExternalLink, MessageCircle, MessageSquare } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface TopPostsRankingProps {
  posts: Array<{
    id: string;
    platform: string;
    message: string | null;
    mediaUrl: string | null;
    permalink: string | null;
    publishedAt: string;
    commentsCount: number;
    repliesCount: number;
    accountName: string;
    topCommenter?: { name: string; count: number } | null;
    topMentioned?: { username: string; count: number } | null;
  }>;
  onSelectPost?: (postId: string) => void;
}

export const TopPostsRanking: React.FC<TopPostsRankingProps> = ({ posts, onSelectPost }) => {
  if (!posts || posts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Publicaciones con Mayor Conversación</CardTitle>
          <CardDescription>No se encontraron publicaciones con comentarios en este período</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Top Publicaciones con Mayor Conversación</CardTitle>
        <CardDescription>
          Contenido con el índice más alto de comentarios en Meta Graph API
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {posts.map((post, index) => {
          const isFb = post.platform === 'FACEBOOK';
          return (
            <div
              key={post.id}
              onClick={() => onSelectPost?.(post.id)}
              className="group p-3 rounded-xl border border-border-ui hover:border-brand-300 hover:bg-slate-50/70 transition-all flex items-center justify-between gap-3 cursor-pointer shadow-2xs"
            >
              {/* Left: Rank & Media Thumbnail */}
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-5 text-center font-bold text-xs text-slate-400 group-hover:text-brand-600">
                  #{index + 1}
                </span>

                {post.mediaUrl ? (
                  <img
                    src={post.mediaUrl}
                    alt="Miniatura"
                    className="w-11 h-11 rounded-lg object-cover border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                )}

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Badge variant={isFb ? 'facebook' : 'instagram'} size="sm">
                      {isFb ? 'Facebook' : 'Instagram'}
                    </Badge>
                    <span className="text-[11px] text-slate-400 font-medium truncate">
                      {post.accountName}
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 font-medium line-clamp-1 group-hover:text-brand-600 transition-colors">
                    {post.message || 'Publicación sin texto (contenido multimedia)'}
                  </p>
                  {post.topCommenter && (
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] text-amber-800">
                      <span className="font-semibold bg-amber-50 border border-amber-200/90 px-1.5 py-0.5 rounded">
                        👤 Más comentada: {post.topCommenter.name} ({post.topCommenter.count})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Comment count badge & External Link */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <div className="flex items-center gap-1 text-slate-900 font-bold text-sm">
                    <MessageCircle className="w-3.5 h-3.5 text-brand-600" />
                    <span>{post.commentsCount}</span>
                  </div>
                  {post.repliesCount > 0 && (
                    <span className="text-[10px] text-slate-400 block">
                      {post.repliesCount} resp.
                    </span>
                  )}
                </div>

                {post.permalink && (
                  <a
                    href={post.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
                    title="Ver en la plataforma oficial"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
