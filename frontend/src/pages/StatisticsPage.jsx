import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Book, CheckCircle, BarChart2, Award, ArrowRight } from "lucide-react";

const StatisticsPage = () => {
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statistics, setStatistics] = useState({});
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [selectedSubjectData, setSelectedSubjectData] = useState(null);
    const [performanceView, setPerformanceView] = useState('table');

    // Цветовая схема
    const GRADE_COLORS = {
        excellent: '#10B981', // Зеленый
        good: '#3B82F6',      // Синий
        average: '#F59E0B',   // Оранжевый
        poor: '#EF4444'       // Красный
    };

    useEffect(() => {
        const fetchStudentStatistics = async () => {
            try {
                setLoading(true);
                const data = await api.get(`/statistics/student/${user.id}/performance`);
                setStatistics(data);

                // Create list of subjects from the data
                const subjectsList = Object.keys(data).map(subjectName => ({
                    id: data[subjectName].subjectId,
                    name: subjectName
                }));

                setSubjects(subjectsList);

                // Set default selected subject if available
                if (subjectsList.length > 0) {
                    setSelectedSubject(subjectsList[0].id);
                    setSelectedSubjectData(data[subjectsList[0].name]);
                }

                setLoading(false);
            } catch (err) {
                setError(err.message || 'Ошибка при загрузке статистики');
                setLoading(false);
            }
        };

        if (user && user.role === 'STUDENT') {
            fetchStudentStatistics();
        }
    }, [user]);

    const handleSubjectChange = (subjectId) => {
        setSelectedSubject(subjectId);
        const subject = subjects.find(s => s.id === parseInt(subjectId));
        if (subject) {
            setSelectedSubjectData(statistics[subject.name]);
        }
    };

    // Format date to dd.mm.yyyy
    const formatDate = (dateString) => {
        if (!dateString) return 'Н/Д';
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU');
    };

    // Helper to get a performance color class based on percentage
    const getPerformanceColor = (percentage) => {
        if (percentage >= 90) return 'text-green-600';
        if (percentage >= 75) return 'text-blue-600';
        if (percentage >= 60) return 'text-amber-600';
        return 'text-red-600';
    };

    // Helper to get performance color for styling
    const getPerformanceColorHex = (percentage) => {
        if (percentage >= 90) return GRADE_COLORS.excellent;
        if (percentage >= 75) return GRADE_COLORS.good;
        if (percentage >= 60) return GRADE_COLORS.average;
        return GRADE_COLORS.poor;
    };

    // Helper to get performance text
    const getPerformanceText = (percentage) => {
        if (percentage >= 90) return 'Отлично';
        if (percentage >= 75) return 'Хорошо';
        if (percentage >= 60) return 'Удовлетворительно';
        return 'Требует улучшения';
    };

    if (user.role !== 'STUDENT') {
        return (
            <div className="container mx-auto p-4">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-xl text-white mb-6">
                    <h2 className="text-3xl font-bold">Статистика</h2>
                    <p className="opacity-80 mt-2">Статистика доступна только для учеников.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="container mx-auto p-4">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-xl text-white mb-6">
                    <h2 className="text-3xl font-bold">Статистика</h2>
                    <p className="opacity-80 mt-2">Загрузка данных...</p>
                </div>
                <div className="grid gap-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-4">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-xl text-white mb-6">
                    <h2 className="text-3xl font-bold">Статистика</h2>
                    <p className="opacity-80 mt-2">Произошла ошибка при загрузке данных</p>
                </div>
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow">
                    <p className="font-medium">Произошла ошибка:</p>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    // Get aggregate stats across all subjects
    const aggregateStats = {
        totalTests: Object.values(statistics).reduce((sum, subject) => sum + (subject.completedTests || 0), 0),
        averagePerformance: Object.values(statistics).length > 0 ?
            Object.values(statistics).reduce((sum, subject) => sum + (subject.averagePercentage || 0), 0) / Object.values(statistics).length : 0
    };

    return (
        <div className="container mx-auto p-4">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 md:p-8 rounded-xl text-white mb-6 shadow-lg">
                <h2 className="text-3xl font-bold flex items-center">
                    <BarChart2 className="mr-3" size={32} />
                    Моя статистика
                </h2>
                <p className="opacity-80 mt-2 text-lg">Отслеживайте свой прогресс и достижения</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center shadow-md">
                        <div className="bg-white/20 rounded-full p-3 mr-4">
                            <Award size={24} className="text-white" />
                        </div>
                        <div>
                            <p className="text-white/70 text-sm">Средний результат</p>
                            <p className="text-2xl font-bold">{aggregateStats.averagePerformance.toFixed(1)}%</p>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center shadow-md">
                        <div className="bg-white/20 rounded-full p-3 mr-4">
                            <CheckCircle size={24} className="text-white" />
                        </div>
                        <div>
                            <p className="text-white/70 text-sm">Всего тестов</p>
                            <p className="text-2xl font-bold">{aggregateStats.totalTests}</p>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center shadow-md">
                        <div className="bg-white/20 rounded-full p-3 mr-4">
                            <Book size={24} className="text-white" />
                        </div>
                        <div>
                            <p className="text-white/70 text-sm">Изученных предметов</p>
                            <p className="text-2xl font-bold">{Object.keys(statistics).length}</p>
                        </div>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="performance" className="w-full mb-6">
                <TabsList className="grid w-full grid-cols-2 mb-8 p-1 bg-gray-100 rounded-lg">
                    <TabsTrigger value="performance" className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-md py-3">
                        <TrendingUp className="mr-2" size={18} />
                        Общая статистика
                    </TabsTrigger>
                    <TabsTrigger value="bySubject" className="data-[state=active]:bg-white data-[state=active]:shadow-md rounded-md py-3">
                        <Book className="mr-2" size={18} />
                        По предметам
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="performance" className="space-y-6">
                    <Card className="shadow-lg overflow-hidden border-0">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                            <CardTitle className="flex items-center text-xl">
                                <TrendingUp className="mr-2 text-blue-600" size={20} />
                                Детальная информация
                            </CardTitle>
                            <CardDescription>
                                Ваши индивидуальные показатели по каждому предмету
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {Object.keys(statistics).length > 0 ? (
                                    Object.entries(statistics).map(([subjectName, data]) => (
                                        <Card key={data.subjectId} className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                                            <div className="h-2" style={{ backgroundColor: getPerformanceColorHex(data.averagePercentage) }}></div>
                                            <CardHeader className="p-4 pb-2">
                                                <div className="flex justify-between items-center">
                                                    <CardTitle className="text-base">{subjectName}</CardTitle>
                                                    {data.averagePercentage >= 0 && (
                                                        <Badge className="ml-2" style={{ backgroundColor: getPerformanceColorHex(data.averagePercentage) }}>
                                                            {getPerformanceText(data.averagePercentage)}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <CardDescription className="mt-1">{data.gradeName || 'Класс не указан'}</CardDescription>
                                            </CardHeader>
                                            <CardContent className="p-4 pt-2">
                                                <div className="space-y-4">
                                                    <div>
                                                        <div className="flex justify-between text-sm mb-1">
                                                            <span className="font-medium">Средний результат:</span>
                                                            <span className={`font-bold ${getPerformanceColor(data.averagePercentage)}`}>
                                                                {data.averagePercentage ? data.averagePercentage.toFixed(1) : '0.0'}%
                                                            </span>
                                                        </div>
                                                        <Progress
                                                            value={data.averagePercentage || 0}
                                                            className="h-2.5 rounded-full"
                                                            style={{
                                                                background: 'rgba(0,0,0,0.05)',
                                                                ['--progress-background']: getPerformanceColorHex(data.averagePercentage || 0)
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="flex items-center">
                                                            <CheckCircle size={16} className="mr-1.5 text-gray-500" />
                                                            Выполнено тестов:
                                                        </span>
                                                        <span className="font-bold">{data.completedTests || 0}</span>
                                                    </div>
                                                </div>
                                            </CardContent>

                                        </Card>
                                    ))
                                ) : (
                                    <div className="col-span-3 text-center py-12 bg-gray-50 rounded-xl shadow-inner">
                                        <div className="text-gray-400 text-lg">Нет данных о выполненных тестах</div>
                                        <div className="text-gray-500 text-sm mt-2">Пройдите тесты, чтобы увидеть свою статистику</div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="bySubject">
                    <Card className="shadow-lg overflow-hidden border-0">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                            <CardTitle className="flex items-center text-xl">
                                <Book className="mr-2 text-blue-600" size={20} />
                                Статистика по предмету
                            </CardTitle>
                            <CardDescription>
                                Выберите предмет для просмотра детальной статистики
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="mb-6">
                                <Select
                                    value={selectedSubject ? selectedSubject.toString() : ''}
                                    onValueChange={handleSubjectChange}
                                >
                                    <SelectTrigger className="w-full md:w-1/3 border-blue-200 focus:ring-blue-400">
                                        <SelectValue placeholder="Выберите предмет" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {subjects.map(subject => (
                                            <SelectItem key={subject.id} value={subject.id.toString()}>
                                                {subject.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedSubjectData ? (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <Card className="border-0 shadow-md overflow-hidden">
                                            <div className="h-2" style={{ backgroundColor: getPerformanceColorHex(selectedSubjectData.averagePercentage || 0) }}></div>
                                            <CardHeader className="p-4 pb-0">
                                                <CardTitle className="text-sm font-medium flex items-center">
                                                    <Award size={18} className="mr-2 text-blue-600" />
                                                    Средний результат
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-4">
                                                <div className="text-3xl font-bold">
                                                    <span className={getPerformanceColor(selectedSubjectData.averagePercentage || 0)}>
                                                        {selectedSubjectData.averagePercentage ? selectedSubjectData.averagePercentage.toFixed(1) : '0.0'}%
                                                    </span>
                                                </div>
                                                <div className="mt-2">
                                                    <Badge className="font-normal" style={{ backgroundColor: getPerformanceColorHex(selectedSubjectData.averagePercentage || 0) }}>
                                                        {getPerformanceText(selectedSubjectData.averagePercentage || 0)}
                                                    </Badge>
                                                </div>
                                                <Progress
                                                    value={selectedSubjectData.averagePercentage || 0}
                                                    className="h-2.5 mt-4 rounded-full"
                                                    style={{
                                                        background: 'rgba(0,0,0,0.05)',
                                                        ['--progress-background']: getPerformanceColorHex(selectedSubjectData.averagePercentage || 0)
                                                    }}
                                                />
                                            </CardContent>
                                        </Card>
                                        <Card className="border-0 shadow-md overflow-hidden">
                                            <div className="h-2 bg-blue-500"></div>
                                            <CardHeader className="p-4 pb-0">
                                                <CardTitle className="text-sm font-medium flex items-center">
                                                    <CheckCircle size={18} className="mr-2 text-blue-600" />
                                                    Выполнено тестов
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-4">
                                                <div className="text-3xl font-bold">
                                                    {selectedSubjectData.completedTests || 0}
                                                </div>
                                                <div className="text-sm text-gray-500 mt-2">
                                                    {selectedSubjectData.completedTests > 0 ? 'Хороший прогресс!' : 'Пока нет выполненных тестов'}
                                                </div>
                                                {selectedSubjectData.completedTests > 0 && (
                                                    <Progress
                                                        value={100}
                                                        className="h-2.5 mt-4 rounded-full"
                                                        style={{
                                                            background: 'rgba(0,0,0,0.05)',
                                                            ['--progress-background']: '#3B82F6'
                                                        }}
                                                    />
                                                )}
                                            </CardContent>
                                        </Card>
                                        <Card className="border-0 shadow-md overflow-hidden">
                                            <div className="h-2 bg-indigo-500"></div>
                                            <CardHeader className="p-4 pb-0">
                                                <CardTitle className="text-sm font-medium flex items-center">
                                                    <Book size={18} className="mr-2 text-blue-600" />
                                                    Класс
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-4">
                                                <div className="text-3xl font-bold">
                                                    {selectedSubjectData.gradeName || 'Н/Д'}
                                                </div>
                                                <div className="text-sm text-gray-500 mt-2">
                                                    {selectedSubjectData.gradeName ? `Программа для ${selectedSubjectData.gradeName} класса` : 'Класс не определен'}
                                                </div>
                                                {selectedSubjectData.gradeName && (
                                                    <Progress
                                                        value={100}
                                                        className="h-2.5 mt-4 rounded-full"
                                                        style={{
                                                            background: 'rgba(0,0,0,0.05)',
                                                            ['--progress-background']: '#6366F1'
                                                        }}
                                                    />
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {selectedSubjectData.testStats && selectedSubjectData.testStats.length > 0 ? (
                                        <Card className="border-0 shadow-lg overflow-hidden">
                                            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                                                <CardTitle className="flex items-center text-xl">
                                                    <BarChart2 className="mr-2 text-blue-600" size={20} />
                                                    Результаты тестов
                                                </CardTitle>
                                                <CardDescription>
                                                    Детальные результаты по каждому тесту
                                                </CardDescription>
                                                <div className="flex mt-2 space-x-2">
                                                    <button
                                                        onClick={() => setPerformanceView('table')}
                                                        className={`px-3 py-1.5 text-sm rounded-md transition-all duration-300 ${performanceView === 'table' ? 'bg-blue-500 text-white shadow-md' : 'bg-white border border-gray-200 hover:bg-gray-50'}`}
                                                    >
                                                        Таблица
                                                    </button>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-0">
                                                <div className="overflow-x-auto">
                                                    <Table>
                                                        <TableCaption>Результаты тестов по предмету "{subjects.find(s => s.id === selectedSubject)?.name || ''}"</TableCaption>
                                                        <TableHeader>
                                                            <TableRow className="bg-gray-50">
                                                                <TableHead className="font-semibold">Тест</TableHead>
                                                                <TableHead className="text-right font-semibold">Баллы</TableHead>
                                                                <TableHead className="text-right font-semibold">Результат</TableHead>
                                                                <TableHead className="text-right font-semibold">Дата</TableHead>
                                                                <TableHead className="text-right font-semibold">Попытка</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {selectedSubjectData.testStats.map((test, index) => (
                                                                <TableRow key={`${test.testId}-${index}`} className="hover:bg-blue-50/30 transition-colors">
                                                                    <TableCell className="font-medium">{test.testTitle}</TableCell>
                                                                    <TableCell className="text-right">{test.score || 0} / {test.maxScore || 0}</TableCell>
                                                                    <TableCell className="text-right">
                                                                        <Badge className={`font-normal transition-all duration-300 ${
                                                                            (test.percentage || 0) >= 90 ? "bg-green-500 hover:bg-green-600" :
                                                                                (test.percentage || 0) >= 75 ? "bg-blue-500 hover:bg-blue-600" :
                                                                                    (test.percentage || 0) >= 60 ? "bg-amber-500 hover:bg-amber-600" :
                                                                                        "bg-red-500 hover:bg-red-600"
                                                                        }`}>
                                                                            {test.percentage ? test.percentage.toFixed(1) : '0.0'}%
                                                                        </Badge>
                                                                    </TableCell>
                                                                    <TableCell className="text-right">{formatDate(test.completedAt)}</TableCell>
                                                                    <TableCell className="text-right">
                                                                        <Badge variant="outline" className="bg-gray-100">
                                                                            #{test.attemptNumber || 1}
                                                                        </Badge>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <div className="text-center py-12 bg-gray-50 rounded-xl shadow-inner">
                                            <div className="text-gray-400 text-lg">Нет данных о выполненных тестах по этому предмету</div>
                                            <div className="text-gray-500 text-sm mt-2">Пройдите тесты, чтобы увидеть свою статистику</div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-gray-50 rounded-xl shadow-inner">
                                    {subjects.length > 0 ? (
                                        <div>
                                            <div className="text-gray-400 text-lg">Выберите предмет для просмотра статистики</div>
                                            <div className="text-gray-500 text-sm mt-2">Используйте выпадающий список выше</div>
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="text-gray-400 text-lg">Нет данных о выполненных тестах</div>
                                            <div className="text-gray-500 text-sm mt-2">Пройдите тесты, чтобы увидеть свою статистику</div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default StatisticsPage;