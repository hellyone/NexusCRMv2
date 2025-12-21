import Link from "next/link";
import { XCircle } from "lucide-react";

export default function UnauthorizedPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
            <XCircle className="text-red-500 w-16 h-16 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Não Autorizado</h1>
            <p className="text-gray-600 mb-6 text-center max-w-md">
                Você não tem permissão para acessar esta página com seu perfil atual.
            </p>
            <Link href="/" className="btn btn-primary">
                Voltar para Início
            </Link>
        </div>
    );
}
