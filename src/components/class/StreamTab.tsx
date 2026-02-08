import { useApp } from '@/contexts/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MoreVertical, Paperclip, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';

interface StreamTabProps {
  classId: string;
}

export function StreamTab({ classId }: StreamTabProps) {
  const { currentRole, getAnnouncementsByClass, currentUser } = useApp();
  const announcements = getAnnouncementsByClass(classId);
  const [newAnnouncement, setNewAnnouncement] = useState('');

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      {/* Compose Announcement (Teacher only) */}
      {currentRole === 'teacher' && (
        <Card className="mb-6 shadow-card rounded-2xl overflow-hidden">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(currentUser.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder="Announce something to your class..."
                  value={newAnnouncement}
                  onChange={(e) => setNewAnnouncement(e.target.value)}
                  className="min-h-[80px] border-0 p-0 focus-visible:ring-0 resize-none text-base"
                />
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    <Paperclip className="w-4 h-4 mr-2" />
                    Attach
                  </Button>
                  <Button 
                    size="sm" 
                    className="rounded-xl gradient-primary"
                    disabled={!newAnnouncement.trim()}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Post
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Announcements Feed */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <Card className="shadow-card rounded-2xl">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No announcements yet</p>
            </CardContent>
          </Card>
        ) : (
          announcements.map((announcement) => (
            <Card key={announcement.id} className="shadow-card rounded-2xl overflow-hidden animate-fade-in">
              <CardContent className="p-4">
                {/* Author Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(announcement.authorName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{announcement.authorName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>

                {/* Content */}
                <p className="text-foreground whitespace-pre-wrap">{announcement.content}</p>

                {/* Attachments */}
                {announcement.attachments && announcement.attachments.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {announcement.attachments.map((attachment, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm"
                      >
                        <Paperclip className="w-4 h-4 text-muted-foreground" />
                        <span>{attachment.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Comments */}
                {announcement.comments && announcement.comments.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border space-y-3">
                    {announcement.comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                            {getInitials(comment.authorName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="font-medium text-sm">{comment.authorName}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm text-foreground mt-0.5">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Comment */}
                <div className="mt-4 pt-3 border-t border-border flex gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                      {getInitials(currentUser.name)}
                    </AvatarFallback>
                  </Avatar>
                  <input
                    type="text"
                    placeholder="Add class comment..."
                    className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
