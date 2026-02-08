import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 max-w-lg">
                        <div className="text-red-400 text-xl font-bold mb-4">
                            ⚠️ Произошла ошибка
                        </div>
                        <div className="text-white/80 text-sm mb-4">
                            {this.state.error?.message || 'Unknown error'}
                        </div>
                        <pre className="text-left text-xs text-white/50 bg-black/30 p-4 rounded-lg overflow-auto max-h-48">
                            {this.state.error?.stack}
                        </pre>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                        >
                            Перезагрузить страницу
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
