import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs/promises';
import pool from '@/lib/db';

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

function normalizePhone(phone: string): string {
    // Удаляем +7, пробелы, дефисы, скобки
    const cleaned = phone.replace(/[^\d]/g, '');
    // Если начинается с 7 или 8, убираем первую цифру
    if (cleaned.length === 11 && (cleaned.startsWith('7') || cleaned.startsWith('8'))) {
        return cleaned.slice(1);
    }
    // Если уже 10 цифр - возвращаем как есть
    if (cleaned.length === 10) {
        return cleaned;
    }
    // Иначе возвращаем как есть (ошибка будет ниже)
    return cleaned;
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();

        const last_name    = (formData.get('last_name')   as string)?.trim();
        const first_name   = (formData.get('first_name')  as string)?.trim();
        const middle_name  = (formData.get('middle_name') as string)?.trim();
        const phoneRaw     = (formData.get('phone')       as string)?.trim();
        const email        = (formData.get('email')       as string)?.trim() || null;
        const passport_series = (formData.get('passport_series') as string)?.trim() || null;
        const passport_number = (formData.get('passport_number') as string)?.trim() || null;
        const birthday     = (formData.get('birthday')    as string) || null;
        const comment      = (formData.get('comment')     as string)?.trim() || null;
        const password     = (formData.get('password')    as string);
        const photoFile    = formData.get('photo') as File | null;

        if (!last_name || !first_name || !middle_name || !phoneRaw || !password) {
            return NextResponse.json(
                { error: 'Заполните обязательные поля: ФИО, телефон, пароль' },
                { status: 400 }
            );
        }

        // Валидация и нормализация телефона
        const phone = normalizePhone(phoneRaw);
        if (!/^\d{10}$/.test(phone)) {
            return NextResponse.json(
                { error: 'Неверный формат телефона. Ожидается 10 цифр (например: 9123456789)' },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Пароль должен содержать не менее 8 символов' },
                { status: 400 }
            );
        }

        let photoPath: string | null = null;
        if (photoFile && photoFile.size > 0) {
            const ext = photoFile.name.split('.').pop()?.toLowerCase() ?? '';
            if (!ALLOWED_EXTENSIONS.includes(ext)) {
                return NextResponse.json(
                    { error: 'Допустимые форматы фото: jpg, jpeg, png, webp, gif' },
                    { status: 400 }
                );
            }
            const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
            await fs.mkdir(uploadsDir, { recursive: true });

            // Генерация имени файла: Дата_регистрации_Телефон_Фамилия_Имя_Отчество
            const regDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
            const sanitizedName = (name: string) => name.replace(/[^a-zA-Zа-яА-ЯёЁ]/g, '_');
            const filename = `${regDate}_${phone}_${sanitizedName(last_name)}_${sanitizedName(first_name)}_${sanitizedName(middle_name)}.${ext}`;

            const bytes = await photoFile.arrayBuffer();
            await fs.writeFile(path.join(uploadsDir, filename), Buffer.from(bytes));
            photoPath = `/uploads/${filename}`;
        }

        const password_hash = await bcrypt.hash(password, 12);

        const result = await pool.query(
            `INSERT INTO users
             (last_name, first_name, middle_name, phone, email,
              photo, passport_series, passport_number,
              birthday, comment, password_hash)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
             RETURNING id, last_name, first_name, middle_name, phone, email, registered_at`,
            [
                last_name, first_name, middle_name, phone, email,
                photoPath, passport_series, passport_number,
                birthday, comment, password_hash,
            ]
        );

        return NextResponse.json(
            { message: 'Пользователь зарегистрирован', user: result.rows[0] },
            { status: 201 }
        );
    } catch (error: any) {
        if (error.code === '23505') {
            return NextResponse.json(
                { error: 'Пользователь с таким телефоном или email уже существует' },
                { status: 409 }
            );
        }
        console.error('[register]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера', detail: String(error?.message ?? error) }, { status: 500 });
    }
}