export interface DashboardWidget {
  id: string;
  title: string;
  type: 'chart' | 'metric' | 'table' | 'list';
  data: unknown;
  config: Record<string, unknown>;
}

export class DashboardBuilder {
  private widgets: DashboardWidget[] = [];

  addWidget(widget: DashboardWidget): void {
    this.widgets.push(widget);
  }

  removeWidget(id: string): void {
    this.widgets = this.widgets.filter(w => w.id !== id);
  }

  getLayout(userRole: string): DashboardWidget[] {
    const layouts: Record<string, string[]> = {
      admin: ['user-metrics', 'system-health', 'ai-usage', 'performance-overview'],
      educator: ['student-progress', 'class-performance', 'content-metrics'],
      student: ['my-progress', 'recent-activity', 'recommendations'],
    };
    const allowed = layouts[userRole] || layouts.student;
    return this.widgets.filter(w => allowed.includes(w.id));
  }

  build(): DashboardWidget[] {
    return this.widgets;
  }
}

export class StudentDashboard {
  private builder = new DashboardBuilder();

  constructor() {
    this.builder.addWidget({
      id: 'my-progress', title: 'My Progress', type: 'chart',
      data: {}, config: { chartType: 'line', period: '7d' },
    });
    this.builder.addWidget({
      id: 'recent-activity', title: 'Recent Activity', type: 'list',
      data: {}, config: { maxItems: 10 },
    });
    this.builder.addWidget({
      id: 'recommendations', title: 'Recommendations', type: 'list',
      data: {}, config: { maxItems: 5 },
    });
  }

  getWidgets(): DashboardWidget[] {
    return this.builder.build();
  }
}

export class EducatorDashboard {
  private builder = new DashboardBuilder();

  constructor() {
    this.builder.addWidget({
      id: 'student-progress', title: 'Student Progress', type: 'chart',
      data: {}, config: { chartType: 'bar', period: '30d' },
    });
    this.builder.addWidget({
      id: 'class-performance', title: 'Class Performance', type: 'table',
      data: {}, config: { sortBy: 'averageScore' },
    });
    this.builder.addWidget({
      id: 'content-metrics', title: 'Content Metrics', type: 'metric',
      data: {}, config: { metrics: ['views', 'completions', 'avgTime'] },
    });
  }

  getWidgets(): DashboardWidget[] {
    return this.builder.build();
  }
}

export class AdminDashboard {
  private builder = new DashboardBuilder();

  constructor() {
    this.builder.addWidget({
      id: 'user-metrics', title: 'User Metrics', type: 'chart',
      data: {}, config: { chartType: 'area', period: '30d' },
    });
    this.builder.addWidget({
      id: 'system-health', title: 'System Health', type: 'metric',
      data: {}, config: { metrics: ['uptime', 'latency', 'errorRate'] },
    });
    this.builder.addWidget({
      id: 'ai-usage', title: 'AI Usage', type: 'chart',
      data: {}, config: { chartType: 'bar', metrics: ['tokens', 'requests', 'cost'] },
    });
    this.builder.addWidget({
      id: 'performance-overview', title: 'Performance Overview', type: 'table',
      data: {}, config: {},
    });
  }

  getWidgets(): DashboardWidget[] {
    return this.builder.build();
  }
}