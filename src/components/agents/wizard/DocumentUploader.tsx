import * as React from 'react';
import { Upload, File, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface Document {
    id: string;
    filename: string;
    content: string;
    size: number;
}

interface DocumentUploaderProps {
    documents: Document[];
    onDocumentsChange: (docs: Document[]) => void;
    maxFileSize?: number; // bytes
    maxFiles?: number;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
    documents,
    onDocumentsChange,
    maxFileSize = 5 * 1024 * 1024, // 5MB default
    maxFiles = 10
}) => {
    const [isDragging, setIsDragging] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileUpload = async (files: FileList | null) => {
        if (!files) return;

        setError(null);

        try {
            // Check file count limit
            if (documents.length + files.length > maxFiles) {
                setError(`Максимум ${maxFiles} файлов. Вы пытаетесь загрузить ${files.length}`);
                return;
            }

            const newDocs: Document[] = [];

            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                // Check file size
                if (file.size > maxFileSize) {
                    setError(`Файл "${file.name}" превышает лимит ${(maxFileSize / 1024 / 1024).toFixed(1)}MB`);
                    continue;
                }

                // Only accept text-like files
                if (!['text/plain', 'text/markdown', 'application/pdf', 'application/json'].includes(file.type)) {
                    if (!file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
                        setError(`Файл "${file.name}" - неподдерживаемый формат. Используй .txt, .md или .pdf`);
                        continue;
                    }
                }

                try {
                    const content = await file.text();

                    newDocs.push({
                        id: crypto.randomUUID(),
                        filename: file.name,
                        content,
                        size: file.size
                    });
                } catch (err) {
                    setError(`Ошибка при чтении файла "${file.name}"`);
                    console.error('File read error:', err);
                }
            }

            if (newDocs.length > 0) {
                onDocumentsChange([...documents, ...newDocs]);
            }

            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

        } catch (err) {
            setError('Ошибка при загрузке файлов');
            console.error('Upload error:', err);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files) {
            handleFileUpload(e.dataTransfer.files);
        }
    };

    const handleRemove = (id: string) => {
        onDocumentsChange(documents.filter(d => d.id !== id));
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="space-y-4">
            {/* Upload Area */}
            <label
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                    'flex items-center justify-center w-full h-40 px-4',
                    'transition-all duration-200',
                    'border-2 border-dashed rounded-2xl',
                    'cursor-pointer group',
                    isDragging
                        ? 'border-cyan-400 bg-cyan-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                )}
            >
                <div className="flex flex-col items-center space-y-2">
                    <Upload className={cn(
                        'w-8 h-8 transition-colors',
                        isDragging ? 'text-cyan-400' : 'text-white/40 group-hover:text-cyan-400'
                    )} />
                    <div className="text-center">
                        <span className="text-sm text-white/40 group-hover:text-white">
                            Загрузите документы для базы знаний
                        </span>
                        <p className="text-xs text-white/30 mt-1">
                            или перетащите файлы сюда
                        </p>
                    </div>
                    <span className="text-xs text-white/30 mt-2">
                        .txt, .md, .pdf (до {(maxFileSize / 1024 / 1024).toFixed(0)}MB, макс. {maxFiles} файлов)
                    </span>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    multiple
                    accept=".txt,.md,.pdf,text/plain,text/markdown,application/pdf"
                    onChange={(e) => handleFileUpload(e.target.files)}
                />
            </label>

            {/* Error Message */}
            {error && (
                <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400">{error}</p>
                </div>
            )}

            {/* Documents List */}
            {documents.length > 0 && (
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <p className="text-xs font-semibold text-white/60 uppercase tracking-widest">
                            Загруженные документы ({documents.length}/{maxFiles})
                        </p>
                        {documents.length > 0 && (
                            <p className="text-xs text-white/40">
                                {documents.reduce((sum, doc) => sum + doc.size, 0) > 0 ?
                                    `Всего: ${formatFileSize(documents.reduce((sum, doc) => sum + doc.size, 0))}` : ''
                                }
                            </p>
                        )}
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {documents.map((doc) => (
                            <div
                                key={doc.id}
                                className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-colors"
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <File className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-sm text-white truncate">
                                            {doc.filename}
                                        </p>
                                        <p className="text-xs text-white/40">
                                            {formatFileSize(doc.size)} • {doc.content.length} символов
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemove(doc.id)}
                                    className="text-white/40 hover:text-red-400 hover:bg-red-500/10 flex-shrink-0 ml-2"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Info Message */}
            {documents.length === 0 && (
                <p className="text-xs text-white/30 text-center">
                    Загруженные документы будут использованы для улучшения ответов агента через семантический поиск
                </p>
            )}
        </div>
    );
};
