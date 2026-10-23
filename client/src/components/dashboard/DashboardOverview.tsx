import React, { useState, useEffect } from 'react';
import { DashboardMetrics, SocialPost, SocialComment } from '../../types';
import { apiService } from '../../services/api';
import { useFilters } from '../../context/FilterContext';
import { StatCards } from './StatCards';
import { EvolutionChart } from './EvolutionChart';
import { PlatformComparison } from './PlatformComparison';
import { TopPostsRanking } from './TopPostsRanking';
import { WeekdayActivity } from './WeekdayActivity';
import { PostDetailDrawer } from '../posts/PostDetailDrawer';

export const DashboardOverview: React.FC = () => {
  const { platform, startDate, endDate, refreshKey } = useFilters();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Selected post for drawer
  const [selectedPost, setSelectedPost] = useState<(SocialPost & { comments: SocialComment[] }) | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      setIsLoading(true);
      try {
        const data = await apiService.getDashboardMetrics({
          platform,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        });
        setMetrics(data);
      } catch (e) {
        console.error('Error al cargar métricas del dashboard:', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, [platform, startDate, endDate, refreshKey]);

  const handleSelectPost = async (postId: string) => {
    try {
      const detail = await apiService.getPostDetail(postId);
      setSelectedPost(detail);
      setIsDrawerOpen(true);
    } catch (e) {
      console.error('Error al abrir detalle:', e);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Stat Cards Row */}
      <StatCards metrics={metrics} isLoading={isLoading} />

      {/* 2. Temporal Evolution Area Chart */}
      <EvolutionChart data={metrics?.evolutionChart || []} isLoading={isLoading} />

      {/* 3. Two Columns: Platform Comparison & Top Posts Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlatformComparison
          distribution={
            metrics?.platformDistribution || {
              facebook: { count: 0, percentage: 0 },
              instagram: { count: 0, percentage: 0 },
            }
          }
          totalComments={metrics?.totalComments || 0}
        />

        <TopPostsRanking
          posts={metrics?.topPosts || []}
          onSelectPost={handleSelectPost}
        />
      </div>

      {/* 4. Weekday Activity Distribution */}
      <WeekdayActivity data={metrics?.weekdayActivity || []} />

      {/* Detail Drawer for Posts */}
      <PostDetailDrawer
        post={selectedPost}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
};
