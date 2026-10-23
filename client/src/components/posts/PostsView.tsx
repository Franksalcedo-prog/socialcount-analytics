import React, { useState, useEffect } from 'react';
import {
  Search,
  LayoutGrid,
  List,
  MessageCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from 'lucide-react';
import { SocialPost, SocialComment } from '../../types';
import { apiService } from '../../services/api';
import { useFilters } from '../../context/FilterContext';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { PostDetailDrawer } from './PostDetailDrawer';

export const PostsView: React.FC = () => {
  const { platform, startDate, endDate, refreshKey } = useFilters();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'publishedAt' | 'commentsCount'>('commentsCount');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selected post for detail drawer
  const [selectedPost, setSelectedPost] = useState<(SocialPost & { comments: SocialComment[] }) | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const loadPosts = async () => {
    setIsLoading(true);
    try {
      const res = await apiService.getPosts({
        page,
        pageSize: 12,
        search: search.trim() || undefined,
        platform,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sortBy,
        sortOrder: 'desc',
      });
      setPosts(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotalCount(res.pagination.totalCount);
    } catch (e) {
      console.error('Error al cargar posts:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [page, platform, sortBy, refreshKey]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadPosts();
  };

  const handleOpenDetail = async (postId: string) => {
    try {
      const detail = await apiService.getPostDetail(postId);
      setSelectedPost(detail);
      setIsDrawerOpen(true);
    } catch (e) {
      console.error('Error al cargar detalle del post:', e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-border-ui shadow-2xs">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por texto o contenido..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </form>

        {/* View mode & Sort controls */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* Sort Switcher */}
          <div className="flex items-center gap-1.5 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="commentsCount">Más comentadas</option>
              <option value="publishedAt">Más recientes</option>
            </select>
          </div>

          {/* Grid vs Table Toggle */}
          <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-brand-600 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Vista en cuadrícula"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-brand-600 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Vista en tabla"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-64 animate-pulse p-4">
              <div className="h-32 bg-slate-200 rounded-lg mb-3" />
              <div className="h-4 w-3/4 bg-slate-200 rounded mb-2" />
              <div className="h-3 w-1/2 bg-slate-100 rounded" />
            </Card>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-slate-500 text-sm">No se encontraron publicaciones con los filtros seleccionados.</p>
        </Card>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {posts.map((post) => {
            const isFb = post.platform === 'FACEBOOK';
            return (
              <Card
                key={post.id}
                onClick={() => handleOpenDetail(post.id)}
                className="group cursor-pointer flex flex-col justify-between overflow-hidden hover:border-brand-300"
              >
                <div>
                  {/* Media Banner */}
                  {post.mediaUrl ? (
                    <div className="h-44 w-full bg-slate-100 overflow-hidden relative">
                      <img
                        src={post.mediaUrl}
                        alt="Publicación"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3">
                        <Badge variant={isFb ? 'facebook' : 'instagram'}>
                          {isFb ? 'Facebook' : 'Instagram'}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 pb-0 flex items-center justify-between">
                      <Badge variant={isFb ? 'facebook' : 'instagram'}>
                        {isFb ? 'Facebook' : 'Instagram'}
                      </Badge>
                    </div>
                  )}

                  {/* Caption & Account Info */}
                  <div className="p-4">
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                      {post.account?.name}
                    </span>
                    <p className="text-xs text-slate-800 line-clamp-2 leading-relaxed">
                      {post.message || 'Contenido multimedia sin texto.'}
                    </p>
                  </div>
                </div>

                {/* Footer Metrics */}
                <div className="p-4 pt-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <MessageCircle className="w-4 h-4 text-brand-600" />
                    <span>{post.totalStoredComments} comentarios</span>
                    {post.repliesCount > 0 && (
                      <span className="text-[11px] text-slate-400 font-normal">
                        ({post.repliesCount} resp.)
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400">
                    {new Date(post.publishedAt).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-border-ui text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Plataforma</th>
                  <th className="py-3 px-4">Cuenta</th>
                  <th className="py-3 px-4">Descripción</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4 text-right">Comentarios</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {posts.map((post) => {
                  const isFb = post.platform === 'FACEBOOK';
                  return (
                    <tr
                      key={post.id}
                      onClick={() => handleOpenDetail(post.id)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        <Badge variant={isFb ? 'facebook' : 'instagram'} size="sm">
                          {isFb ? 'Facebook' : 'Instagram'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {post.account?.name}
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-800">
                        {post.message || 'Sin texto'}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(post.publishedAt).toLocaleDateString('es-ES')}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {post.totalStoredComments}
                      </td>
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        {post.permalink && (
                          <a
                            href={post.permalink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-slate-400 hover:text-brand-600 inline-block"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
          <span>
            Mostrando página <strong>{page}</strong> de <strong>{totalPages}</strong> ({totalCount} publicaciones)
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      <PostDetailDrawer
        post={selectedPost}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
};
