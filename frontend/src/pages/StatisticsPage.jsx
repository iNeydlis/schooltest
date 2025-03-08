// src/pages/StatisticsPage.jsx
import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const StatisticsPage = () => {
    const { user } = useContext(AuthContext);

    return (
        <div>
            <h2>Статистика</h2>
            {user.role === 'TEACHER' && (
                <div>
                    {/* Здесь будет логика для отображения статистики для учителей */}
                    <p>Статистика для учителей.</p>
                </div>
            )}
            {user.role === 'ADMIN' && (
                <div>
                    {/* Здесь будет логика для отображения статистики для администраторов */}
                    <p>Статистика для администраторов.</p>
                </div>
            )}
            {user.role === 'STUDENT' && (
                <div>
                    {/* Здесь будет логика для отображения статистики для учеников */}
                    <p>Статистика для учеников.</p>
                </div>
            )}
        </div>
    );
};

export default StatisticsPage;