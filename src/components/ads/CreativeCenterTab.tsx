import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Upload, 
  Image as ImageIcon, 
  Video, 
  Sparkles, 
  Wand2, 
  Loader2,
  Trash2,
  Play,
  Copy,
  Check
} from 'lucide-react';
import { AdAsset, useAdAssets } from '@/hooks/useAdAssets';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreativeCenterTabProps {
  projectId: string | null;
}

const platformAspectRatios: Record<string, string[]> = {
  facebook: ['1:1', '4:5', '16:9'],
  tiktok: ['9:16'],
  google: ['1:1', '16:9', '4:5'],
  all: ['1:1', '4:5', '9:16', '16:9'],
};

export const CreativeCenterTab = ({ projectId }: CreativeCenterTabProps) => {
  const { assets, loading, createAsset, deleteAsset } = useAdAssets(projectId);
  const [platform, setPlatform] = useState<'facebook' | 'tiktok' | 'google'>('facebook');
  const [productDescription, setProductDescription] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<{
    headlines: string[];
    descriptions: string[];
    primaryText: string;
    hashtags: string[];
  } | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    // В реальном приложении здесь будет загрузка в Supabase Storage
    for (const file of Array.from(files)) {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (!isImage && !isVideo) {
        toast.error(`${file.name} не является изображением или видео`);
        continue;
      }

      // Mock URL - в реальном приложении это будет URL из Storage
      const mockUrl = URL.createObjectURL(file);
      
      if (projectId) {
        await createAsset({
          project_id: projectId,
          campaign_id: null,
          asset_type: isImage ? 'image' : 'video',
          file_url: mockUrl,
          file_name: file.name,
          aspect_ratio: null,
          platform: platform,
          ai_headlines: [],
          ai_descriptions: [],
          ai_primary_text: null,
          ai_hashtags: null,
          ai_score: Math.floor(Math.random() * 30) + 70, // Mock score
          status: 'draft',
        });
      }
    }
  };

  const generateContent = async () => {
    if (!productDescription.trim()) {
      toast.error('Введите описание продукта');
      return;
    }

    setGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-ad-copy', {
        body: {
          platform,
          productDescription: productDescription.trim(),
          language: 'ru',
        },
      });

      if (error) {
        throw error;
      }

      if (data?.content) {
        setGeneratedContent({
          headlines: data.content.headlines || [],
          descriptions: data.content.descriptions || [],
          primaryText: data.content.primaryText || '',
          hashtags: data.content.hashtags || [],
        });
        toast.success('Контент сгенерирован!');
      } else {
        throw new Error('No content in response');
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      if (error.message?.includes('429')) {
        toast.error('Превышен лимит запросов. Попробуйте позже.');
      } else if (error.message?.includes('402')) {
        toast.error('Закончились кредиты API.');
      } else {
        toast.error('Ошибка генерации. Попробуйте снова.');
      }
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast.success('Скопировано!');
  };

  const getAIScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="space-y-6">
      {/* Platform Selector */}
      <Tabs value={platform} onValueChange={(v) => setPlatform(v as any)}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="facebook" className="gap-2">
            <div className="w-4 h-4 bg-[#1877F2] rounded text-[10px] text-white font-bold flex items-center justify-center">f</div>
            Facebook / Instagram
          </TabsTrigger>
          <TabsTrigger value="google" className="gap-2">
            <div className="w-4 h-4 bg-[#EA4335] rounded text-[10px] text-white font-bold flex items-center justify-center">G</div>
            Google Ads
          </TabsTrigger>
          <TabsTrigger value="tiktok" className="gap-2">
            <div className="w-4 h-4 bg-foreground rounded text-[10px] text-background font-bold flex items-center justify-center">T</div>
            TikTok
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Media Uploader */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload className="w-4 h-4" />
              Загрузка медиа
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Drag & Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-muted-foreground'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-muted rounded-full">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Перетащите файлы сюда</p>
                  <p className="text-sm text-muted-foreground">
                    или <label className="text-primary cursor-pointer hover:underline">
                      выберите файлы
                      <input
                        type="file"
                        className="hidden"
                        multiple
                        accept="image/*,video/*"
                        onChange={(e) => e.target.files && handleFiles(e.target.files)}
                      />
                    </label>
                  </p>
                </div>
                <div className="flex gap-2">
                  {platformAspectRatios[platform].map(ratio => (
                    <Badge key={ratio} variant="secondary" className="text-xs">
                      {ratio}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Asset Library */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Библиотека креативов</h4>
              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : assets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Нет загруженных креативов
                </p>
              ) : (
                <ScrollArea className="h-[200px]">
                  <div className="grid grid-cols-3 gap-2">
                    {assets.map(asset => (
                      <div
                        key={asset.id}
                        className="relative group aspect-square bg-muted rounded-lg overflow-hidden"
                      >
                        {asset.asset_type === 'image' ? (
                          <img
                            src={asset.file_url}
                            alt={asset.file_name || 'Asset'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-black/50">
                            <Play className="w-8 h-8 text-white" />
                          </div>
                        )}
                        
                        {/* AI Score */}
                        {asset.ai_score && (
                          <div className={`absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 rounded text-xs font-bold ${getAIScoreColor(asset.ai_score)}`}>
                            {asset.ai_score}
                          </div>
                        )}
                        
                        {/* Type badge */}
                        <div className="absolute top-1 right-1">
                          {asset.asset_type === 'image' ? (
                            <ImageIcon className="w-4 h-4 text-white drop-shadow" />
                          ) : (
                            <Video className="w-4 h-4 text-white drop-shadow" />
                          )}
                        </div>
                        
                        {/* Delete button */}
                        <button
                          onClick={() => deleteAsset(asset.id)}
                          className="absolute bottom-1 right-1 p-1 bg-destructive/80 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI Copywriter */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wand2 className="w-4 h-4 text-primary" />
              Quantom Copywriter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Опишите ваш продукт/услугу</Label>
              <Textarea
                placeholder="Например: Онлайн-курс по маркетингу для начинающих предпринимателей..."
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                rows={3}
              />
            </div>

            <Button
              className="w-full gap-2"
              onClick={generateContent}
              disabled={generating}
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Сгенерировать для {platform === 'facebook' ? 'Facebook' : platform === 'google' ? 'Google' : 'TikTok'}
            </Button>

            {/* Generated Content */}
            {generatedContent && (
              <ScrollArea className="h-[280px] border border-border rounded-lg p-4">
                <div className="space-y-4">
                  {/* Headlines */}
                  {generatedContent.headlines.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {platform === 'google' ? '15 заголовков' : 'Заголовки'}
                        </Badge>
                      </h4>
                      {generatedContent.headlines.map((headline, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2 bg-muted/50 rounded-lg group"
                        >
                          <span className="text-sm">{headline}</span>
                          <button
                            onClick={() => copyToClipboard(headline, `h-${i}`)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                          {copiedIndex === `h-${i}` ? (
                            <Check className="w-4 h-4 text-success" />
                          ) : (
                              <Copy className="w-4 h-4 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Descriptions */}
                  {generatedContent.descriptions.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">
                        <Badge variant="outline" className="text-xs">Описания</Badge>
                      </h4>
                      {generatedContent.descriptions.map((desc, i) => (
                        <div
                          key={i}
                          className="flex items-start justify-between p-2 bg-muted/50 rounded-lg group"
                        >
                          <span className="text-sm">{desc}</span>
                          <button
                            onClick={() => copyToClipboard(desc, `d-${i}`)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                          >
                          {copiedIndex === `d-${i}` ? (
                            <Check className="w-4 h-4 text-success" />
                          ) : (
                              <Copy className="w-4 h-4 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Primary Text */}
                  {generatedContent.primaryText && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">
                        <Badge variant="outline" className="text-xs">Основной текст</Badge>
                      </h4>
                      <div className="p-3 bg-muted/50 rounded-lg group relative">
                        <pre className="text-sm whitespace-pre-wrap font-sans">
                          {generatedContent.primaryText}
                        </pre>
                        <button
                          onClick={() => copyToClipboard(generatedContent.primaryText, 'primary')}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {copiedIndex === 'primary' ? (
                            <Check className="w-4 h-4 text-success" />
                          ) : (
                            <Copy className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Hashtags */}
                  {generatedContent.hashtags.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">
                        <Badge variant="outline" className="text-xs">Хэштеги</Badge>
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {generatedContent.hashtags.map((tag, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                            onClick={() => copyToClipboard(tag, `tag-${i}`)}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
