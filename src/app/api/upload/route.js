import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { auth } from '@/auth';
import { getSupabaseServer } from '@/lib/supabase';

const BUCKET = 'uploads';
const FOLDER = 'equipments';

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

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Tipo de arquivo não permitido. Use JPG, PNG ou WEBP' }, { status: 400 });
        }

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            return NextResponse.json({ error: 'Arquivo muito grande. Máximo 5MB' }, { status: 400 });
        }

        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 15);
        const extension = file.name.split('.').pop();
        const filename = `equipment-${equipmentId}-${timestamp}-${randomStr}.${extension}`;

        const supabase = getSupabaseServer();
        const isVercel = process.env.VERCEL === '1';

        if (isVercel && !supabase) {
            return NextResponse.json(
                { error: 'Upload na Vercel exige Supabase Storage. Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.' },
                { status: 503 }
            );
        }

        if (supabase) {
            // Vercel / produção: Supabase Storage
            const bytes = await file.arrayBuffer();
            const { data, error } = await supabase.storage
                .from(BUCKET)
                .upload(`${FOLDER}/${filename}`, bytes, {
                    contentType: file.type,
                    upsert: false,
                });

            if (error) {
                console.error('Supabase upload error:', error);
                return NextResponse.json({ error: 'Erro ao fazer upload do arquivo' }, { status: 500 });
            }

            const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(`${FOLDER}/${filename}`);
            return NextResponse.json({
                success: true,
                url: urlData.publicUrl,
                filename,
            });
        }

        // Desenvolvimento local: disco (public/uploads)
        const uploadsDir = join(process.cwd(), 'public', 'uploads', FOLDER);
        if (!existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true });
        }
        const filepath = join(uploadsDir, filename);
        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(filepath, buffer);

        return NextResponse.json({
            success: true,
            url: `/uploads/${FOLDER}/${filename}`,
            filename,
        });
    } catch (error) {
        console.error('Erro no upload:', error);
        return NextResponse.json({ error: 'Erro ao fazer upload do arquivo' }, { status: 500 });
    }
}

