import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileSpreadsheet,
  Upload,
  RefreshCw,
  Edit3,
  Filter,
  Check,
  X,
  FileText,
  UserCheck,
} from 'lucide-react';
import { CategoryItem, CandidateItem, VotingCommentItem, PaginatedResponse } from '../../types';
import { apiService } from '../../services/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export const VotesAuditView: React.FC = () => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const [commentsData, setCommentsData] = useState<PaginatedResponse<VotingCommentItem> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal de Corrección Manual / Auditoría
  const [auditComment, setAuditComment] = useState<VotingCommentItem | null>(null);
  const [auditStatus, setAuditStatus] = useState<string>('MANUALLY_APPROVED');
  const [auditCandidateId, setAuditCandidateId] = useState<string>('');
  const [auditReason, setAuditReason] = useState<string>('');
  const [isAuditing, setIsAuditing] = useState(false);

  // Modal de Importación CSV
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvRawText, setCsvRawText] = useState('');
  const [csvCategoryId, setCsvCategoryId] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importResultMsg, setImportResultMsg] = useState<string | null>(null);

  // 1. Cargar Categorías y Candidatos
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [cats, cands] = await Promise.all([
          apiService.getVotingCategories(),
          apiService.getVotingCandidates(),
        ]);
        setCategories(cats);
        setCandidates(cands);
        if (cats.length > 0) {
          setCsvCategoryId(cats[0].id);
        }
      } catch (err) {
        console.error('Error al cargar metadatos de auditoría:', err);
      }
    };
    loadMetadata();
  }, []);

  // 2. Cargar Comentarios Paginados con Filtros
  const loadComments = async () => {
    setIsLoading(true);
    try {
      const res = await apiService.getVotingComments({
        categoryId: selectedCategoryId || undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        platform: selectedPlatform !== 'ALL' ? selectedPlatform : undefined,
        search: searchTerm.trim() || undefined,
        page,
        pageSize: 20,
      });
      setCommentsData(res);
    } catch (err) {
      console.error('Error al cargar comentarios para auditoría:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [page, selectedCategoryId, selectedStatus, selectedPlatform]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadComments();
  };

  // 3. Ejecutar Auditoría Manual
  const handleOpenAuditModal = (comment: VotingCommentItem) => {
    setAuditComment(comment);
    setAuditStatus(comment.voteStatus === 'VALID' ? 'MANUALLY_REJECTED' : 'MANUALLY_APPROVED');
    setAuditCandidateId(comment.candidate?.id || '');
    setAuditReason('');
  };

  const handleSaveAudit = async () => {
    if (!auditComment?.voteRecordId || !auditReason.trim()) return;

    setIsAuditing(true);
    try {
      await apiService.auditVote({
        voteRecordId: auditComment.voteRecordId,
        newStatus: auditStatus,
        newCandidateId: auditCandidateId || null,
        changedBy: 'Juez / Auditor Ébano',
        reason: auditReason.trim(),
      });
      setAuditComment(null);
      loadComments();
    } catch (err: any) {
      alert('Error al guardar auditoría: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsAuditing(false);
    }
  };

  // 4. Ejecutar Importación CSV
  const handleImportCsv = async () => {
    if (!csvRawText.trim() || !csvCategoryId) return;

    setIsImporting(true);
    setImportResultMsg(null);
    try {
      const res = await apiService.importCommentsCsv({
        csvContent: csvRawText,
        categoryId: csvCategoryId,
      });
      setImportResultMsg(res.message);
      setCsvRawText('');
      setTimeout(() => {
        setIsCsvModalOpen(false);
        setImportResultMsg(null);
        loadComments();
      }, 2000);
    } catch (err: any) {
      setImportResultMsg('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-border-ui shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-brand-600" />
              <span>Detección de Repetidos y Auditoría Manual de Votos</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Revisa comentarios descartados, repetidos o dudosos y aplica correcciones trazables con registro de auditoría
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCsvModalOpen(true)}
              leftIcon={<Upload className="w-4 h-4 text-brand-600" />}
            >
              Importar Comentarios CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadComments}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refrescar
            </Button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* Category Filter */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Categoría:</label>
            <select
              value={selectedCategoryId}
              onChange={(e) => {
                setSelectedCategoryId(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none"
            >
              <option value="">Todas las Categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Estado del Voto:</label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="VALID">Válidos (Contabilizados)</option>
              <option value="DUPLICATE_USER">Duplicado por Usuario</option>
              <option value="MULTI_MENTION">Mención Múltiple Ambigua</option>
              <option value="NO_CANDIDATE_MATCH">Sin Coincidencia de Candidato</option>
              <option value="PENDING_REVIEW">Pendiente de Revisión</option>
              <option value="MANUALLY_APPROVED">Aprobado Manualmente</option>
              <option value="MANUALLY_REJECTED">Rechazado Manualmente</option>
            </select>
          </div>

          {/* Platform Filter */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Red Social:</label>
            <select
              value={selectedPlatform}
              onChange={(e) => {
                setSelectedPlatform(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none"
            >
              <option value="ALL">Todas las Redes</option>
              <option value="FACEBOOK">Facebook</option>
              <option value="INSTAGRAM">Instagram</option>
            </select>
          </div>

          {/* Search Input */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Búsqueda rápida:</label>
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Texto o autor..."
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              />
            </form>
          </div>
        </div>
      </div>

      {/* Comments Audit Table */}
      <Card className="overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-border-ui text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Red</th>
                <th className="py-3 px-4">Autor</th>
                <th className="py-3 px-4">Comentario Original</th>
                <th className="py-3 px-4">Candidato Asignado</th>
                <th className="py-3 px-4">Estado del Voto</th>
                <th className="py-3 px-4">Motivo / Notas</th>
                <th className="py-3 px-4 text-center">Auditoría</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Cargando comentarios y votos auditados...
                  </td>
                </tr>
              ) : !commentsData || commentsData.data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                    No se encontraron comentarios para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                commentsData.data.map((c) => {
                  const isValid = c.voteStatus === 'VALID' || c.voteStatus === 'MANUALLY_APPROVED';
                  const isFb = c.platform === 'FACEBOOK';
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <Badge variant={isFb ? 'facebook' : 'instagram'} size="sm">
                          {isFb ? 'Facebook' : 'Instagram'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {c.authorName}
                      </td>
                      <td className="py-3 px-4 max-w-sm truncate text-slate-700" title={c.text}>
                        {c.text}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {c.candidate ? (
                          <span className="inline-flex items-center gap-1">
                            <span className="font-bold text-brand-600">#{c.candidate.number || '-'}</span>
                            <span>{c.candidate.name}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Ninguno</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {c.voteStatus === 'VALID' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Válido
                          </span>
                        ) : c.voteStatus === 'MANUALLY_APPROVED' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                            <UserCheck className="w-3 h-3 text-blue-600" /> Aprobado Juez
                          </span>
                        ) : c.voteStatus === 'DUPLICATE_USER' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            <AlertCircle className="w-3 h-3 text-amber-600" /> Usuario Duplicado
                          </span>
                        ) : c.voteStatus === 'MULTI_MENTION' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                            Multi-mención
                          </span>
                        ) : c.voteStatus === 'MANUALLY_REJECTED' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                            <XCircle className="w-3 h-3 text-red-600" /> Rechazado Juez
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            {c.voteStatus}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate text-[11px]" title={c.discardReason || c.manualNotes || ''}>
                        {c.discardReason || c.manualNotes || '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenAuditModal(c)}
                          className="text-[11px] py-1 px-2.5 h-auto"
                          leftIcon={<Edit3 className="w-3 h-3" />}
                        >
                          Auditar
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {commentsData && commentsData.pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Página <strong>{page}</strong> de <strong>{commentsData.pagination.totalPages}</strong> (
              {commentsData.pagination.totalCount} comentarios)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= commentsData.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal de Corrección Manual / Auditoría */}
      <Modal
        isOpen={!!auditComment}
        onClose={() => setAuditComment(null)}
        title="Auditoría y Corrección Manual de Voto"
        description="Ajusta el estado oficial de este comentario con justificación trazable para los jueces"
        maxWidth="md"
      >
        {auditComment && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-500 block">Comentario Original:</span>
              <p className="text-slate-900 font-medium select-text">"{auditComment.text}"</p>
              <span className="text-[10px] text-slate-400 block">
                Autor: {auditComment.authorName} ({auditComment.platform})
              </span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Nuevo Estado del Voto:</label>
              <select
                value={auditStatus}
                onChange={(e) => setAuditStatus(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none"
              >
                <option value="MANUALLY_APPROVED">Aprobar Manualmente como Voto Válido</option>
                <option value="MANUALLY_REJECTED">Descartar / Rechazar Manualmente</option>
                <option value="PENDING_REVIEW">Dejar en Revisión</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Asignar a Integrante:</label>
              <select
                value={auditCandidateId}
                onChange={(e) => setAuditCandidateId(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none"
              >
                <option value="">Sin Asignar</option>
                {candidates.map((cand) => (
                  <option key={cand.id} value={cand.id}>
                    #{cand.number || '-'} {cand.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Motivo / Justificación de la Corrección (Requerido para auditoría):
              </label>
              <textarea
                value={auditReason}
                onChange={(e) => setAuditReason(e.target.value)}
                rows={3}
                placeholder="Explica por qué se aprueba o descarta este voto..."
                className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setAuditComment(null)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={isAuditing}
                disabled={!auditReason.trim()}
                onClick={handleSaveAudit}
              >
                Guardar Auditoría
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Importación de Comentarios CSV */}
      <Modal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        title="Importar Comentarios vía CSV"
        description="Carga comentarios de Facebook o Instagram cuando la cuenta no disponga de API o para datos históricos"
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Categoría Destino:</label>
            <select
              value={csvCategoryId}
              onChange={(e) => setCsvCategoryId(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.edition})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700 block">
                Contenido CSV (Pegar texto o encabezados):
              </label>
              <span className="text-[10px] text-slate-400">
                Columnas requeridas: <code>texto, autor, plataforma, fecha</code>
              </span>
            </div>
            <textarea
              value={csvRawText}
              onChange={(e) => setCsvRawText(e.target.value)}
              rows={8}
              placeholder={`texto,autor,plataforma,fecha\n"Voto por Valentina #1",Carlos Mendoza,FACEBOOK,2026-10-23T10:00:00Z\n"@isabella_mina eres la reina",isabella_fan,INSTAGRAM,2026-10-23T11:00:00Z`}
              className="w-full p-2.5 bg-slate-50 font-mono text-[11px] border border-slate-200 rounded-xl focus:outline-none"
            />
          </div>

          {importResultMsg && (
            <div
              className={`p-3 rounded-xl border text-xs font-semibold ${
                importResultMsg.startsWith('Error')
                  ? 'bg-red-50 text-red-800 border-red-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              {importResultMsg}
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsCsvModalOpen(false)}>
              Cerrar
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isImporting}
              disabled={!csvRawText.trim() || !csvCategoryId}
              onClick={handleImportCsv}
              leftIcon={<Upload className="w-3.5 h-3.5" />}
            >
              Procesar e Importar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
