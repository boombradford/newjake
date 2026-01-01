import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import { getLoginUrl } from "@/const";
import {
  ArrowLeft,
  RefreshCw,
  Twitter,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Bell,
  TrendingUp,
  Users,
  MessageSquare,
  Heart,
  Share2,
  Eye,
  Clock,
  AlertTriangle,
  Sparkles,
  BarChart3,
  Activity,
  Hash,
  Video,
  Image as ImageIcon,
  FileText,
  ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const platformIcons: Record<string, React.ReactNode> = {
  twitter: <Twitter className="w-4 h-4" />,
  facebook: <Facebook className="w-4 h-4" />,
  instagram: <Instagram className="w-4 h-4" />,
  linkedin: <Linkedin className="w-4 h-4" />,
  youtube: <Youtube className="w-4 h-4" />,
  tiktok: <Video className="w-4 h-4" />,
};

const platformColors: Record<string, string> = {
  twitter: "bg-sky-500/20 text-sky-400 border-sky-500/30",
  facebook: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  instagram: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  linkedin: "bg-blue-600/20 text-blue-300 border-blue-600/30",
  youtube: "bg-red-500/20 text-red-400 border-red-500/30",
  tiktok: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const contentTypeIcons: Record<string, React.ReactNode> = {
  text: <FileText className="w-3 h-3" />,
  image: <ImageIcon className="w-3 h-3" />,
  video: <Video className="w-3 h-3" />,
  link: <ExternalLink className="w-3 h-3" />,
  carousel: <ImageIcon className="w-3 h-3" />,
};

const alertTypeColors: Record<string, string> = {
  viral_post: "bg-green-500/20 text-green-400 border-green-500/30",
  high_engagement: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  new_campaign: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  mention_spike: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  follower_surge: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
};

export default function SocialMediaMonitor() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const analysisId = parseInt(params.id || "0", 10);

  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = trpc.socialMedia.getMetrics.useQuery(
    { analysisId },
    { enabled: analysisId > 0 }
  );

  const { data: posts, isLoading: postsLoading, refetch: refetchPosts } = trpc.socialMedia.getPosts.useQuery(
    { analysisId },
    { enabled: analysisId > 0 }
  );

  const { data: alerts, isLoading: alertsLoading, refetch: refetchAlerts } = trpc.socialMedia.getAlerts.useQuery(
    { analysisId },
    { enabled: analysisId > 0 }
  );

  const { data: insights, isLoading: insightsLoading } = trpc.socialMedia.getInsights.useQuery(
    { analysisId },
    { enabled: analysisId > 0 }
  );

  const { data: analysis } = trpc.analysis.get.useQuery(
    { id: analysisId },
    { enabled: analysisId > 0 }
  );

  const refreshMutation = trpc.socialMedia.refresh.useMutation({
    onSuccess: () => {
      setTimeout(() => {
        refetchMetrics();
        refetchPosts();
        refetchAlerts();
      }, 3000);
    },
  });

  const markReadMutation = trpc.socialMedia.markAlertRead.useMutation({
    onSuccess: () => refetchAlerts(),
  });

  // Auth checks removed

  const isLoading = metricsLoading || postsLoading || alertsLoading;

  // Group metrics by competitor
  const metricsByCompetitor = metrics?.reduce((acc, m) => {
    const key = m.competitorId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {} as Record<number, typeof metrics>) || {};

  // Get unique platforms
  const platforms = Array.from(new Set(metrics?.map(m => m.platform) || []));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation(`/analysis/${analysisId}`)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Social Media Monitor</h1>
              <p className="text-sm text-muted-foreground">
                {analysis?.businessName || "Loading..."}
              </p>
            </div>
          </div>
          <Button
            onClick={() => refreshMutation.mutate({ analysisId })}
            disabled={refreshMutation.isPending}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshMutation.isPending ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
        </div>
      </header>

      <main className="container py-8">
        {/* Alerts Banner */}
        {alerts && alerts.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Recent Alerts</h2>
              <Badge variant="secondary">{alerts.filter(a => !a.isRead).length} new</Badge>
            </div>
            <div className="grid gap-3">
              {alerts.slice(0, 3).map((alert) => (
                <Card
                  key={alert.id}
                  className={`cursor-pointer transition-all hover:border-primary/50 ${alert.isRead ? "opacity-60" : ""
                    }`}
                  onClick={() => !alert.isRead && markReadMutation.mutate({ alertId: alert.id })}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className={`p-2 rounded-lg ${alertTypeColors[alert.alertType] || "bg-muted"}`}>
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{alert.title}</span>
                        <Badge variant="outline" className={platformColors[alert.platform]}>
                          {platformIcons[alert.platform]}
                          <span className="ml-1 capitalize">{alert.platform}</span>
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                    </div>
                    <Badge
                      variant={
                        alert.importance === "high" ? "destructive" :
                          alert.importance === "medium" ? "default" : "secondary"
                      }
                    >
                      {alert.importance}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Insights Summary */}
        {insights && (
          <Card className="mb-8 bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <CardTitle>AI Insights</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{insights.summary}</p>
              {insights.topPerformer !== "N/A" && (
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm">
                    <strong>Top Performer:</strong> {insights.topPerformer}
                  </span>
                </div>
              )}
              {insights.recommendations.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Recommendations:</p>
                  <ul className="space-y-1">
                    {insights.recommendations.map((rec, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Activity className="w-4 h-4" />
              Activity Feed
            </TabsTrigger>
            <TabsTrigger value="engagement" className="gap-2">
              <Heart className="w-4 h-4" />
              Engagement
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-48" />
                ))}
              </div>
            ) : (
              <>
                {/* Access Restricted Banner if metrics are empty */}
                {metrics?.every(m => m.followers === 0) && (
                  <Card className="mb-6 border-amber-500/20 bg-amber-500/5">
                    <CardContent className="flex items-center gap-4 p-6">
                      <div className="p-3 rounded-full bg-amber-500/10 text-amber-500">
                        <Activity className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">Deep Metrics Restricted</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Public access allows us to identify social profiles, but deep engagement metrics (Follower Growth, Engagement Rate) require restricted API access.
                          <br />
                          <span className="opacity-80">Connect your official business accounts to unlock full competitor benchmarking.</span>
                        </p>
                      </div>
                      <Button variant="outline" className="border-amber-500/30 hover:bg-amber-500/10">
                        Connect APIs
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Platform Summary Cards - Modified to focus on Discovery */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {platforms.map((platform) => {
                    const platformMetrics = metrics?.filter(m => m.platform === platform) || [];

                    return (
                      <Card key={platform} className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`p-2 rounded-lg ${platformColors[platform]}`}>
                                {platformIcons[platform]}
                              </div>
                              <CardTitle className="text-base capitalize">{platform}</CardTitle>
                            </div>
                            <Badge variant="secondary">{platformMetrics.length} found</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="mt-2 space-y-2">
                            {platformMetrics.slice(0, 3).map((pm, idx) => (
                              <a
                                key={idx}
                                href={pm.profileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-muted/50 transition-colors group"
                              >
                                <span className="text-muted-foreground group-hover:text-primary truncate max-w-[180px]">
                                  @{pm.username || "unknown"}
                                </span>
                                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </a>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Competitor Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle>Competitor Social Landscape</CardTitle>
                    <CardDescription>Verified social media presence</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {Object.entries(metricsByCompetitor).map(([competitorId, competitorMetrics]) => {
                        const competitor = analysis?.competitors?.find(
                          c => c.id === parseInt(competitorId)
                        );

                        return (
                          <div key={competitorId} className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{competitor?.name || `Competitor ${competitorId}`}</h4>
                              <div className="flex gap-1">
                                {competitorMetrics?.map(m => (
                                  <a
                                    key={m.platform}
                                    href={m.profileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Badge
                                      variant="outline"
                                      className={`${platformColors[m.platform]} hover:bg-muted cursor-pointer transition-colors`}
                                    >
                                      {platformIcons[m.platform]}
                                    </Badge>
                                  </a>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Activity Feed Tab */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest posts from competitors across all platforms</CardDescription>
              </CardHeader>
              <CardContent>
                {postsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-24" />
                    ))}
                  </div>
                ) : posts && posts.length > 0 ? (
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-4">
                      {posts.map((post) => {
                        const competitor = analysis?.competitors?.find(
                          c => c.id === post.competitorId
                        );

                        return (
                          <div
                            key={post.id}
                            className="border border-border/50 rounded-lg p-4 hover:border-primary/30 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className={platformColors[post.platform]}>
                                  {platformIcons[post.platform]}
                                  <span className="ml-1 capitalize">{post.platform}</span>
                                </Badge>
                                <span className="font-medium">{competitor?.name || "Unknown"}</span>
                                <Badge variant="secondary" className="gap-1">
                                  {contentTypeIcons[post.contentType || "text"]}
                                  <span className="capitalize">{post.contentType}</span>
                                </Badge>
                              </div>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {post.postedAt
                                  ? formatDistanceToNow(new Date(post.postedAt), { addSuffix: true })
                                  : "Unknown"}
                              </span>
                            </div>

                            {post.content && (
                              <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                                {post.content}
                              </p>
                            )}

                            {/* Hashtags */}
                            {post.hashtags && Array.isArray(post.hashtags) && post.hashtags.length > 0 ? (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {(post.hashtags as string[]).slice(0, 5).map((tag, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs gap-1">
                                    <Hash className="w-3 h-3" />
                                    {String(tag)}
                                  </Badge>
                                ))}
                              </div>
                            ) : null}

                            {/* Engagement Metrics */}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Heart className="w-4 h-4" />
                                {(post.likes || 0).toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageSquare className="w-4 h-4" />
                                {(post.comments || 0).toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Share2 className="w-4 h-4" />
                                {(post.shares || 0).toLocaleString()}
                              </span>
                              {post.views && (
                                <span className="flex items-center gap-1">
                                  <Eye className="w-4 h-4" />
                                  {post.views.toLocaleString()}
                                </span>
                              )}
                              {post.engagementRate && (
                                <span className="flex items-center gap-1 text-primary">
                                  <TrendingUp className="w-4 h-4" />
                                  {parseFloat(post.engagementRate).toFixed(1)}% engagement
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No social media posts found</p>
                    <p className="text-sm mt-2">Click "Refresh Data" to fetch the latest activity</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Engagement Tab */}
          <TabsContent value="engagement">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Content Type Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Content Type Distribution</CardTitle>
                  <CardDescription>What types of content competitors are posting</CardDescription>
                </CardHeader>
                <CardContent>
                  {metrics && metrics.length > 0 ? (
                    <div className="space-y-4">
                      {["text", "image", "video"].map((type) => {
                        const avgPercent = metrics.reduce((sum, m) => {
                          const val = type === "text" ? m.textPostsPercent :
                            type === "image" ? m.imagePostsPercent :
                              m.videoPostsPercent;
                          return sum + (val || 0);
                        }, 0) / metrics.length;

                        return (
                          <div key={type}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {contentTypeIcons[type]}
                                <span className="capitalize">{type} Posts</span>
                              </div>
                              <span className="text-sm font-medium">{avgPercent.toFixed(0)}%</span>
                            </div>
                            <Progress value={avgPercent} className="h-2" />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Hashtags */}
              <Card>
                <CardHeader>
                  <CardTitle>Trending Hashtags</CardTitle>
                  <CardDescription>Most used hashtags by competitors</CardDescription>
                </CardHeader>
                <CardContent>
                  {metrics && metrics.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {Array.from(
                        new Set(
                          metrics.flatMap(m =>
                            Array.isArray(m.topHashtags) ? m.topHashtags as string[] : []
                          )
                        )
                      ).slice(0, 15).map((tag, i) => (
                        <Badge key={i} variant="secondary" className="gap-1">
                          <Hash className="w-3 h-3" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No hashtags found
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Best Posting Times */}
              <Card>
                <CardHeader>
                  <CardTitle>Optimal Posting Times</CardTitle>
                  <CardDescription>When competitors get the most engagement</CardDescription>
                </CardHeader>
                <CardContent>
                  {metrics && metrics.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {Array.from(
                        new Set(
                          metrics.flatMap(m =>
                            Array.isArray(m.bestPostingTimes) ? m.bestPostingTimes as string[] : []
                          )
                        )
                      ).slice(0, 8).map((time, i) => (
                        <Badge key={i} variant="outline" className="gap-1">
                          <Clock className="w-3 h-3" />
                          {time}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No timing data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Engagement Leaders */}
              <Card>
                <CardHeader>
                  <CardTitle>Engagement Leaders</CardTitle>
                  <CardDescription>Top performing competitors by engagement rate</CardDescription>
                </CardHeader>
                <CardContent>
                  {metrics && metrics.length > 0 ? (
                    <div className="space-y-3">
                      {[...metrics]
                        .sort((a, b) => parseFloat(b.avgEngagementRate || "0") - parseFloat(a.avgEngagementRate || "0"))
                        .slice(0, 5)
                        .map((m, i) => {
                          const competitor = analysis?.competitors?.find(c => c.id === m.competitorId);
                          return (
                            <div key={m.id} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-lg font-bold text-muted-foreground">#{i + 1}</span>
                                <div>
                                  <p className="font-medium">{competitor?.name || "Unknown"}</p>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    {platformIcons[m.platform]}
                                    <span className="capitalize">{m.platform}</span>
                                  </div>
                                </div>
                              </div>
                              <Badge variant="default">
                                {parseFloat(m.avgEngagementRate || "0").toFixed(1)}%
                              </Badge>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No engagement data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div >
  );
}
