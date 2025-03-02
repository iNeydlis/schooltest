import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Header = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <header style={{
            backgroundColor: '#4a6baf',
            color: 'white',
            padding: '1rem',
            marginBottom: '2rem'
        }}>
            <div className="container" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <h1 style={{ fontSize: '1.5rem' }}>Школьная система тестирования</h1>
                {user ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span>Привет, {user.fullName} ({user.role})</span>
                        {user.role === 'ADMIN' && (
                            <Link to="/admin" style={{ color: 'white', textDecoration: 'none' }}>
                                Админ панель
                            </Link>
                        )}
                        <button onClick={handleLogout} style={{
                            backgroundColor: 'transparent',
                            border: '1px solid white',
                            padding: '0.25rem 0.5rem'
                        }}>
                            Выйти
                        </button>
                    </div>
                ) : (
                    <Link to="/login" style={{ color: 'white', textDecoration: 'none' }}>
                        Войти
                    </Link>
                )}
            </div>
        </header>
    );
};

export default Header;