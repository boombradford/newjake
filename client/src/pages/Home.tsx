import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import {
  Search,
  Target,
  TrendingUp,
  FileText,
  BarChart3,
  Shield,
  Globe,
  ArrowRight,
  Eye,
  Users,
  Lightbulb,
  Activity
} from "lucide-react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const handleGetStarted = () => {
    // App is now public - go directly to new analysis
    setLocation("/new-analysis");
  };

  const features = [
    {
      icon: Search,
      title: "Competitor Discovery",
      description: "Automatically identify your top 5 local competitors using location intelligence and industry analysis."
    },
    {
      icon: BarChart3,
      title: "SEO Analysis",
      description: "Deep-dive into meta tags, content structure, and keyword optimization across all competitors."
    },
    {
      icon: Globe,
      title: "Online Presence",
      description: "Track Google Business profiles, reviews, ratings, and social media footprints."
    },
    {
      icon: Lightbulb,
      title: "AI-Powered Insights",
      description: "Get intelligent recommendations based on competitive analysis and market positioning."
    },
    {
      icon: FileText,
      title: "Content Generation",
      description: "Auto-generate SEO blog posts and ad copy variations to outperform competitors."
    },
    {
      icon: Activity,
      title: "Sentiment Analysis",
      description: "Gauge audience reactions and sentiment trends across competitor social media."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Background effects */}
      <div className="fixed inset-0 geometric-grid opacity-40 pointer-events-none" />
      <div className="fixed inset-0 soft-gradient pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-10 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-soft">
              <Search className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-foreground">JAKE</span>
          </div>

          <div className="flex items-center gap-4">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
            ) : isAuthenticated ? (
              <>
                <Button variant="ghost" onClick={() => setLocation("/dashboard")}>
                  Dashboard
                </Button>
                <Button onClick={() => setLocation("/new-analysis")}>
                  New Analysis
                </Button>
              </>
            ) : (
              <Button onClick={handleGetStarted}>
                Get Started
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 py-24 lg:py-32">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border mb-8">
              <Eye className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground font-medium">Competitive Intelligence Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-foreground">
              Know Your Competition
              <span className="block text-primary">Inside and Out</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              JAKE analyzes your business and competitors to deliver actionable insights,
              SEO recommendations, and AI-generated content that helps you stay ahead.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="shadow-medium" onClick={handleGetStarted}>
                Start Analysis
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="bg-background" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 py-16 border-y border-border bg-secondary/30">
        <div className="container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: "95", label: "Analysis Steps", suffix: "+" },
              { value: "5", label: "Competitors Analyzed" },
              { value: "1,500", label: "Word Blog Posts" },
              { value: "6", label: "Ad Copy Variations" }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">
                  {stat.value}{stat.suffix}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-24">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-foreground">
              Complete Competitive Intelligence
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A comprehensive suite of tools to understand and outperform your competition.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group p-6 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-medium transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative z-10 py-24 border-t border-border bg-secondary/20">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-foreground">
              How JAKE Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get actionable competitive insights in three simple steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: "01",
                title: "Enter Your Business",
                description: "Provide your business name, website URL, and location to start the investigation."
              },
              {
                step: "02",
                title: "AI Analyzes Market",
                description: "JAKE discovers competitors, analyzes SEO, reviews, and online presence."
              },
              {
                step: "03",
                title: "Get Actionable Insights",
                description: "Receive detailed reports, recommendations, and auto-generated content."
              }
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="text-6xl font-bold text-primary/15 mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 right-0 translate-x-1/2">
                    <ArrowRight className="w-6 h-6 text-border" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center p-12 rounded-2xl bg-card border border-border shadow-medium">
            <Target className="w-12 h-12 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4 text-foreground">
              Ready to Investigate Your Market?
            </h2>
            <p className="text-muted-foreground mb-8">
              Start your competitive analysis today and discover opportunities to outperform your competitors.
            </p>
            <Button size="lg" className="shadow-soft" onClick={handleGetStarted}>
              Start Analysis
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-border bg-secondary/20">
        <div className="container">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Search className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">JAKE</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Competitive intelligence for local businesses
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
