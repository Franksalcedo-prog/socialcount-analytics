import React, { useState, useEffect } from 'react';
import {
  Search,
  MessageSquare,
  CornerDownRight,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
} from 'lucide-react';
import { SocialComment } from '../../types';
import { apiService } from '../../services/api';
import { useFilters } from '../../context/FilterContext';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export const CommentsView: React.FC = () => {
  const { platform, startDate, endDate, refreshKey } = useFilters();
  const [comments, setComments] = useState<SocialComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const res = await apiService.getComments({
        page,
        pageSize: 20,
        search: search.trim() || undefined,
        platform,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sortOrder: 'desc',
      });
      setComments(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotalCount(res.pagination.totalCount);
    } catch (e) {
      console.error('Error al cargar comentarios:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [page, platform, refreshKey]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadComments();
  };

  const handleExportCsv = () => {
    const url = apiService.getCsvExportUrl({
      platform,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      search: search.trim() || undefined,
    });
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Search and Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-border-ui shadow-2xs">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por comentario o autor..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </form>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            leftIcon={<Download className="w-4 h-4 text-slate-600" />}
          >
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No se encontraron comentarios que coincidan con los criterios de búsqueda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-border-ui text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Plataforma</th>
                  <th className="py-3 px-4">Autor</th>
                  <th className="py-3 px-4">Comentario</th>
                  <th className="py-3 px-4">Publicación Asociada</th>
                  <th className="py-3 px-4">Fecha Meta</th>
                  <th className="py-3 px-4">ID Meta</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {comments.map((comment) => {
                  const isFb = comment.platform === 'FACEBOOK';
                  return (
                    <tr key={comment.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge variant={isFb ? 'facebook' : 'instagram'} size="sm">
                          {isFb ? 'Facebook' : 'Instagram'}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {comment.isReply && (
                            <CornerDownRight className="w-3 h-3 text-slate-400 shrink-0" />
                          )}
                          <span>{comment.authorName}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 max-w-sm text-slate-700 leading-relaxed">
                        <p className="line-clamp-2">{comment.text}</p>
                      </td>

                      <td className="py-3 px-4 max-w-xs text-slate-500 truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate">{comment.post?.message || 'Publicación'}</span>
                          {comment.post?.permalink && (
                            <a
                              href={comment.post.permalink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-400 hover:text-brand-600 shrink-0"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-slate-400 text-[11px]">
                        {new Date(comment.commentDate).toLocaleString('es-ES', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <code className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {comment.externalId}
                        </code>
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <Badge variant="success" size="sm">
                          Verificado
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
          <span>
            Mostrando página <strong>{page}</strong> de <strong>{totalPages}</strong> ({totalCount} comentarios recolectados)
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
    </div>
  );
};
