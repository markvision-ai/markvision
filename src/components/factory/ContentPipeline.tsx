import { ContentItem } from '@/hooks/useContentFactory';
import { ContentCard } from './ContentCard';

interface ContentPipelineProps {
  content: ContentItem[];
  onUpdate: (id: string, data: Partial<ContentItem>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  triggerVoice: (contentId: string, script: string, voiceSettings?: Record<string, unknown>) => Promise<boolean>;
  triggerAvatar: (contentId: string, audioUrl: string, avatarId?: string) => Promise<boolean>;
  triggerAiVideo: (contentId: string, script: string, style?: string) => Promise<boolean>;
  triggerEdit: (contentId: string, videoUrl: string, captionsStyle?: string) => Promise<boolean>;
  triggerPublish: (contentId: string, finalVideoUrl: string, caption: string, platforms: string[]) => Promise<boolean>;
}

export const ContentPipeline = ({
  content,
  onUpdate,
  onDelete,
  triggerVoice,
  triggerAvatar,
  triggerAiVideo,
  triggerEdit,
  triggerPublish,
}: ContentPipelineProps) => {
  if (content.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <span className="text-2xl">📦</span>
        </div>
        <h3 className="text-lg font-semibold mb-2">Нет контента</h3>
        <p className="text-muted-foreground max-w-sm">
          Создайте первый элемент контента, чтобы начать работу с производственной линией
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {content.map((item) => (
        <ContentCard
          key={item.id}
          item={item}
          onUpdate={onUpdate}
          onDelete={onDelete}
          triggerVoice={triggerVoice}
          triggerAvatar={triggerAvatar}
          triggerAiVideo={triggerAiVideo}
          triggerEdit={triggerEdit}
          triggerPublish={triggerPublish}
        />
      ))}
    </div>
  );
};
