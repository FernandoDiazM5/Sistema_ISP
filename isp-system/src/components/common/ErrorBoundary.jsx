import React from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Se detectó un error crítico en React:", error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReset = () => {
        window.location.reload();
    };

    handleClearCache = () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
                    <div className="bg-bg-secondary p-8 rounded-xl shadow-xl max-w-2xl w-full text-center border border-border">
                        <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-text-primary mb-4">
                            ¡Ups! Algo salió mal
                        </h1>
                        <p className="text-text-secondary mb-6">
                            Ha ocurrido un error inesperado al cargar la interfaz. Esto suele pasar por problemas de caché o permisos del navegador.
                        </p>

                        <div className="bg-bg-primary p-4 rounded-lg text-left overflow-auto mb-8 max-h-48 border border-border">
                            <p className="text-red-400 font-mono text-sm break-words">
                                {this.state.error && this.state.error.toString()}
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={this.handleReset}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-accent-blue text-white rounded-lg hover:opacity-90 transition-opacity"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Recargar Página
                            </button>
                            <button
                                onClick={this.handleClearCache}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                Borrar Caché y Reiniciar
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
