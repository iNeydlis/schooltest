import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const { user } = useContext(AuthContext);

    // Преобразование массива предметов в строку для отображения
    const subjectsDisplay = user.subjects ? user.subjects.join(', ') : 'Не указаны';

    return (
        <div>
            <h2>Личный кабинет</h2>

            {/* Меню тестов */}
            <div style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '8px',
                boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                marginTop: '1.5rem',
                marginBottom: '1.5rem'
            }}>
                <h3 style={{ marginBottom: '1.5rem' }}>Меню тестов</h3>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '1rem'
                }}>
                    <Link to="/tests" style={menuItemStyle}>
                        <div style={menuIconStyle}>📋</div>
                        <div>Список всех тестов</div>
                    </Link>

                    {user.role === 'STUDENT' && (
                        <Link to="/my-results" style={menuItemStyle}>
                            <div style={menuIconStyle}>📊</div>
                            <div>Мои результаты</div>
                        </Link>
                    )}

                    {(user.role === 'TEACHER' || user.role === 'ADMIN') && (
                        <Link to="/tests/create" style={menuItemStyle}>
                            <div style={menuIconStyle}>✏️</div>
                            <div>Создать тест</div>
                        </Link>
                    )}

                    {user.role === 'ADMIN' && (
                        <Link to="/admin" style={menuItemStyle}>
                            <div style={menuIconStyle}>⚙️</div>
                            <div>Панель администратора</div>
                        </Link>
                    )}
                </div>
            </div>

            {/* Информация о пользователе */}
            <div style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '8px',
                boxShadow: '0 0 10px rgba(0,0,0,0.1)'
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

// Стили для элементов меню
const menuItemStyle = {
    backgroundColor: '#f5f7fa',
    padding: '1.5rem',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textDecoration: 'none',
    color: '#333',
    transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
    border: '1px solid #eaeaea',
    textAlign: 'center'
};

// Стиль для иконок меню
const menuIconStyle = {
    fontSize: '2rem',
    marginBottom: '0.5rem'
};

export default Dashboard;