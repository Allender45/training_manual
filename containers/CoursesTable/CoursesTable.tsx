'use client';

import EntityTable from '../EntityTable/EntityTable';
import type { CourseRow, EntityRow } from '../EntityTable/EntityTable';

export type { CourseRow };

type CoursesTableProps = {
    data: CourseRow[];
    onEdit?: (row: CourseRow) => void;
    onDelete?: (row: CourseRow) => void;
};

export default function CoursesTable({ data, onEdit, onDelete }: CoursesTableProps) {
    return (
        <EntityTable
            entityType="courses"
            data={data}
            onEdit={onEdit as ((row: EntityRow) => void) | undefined}
            onDelete={onDelete as ((row: EntityRow) => void) | undefined}
        />
    );
}