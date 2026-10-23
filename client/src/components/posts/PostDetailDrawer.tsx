import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ExternalLink,
  MessageCircle,
  Calendar,
  Layers,
  CornerDownRight,
  User,
} from 'lucide-react';
import { SocialPost, SocialComment } from '../../types';
import { Badge } from '../ui/Badge';

interface PostDetailDrawerProps {
  post: (SocialPost & { comments: SocialComment[] }) | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PostDetailDrawer: React.FC<PostDetailDrawerProps> = ({
  post,
  isOpen,
  onClose,
}) => {
  if (!post) return null;

  const isFb = post.platform === 'FACEBOOK';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
          />

          {/* Drawer Content */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative w-full max-w-xl bg-surface border-l border-border-ui shadow-2xl flex flex-col h-full z-10"
          >
            {/* Header */}
            <div className="p-5 border-b border-border-ui flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={isFb ? 'facebook' : 'instagram'}>
                  {isFb ? 'Facebook Post' : 'Instagram Media'}
                </Badge>
                <span className="text-xs text-slate-500 font-medium">
                  {post.account?.name}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {post.permalink && (
                  <a
                    href={post.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Ver en la plataforma oficial"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Media Preview if available */}
              {post.mediaUrl && (
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 max-h-72 flex items-center justify-center">
                  <img
                    src={post.mediaUrl}
                    alt="Publicación"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Caption Text */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Texto / Descripción
                </h4>
                <p className="text-sm text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200/80 select-text">
                  {post.message || 'Sin descripción textual.'}
                </p>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-500 block">Comentarios Meta</span>
                  <span className="text-lg font-bold text-slate-900">
                    {post.apiCommentsCount}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-500 block">Almacenados</span>
                  <span className="text-lg font-bold text-brand-600">
                    {post.totalStoredComments}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-500 block">Respuestas</span>
                  <span className="text-lg font-bold text-slate-700">
                    {post.repliesCount}
                  </span>
                </div>
              </div>

              {/* Published Date */}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>
                  Publicado el{' '}
                  {new Date(post.publishedAt).toLocaleString('es-ES', {
                    dateStyle: 'long',
                    timeStyle: 'short',
                  })}
                </span>
              </div>

              {/* Comments Stream */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-brand-600" />
                    <span>Comentarios recolectados ({post.comments?.length || 0})</span>
                  </h4>
                </div>

                <div className="space-y-3">
                  {(!post.comments || post.comments.length === 0) ? (
                    <p className="text-xs text-slate-400 italic text-center py-6">
                      No hay comentarios recolectados para esta publicación.
                    </p>
                  ) : (
                    post.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className={`p-3.5 rounded-xl border text-xs space-y-1.5 transition-all ${
                          comment.isReply
                            ? 'ml-6 bg-slate-50/80 border-slate-200'
                            : 'bg-white border-slate-200/90 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                            {comment.isReply && (
                              <CornerDownRight className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{comment.authorName}</span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {new Date(comment.commentDate).toLocaleString('es-ES', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>

                        <p className="text-slate-700 leading-normal pl-5">{comment.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};
