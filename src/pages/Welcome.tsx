import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  ClipboardCheck, 
  BarChart3, 
  FolderOpen,
  ArrowRight
} from 'lucide-react';

const features = [
  {
    icon: BookOpen,
    title: 'Classes',
    description: 'Organize courses with streams, assignments, and materials all in one place.',
  },
  {
    icon: ClipboardCheck,
    title: 'Assignments',
    description: 'Create, distribute, and collect student work with due dates and attachments.',
  },
  {
    icon: BarChart3,
    title: 'Grading',
    description: 'Grade submissions, provide feedback, and track student progress effortlessly.',
  },
  {
    icon: FolderOpen,
    title: 'Materials',
    description: 'Share resources, documents, and links organized by topic.',
  },
];

export default function Welcome() {
  const navigate = useNavigate();
  const { setCurrentRole } = useApp();

  const handleExplore = (role: 'teacher' | 'student') => {
    setCurrentRole(role);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl gradient-primary shadow-soft">
            <GraduationCap className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold text-foreground">Classroom</span>
        </div>
      </header>

      {/* Hero Section */}
      <main className="px-6 pt-12 pb-20">
        <div className="max-w-7xl mx-auto">
          {/* Hero Content */}
          <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Teaching and learning,
              <span className="block gradient-primary bg-clip-text text-transparent">
                simplified.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              A collaborative platform that helps teachers and students connect, 
              organize coursework, and achieve more together.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => handleExplore('teacher')}
                className="h-14 px-8 text-base font-medium gradient-primary hover:opacity-90 transition-opacity shadow-soft rounded-2xl"
              >
                <Users className="w-5 h-5 mr-2" />
                Explore as Teacher
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => handleExplore('student')}
                className="h-14 px-8 text-base font-medium bg-card hover:bg-accent border-border shadow-soft rounded-2xl"
              >
                <GraduationCap className="w-5 h-5 mr-2" />
                Explore as Student
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={feature.title}
                className="bg-card border-border shadow-card hover:shadow-elevated transition-all duration-300 rounded-2xl overflow-hidden group animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Demo Note */}
          <div className="mt-16 text-center">
            <p className="text-sm text-muted-foreground">
              This is a demo prototype with sample data. 
              <span className="block mt-1">Switch between teacher and student views using the toggle in the header.</span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
