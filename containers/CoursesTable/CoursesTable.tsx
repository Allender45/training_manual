'use client';

import EntityTable from '../EntityTable/EntityTable';
import type { CourseRow, EntityRow } from '../EntityTable/EntityTable';

export type { CourseRow };

type CoursesTableProps = {
    data: CourseRow[];
    onEdit?: (row: CourseRow) => void;
    onDelete?: (row: CourseRow) => void;
    buttonEdit?: boolean;
    buttonDel?: boolean;
};

export default function CoursesTable({ data, onEdit, onDelete, buttonEdit, buttonDel }: CoursesTableProps) {
    return (
        <EntityTable
            entityType="courses"
            data={data}
            buttonEdit={buttonEdit}
            buttonDel={buttonDel}
            onEdit={onEdit as ((row: EntityRow) => void) | undefined}
            onDelete={onDelete as ((row: EntityRow) => void) | undefined}
        />
    );
}