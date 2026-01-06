import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, 
  Send,
  Search,
  Phone,
  Mail,
  Instagram,
  PhoneCall,
  Paperclip,
  MoreVertical,
  Circle,
  CheckCheck
} from 'lucide-react';
import { supabase } from '@/lib/externalSupabase';

interface Message {
  id: string;
  lead_id: string;
  channel: string;
  direction: string;
  content: string;
  status: string;
  sent_at: string;
  read_at: string | null;
}

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
}

interface OmnichannelInboxProps {
  projectId: string;
}

// Telegram icon component
const TelegramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

// WhatsApp icon component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const channelIcons: Record<string, React.ReactNode> = {
  whatsapp: <WhatsAppIcon className="w-4 h-4" />,
  telegram: <TelegramIcon className="w-4 h-4" />,
  instagram: <Instagram className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
  phone: <PhoneCall className="w-4 h-4" />,
  sms: <Phone className="w-4 h-4" />,
};

const channelColors: Record<string, string> = {
  whatsapp: 'bg-green-500',
  telegram: 'bg-blue-500',
  instagram: 'bg-pink-500',
  email: 'bg-purple-500',
  phone: 'bg-orange-500',
  sms: 'bg-yellow-500',
};

export const OmnichannelInbox = ({ projectId }: OmnichannelInboxProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      // Fetch leads
      const { data: leadsData } = await supabase
        .from('leads')
        .select('id, name, phone, email')
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false })
        .limit(50);

      setLeads(leadsData || []);

      // Fetch messages
      const { data: messagesData } = await supabase
        .from('inbox_messages')
        .select('*')
        .eq('project_id', projectId)
        .order('sent_at', { ascending: false });

      setMessages(messagesData || []);

      if (leadsData && leadsData.length > 0) {
        setSelectedLead(leadsData[0]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedLead) return;
    
    // In a real app, this would integrate with messaging APIs
    setNewMessage('');
  };

  const filteredLeads = leads.filter(lead => 
    lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.phone?.includes(searchQuery) ||
    lead.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const leadMessages = messages.filter(m => m.lead_id === selectedLead?.id);
  
  // Group conversations by lead
  const conversationsByLead = leads.map(lead => {
    const leadMsgs = messages.filter(m => m.lead_id === lead.id);
    const lastMessage = leadMsgs[0];
    const unreadCount = leadMsgs.filter(m => m.direction === 'inbound' && !m.read_at).length;
    return { lead, lastMessage, unreadCount };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-primary" />
            Omnichannel Inbox
          </h2>
          <p className="text-muted-foreground">Единый центр коммуникаций</p>
        </div>
        <div className="flex gap-2">
          {Object.entries(channelIcons).map(([channel, icon]) => (
            <Button key={channel} variant="outline" size="icon" className="relative">
              <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${channelColors[channel]}`} />
              {icon}
            </Button>
          ))}
        </div>
      </div>

      {/* Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Поиск диалогов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {loading ? (
                <div className="p-4 text-center text-muted-foreground">Загрузка...</div>
              ) : conversationsByLead.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">Нет диалогов</div>
              ) : (
                conversationsByLead
                  .filter(c => filteredLeads.some(l => l.id === c.lead.id))
                  .map(({ lead, lastMessage, unreadCount }) => (
                    <div
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className={`flex items-center gap-3 p-4 cursor-pointer border-b border-border hover:bg-muted/50 transition-colors ${
                        selectedLead?.id === lead.id ? 'bg-muted' : ''
                      }`}
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {lead.name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        {lastMessage && (
                          <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white ${channelColors[lastMessage.channel] || 'bg-gray-500'}`}>
                            {channelIcons[lastMessage.channel]}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">{lead.name || 'Без имени'}</p>
                          {lastMessage && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(lastMessage.sent_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground truncate">
                            {lastMessage?.content || 'Нет сообщений'}
                          </p>
                          {unreadCount > 0 && (
                            <Badge className="ml-2 bg-primary">{unreadCount}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Window */}
        <Card className="lg:col-span-2 flex flex-col">
          {selectedLead ? (
            <>
              {/* Chat Header */}
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {selectedLead.name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{selectedLead.name || 'Без имени'}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Circle className="w-2 h-2 fill-green-500 text-green-500" />
                        Онлайн
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon">
                      <PhoneCall className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 p-4 overflow-hidden">
                <ScrollArea className="h-[380px] pr-4">
                  {leadMessages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      Начните диалог с клиентом
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {[...leadMessages].reverse().map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                            msg.direction === 'outbound' 
                              ? 'bg-primary text-primary-foreground rounded-br-md' 
                              : 'bg-muted rounded-bl-md'
                          }`}>
                            <p className="text-sm">{msg.content}</p>
                            <div className={`flex items-center gap-1 mt-1 ${
                              msg.direction === 'outbound' ? 'justify-end' : 'justify-start'
                            }`}>
                              <span className="text-xs opacity-70">
                                {new Date(msg.sent_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {msg.direction === 'outbound' && (
                                <CheckCheck className={`w-3 h-3 ${msg.read_at ? 'text-blue-400' : 'opacity-70'}`} />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon">
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Input
                    placeholder="Введите сообщение..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center text-muted-foreground">
              Выберите диалог для просмотра
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};
