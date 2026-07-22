'use client';

import {useState, useEffect, useRef} from 'react';
import {useRouter} from 'next/navigation';
import {Input, Button, Select, Checkbox, AchievementsWidget} from '@/components';
import {hasFeature} from '@/lib/permissions';
import {Plus} from 'lucide-react';
import {useAdaptationPlansStore, useUserStore, useRolesStore, useEditedUserStore} from '@/store';

type UserForm = {
    last_name: string; first_name: string; middle_name: string;
    phone: string; email: string;
    role: string;
    passport_series: string; passport_number: string;
    birthday: string; comment: string;
    is_active: boolean;
    crm_id: string;
    adaptation_access: boolean;
};

const emptyForm: UserForm = {
    last_name: '', first_name: '', middle_name: '',
    phone: '', email: '', role: '',
    passport_series: '', passport_number: '',
    birthday: '', comment: '',
    is_active: true,
    crm_id: '',
    adaptation_access: false,
};

function formatPhoneDisplay(raw: string): string {
    if (!raw) return '';
    const d = ('7' + raw.replace(/\D/g, '')).slice(0, 11);
    let f = '+' + d[0];
    if (d.length > 1) {
        f += ' (' + d.slice(1, Math.min(4, d.length));
        if (d.length >= 4) f += ')';
        if (d.length > 4) f += ' ' + d.slice(4, Math.min(7, d.length));
    }
    if (d.length > 7) f += '-' + d.slice(7, Math.min(9, d.length));
    if (d.length > 9) f += '-' + d.slice(9, 11);
    return f;
}

type Props = {
    userId: string | null;
};

export default function UserContent({userId}: Props) {
    const router = useRouter();

    const {user: activeUser, fetchUser} = useUserStore();
    const rid = activeUser?.role_id ?? null;
    const isSelf = activeUser != null && String(activeUser.id) === String(userId);
    const isCreate = userId === null;

    const {roles, fetchRoles} = useRolesStore();
    const {editedUser, mentorship, loading, fetchEditedUser, clearEditedUser} = useEditedUserStore();

    const [form, setForm] = useState<UserForm>(emptyForm);
    const [originalForm, setOriginalForm] = useState<UserForm>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState('');
    const [originalPlanId, setOriginalPlanId] = useState('');
    const [saveError, setSaveError] = useState<string | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [mentorForm, setMentorForm] = useState({mentor_id: ''});
    const [originalMentorId, setOriginalMentorId] = useState('');
    const [mentorOptions, setMentorOptions] = useState<{ value: string; label: string }[]>([]);
    const {plans: adaptationPlans, fetchPlans} = useAdaptationPlansStore();

    const [newPassword, setNewPassword] = useState('');
    const [createPw, setCreatePw] = useState({password: '', confirmPassword: ''});

    const [pwForm, setPwForm] = useState({currentPassword: '', newPassword: '', confirmPassword: ''});
    const [pwSaving, setPwSaving] = useState(false);
    const [pwError, setPwError] = useState<string | null>(null);
    const [pwSuccess, setPwSuccess] = useState(false);

    const canEdit = !isCreate && !(isSelf || hasFeature(rid, 'editUser'));
    const showAdminFields = hasFeature(rid, 'editUser');
    const showSimplePassword = hasFeature(rid, 'profilePassChange') && !isSelf;

    const isDirty = JSON.stringify(form) !== JSON.stringify(originalForm)
        || photoFile !== null
        || (showAdminFields && mentorForm.mentor_id !== originalMentorId)
        || (showAdminFields && selectedPlanId !== originalPlanId)
        || (showSimplePassword && !!newPassword);

    const initials = [form.last_name, form.first_name, form.middle_name]
        .filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase();

    useEffect(() => {
        fetchRoles();
        if (userId) fetchEditedUser(userId);
        return () => clearEditedUser();
    }, [userId]);

    useEffect(() => {
        if (!showAdminFields) return;
        fetchPlans();
    }, [showAdminFields]);

    useEffect(() => {
        if (!showAdminFields) return;
        fetch('/api/users?scope=mentors')
            .then(r => r.json())
            .then(d => setMentorOptions(
                (d.users ?? [])
                    .filter((u: any) => String(u.id) !== String(userId))
                    .map((u: any) => ({value: String(u.id), label: u.name}))
            ));
    }, [showAdminFields, userId]);

    useEffect(() => {
        if (!editedUser) return;
        const filled: UserForm = {
            last_name: editedUser.last_name ?? '',
            first_name: editedUser.first_name ?? '',
            middle_name: editedUser.middle_name ?? '',
            phone: isSelf ? formatPhoneDisplay(editedUser.phone ?? '') : (editedUser.phone ?? ''),
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
        if (!showAdminFields || !userId) return;
        fetch(`/api/adaptations/${userId}`)
            .then(r => r.json())
            .then(d => {
                if (d.adaptation?.plan_id) {
                    setSelectedPlanId(String(d.adaptation.plan_id));
                    setOriginalPlanId(String(d.adaptation.plan_id));
                }
            });
    }, [userId, showAdminFields]);

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
        setSaveError(null);
    }

    async function handleSave() {
        if (isCreate && createPw.password !== createPw.confirmPassword) {
            setSaveError('Пароли не совпадают');
            return;
        }
        setSaving(true);
        setSaveError(null);
        try {
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => {
                if (k === 'is_active') return;
                fd.append(k, String(v));
            });
            if (isCreate) fd.append('password', createPw.password);
            if (photoFile) fd.append('photo', photoFile);

            const res = await fetch(isCreate ? '/api/users' : `/api/users/${userId}`, {
                method: isCreate ? 'POST' : 'PATCH',
                body: fd,
            });
            const data = await res.json();
            if (!res.ok) {
                setSaveError(data.error ?? 'Ошибка');
                return;
            }

            const targetUserId = isCreate ? String(data.user.id) : userId;
            const selectedRole = form.role || (isCreate ? 'Стажёр' : '');

            if (showAdminFields) {
                if (selectedRole === 'Стажёр' && mentorForm.mentor_id) {
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
                            body: JSON.stringify({intern_id: Number(targetUserId), ...body}),
                        });
                    }
                }

                if (selectedPlanId && selectedPlanId !== originalPlanId) {
                    await fetch('/api/adaptations', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({user_id: Number(targetUserId), plan_id: Number(selectedPlanId)}),
                    });
                }
            }

            if (!isCreate && showSimplePassword && newPassword) {
                const pwRes = await fetch(`/api/users/${userId}/set-password`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({newPassword}),
                });
                const pwData = await pwRes.json();
                if (!pwRes.ok) {
                    setSaveError(pwData.error ?? 'Ошибка смены пароля');
                    return;
                }
                setNewPassword('');
            }

            if (isSelf) {
                await fetchUser(() => router.push('/login'));
                setPhotoFile(null);
                setPhotoPreview(null);
            } else {
                router.push('/users');
            }
        } catch {
            setSaveError('Ошибка соединения с сервером');
        } finally {
            setSaving(false);
        }
    }

    async function handleChangePassword() {
        setPwError(null);
        setPwSuccess(false);
        if (pwForm.newPassword !== pwForm.confirmPassword) {
            setPwError('Новый пароль и подтверждение не совпадают');
            return;
        }
        setPwSaving(true);
        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    currentPassword: pwForm.currentPassword,
                    newPassword: pwForm.newPassword,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setPwError(data.error ?? 'Ошибка смены пароля');
            } else {
                setPwSuccess(true);
                setPwForm({currentPassword: '', newPassword: '', confirmPassword: ''});
            }
        } catch {
            setPwError('Ошибка соединения с сервером');
        } finally {
            setPwSaving(false);
        }
    }

    if (loading) return <p className="text-sm text-gray-400 p-6">Загрузка...</p>;

    return (
        <main className="flex-1 p-6 max-w-3xl">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">
                    {isCreate ? 'Новый пользователь' : isSelf ? 'Профиль' : 'Редактирование пользователя'}
                </h3>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex w-full gap-5 mb-6">
                    <div className="flex flex-col flex-1 items-center gap-2 shrink-0">
                        {photoPreview || editedUser?.photo ? (
                            <img
                                src={photoPreview ?? editedUser!.photo!}
                                alt="Фото профиля"
                                className="object-fit"
                            />
                        ) : (
                            <div className="w-28 h-28 rounded-full bg-blue-600 text-white flex items-center justify-center text-3xl font-semibold select-none">
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
                        <AchievementsWidget variant="block"/>
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
                    {(!isCreate || hasFeature(rid, 'profileRoleChange')) && (
                        <Select label="Роль" name="role" value={form.role} onChange={handleChange}
                                placeholder="Выберите роль" options={roles}
                                disabled={!hasFeature(rid, 'profileRoleChange')}/>
                    )}
                    <Input label="Номер паспорта" name="passport_number" value={form.passport_number}
                           onChange={handleChange} placeholder="567890" disabled={canEdit}/>
                        <Select
                            label="Наставник"
                            name="mentor_id"
                            value={mentorForm.mentor_id}
                            onChange={e => setMentorForm({mentor_id: e.target.value})}
                            options={mentorOptions}
                            placeholder="Выберите наставника"
                            disabled={canEdit}
                        />
                    {showAdminFields && (
                        <Input label="ID в CRM" name="crm_id" type="number" value={form.crm_id}
                               onChange={handleChange} disabled={canEdit}/>
                    )}
                    {showAdminFields && (
                        <Checkbox label="Допуск к адаптации" name="adaptation_access"
                                  checked={form.adaptation_access} onChange={handleChange}
                                  variant="switch" disabled={canEdit}/>
                    )}
                    {showAdminFields && form.adaptation_access && (
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
                                <Plus size={16}/>
                            </button>
                        </div>
                    )}

                    {isCreate ? (
                        <>
                            <Input label="Пароль *" name="password" type="password" value={createPw.password}
                                   onChange={e => setCreatePw(prev => ({...prev, password: e.target.value}))}
                                   icon="lock"/>
                            <Input label="Подтверждение пароля *" name="confirmPassword" type="password"
                                   value={createPw.confirmPassword}
                                   onChange={e => setCreatePw(prev => ({...prev, confirmPassword: e.target.value}))}
                                   icon="lock"/>
                        </>
                    ) : showSimplePassword && (
                        <Input
                            label="Новый пароль"
                            name="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            icon="lock"
                        />
                    )}

                    {(showAdminFields && !isSelf) &&
                        <div className="sm:col-span-2">
                            <label className="block text-gray-500 text-sm mb-2">Комментарий</label>
                            <textarea name="comment" value={form.comment} onChange={handleChange} rows={3}
                                      disabled={canEdit}
                                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-50"/>
                        </div>
                    }
                    {!isCreate &&
                        <Checkbox label="Активен" name="is_active" checked={form.is_active} onChange={handleChange}
                                  variant="switch" disabled={!hasFeature(rid, 'profileActiveStatusChange')}/>
                    }
                </div>

                {saveError && (
                    <div
                        className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{saveError}</div>
                )}

                {isCreate ? (
                    <div className="flex gap-3 mt-6 pt-5 border-t justify-end">
                        <Button variant="outline" onClick={() => router.push('/users')}>Отменить</Button>
                        <Button onClick={handleSave} loading={saving}>Создать</Button>
                    </div>
                ) : !canEdit && (
                    <div className="flex gap-3 mt-6 pt-5 border-t justify-end">
                        <Button variant="outline" onClick={handleReset} disabled={!isDirty}>Сбросить</Button>
                        <Button onClick={handleSave} disabled={!isDirty} loading={saving}>Сохранить</Button>
                    </div>
                )}
            </div>

            {isSelf && (
                <div className="bg-white rounded-2xl shadow-sm p-6 mt-6">
                    <h4 className="text-base font-semibold text-gray-800 mb-4">Смена пароля</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Input label="Текущий пароль" name="currentPassword" type="password"
                               value={pwForm.currentPassword}
                               onChange={e => setPwForm(prev => ({...prev, currentPassword: e.target.value}))}
                               icon="lock"/>
                        <Input label="Новый пароль" name="newPassword" type="password"
                               value={pwForm.newPassword}
                               onChange={e => setPwForm(prev => ({...prev, newPassword: e.target.value}))}
                               icon="lock"/>
                        <Input label="Подтвердить пароль" name="confirmPassword" type="password"
                               value={pwForm.confirmPassword}
                               onChange={e => setPwForm(prev => ({...prev, confirmPassword: e.target.value}))}
                               icon="lock"/>
                    </div>
                    {pwError && (
                        <div className="mt-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
                            {pwError}
                        </div>
                    )}
                    {pwSuccess && (
                        <div className="mt-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-3 py-2">
                            Пароль успешно изменён
                        </div>
                    )}
                    <div className="flex justify-end mt-4 pt-4 border-t">
                        <Button onClick={handleChangePassword} loading={pwSaving}
                                disabled={!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword}>
                            Изменить пароль
                        </Button>
                    </div>
                </div>
            )}
        </main>
    );
}