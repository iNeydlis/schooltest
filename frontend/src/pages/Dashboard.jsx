import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Dashboard = () => {
    const { user } = useContext(AuthContext);

    // Преобразование массива предметов в строку для отображения
    const subjectsDisplay = user.subjects ? user.subjects.join(', ') : 'Не указаны';

    return (
        <div>
            <h2>Личный кабинет</h2>
            <div style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '8px',
                boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                marginTop: '1.5rem'
            }}>
                <h3 style={{ marginBottom: '1.5rem' }}>Информация о пользователе</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                    <div><strong>Имя пользователя:</strong></div>
                    <div>{user.username}</div>

                    <div><strong>Полное имя:</strong></div>
                    <div>{user.fullName}</div>

                    <div><strong>Email:</strong></div>
                    <div>{user.email}</div>

                    <div><strong>Роль:</strong></div>
                    <div>{user.role}</div>

                    {user.role === 'TEACHER' && (
                        <>
                            <div><strong>Предметы:</strong></div>
                            <div>{subjectsDisplay}</div>
                        </>
                    )}

                    {user.role === 'STUDENT' && (
                        <>
                            <div><strong>Класс:</strong></div>
                            <div>{user.grade}</div>

                            <div><strong>Группа:</strong></div>
                            <div>{user.group || 'Не указана'}</div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;