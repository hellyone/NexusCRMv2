'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * Error Boundary para capturar erros em componentes React
 */
export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log do erro
        console.error('ErrorBoundary capturou um erro:', error, errorInfo);
        
        this.setState({
            error,
            errorInfo,
        });

        // Aqui você pode enviar para serviço de monitoramento
        // Ex: Sentry.captureException(error, { contexts: { react: errorInfo } });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            const { fallback, showDetails = false } = this.props;
            
            if (fallback) {
                return fallback(this.state.error, this.handleReset);
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                    <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-red-100 rounded-full">
                                <AlertTriangle className="text-red-600" size={32} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    Ops! Algo deu errado
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    Ocorreu um erro inesperado. Por favor, tente novamente.
                                </p>
                            </div>
                        </div>

                        {showDetails && this.state.error && (
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <h3 className="font-semibold text-gray-900 mb-2">Detalhes do erro:</h3>
                                <pre className="text-xs text-gray-700 overflow-auto max-h-48">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={this.handleReset}
                                className="btn btn-primary flex items-center gap-2"
                            >
                                <RefreshCw size={18} />
                                Tentar Novamente
                            </button>
                            <a
                                href="/"
                                className="btn btn-outline flex items-center gap-2"
                            >
                                <Home size={18} />
                                Voltar ao Início
                            </a>
                        </div>

                        {process.env.NODE_ENV === 'development' && (
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <p className="text-xs text-gray-500">
                                    Este erro é visível apenas em modo de desenvolvimento.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * Hook para usar Error Boundary em componentes funcionais
 * @param {Error} error - Objeto de erro
 * @param {Function} resetError - Função para resetar o erro
 */
export function useErrorHandler() {
    return (error, errorInfo) => {
        // Em componentes funcionais, você pode usar isso com um Error Boundary wrapper
        console.error('Erro capturado:', error, errorInfo);
        throw error; // Re-throw para ser capturado pelo Error Boundary
    };
}

