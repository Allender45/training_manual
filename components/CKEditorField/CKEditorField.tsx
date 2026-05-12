'use client';

import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

type CKEditorFieldProps = {
    label?: string;
    value: string;
    onChange: (data: string) => void;
    placeholder?: string;
    minHeight?: number;
};

export default function CKEditorField({
                                          label,
                                          value,
                                          onChange,
                                          placeholder,
                                          minHeight = 160,
                                      }: CKEditorFieldProps) {
    return (
        <div>
            {label && (
                <label className="block text-gray-500 text-sm mb-2">{label}</label>
            )}
            <CKEditor
                editor={ClassicEditor}
                data={value}
                config={{ placeholder }}
                onReady={(editor) => {
                    const el = editor.ui.view.editable.element;
                    if (el) el.style.minHeight = `${minHeight}px`;
                }}
                onChange={(_, editor) => {
                    onChange(editor.getData());
                }}
            />
        </div>
    );
}