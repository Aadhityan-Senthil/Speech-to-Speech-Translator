import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Timer, Gauge, Star } from 'lucide-react';

interface ModelStats {
  model_name: string;
  avg_latency: number;
  avg_quality: number;
  avg_expressivity: number;
  usage_count: number;
}

interface PerformanceDashboardProps {
  stats: ModelStats[];
}

export const PerformanceDashboard = ({ stats }: PerformanceDashboardProps) => {
  const getLatencyColor = (latency: number) => {
    if (latency < 500) return 'text-green-600';
    if (latency < 1000) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600';
    if (score >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatModelName = (modelName: string) => {
    switch (modelName) {
      case 'moshi': return 'Moshi';
      case 'ultravox': return 'Ultravox';
      case 'spirit_lm': return 'Spirit LM';
      default: return modelName;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5" />
          <span>Model Performance</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {stats.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No performance data available yet
          </div>
        ) : (
          <div className="space-y-6">
            {stats.map((stat) => (
              <div key={stat.model_name} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{formatModelName(stat.model_name)}</h3>
                  <Badge variant="outline">{stat.usage_count} uses</Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Latency */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Timer className="w-4 h-4" />
                      <span className="text-sm font-medium">Latency</span>
                    </div>
                    <div className={`text-2xl font-bold ${getLatencyColor(stat.avg_latency)}`}>
                      {Math.round(stat.avg_latency)}ms
                    </div>
                    <Progress 
                      value={Math.min((2000 - stat.avg_latency) / 2000 * 100, 100)} 
                      className="h-2"
                    />
                  </div>

                  {/* Quality */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Gauge className="w-4 h-4" />
                      <span className="text-sm font-medium">Quality</span>
                    </div>
                    <div className={`text-2xl font-bold ${getScoreColor(stat.avg_quality)}`}>
                      {stat.avg_quality.toFixed(1)}/5
                    </div>
                    <Progress 
                      value={stat.avg_quality * 20} 
                      className="h-2"
                    />
                  </div>

                  {/* Expressivity */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4" />
                      <span className="text-sm font-medium">Expressivity</span>
                    </div>
                    <div className={`text-2xl font-bold ${getScoreColor(stat.avg_expressivity)}`}>
                      {stat.avg_expressivity.toFixed(1)}/5
                    </div>
                    <Progress 
                      value={stat.avg_expressivity * 20} 
                      className="h-2"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};