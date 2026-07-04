export class RecommendationEngine {
  private userHistory: Map<string, Array<{ id: string; type: string; score: number }>> = new Map();

  trackActivity(userId: string, itemId: string, type: string, score: number): void {
    const history = this.userHistory.get(userId) || [];
    history.push({ id: itemId, type, score });
    this.userHistory.set(userId, history);
  }

  getRecommendations(userId: string, topN: number = 5): Array<{ id: string; reason: string; confidence: number }> {
    const history = this.userHistory.get(userId) || [];
    if (history.length === 0) return [];
    const typeScores = new Map<string, { count: number; totalScore: number }>();
    for (const h of history) {
      const current = typeScores.get(h.type) || { count: 0, totalScore: 0 };
      current.count++;
      current.totalScore += h.score;
      typeScores.set(h.type, current);
    }
    const preferredTypes = Array.from(typeScores.entries())
      .map(([type, data]) => ({ type, avgScore: data.totalScore / data.count }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 3);
    return preferredTypes.map(t => ({
      id: `${t.type}-recommendation`,
      reason: `Continue improving in ${t.type}`,
      confidence: Math.min(t.avgScore / 100, 0.95),
    }));
  }
}

export class LearningPathOptimizer {
  optimize(userProgress: Array<{ lessonId: string; score: number; completedAt: Date }>): Array<{ lessonId: string; priority: number; reason: string }> {
    const lowScoreLessons = userProgress
      .filter(p => p.score < 70)
      .sort((a, b) => a.score - b.score)
      .map(p => ({ lessonId: p.lessonId, priority: 100 - p.score, reason: `Score of ${p.score}% needs improvement` }));
    return lowScoreLessons;
  }
}

export class TrendAnalyzer {
  analyzeTrend(data: number[]): { direction: 'up' | 'down' | 'flat'; changePercent: number; volatility: number } {
    if (data.length < 2) return { direction: 'flat', changePercent: 0, volatility: 0 };
    const first = data[0];
    const last = data[data.length - 1];
    const changePercent = first !== 0 ? ((last - first) / first) * 100 : 0;
    const changes = data.slice(1).map((v, i) => v - data[i]);
    const meanChange = changes.reduce((a, b) => a + b, 0) / changes.length;
    const variance = changes.reduce((sum, c) => sum + Math.pow(c - meanChange, 2), 0) / changes.length;
    return {
      direction: changePercent > 5 ? 'up' : changePercent < -5 ? 'down' : 'flat',
      changePercent,
      volatility: Math.sqrt(variance),
    };
  }
}