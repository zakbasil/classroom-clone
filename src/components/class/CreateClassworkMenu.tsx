import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, FileQuestion, ClipboardList, FileText } from 'lucide-react';
import { CreateQuizDialog } from './CreateQuizDialog';
import { CreateQuestionsDialog } from './CreateQuestionsDialog';
import { CreateMaterialDialog } from './CreateMaterialDialog';

interface CreateClassworkMenuProps {
  classId: string;
}

export function CreateClassworkMenu({ classId }: CreateClassworkMenuProps) {
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [questionsDialogOpen, setQuestionsDialogOpen] = useState(false);
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="rounded-xl gradient-primary shadow-soft">
            <Plus className="w-4 h-4 mr-2" />
            Create
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem onClick={() => setQuizDialogOpen(true)} className="cursor-pointer">
            <ClipboardList className="w-4 h-4 mr-2" />
            Quiz
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setQuestionsDialogOpen(true)} className="cursor-pointer">
            <FileQuestion className="w-4 h-4 mr-2" />
            Questions
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setMaterialDialogOpen(true)} className="cursor-pointer">
            <FileText className="w-4 h-4 mr-2" />
            Material
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateQuizDialog 
        classId={classId} 
        open={quizDialogOpen} 
        onOpenChange={setQuizDialogOpen} 
      />
      <CreateQuestionsDialog 
        classId={classId} 
        open={questionsDialogOpen} 
        onOpenChange={setQuestionsDialogOpen} 
      />
      <CreateMaterialDialog 
        classId={classId} 
        open={materialDialogOpen} 
        onOpenChange={setMaterialDialogOpen} 
      />
    </>
  );
}
