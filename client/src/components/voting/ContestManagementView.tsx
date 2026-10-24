import React, { useState, useEffect } from 'react';
import {
  Settings,
  Trophy,
  Users,
  Plus,
  Share2,
  Edit2,
  CheckCircle2,
  Link2,
  Trash2,
  Sparkles,
  HelpCircle,
  AlertCircle,
} from 'lucide-react';
import { CategoryItem, CandidateItem, SocialPost, SocialAccount } from '../../types';
import { apiService } from '../../services/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export const ContestManagementView: React.FC = () => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal Categoría
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [catName, setCatName] = useState('');
  const [catEdition, setCatEdition] = useState('2026');
  const [catPolicy, setCatPolicy] = useState<'EVERY_VALID_COMMENT' | 'ONE_PER_USER_AND_CANDIDATE' | 'ONE_PER_USER_PER_CATEGORY'>('ONE_PER_USER_AND_CANDIDATE');
  const [catStatus, setCatStatus] = useState<'PROVISIONAL' | 'DEFINITIVE'>('PROVISIONAL');
  const [catAllowMultiple, setCatAllowMultiple] = useState(false);
  const [catDescription, setCatDescription] = useState('');

  // Modal Candidato
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<CandidateItem | null>(null);
  const [candCategoryId, setCandCategoryId] = useState('');
  const [candName, setCandName] = useState('');
  const [candNumber, setCandNumber] = useState('');
  const [candAliases, setCandAliases] = useState('');
  const [candPhotoUrl, setCandPhotoUrl] = useState('');
  const [candBio, setCandBio] = useState('');

  // Modal Asociar Publicación
  const [isAssociateModalOpen, setIsAssociateModalOpen] = useState(false);
  const [targetPostId, setTargetPostId] = useState('');
  const [assocCategoryId, setAssocCategoryId] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cats, cands, postsRes, accs] = await Promise.all([
        apiService.getVotingCategories(),
        apiService.getVotingCandidates(),
        apiService.getPosts({ pageSize: 50 }),
        apiService.getAccounts(),
      ]);
      setCategories(cats);
      setCandidates(cands);
      setPosts(postsRes.data);
      setAccounts(accs);
    } catch (err) {
      console.error('Error al cargar datos de gestión:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Guardar Categoría
  const handleSaveCategory = async () => {
    if (!catName.trim()) return;
    try {
      if (editingCategory) {
        await apiService.updateCategory(editingCategory.id, {
          name: catName.trim(),
          edition: catEdition,
          description: catDescription,
          votingPolicy: catPolicy,
          status: catStatus,
          allowMultipleMentions: catAllowMultiple,
        });
      } else {
        await apiService.createCategory({
          name: catName.trim(),
          edition: catEdition,
          description: catDescription,
          votingPolicy: catPolicy,
          allowMultipleMentions: catAllowMultiple,
        });
      }
      setIsCategoryModalOpen(false);
      loadData();
    } catch (err: any) {
      alert('Error al guardar categoría: ' + err.message);
    }
  };

  const handleOpenEditCategory = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatEdition(cat.edition);
    setCatPolicy(cat.votingPolicy);
    setCatStatus(cat.status);
    setCatAllowMultiple(cat.allowMultipleMentions);
    setCatDescription(cat.description || '');
    setIsCategoryModalOpen(true);
  };

  // Guardar Candidato
  const handleSaveCandidate = async () => {
    if (!candName.trim() || !candCategoryId) return;
    try {
      if (editingCandidate) {
        await apiService.updateCandidate(editingCandidate.id, {
          name: candName.trim(),
          number: candNumber ? Number(candNumber) : null,
          aliasList: candAliases,
          photoUrl: candPhotoUrl,
          bio: candBio,
        });
      } else {
        await apiService.createCandidate({
          categoryId: candCategoryId,
          name: candName.trim(),
          number: candNumber ? Number(candNumber) : null,
          aliasList: candAliases,
          photoUrl: candPhotoUrl,
          bio: candBio,
        });
      }
      setIsCandidateModalOpen(false);
      loadData();
    } catch (err: any) {
      alert('Error al guardar participante: ' + err.message);
    }
  };

  const handleOpenEditCandidate = (cand: CandidateItem) => {
    setEditingCandidate(cand);
    setCandCategoryId(cand.categoryId);
    setCandName(cand.name);
    setCandNumber(cand.number !== null ? String(cand.number) : '');
    setCandAliases(Array.isArray(cand.aliasList) ? cand.aliasList.join(', ') : '');
    setCandPhotoUrl(cand.photoUrl || '');
    setCandBio(cand.bio || '');
    setIsCandidateModalOpen(true);
  };

  // Asociar Post
  const handleAssociatePost = async () => {
    if (!targetPostId || !assocCategoryId) return;
    try {
      await apiService.associatePostsToCategory([targetPostId], assocCategoryId);
      setIsAssociateModalOpen(false);
      loadData();
    } catch (err: any) {
      alert('Error al asociar publicación: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Official Ébano Accounts Status Header */}
      <Card className="p-5 bg-white shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-brand-600" />
              <span>Cuentas Oficiales de Ébano Vinculadas</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Identificación y monitoreo de perfiles oficiales autorizados para el procesamiento de votaciones
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {accounts.map((acc) => {
            const isFb = acc.platform === 'FACEBOOK';
            return (
              <div
                key={acc.id}
                className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {acc.profilePictureUrl ? (
                    <img
                      src={acc.profilePictureUrl}
                      alt={acc.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700">
                      {acc.name.substring(0, 2)}
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{acc.name}</span>
                    <span className="text-[11px] text-slate-500">
                      {isFb ? 'Página Oficial Facebook' : 'Instagram Profesional'} ({acc.commentsCount} comentarios)
                    </span>
                  </div>
                </div>

                <Badge variant={acc.tokenStatus === 'ACTIVE' ? 'success' : 'warning'} size="sm">
                  {acc.tokenStatus === 'ACTIVE' ? 'Conectada' : acc.tokenStatus}
                </Badge>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Categories Management Section */}
      <Card className="shadow-2xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Trophy className="w-4 h-4 text-brand-600" />
              <span>Categorías y Convocatorias</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Configura las convocatorias, las reglas de conteo y el estado de validación
            </CardDescription>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingCategory(null);
              setCatName('');
              setCatEdition('2026');
              setCatPolicy('ONE_PER_USER_AND_CANDIDATE');
              setCatStatus('PROVISIONAL');
              setCatAllowMultiple(false);
              setCatDescription('');
              setIsCategoryModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Nueva Categoría
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-200">
                      {cat.edition}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Badge variant={cat.status === 'DEFINITIVE' ? 'success' : 'warning'} size="sm">
                        {cat.status === 'DEFINITIVE' ? 'Ganador Definitivo' : 'Ganador Provisional'}
                      </Badge>
                      <button
                        onClick={() => handleOpenEditCategory(cat)}
                        className="p-1 text-slate-400 hover:text-brand-600 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{cat.name}</h4>
                  <p className="text-xs text-slate-600 mt-1">{cat.description || 'Sin descripción'}</p>
                </div>

                <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-500 space-y-1">
                  <div>
                    Regla de Votación: <strong>{cat.votingPolicy.replace(/_/g, ' ')}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>
                      Participantes: <strong>{cat._count?.candidates || 0}</strong>
                    </span>
                    <span>
                      Posts vinculados: <strong>{cat._count?.posts || 0}</strong>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Candidates Management Section */}
      <Card className="shadow-2xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-600" />
              <span>Integrantes Participantes</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Registra a los integrantes, números de lista y sus alias de votación (hashtags y menciones)
            </CardDescription>
          </div>
          <Button
            variant="primary"
            size="sm"
            disabled={categories.length === 0}
            onClick={() => {
              setEditingCandidate(null);
              setCandCategoryId(categories[0]?.id || '');
              setCandName('');
              setCandNumber('');
              setCandAliases('');
              setCandPhotoUrl('');
              setCandBio('');
              setIsCandidateModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Nuevo Integrante
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-border-ui text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Integrante</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4">Alias / Hashtags de Voto</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {candidates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No hay integrantes registrados.
                    </td>
                  </tr>
                ) : (
                  candidates.map((cand) => (
                    <tr key={cand.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {cand.number !== null ? `#${cand.number}` : '-'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 flex items-center gap-2">
                        {cand.photoUrl && (
                          <img
                            src={cand.photoUrl}
                            alt={cand.name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        )}
                        <span>{cand.name}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{cand.category?.name}</td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-500 font-mono text-[11px]">
                        {Array.isArray(cand.aliasList) ? cand.aliasList.join(', ') : cand.aliasList}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={cand.status === 'ACTIVE' ? 'success' : 'outline'} size="sm">
                          {cand.status === 'ACTIVE' ? 'Activo' : 'Descalificado'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditCandidate(cand)}
                          className="text-[11px] py-1 px-2.5 h-auto"
                        >
                          Editar
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Associate Posts with Category Section */}
      <Card className="shadow-2xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Link2 className="w-4 h-4 text-brand-600" />
              <span>Vincular Publicaciones a Categorías</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Asocia las publicaciones de Facebook e Instagram para que sus comentarios se procesen como votos
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {posts.slice(0, 8).map((p) => {
              const isFb = p.platform === 'FACEBOOK';
              return (
                <div
                  key={p.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge variant={isFb ? 'facebook' : 'instagram'} size="sm">
                      {isFb ? 'Facebook' : 'Instagram'}
                    </Badge>
                    <span className="truncate max-w-md font-medium text-slate-800">
                      {p.message || 'Publicación multimedia'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-slate-500 text-[11px] font-semibold">
                      {p.totalStoredComments} comentarios
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTargetPostId(p.id);
                        setAssocCategoryId(categories[0]?.id || '');
                        setIsAssociateModalOpen(true);
                      }}
                      className="text-[11px] py-1 px-2.5 h-auto"
                    >
                      Asociar Categoría
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Modal Crear/Editar Categoría */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={editingCategory ? 'Editar Categoría' : 'Nueva Categoría de Convocatoria'}
        description="Define las reglas oficiales y el criterio de conteo de votos"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Nombre de la Categoría:</label>
            <input
              type="text"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="Ej. Reina Ébano 2026, Talento Juvenil..."
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Edición / Convocatoria:</label>
            <input
              type="text"
              value={catEdition}
              onChange={(e) => setCatEdition(e.target.value)}
              placeholder="2026"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Política de Conteo de Votos:</label>
            <select
              value={catPolicy}
              onChange={(e) => setCatPolicy(e.target.value as any)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none"
            >
              <option value="ONE_PER_USER_AND_CANDIDATE">
                1 voto por usuario para cada participante (Recomendado)
              </option>
              <option value="ONE_PER_USER_PER_CATEGORY">
                1 sola participación por usuario en toda la categoría
              </option>
              <option value="EVERY_VALID_COMMENT">
                Contar cada comentario válido (Sin deduplicación de usuario)
              </option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Estado de Resultados:</label>
            <select
              value={catStatus}
              onChange={(e) => setCatStatus(e.target.value as any)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none"
            >
              <option value="PROVISIONAL">Ganador Provisional (En votación)</option>
              <option value="DEFINITIVE">Ganador Definitivo (Cierre oficial)</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Descripción de la Convocatoria:</label>
            <textarea
              value={catDescription}
              onChange={(e) => setCatDescription(e.target.value)}
              rows={2}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsCategoryModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveCategory}>
              Guardar Categoría
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Crear/Editar Candidato */}
      <Modal
        isOpen={isCandidateModalOpen}
        onClose={() => setIsCandidateModalOpen(false)}
        title={editingCandidate ? 'Editar Integrante' : 'Nuevo Integrante Participante'}
        description="Ingresa los datos del participante y sus términos de búsqueda de votos"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Categoría:</label>
            <select
              value={candCategoryId}
              onChange={(e) => setCandCategoryId(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Nombre Completo:</label>
            <input
              type="text"
              value={candName}
              onChange={(e) => setCandName(e.target.value)}
              placeholder="Ej. Valentina Córdoba"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Número de Lista (Opcional):</label>
            <input
              type="number"
              value={candNumber}
              onChange={(e) => setCandNumber(e.target.value)}
              placeholder="Ej. 1"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Alias, Hashtags y Menciones (Separados por coma):
            </label>
            <input
              type="text"
              value={candAliases}
              onChange={(e) => setCandAliases(e.target.value)}
              placeholder="#valentina, @valentina_cordoba, valentina, candidata 1"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
            />
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Cualquier comentario que incluya estos términos sumará como voto para este participante.
            </span>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">URL de la Fotografía:</label>
            <input
              type="url"
              value={candPhotoUrl}
              onChange={(e) => setCandPhotoUrl(e.target.value)}
              placeholder="https://..."
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Perfil / Biografía:</label>
            <textarea
              value={candBio}
              onChange={(e) => setCandBio(e.target.value)}
              rows={2}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsCandidateModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveCandidate}>
              Guardar Integrante
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Asociar Post */}
      <Modal
        isOpen={isAssociateModalOpen}
        onClose={() => setIsAssociateModalOpen(false)}
        title="Vincular Publicación a Categoría"
        description="Selecciona la categoría a la que pertenecerán los comentarios de esta publicación"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Categoría de Votación:</label>
            <select
              value={assocCategoryId}
              onChange={(e) => setAssocCategoryId(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsAssociateModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" onClick={handleAssociatePost}>
              Vincular y Procesar Votos
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
