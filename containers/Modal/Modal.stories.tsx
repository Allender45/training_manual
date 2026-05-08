import React, {useState} from 'react';
import type {Meta, StoryObj} from '@storybook/react';
import Modal from './Modal';
import {Button, Input} from '@/components';

const meta: Meta<typeof Modal> = {
    title: 'Containers/Modal',
    component: Modal,
    tags: ['autodocs'],
    parameters: {layout: 'centered'},
};
export default meta;
type Story = StoryObj<typeof Modal>;

export const Default: Story = {
    render: () => {
        const [open, setOpen] = useState(false);
        return (
            <>
                <Button onClick={() => setOpen(true)}>Открыть модальное окно</Button>
                <Modal isOpen={open} onClose={() => setOpen(false)} title="Заголовок окна">
                    <p className="text-sm text-gray-600">Содержимое модального окна.</p>
                    <div className="flex gap-3 justify-end mt-5">
                        <Button variant="outline" onClick={() => setOpen(false)}>Отменить</Button>
                        <Button onClick={() => setOpen(false)}>Подтвердить</Button>
                    </div>
                </Modal>
            </>
        );
    },
};

export const WithForm: Story = {
    render: () => {
        const [open, setOpen] = useState(false);
        const [name, setName] = useState('');
        return (
            <div className={'flex bg-gray-100'}>
                <Button onClick={() => setOpen(true)}>Добавить роль</Button>
                <Modal isOpen={open} onClose={() => setOpen(false)} title="Добавление роли">
                    <div className="flex flex-col gap-4">
                        <Input
                            label="Название роли"
                            name="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <Input label="Комментарий" name="comment" value="" onChange={() => {
                        }}/>
                        <div className="flex gap-3 justify-end pt-2">
                            <Button variant="outline" onClick={() => setOpen(false)}>Отменить</Button>
                            <Button onClick={() => setOpen(false)}>Добавить</Button>
                        </div>
                    </div>
                </Modal>
            </div>
        );
    },
};