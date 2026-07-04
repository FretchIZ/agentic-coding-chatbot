export class CompletionMetric {
  calculate(completed: number, total: number): { rate: number; remaining: number; percentage: number } {
    const rate = total > 0 ? completed / total : 0;
    return { rate, remaining: total - completed, percentage: rate * 100 };
  }
}

export class TimeOnTaskMetric {
  calculate(totalMinutes: number, sessions: number): { averageMinutes: number; totalHours: number; sessionsPerDay: number } {
    return {
      averageMinutes: sessions > 0 ? totalMinutes / sessions : 0,
      totalHours: totalMinutes / 60,
      sessionsPerDay: totalMinutes > 0 ? sessions / (totalMinutes / (24 * 60)) : 0,
    };
  }
}

export class AccuracyMetric {
  calculate(correct: number, total: number): { rate: number; percentage: number; grade: string } {
    const rate = total > 0 ? correct / total : 0;
    const percentage = rate * 100;
    let grade = 'F';
    if (percentage >= 90) grade = 'A';
    else if (percentage >= 80) grade = 'B';
    else if (percentage >= 70) grade = 'C';
    else if (percentage >= 60) grade = 'D';
    return { rate, percentage, grade };
  }
}

export class TimeSpentMetric {
  calculate(ms: number): { ms: number; seconds: number; minutes: number; hours: number; formatted: string } {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const formatted = hours > 0 ? `${hours}h ${minutes % 60}m` : minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
    return { ms, seconds, minutes, hours, formatted };
  }
}

export class SkillProgressionMetric {
  calculate(scores: number[]): { trend: 'improving' | 'declining' | 'stable'; average: number; latest: number; variance: number } {
    if (scores.length === 0) return { trend: 'stable', average: 0, latest: 0, variance: 0 };
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    const latest = scores[scores.length - 1];
    const trend = latest > average ? 'improving' : latest < average ? 'declining' : 'stable';
    const variance = Math.sqrt(scores.reduce((sum, s) => sum + Math.pow(s - average, 2), 0) / scores.length);
    return { trend, average, latest, variance };
  }
}