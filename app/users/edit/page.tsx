'use client';

import {useState, useEffect, useRef} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import {Header, Sidebar} from '@/containers';
import {Input, Button, Select, Checkbox} from '@/components';
import {hasFeature} from '@/lib/permissions';
import { Plus } from 'lucide-react';
import { useAdaptationPlansStore, useUserStore, useRolesStore, useEditedUserStore } from '@/store';

type EditUserForm = {
    last_name: string; first_name: string; middle_name: string;
    phone: string; email: string;
    role: string;
    passport_series: string; passport_number: string;
    birthday: string; comment: string;
    is_active: boolean;
    crm_id: string;
    adaptation_access: boolean;
};

const emptyForm: EditUserForm = {
    last_name: '', first_name: '', middle_name: '',
    phone: '', email: '', role: '',
    passport_series: '', passport_number: '',
    birthday: '', comment: '',
    is_active: true,
    crm_id: '',
    adaptation_access: false,
};

export default function EditUserPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const userId = searchParams.get('id');

    const activeUser = useUserStore(s => s.user);
    const rid = activeUser?.role_id ?? null;

    const {roles, fetchRoles} = useRolesStore();
    const {editedUser, mentorship, mentorOptions, loading, fetchEditedUser, clearEditedUser} = useEditedUserStore();

    const [form, setForm] = useState<EditUserForm>(emptyForm);
    const [originalForm, setOriginalForm] = useState<EditUserForm>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState('');
    const [originalPlanId, setOriginalPlanId] = useState('');
    const [saveError, setSaveError] = useState<string | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [mentorForm, setMentorForm] = useState({mentor_id: ''});
    const [originalMentorId, setOriginalMentorId] = useState('');
    const { plans: adaptationPlans, fetchPlans } = useAdaptationPlansStore();
    const [newPassword, setNewPassword] = useState('');
    const [pwSaving, setPwSaving] = useState(false);
    const [pwError, setPwError] = useState<string | null>(null);
    const [pwSuccess, setPwSuccess] = useState(false);


    const isDirty = JSON.stringify(form) !== JSON.stringify(originalForm)
        || photoFile !== null
        || mentorForm.mentor_id !== originalMentorId
        || selectedPlanId !== originalPlanId
        || !!newPassword;

    const canEdit = !hasFeature(rid, 'editUser');

    const initials = [form.last_name, form.first_name, form.middle_name]
        .filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase();

    useEffect(() => {
        fetchRoles();
        fetchPlans();
        if (userId) fetchEditedUser(userId);
        return () => clearEditedUser();
    }, [userId]);

    useEffect(() => {
        if (!editedUser) return;
        const filled: EditUserForm = {
            last_name: editedUser.last_name ?? '',
            first_name: editedUser.first_name ?? '',
            middle_name: editedUser.middle_name ?? '',
            phone: editedUser.phone ?? '',
            email: editedUser.email ?? '',
            role: editedUser.role ?? '',
            passport_series: editedUser.passport_series ?? '',
            passport_number: editedUser.passport_number ?? '',
            birthday: editedUser.birthday ?? '',
            comment: editedUser.comment ?? '',
            is_active: editedUser.is_active ?? true,
            crm_id: String(editedUser.crm_id ?? ''),
            adaptation_access: editedUser.adaptation_access ?? false,
        };
        setForm(filled);
        setOriginalForm(filled);
        if (mentorship) {
            setMentorForm({mentor_id: String(mentorship.mentor_id)});
            setOriginalMentorId(String(mentorship.mentor_id));
        }
    }, [editedUser, mentorship]);

    useEffect(() => {
        if (!userId) return;
        fetch(`/api/adaptations/${userId}`)
            .then(r => r.json())
            .then(d => {
                if (d.adaptation?.plan_id) {
                    setSelectedPlanId(String(d.adaptation.plan_id));
                    setOriginalPlanId(String(d.adaptation.plan_id));
                }
            });
    }, [userId]);

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
        const {name, value} = e.target;
        const type = (e.target as HTMLInputElement).type;
        const checked = (e.target as HTMLInputElement).checked;
        setForm(prev => ({...prev, [name]: type === 'checkbox' ? checked : value}));
    }

    function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
    }

    function handlePhotoClick() {
        fileInputRef.current?.click();
    }

    function handleReset() {
        setForm(originalForm);
        setPhotoFile(null);
        setPhotoPreview(null);
    }

    async function handleSave() {
        setSaving(true);
        setSaveError(null);
        try {
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
            if (photoFile) fd.append('photo', photoFile);

            const res = await fetch(`/api/users/${userId}`, {method: 'PATCH', body: fd});
            const data = await res.json();
            if (!res.ok) {
                setSaveError(data.error ?? 'Ошибка');
                return;
            }

            if (form.role === 'Стажёр' && mentorForm.mentor_id) {
                const today = new Date().toISOString().split('T')[0];
                const body = {mentor_id: Number(mentorForm.mentor_id), start_date: today, end_date: null};
                if (mentorship) {
                    await fetch(`/api/mentorships/${mentorship.id}`, {
                        method: 'PATCH',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(body),
                    });
                } else {
                    await fetch('/api/mentorships', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({intern_id: Number(userId), ...body}),
                    });
                }
            }

            if (selectedPlanId && selectedPlanId !== originalPlanId) {
                await fetch('/api/adaptations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: Number(userId), plan_id: Number(selectedPlanId) }),
                });
            }

            if (newPassword) {
                const pwRes = await fetch(`/api/users/${userId}/set-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ newPassword }),
                });
                const pwData = await pwRes.json();
                if (!pwRes.ok) {
                    setSaveError(pwData.error ?? 'Ошибка смены пароля');
                    return;
                }
            }

            router.push('/users');
        } catch {
            setSaveError('Ошибка соединения с сервером');
        } finally {
            setSaving(false);
        }
    }

    async function handleSetPassword() {
        setPwError(null);
        setPwSuccess(false);
        setPwSaving(true);
        try {
            const res = await fetch(`/api/users/${userId}/set-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword }),
            });
            const data = await res.json();
            if (!res.ok) {
                setPwError(data.error ?? 'Ошибка смены пароля');
            } else {
                setPwSuccess(true);
                setNewPassword('');
            }
        } catch {
            setPwError('Ошибка соединения с сервером');
        } finally {
            setPwSaving(false);
        }
    }

    if (loading) return <div className="flex items-center justify-center min-h-screen">Загрузка...</div>;

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar sidebarOpen={sidebarOpen} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen}/>
            <div className="flex-1 flex flex-col min-w-0">
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
                        mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen}/>
                <main className="flex-1 p-6 max-w-3xl">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-gray-800">Редактирование пользователя</h3>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <div className="flex w-full gap-5 mb-6">
                            <div className="flex flex-col flex-1 items-center gap-2 shrink-0">
                                {photoPreview || editedUser?.photo ? (
                                    <img src={photoPreview ?? editedUser!.photo!} alt="Фото профиля"
                                         className="w-28 h-28 rounded-full object-cover"/>
                                ) : (
                                    <div
                                        className="w-28 h-28 rounded-full bg-blue-600 text-white flex items-center justify-center text-3xl font-semibold select-none">
                                        {initials}
                                    </div>
                                )}
                                <span className="text-xs text-gray-400">
                                    {editedUser?.registered_at ? `С ${new Date(editedUser.registered_at).toLocaleDateString('ru-RU')}` : ''}
                                </span>
                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                                       onChange={handlePhotoChange}/>
                                <button className="text-sm text-blue-600 hover:underline" onClick={handlePhotoClick}>
                                    Изменить фото
                                </button>
                            </div>
                            <div className="flex flex-col flex-1 gap-4">
                                <Input label="Фамилия" name="last_name" value={form.last_name} onChange={handleChange}
                                       icon="user" disabled={canEdit}/>
                                <Input label="Имя" name="first_name" value={form.first_name} onChange={handleChange}
                                       icon="user" disabled={canEdit}/>
                                <Input label="Отчество" name="middle_name" value={form.middle_name}
                                       onChange={handleChange} icon="user" disabled={canEdit}/>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input label="Телефон" name="phone" type="tel" value={form.phone} onChange={handleChange}
                                   icon="phone" disabled={canEdit}/>
                            <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange}
                                   icon="email" placeholder="example@mail.ru" disabled={canEdit}/>
                            <Input label="Дата рождения" name="birthday" value={form.birthday} onChange={handleChange}
                                   placeholder="ГГГГ-ММ-ДД" disabled={canEdit}/>
                            <Input label="Серия паспорта" name="passport_series" value={form.passport_series}
                                   onChange={handleChange} placeholder="1234" disabled={canEdit}/>
                            <Select label="Роль" name="role" value={form.role} onChange={handleChange}
                                    placeholder="Выберите роль" options={roles} disabled={canEdit}/>
                            <Input label="Номер паспорта" name="passport_number" value={form.passport_number}
                                   onChange={handleChange} placeholder="567890" disabled={canEdit}/>
                            {form.role === 'Стажёр' && (
                                <Select
                                    label="Наставник"
                                    name="mentor_id"
                                    value={mentorForm.mentor_id}
                                    onChange={e => setMentorForm({mentor_id: e.target.value})}
                                    options={mentorOptions}
                                    placeholder="Выберите наставника"
                                    disabled={canEdit}
                                />

                            )}
                            <Input label="ID в CRM" name="crm_id" type="number" value={form.crm_id}
                                   onChange={handleChange} disabled={canEdit}/>
                            <Checkbox label="Допуск к адаптации" name="adaptation_access"
                                      checked={form.adaptation_access} onChange={handleChange}
                                      variant="switch" disabled={canEdit}/>
                            {form.adaptation_access && (
                                <div className="flex items-end gap-2">
                                    <div className="flex-1">
                                        <Select
                                            label="План адаптации"
                                            name="adaptation_plan_id"
                                            value={selectedPlanId}
                                            onChange={e => setSelectedPlanId(e.target.value)}
                                            options={adaptationPlans}
                                            placeholder="Выберите план"
                                            disabled={canEdit}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => router.push('/adaptationPlans')}
                                        disabled={canEdit}
                                        title="Создать план адаптации"
                                        className="p-2 mb-0.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 transition-colors shrink-0"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            )}

                            {hasFeature(rid, 'profilePassChange') &&
                                <Input
                                    label="Новый пароль"
                                    name="newPassword"
                                    type="password"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    icon="lock"
                                />
                            }

                            <div className="sm:col-span-2">
                                <label className="block text-gray-500 text-sm mb-2">Комментарий</label>
                                <textarea name="comment" value={form.comment} onChange={handleChange} rows={3}
                                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"/>
                            </div>
                            <Checkbox label="Активен" name="is_active" checked={form.is_active} onChange={handleChange}
                                      variant="switch" disabled={canEdit}/>
                        </div>

                        {saveError && (
                            <div
                                className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{saveError}</div>
                        )}
                        {!canEdit &&
                            <div className="flex gap-3 mt-6 pt-5 border-t justify-end">
                                <Button variant="outline" onClick={handleReset} disabled={!isDirty}>Сбросить</Button>
                                <Button onClick={handleSave} disabled={!isDirty} loading={saving}>Сохранить</Button>
                            </div>
                        }
                    </div>
                </main>
            </div>
        </div>
    );
}