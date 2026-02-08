-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create classes table
CREATE TABLE public.classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  section TEXT,
  subject TEXT,
  room TEXT,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cover_color TEXT NOT NULL DEFAULT 'bg-primary',
  stream_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create enrollments table (students joining classes)
CREATE TABLE public.enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, class_id)
);

-- Create assignments table
CREATE TABLE public.assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  points INTEGER NOT NULL DEFAULT 100,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  topic TEXT,
  type TEXT NOT NULL DEFAULT 'assignment' CHECK (type IN ('assignment', 'quiz', 'questions')),
  quiz_id UUID,
  question_set_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quizzes table
CREATE TABLE public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  topic TEXT,
  questions JSONB NOT NULL DEFAULT '[]',
  total_points INTEGER NOT NULL DEFAULT 0,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  require_fullscreen BOOLEAN NOT NULL DEFAULT false,
  time_limit INTEGER, -- in minutes
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create question_sets table
CREATE TABLE public.question_sets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  topic TEXT,
  questions JSONB NOT NULL DEFAULT '[]',
  total_points INTEGER NOT NULL DEFAULT 0,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create materials table
CREATE TABLE public.materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  topic TEXT,
  attachments JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create announcements table
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachments JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz_submissions table
CREATE TABLE public.quiz_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}',
  score INTEGER NOT NULL DEFAULT 0,
  time_taken INTEGER, -- in minutes
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(quiz_id, user_id)
);

-- Create question_set_submissions table
CREATE TABLE public.question_set_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_set_id UUID NOT NULL REFERENCES public.question_sets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}',
  score INTEGER,
  time_taken INTEGER,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(question_set_id, user_id)
);

-- Add foreign keys to assignments
ALTER TABLE public.assignments 
  ADD CONSTRAINT fk_assignments_quiz FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_assignments_question_set FOREIGN KEY (question_set_id) REFERENCES public.question_sets(id) ON DELETE SET NULL;

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_set_submissions ENABLE ROW LEVEL SECURITY;

-- Create helper function to check if user is class member (creator or enrolled)
CREATE OR REPLACE FUNCTION public.is_class_member(class_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classes c WHERE c.id = class_id AND c.creator_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.enrollments e WHERE e.class_id = class_id AND e.user_id = auth.uid()
  );
$$;

-- Create helper function to check if user is class creator
CREATE OR REPLACE FUNCTION public.is_class_creator(class_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classes c WHERE c.id = class_id AND c.creator_id = auth.uid()
  );
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Allow viewing profiles of class members
CREATE POLICY "Users can view profiles of classmates" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e1
      JOIN public.enrollments e2 ON e1.class_id = e2.class_id
      WHERE e1.user_id = auth.uid() AND e2.user_id = profiles.user_id
    )
    OR EXISTS (
      SELECT 1 FROM public.classes c
      JOIN public.enrollments e ON c.id = e.class_id
      WHERE c.creator_id = auth.uid() AND e.user_id = profiles.user_id
    )
    OR EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.creator_id = profiles.user_id AND public.is_class_member(c.id)
    )
  );

-- Classes policies
CREATE POLICY "Users can view classes they're members of" ON public.classes
  FOR SELECT USING (public.is_class_member(id));

CREATE POLICY "Authenticated users can create classes" ON public.classes
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their classes" ON public.classes
  FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "Creators can delete their classes" ON public.classes
  FOR DELETE USING (creator_id = auth.uid());

-- Allow reading class by stream code for joining
CREATE POLICY "Anyone can lookup class by stream code" ON public.classes
  FOR SELECT USING (true);

-- Enrollments policies
CREATE POLICY "Users can view enrollments in their classes" ON public.enrollments
  FOR SELECT USING (public.is_class_member(class_id));

CREATE POLICY "Users can enroll themselves" ON public.enrollments
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave classes" ON public.enrollments
  FOR DELETE USING (user_id = auth.uid());

-- Assignments policies
CREATE POLICY "Class members can view assignments" ON public.assignments
  FOR SELECT USING (public.is_class_member(class_id));

CREATE POLICY "Class creators can manage assignments" ON public.assignments
  FOR ALL USING (public.is_class_creator(class_id));

-- Quizzes policies
CREATE POLICY "Class members can view quizzes" ON public.quizzes
  FOR SELECT USING (public.is_class_member(class_id));

CREATE POLICY "Class creators can manage quizzes" ON public.quizzes
  FOR ALL USING (public.is_class_creator(class_id));

-- Question sets policies
CREATE POLICY "Class members can view question sets" ON public.question_sets
  FOR SELECT USING (public.is_class_member(class_id));

CREATE POLICY "Class creators can manage question sets" ON public.question_sets
  FOR ALL USING (public.is_class_creator(class_id));

-- Materials policies
CREATE POLICY "Class members can view materials" ON public.materials
  FOR SELECT USING (public.is_class_member(class_id));

CREATE POLICY "Class creators can manage materials" ON public.materials
  FOR ALL USING (public.is_class_creator(class_id));

-- Announcements policies
CREATE POLICY "Class members can view announcements" ON public.announcements
  FOR SELECT USING (public.is_class_member(class_id));

CREATE POLICY "Class members can create announcements" ON public.announcements
  FOR INSERT WITH CHECK (public.is_class_member(class_id) AND author_id = auth.uid());

CREATE POLICY "Authors can update their announcements" ON public.announcements
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Authors and creators can delete announcements" ON public.announcements
  FOR DELETE USING (author_id = auth.uid() OR public.is_class_creator(class_id));

-- Quiz submissions policies
CREATE POLICY "Users can view their own quiz submissions" ON public.quiz_submissions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Class creators can view all quiz submissions" ON public.quiz_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      WHERE q.id = quiz_submissions.quiz_id AND public.is_class_creator(q.class_id)
    )
  );

CREATE POLICY "Users can submit their own quiz answers" ON public.quiz_submissions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own submissions" ON public.quiz_submissions
  FOR UPDATE USING (user_id = auth.uid());

-- Question set submissions policies
CREATE POLICY "Users can view their own question set submissions" ON public.question_set_submissions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Class creators can view all question set submissions" ON public.question_set_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.question_sets qs
      WHERE qs.id = question_set_submissions.question_set_id AND public.is_class_creator(qs.class_id)
    )
  );

CREATE POLICY "Users can submit their own question set answers" ON public.question_set_submissions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own question set submissions" ON public.question_set_submissions
  FOR UPDATE USING (user_id = auth.uid());

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON public.quizzes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_question_sets_updated_at BEFORE UPDATE ON public.question_sets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON public.materials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_classes_creator ON public.classes(creator_id);
CREATE INDEX idx_classes_stream_code ON public.classes(stream_code);
CREATE INDEX idx_enrollments_user ON public.enrollments(user_id);
CREATE INDEX idx_enrollments_class ON public.enrollments(class_id);
CREATE INDEX idx_assignments_class ON public.assignments(class_id);
CREATE INDEX idx_quizzes_class ON public.quizzes(class_id);
CREATE INDEX idx_question_sets_class ON public.question_sets(class_id);
CREATE INDEX idx_materials_class ON public.materials(class_id);
CREATE INDEX idx_announcements_class ON public.announcements(class_id);
CREATE INDEX idx_quiz_submissions_quiz ON public.quiz_submissions(quiz_id);
CREATE INDEX idx_quiz_submissions_user ON public.quiz_submissions(user_id);
CREATE INDEX idx_question_set_submissions_qs ON public.question_set_submissions(question_set_id);
CREATE INDEX idx_question_set_submissions_user ON public.question_set_submissions(user_id);