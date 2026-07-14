import {NextRequest, NextResponse} from 'next/server';
import pool from '@/lib/db';
import {unsignSession} from '@/lib/session';

export async function GET(req: NextRequest) {
    const raw = req.cookies.get('session')?.value ?? '';
    if (!unsignSession(raw)) return NextResponse.json({error: 'Не авторизован'}, {status: 401});

    const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
    if (q.length < 2) return NextResponse.json({results: []});

    const like = `%${q}%`;

    try {
        const {rows} = await pool.query(`
            (
                SELECT 'course' AS type, id::text, title,
                       LEFT(COALESCE(description, ''), 80) AS subtitle,
                       '/courses/study?id=' || id AS url
                FROM courses
                WHERE is_active = true
                  AND (title ILIKE $1 OR description ILIKE $1)
                LIMIT 4
            )
            UNION ALL
            (
                SELECT DISTINCT ON (c.id)
                    'manual'::text,
                    c.id::text,
                    c.title,
                    ('Материал: ' || m.title)::text,
                    ('/courses/study?id=' || c.id)::text
                FROM manuals m
                JOIN course_manuals cm ON cm.manual_id = m.id
                JOIN courses c ON c.id = cm.course_id
                WHERE m.is_active = true
                  AND (m.title ILIKE $1 OR m.description ILIKE $1
                       OR COALESCE(regexp_replace(m.content, '<[^>]+>', '', 'g'), '') ILIKE $1)
                LIMIT 4
            )
            UNION ALL
            (
                SELECT 'functional', id::text, title,
                       '' AS subtitle,
                       '/functional/' || id
                FROM functional_instructions
                WHERE is_active = true
                  AND (title ILIKE $1
                       OR COALESCE(regexp_replace(content, '<[^>]+>', '', 'g'), '') ILIKE $1)
                LIMIT 4
            )
            UNION ALL
            (
                SELECT 'user', id::text,
                       TRIM(last_name || ' ' || first_name || ' ' || middle_name),
                       COALESCE(phone, ''),
                       '/users/edit?id=' || id
                FROM users
                WHERE is_active = true
                  AND (TRIM(last_name || ' ' || first_name || ' ' || middle_name) ILIKE $1
                       OR phone ILIKE $1)
                LIMIT 4
            )
            UNION ALL
            (
                SELECT 'department', id::text, name,
                       '' AS subtitle,
                       '/departments'
                FROM departments
                WHERE name ILIKE $1
                LIMIT 4
            )
            UNION ALL
            (
                SELECT 'trainer', id::text, name,
                       LEFT(COALESCE(description, ''), 80),
                       '/trainers'
                FROM trainers
                WHERE is_active = true
                  AND (name ILIKE $1 OR description ILIKE $1)
                LIMIT 4
            )
        `, [like]);

        return NextResponse.json({results: rows});
    } catch (error: any) {
        console.error('[GET /api/search]', error);
        return NextResponse.json({error: 'Внутренняя ошибка сервера'}, {status: 500});
    }
}