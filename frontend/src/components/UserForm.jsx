import React, { useState, useEffect } from 'react';

const UserForm = ({ user, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        fullName: '',
        email: '',
        role: 'STUDENT',
        grade: '',
        group: '',
        subjects: [],
        active: true
    });

    useEffect(() => {
        if (user) {
            // Если редактируем существующего пользователя
            setFormData({
                ...user,
                password: '', // Пароль не передаем для редактирования
                subjects: user.subjects || []
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === 'subjects') {
            // Преобразуем строку с предметами в массив
            const subjectsArray = value.split(',').map(s => s.trim()).filter(Boolean);
            setFormData(prev => ({ ...prev, subjects: subjectsArray }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 0 10px rgba(0,0,0,0.1)',
            marginBottom: '1.5rem'
        }}>
            <h3>{user ? 'Редактировать пользователя' : 'Добавить пользователя'}</h3>

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="username">Имя пользователя</label>
                    <input
                        id="username"
                        name="username"
                        type="text"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        disabled={!!user} // Запрещаем изменение имени пользователя при редактировании
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">Пароль {user && '(оставьте пустым, чтобы не менять)'}</label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        required={!user}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="fullName">Полное имя</label>
                    <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="role">Роль</label>
                    <select
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        required
                    >
                        <option value="ADMIN">Администратор</option>
                        <option value="TEACHER">Учитель</option>
                        <option value="STUDENT">Ученик</option>
                    </select>
                </div>

                {formData.role === 'STUDENT' && (
                    <>
                        <div className="form-group">
                            <label htmlFor="grade">Класс</label>
                            <input
                                id="grade"
                                name="grade"
                                type="text"
                                value={formData.grade || ''}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="group">Группа</label>
                            <input
                                id="group"
                                name="group"
                                type="text"
                                value={formData.group || ''}
                                onChange={handleChange}
                            />
                        </div>
                    </>
                )}

                {formData.role === 'TEACHER' && (
                    <div className="form-group">
                        <label htmlFor="subjects">Предметы (через запятую)</label>
                        <input
                            id="subjects"
                            name="subjects"
                            type="text"
                            value={formData.subjects.join(', ')}
                            onChange={handleChange}
                        />
                    </div>
                )}

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                        id="active"
                        name="active"
                        type="checkbox"
                        checked={formData.active}
                        onChange={handleChange}
                        style={{ width: 'auto', margin: 0 }}
                    />
                    <label htmlFor="active" style={{ margin: 0 }}>Активен</label>
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button type="button" className="secondary" onClick={onCancel}>
                        Отмена
                    </button>
                    <button type="submit">
                        {user ? 'Сохранить' : 'Добавить'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UserForm;