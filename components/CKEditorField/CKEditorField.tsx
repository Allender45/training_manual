'use client';

import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
    ClassicEditor,
    Essentials, Paragraph, Heading,
    Bold, Italic, Underline, Strikethrough,
    Alignment,
    List, TodoList,
    Indent, IndentBlock,
    Link,
    BlockQuote,
    Base64UploadAdapter,
    Image, ImageUpload, ImageToolbar, ImageCaption, ImageStyle,
    Table, TableToolbar,
    HorizontalLine,
    FindAndReplace,
    RemoveFormat,
} from 'ckeditor5';

type CKEditorFieldProps = {
    label?: string;
    value: string;
    onChange: (data: string) => void;
    placeholder?: string;
    minHeight?: number;
};

export default function CKEditorField({
                                          label, value, onChange, placeholder, minHeight = 160,
                                      }: CKEditorFieldProps) {
    return (
        <div>
            {label && <label className="block text-gray-500 text-sm mb-2">{label}</label>}
            <CKEditor
                editor={ClassicEditor}
                data={value}
                config={{
                    licenseKey: 'GPL',
                    plugins: [
                        Essentials, Paragraph, Heading,
                        Bold, Italic, Underline, Strikethrough,
                        Alignment,
                        List, TodoList,
                        Indent, IndentBlock,
                        Link,
                        BlockQuote,
                        Base64UploadAdapter,
                        Image, ImageUpload, ImageToolbar, ImageCaption, ImageStyle,
                        Table, TableToolbar,
                        HorizontalLine,
                        FindAndReplace,
                        RemoveFormat,
                    ],
                    toolbar: {
                        items: [
                            'heading', '|',
                            'bold', 'italic', 'underline', 'strikethrough',
                            '|',
                            'alignment',
                            '|',
                            'bulletedList', 'numberedList', 'todoList',
                            '|',
                            'indent', 'outdent',
                            '|',
                            'link', 'uploadImage', 'insertTable', 'blockQuote',
                            '|',
                            'horizontalLine', 'findAndReplace', 'removeFormat',
                            '|',
                            'undo', 'redo',
                        ],
                    },
                    image: {
                        toolbar: ['imageStyle:inline', 'imageStyle:block', '|', 'imageTextAlternative'],
                    },
                    table: {
                        contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells'],
                    },
                    placeholder,
                }}
                onReady={(editor) => {
                    const el = (editor.ui.view as any).editable?.element;
                    if (el) el.style.minHeight = `${minHeight}px`;
                }}
                onChange={(_, editor) => onChange(editor.getData())}
            />
        </div>
    );
}