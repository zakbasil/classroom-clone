import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, Key, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface StreamCodeDisplayProps {
  streamCode: string;
}

export function StreamCodeDisplay({ streamCode }: StreamCodeDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const inviteLink = `${window.location.origin}/join/${streamCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(streamCode);
      setCopied(true);
      toast.success('Stream code copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy stream code');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setLinkCopied(true);
      toast.success('Invite link copied to clipboard');
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast.error('Failed to copy invite link');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 bg-card border border-border rounded-xl p-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
          <Key className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">Stream Code</p>
          <p className="font-mono text-lg font-semibold text-foreground tracking-wider">
            {streamCode}
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleCopy}
          className="rounded-lg shrink-0"
        >
          {copied ? (
            <Check className="w-4 h-4 text-primary" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </Button>
      </div>
      
      <Button
        variant="outline"
        onClick={handleCopyLink}
        className="w-full flex items-center gap-2"
      >
        {linkCopied ? (
          <>
            <Check className="w-4 h-4 text-primary" />
            Link Copied!
          </>
        ) : (
          <>
            <Share2 className="w-4 h-4" />
            Copy Invite Link
          </>
        )}
      </Button>
    </div>
  );
}
