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
                editor={ClassicEditor as any}
                data={value}
                config={{ placeholder }}
                onReady={(editor) => {
                    const el = editor.ui.view.editable.element;
                    if (el) el.style.minHeight = `${minHeight}px`;

                    (editor.plugins.get('FileRepository') as any).createUploadAdapter = (loader: any) => ({
                        upload: () =>
                            loader.file.then((file: File) =>
                                new Promise<{ default: string }>((resolve, reject) => {
                                    const reader = new FileReader();
                                    reader.onload = () => resolve({ default: reader.result as string });
                                    reader.onerror = reject;
                                    reader.readAsDataURL(file);
                                })
                            ),
                        abort: () => {},
                    });
                }}
                onChange={(_, editor) => {
                    onChange(editor.getData());
                }}
            />
        </div>
    );
}