import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Plus, Megaphone, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { mockTeamMessages, TeamMessage } from '@/lib/team-mock-data';
import { toast } from '@/components/ui/sonner';
import { useAnnouncements } from '@/hooks/queries/use-announcements';
import { useCreateAnnouncement } from '@/hooks/mutations/use-announcements';
import { getApiErrorMessage } from '@/common/network/http-client';

const CommunicationsTab = () => {
  const [messages, setMessages] = useState<TeamMessage[]>(mockTeamMessages);
  const [chatInput, setChatInput] = useState('');
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [annForm, setAnnForm] = useState({ title: '', description: '' });

  const { data: announcementsData, isLoading: announcementsLoading } = useAnnouncements();
  const createAnnouncement = useCreateAnnouncement();

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const msg: TeamMessage = {
      id: `tm${Date.now()}`,
      sender: 'Business Owner',
      senderInitials: 'BO',
      content: chatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, msg]);
    setChatInput('');
  };

  const handleCreateAnnouncement = () => {
    if (!annForm.title.trim()) {
      toast.error('Title is required.');
      return;
    }
    if (!annForm.description.trim()) {
      toast.error('Description is required.');
      return;
    }
    createAnnouncement.mutate(
      { title: annForm.title.trim(), description: annForm.description.trim() },
      {
        onSuccess: () => {
          setAnnForm({ title: '', description: '' });
          setShowAnnouncement(false);
          toast.success('Announcement posted!');
        },
        onError: (err) => {
          toast.error(getApiErrorMessage(err));
        },
      }
    );
  };

  const announcementList = announcementsData?.data ?? [];

  return (
    <div className='mt-4 grid gap-6 lg:grid-cols-2'>
      {/* Team Chat */}
      <Card className='flex h-[420px] flex-col sm:h-[500px]'>
        <CardHeader className='pb-3'>
          <CardTitle className='text-base'>Team Chat</CardTitle>
        </CardHeader>
        <CardContent className='flex flex-1 flex-col overflow-hidden p-4 pt-0'>
          <div className='flex-1 space-y-3 overflow-y-auto pr-1'>
            {messages.map((msg) => {
              const isOwner = msg.sender === 'Business Owner';
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-start gap-2 ${isOwner ? 'flex-row-reverse' : ''}`}
                >
                  <Avatar className='h-7 w-7 shrink-0'>
                    <AvatarFallback className='bg-muted text-[9px] font-bold'>
                      {msg.senderInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
                      isOwner ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}
                  >
                    {!isOwner && (
                      <p className='mb-0.5 text-[10px] font-semibold opacity-70'>{msg.sender}</p>
                    )}
                    <p>{msg.content}</p>
                    <p
                      className={`mt-1 text-[9px] ${
                        isOwner ? 'text-primary-foreground/75' : 'text-muted-foreground'
                      }`}
                    >
                      {msg.time}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
          <div className='mt-3 flex gap-2'>
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendChat()}
              placeholder='Type a message...'
              className='h-9 text-sm'
            />
            <Button size='sm' className='h-9 shrink-0 gap-1' onClick={sendChat}>
              <Send size={14} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Announcements */}
      <div className='space-y-4'>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
          <h3 className='font-display text-base font-semibold'>Announcements</h3>
          <Button
            size='sm'
            variant='outline'
            className='w-full gap-1.5 sm:w-auto'
            onClick={() => setShowAnnouncement(true)}
          >
            <Plus size={14} /> New Announcement
          </Button>
        </div>
        <div className='space-y-3'>
          {announcementsLoading ? (
            <div className='flex items-center justify-center py-8'>
              <Loader2 size={20} className='animate-spin text-muted-foreground' />
            </div>
          ) : announcementList.length === 0 ? (
            <p className='py-8 text-center text-sm text-muted-foreground'>No announcements yet.</p>
          ) : (
            announcementList.map((ann, i) => (
              <motion.div
                key={ann._id ?? `ann-${i}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card>
                  <CardContent className='p-4'>
                    <div className='flex items-start gap-3'>
                      <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10'>
                        <Megaphone size={14} className='text-primary' />
                      </div>
                      <div className='flex-1'>
                        <div className='flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between'>
                          <p className='text-sm font-semibold'>{ann.title}</p>
                          <span className='text-[10px] text-muted-foreground'>
                            {new Date(ann.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className='mt-1 text-sm text-muted-foreground'>{ann.description}</p>
                        <p className='mt-2 text-[10px] text-muted-foreground'>
                          — {ann.authorName}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Create Announcement Dialog */}
      <Dialog open={showAnnouncement} onOpenChange={setShowAnnouncement}>
        <DialogContent className='max-h-[90dvh] overflow-y-auto sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>New Announcement</DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <Label>Title *</Label>
              <Input
                value={annForm.title}
                onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })}
                placeholder='Announcement title'
                maxLength={200}
              />
            </div>
            <div>
              <Label>Description *</Label>
              <Textarea
                value={annForm.description}
                onChange={(e) => setAnnForm({ ...annForm, description: e.target.value })}
                placeholder='Details...'
                rows={4}
                maxLength={5000}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setShowAnnouncement(false)}
              disabled={createAnnouncement.isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateAnnouncement} disabled={createAnnouncement.isPending}>
              {createAnnouncement.isPending && <Loader2 size={14} className='mr-1.5 animate-spin' />}
              Post Announcement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommunicationsTab;
