import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Trash2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import {
  getSchedules,
  createSchedule,
  deleteSchedule,
  getAdminUsers,
  type TeacherSchedule,
  type AdminUser,
} from '@/lib/database';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function AdminSchedulesTab() {
  const [schedules, setSchedules] = useState<TeacherSchedule[]>([]);
  const [teachers, setTeachers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState({
    teacherId: '',
    className: '',
    section: '',
    subject: '',
    room: '',
    dayOfWeek: 'Monday',
    startTime: '09:00',
    endTime: '10:00',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [schedulesData, usersData] = await Promise.all([
        getSchedules(),
        getAdminUsers(),
      ]);
      setSchedules(schedulesData);
      setTeachers(usersData.filter(u => u.role === 'Teacher' || u.role === 'Admin'));
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load schedules');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.teacherId || !formData.className) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsCreating(true);
    try {
      await createSchedule({
        teacherId: formData.teacherId,
        className: formData.className,
        section: formData.section || undefined,
        subject: formData.subject || undefined,
        room: formData.room || undefined,
        dayOfWeek: formData.dayOfWeek,
        startTime: formData.startTime,
        endTime: formData.endTime,
      });
      toast.success('Schedule created and class created automatically');
      setIsDialogOpen(false);
      setFormData({
        teacherId: '',
        className: '',
        section: '',
        subject: '',
        room: '',
        dayOfWeek: 'Monday',
        startTime: '09:00',
        endTime: '10:00',
      });
      loadData();
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast.error('Failed to create schedule');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    try {
      await deleteSchedule(scheduleId);
      toast.success('Schedule deleted');
      loadData();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Failed to delete schedule');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Teacher Schedules</h2>
          <p className="text-sm text-muted-foreground">
            Allocate schedules and automatically create classes for teachers
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Teacher Schedule</DialogTitle>
              <DialogDescription>
                This will create a schedule and automatically create a class for the teacher.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Teacher *</Label>
                <Select
                  value={formData.teacherId}
                  onValueChange={(value) => setFormData({ ...formData, teacherId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.userId} value={teacher.userId}>
                        {teacher.name} ({teacher.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Class Name *</Label>
                  <Input
                    value={formData.className}
                    onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                    placeholder="e.g., Mathematics 101"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Input
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    placeholder="e.g., A"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g., Mathematics"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Room</Label>
                  <Input
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    placeholder="e.g., Room 101"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Day of Week *</Label>
                  <Select
                    value={formData.dayOfWeek}
                    onValueChange={(value) => setFormData({ ...formData, dayOfWeek: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map((day) => (
                        <SelectItem key={day} value={day}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Start Time *</Label>
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time *</Label>
                  <Input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Schedule'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Schedules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">{schedule.className}</p>
                      <p className="text-sm text-muted-foreground">
                        {schedule.teacherName} • {schedule.dayOfWeek} • {schedule.startTime} - {schedule.endTime}
                        {schedule.room && ` • ${schedule.room}`}
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(schedule.id)}
                  className="flex items-center gap-2 text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>
            ))}
            {schedules.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No schedules found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
