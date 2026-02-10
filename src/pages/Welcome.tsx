import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  GraduationCap, 
  BookOpen, 
  ClipboardCheck, 
  BarChart3, 
  Users,
  FileText,
  MessageSquare,
  Calendar,
  Award,
  Zap,
  Shield,
  ArrowRight,
  LogIn,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

const features = [
  {
    icon: BookOpen,
    title: 'Organized Classes',
    description: 'Create and manage classes with ease. Organize coursework, share materials, and keep everything in one place.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: ClipboardCheck,
    title: 'Smart Assignments',
    description: 'Create assignments, quizzes, and question sets with automatic grading and progress tracking.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Insights',
    description: 'Track student progress, view submission statistics, and gain insights into class performance.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Users,
    title: 'Collaboration',
    description: 'Foster collaboration with announcements, discussions, and seamless communication between teachers and students.',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: FileText,
    title: 'Resource Library',
    description: 'Share materials, documents, and resources organized by topic for easy access and reference.',
    color: 'from-teal-500 to-cyan-500',
  },
  {
    icon: Award,
    title: 'Achievement Tracking',
    description: 'Recognize student achievements and track progress with comprehensive grading and feedback systems.',
    color: 'from-indigo-500 to-purple-500',
  },
];

const benefits = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Built for performance with instant loading and smooth interactions.',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your data is protected with enterprise-grade security and privacy controls.',
  },
  {
    icon: Sparkles,
    title: 'Modern Interface',
    description: 'Beautiful, intuitive design that makes teaching and learning enjoyable.',
  },
];

export default function Welcome() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-amber-50/20 to-yellow-50/20 dark:from-background dark:via-amber-950/10 dark:to-yellow-950/10">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/95 border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 shadow-lg shadow-amber-500/30 dark:shadow-amber-500/50">
                <GraduationCap className="w-7 h-7 text-black dark:text-white" />
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 dark:from-amber-400 dark:via-yellow-400 dark:to-amber-500 bg-clip-text text-transparent">
                  iSkew PlayGround
                </span>
                <p className="text-xs text-muted-foreground -mt-1">Learning Platform</p>
              </div>
            </div>
            {user ? (
              <Button 
                onClick={() => navigate('/dashboard')} 
                className="rounded-xl shadow-md hover:shadow-lg transition-all bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black dark:text-black"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={() => navigate('/auth')} 
                variant="outline"
                className="rounded-xl border-amber-200 hover:border-amber-300 hover:bg-amber-50 dark:border-amber-800 dark:hover:border-amber-700 dark:hover:bg-amber-950"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 px-6">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-200/50 dark:from-amber-900/30 dark:to-yellow-900/30 dark:border-amber-800/50 mb-8 animate-fade-in">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-medium bg-gradient-to-r from-amber-600 to-yellow-600 dark:from-amber-400 dark:to-yellow-400 bg-clip-text text-transparent">Transform Your Learning Experience</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight animate-fade-in" style={{ animationDelay: '100ms' }}>
              Welcome to
              <span className="block mt-2 bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 dark:from-amber-400 dark:via-yellow-400 dark:to-amber-500 bg-clip-text text-transparent">
                iSkew PlayGround
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-3xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '200ms' }}>
              Your comprehensive learning platform designed for modern education.
            </p>
            <p className="text-lg text-muted-foreground/80 mb-12 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '300ms' }}>
              Streamline assignments, foster collaboration, and track progress—all in one intuitive platform.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in" style={{ animationDelay: '400ms' }}>
              {user ? (
                  <Button
                    size="lg"
                    onClick={() => navigate('/dashboard')}
                    className="h-14 px-8 text-base font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black dark:text-black"
                  >
                    <GraduationCap className="w-5 h-5 mr-2" />
                    Go to Dashboard
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    onClick={() => navigate('/auth')}
                    className="h-14 px-8 text-base font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black dark:text-black"
                  >
                    <GraduationCap className="w-5 h-5 mr-2" />
                    Get Started Free
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => navigate('/auth')}
                    className="h-14 px-8 text-base font-semibold rounded-2xl border-2 border-amber-200 hover:border-amber-300 hover:bg-amber-50 dark:border-amber-800 dark:hover:border-amber-700 dark:hover:bg-amber-950"
                  >
                    Sign In
                  </Button>
                </>
              )}
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '500ms' }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <span>Free to start</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <span>Setup in minutes</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-card/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Everything You Need to
              <span className="block bg-gradient-to-r from-amber-600 to-yellow-600 dark:from-amber-400 dark:to-yellow-400 bg-clip-text text-transparent mt-2">Teach & Learn</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to make learning management effortless and education engaging.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={feature.title}
                className="group border-2 hover:border-amber-300 dark:hover:border-amber-700 transition-all duration-300 rounded-2xl overflow-hidden bg-card hover:shadow-elevated hover:scale-[1.02]"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-8">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div 
                key={benefit.title}
                className="text-center p-8 rounded-2xl bg-gradient-to-br from-card to-amber-50/30 dark:to-amber-950/20 border border-border/50 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-lg transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/50 dark:to-yellow-900/50 flex items-center justify-center mx-auto mb-6">
                  <benefit.icon className="w-8 h-8 bg-gradient-to-r from-amber-600 to-yellow-600 dark:from-amber-400 dark:to-yellow-400 bg-clip-text text-transparent" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">
                  {benefit.title}
                </h3>
                <p className="text-muted-foreground">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-br from-amber-50/50 via-yellow-50/30 to-background dark:from-amber-950/20 dark:via-yellow-950/10 dark:to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Ready to Transform Your Learning Experience?
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join educators and students who are already experiencing the future of education.
          </p>
          {!user && (
            <Button
              size="lg"
              onClick={() => navigate('/auth')}
              className="h-16 px-10 text-lg font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black dark:text-black"
            >
              <GraduationCap className="w-6 h-6 mr-2" />
              Start Free Today
              <ArrowRight className="w-6 h-6 ml-2" />
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 shadow-md">
                <GraduationCap className="w-6 h-6 text-black dark:text-white" />
              </div>
              <span className="text-lg font-semibold bg-gradient-to-r from-amber-600 to-yellow-600 dark:from-amber-400 dark:to-yellow-400 bg-clip-text text-transparent">iSkew PlayGround</span>
            </div>
            <p className="text-sm text-muted-foreground text-center md:text-right">
              © {new Date().getFullYear()} iSkew PlayGround. Built for modern education.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
