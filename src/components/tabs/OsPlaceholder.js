export default function OsPlaceholder({ title, os }) {
    return (
        <div className="text-center p-12 text-muted">
            <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
            <p>Módulo em desenvolvimento...</p>
            <pre className="text-xs mt-4 text-left bg-gray-100 p-4 rounded overflow-auto hidden">
                {JSON.stringify(os, null, 2)}
            </pre>
        </div>
    );
}
