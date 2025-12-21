import Link from 'next/link';
import { PackageSearch, Settings, Users } from 'lucide-react';

export default function SettingsPage() {
    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Settings /> Configurações
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link href="/settings/products" className="card hover:shadow-md transition-shadow cursor-pointer p-6 flex flex-col items-center text-center gap-4 bg-white border rounded-lg">
                    <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                        <PackageSearch size={32} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-gray-900">Catálogo de Equipamentos</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Cadastre e gerencie equipamentos, marcas e números de série.
                        </p>
                    </div>
                </Link>

                <Link href="/users" className="card hover:shadow-md transition-shadow cursor-pointer p-6 flex flex-col items-center text-center gap-4 bg-white border rounded-lg">
                    <div className="p-3 bg-green-50 rounded-full text-green-600">
                        <Users size={32} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-gray-900">Gerenciamento de Equipe</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Gerencie funcionários, permissões de acesso e dados técnicos.
                        </p>
                    </div>
                </Link>

                {/* Placeholder for future settings */}
                <div className="card p-6 flex flex-col items-center text-center gap-4 bg-gray-50 border border-dashed rounded-lg opacity-60">
                    <div className="p-3 bg-gray-200 rounded-full text-gray-400">
                        <Settings size={32} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-gray-500">Gerais</h3>
                        <p className="text-sm text-gray-400 mt-1">Em breve</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
