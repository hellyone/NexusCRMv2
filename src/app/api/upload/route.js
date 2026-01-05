import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';

export async function POST(request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file');
        const equipmentId = formData.get('equipmentId');

        if (!file || !equipmentId) {
            return NextResponse.json({ error: 'Arquivo e equipmentId são obrigatórios' }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Tipo de arquivo não permitido. Use JPG, PNG ou WEBP' }, { status: 400 });
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            return NextResponse.json({ error: 'Arquivo muito grande. Máximo 5MB' }, { status: 400 });
        }

        // Create uploads directory if it doesn't exist
        const uploadsDir = join(process.cwd(), 'public', 'uploads', 'equipments');
        if (!existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true });
        }

        // Sanitize filename - remove path traversal and dangerous characters
        const sanitizeFilename = (name) => {
            return name
                .replace(/[^a-zA-Z0-9._-]/g, '') // Remove caracteres perigosos
                .replace(/\.\./g, '') // Remove path traversal
                .substring(0, 100); // Limite de tamanho
        };

        // Generate unique filename with sanitized extension
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 15);
        const originalExtension = file.name.split('.').pop()?.toLowerCase() || 'bin';
        
        // Validar extensão permitida
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
        const extension = allowedExtensions.includes(originalExtension) ? originalExtension : 'jpg';
        
        // Validar equipmentId para evitar path injection
        const safeEquipmentId = String(equipmentId).replace(/[^0-9]/g, '');
        
        const filename = `equipment-${safeEquipmentId}-${timestamp}-${randomStr}.${extension}`;
        const filepath = join(uploadsDir, filename);
        
        // Validar que o caminho final está dentro do diretório de uploads (path traversal protection)
        // O join() já previne path traversal, mas validamos como camada extra de segurança
        const normalizedPath = filepath.replace(/\\/g, '/');
        const normalizedDir = uploadsDir.replace(/\\/g, '/');
        if (!normalizedPath.startsWith(normalizedDir)) {
            return NextResponse.json({ error: 'Caminho de arquivo inválido' }, { status: 400 });
        }

        // Basic magic number validation (first bytes of file)
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Verificar magic numbers para imagens (validação básica)
        const magicNumbers = {
            jpeg: [0xFF, 0xD8, 0xFF],
            png: [0x89, 0x50, 0x4E, 0x47],
            webp: [0x52, 0x49, 0x46, 0x46], // WEBP starts with RIFF
        };
        
        const isJPEG = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
        const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
        const isWEBP = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;
        
        if (!isJPEG && !isPNG && !isWEBP) {
            return NextResponse.json({ error: 'Arquivo não é uma imagem válida (JPG, PNG ou WEBP)' }, { status: 400 });
        }
        
        // Validar que a extensão corresponde ao magic number
        if ((extension === 'jpg' || extension === 'jpeg') && !isJPEG) {
            return NextResponse.json({ error: 'Tipo de arquivo não corresponde à extensão' }, { status: 400 });
        }
        if (extension === 'png' && !isPNG) {
            return NextResponse.json({ error: 'Tipo de arquivo não corresponde à extensão' }, { status: 400 });
        }
        if (extension === 'webp' && !isWEBP) {
            return NextResponse.json({ error: 'Tipo de arquivo não corresponde à extensão' }, { status: 400 });
        }
        
        await writeFile(filepath, buffer);

        // Return public URL
        const publicUrl = `/uploads/equipments/${filename}`;

        return NextResponse.json({ 
            success: true, 
            url: publicUrl,
            filename: filename 
        });
    } catch (error) {
        logger.error('Erro no upload de arquivo', error, { equipmentId });
        return NextResponse.json({ error: 'Erro ao fazer upload do arquivo' }, { status: 500 });
    }
}

