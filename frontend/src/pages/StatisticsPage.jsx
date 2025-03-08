import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
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
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    AreaChart,
    Area
} from 'recharts';

const StatisticsPage = () => {
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statistics, setStatistics] = useState({});
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [selectedSubjectData, setSelectedSubjectData] = useState(null);
    const [performanceView, setPerformanceView] = useState('chart');
    const [chartType, setChartType] = useState('bar');

    // Цветовая схема для графиков
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A259FF', '#4CAF50', '#F44336', '#3F51B5', '#2196F3', '#009688'];
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
        if (percentage >= 75) return 'text-emerald-500';
        if (percentage >= 60) return 'text-amber-500';
        return 'text-red-500';
    };

    // Helper to get performance color for charts
    const getPerformanceColorHex = (percentage) => {
        if (percentage >= 90) return GRADE_COLORS.excellent;
        if (percentage >= 75) return GRADE_COLORS.good;
        if (percentage >= 60) return GRADE_COLORS.average;
        return GRADE_COLORS.poor;
    };

    // Prepare data for charts
    const prepareOverviewChartData = () => {
        if (!statistics || Object.keys(statistics).length === 0) {
            return [];
        }

        return Object.entries(statistics).map(([subjectName, data], index) => ({
            name: subjectName,
            Результат: data.averagePercentage || 0,
            Тесты: data.completedTests || 0,
            fill: COLORS[index % COLORS.length]
        }));
    };

    const prepareSubjectTestsData = () => {
        if (!selectedSubjectData || !selectedSubjectData.testStats || !Array.isArray(selectedSubjectData.testStats)) {
            return [];
        }

        return selectedSubjectData.testStats.map((test, index) => ({
            name: test.testTitle.length > 15 ? test.testTitle.substring(0, 15) + '...' : test.testTitle,
            fullName: test.testTitle,
            Результат: test.percentage || 0,
            Баллы: test.maxScore > 0 ? ((test.score / test.maxScore) * 100) || 0 : 0,
            Попытка: test.attemptNumber || 1,
            Дата: formatDate(test.completedAt),
            color: getPerformanceColorHex(test.percentage || 0)
        }));
    };

    // Custom tooltip for charts
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-2 border border-gray-200 shadow-md rounded">
                    <p className="font-bold">{payload[0].payload.fullName || label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color || '#000' }}>
                            {entry.name}: {(typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value)}%
                        </p>
                    ))}
                    {payload[0].payload.Дата && <p>Дата: {payload[0].payload.Дата}</p>}
                    {payload[0].payload.Попытка && <p>Попытка: {payload[0].payload.Попытка}</p>}
                </div>
            );
        }
        return null;
    };

    if (user.role !== 'STUDENT') {
        return (
            <div className="container mx-auto p-4">
                <h2 className="text-2xl font-bold mb-4">Статистика</h2>
                <p>Статистика доступна только для учеников.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="container mx-auto p-4">
                <h2 className="text-2xl font-bold mb-4">Статистика</h2>
                <div className="grid gap-4">
                    <Skeleton className="h-[150px] w-full" />
                    <Skeleton className="h-[400px] w-full" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-4">
                <h2 className="text-2xl font-bold mb-4">Статистика</h2>
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <p>Произошла ошибка: {error}</p>
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

    // Prepare chart data and ensure it's not empty
    const overviewChartData = prepareOverviewChartData();
    const subjectTestsData = prepareSubjectTestsData();

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-2xl font-bold mb-4">Моя статистика</h2>

            <Tabs defaultValue="performance" className="w-full mb-6">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="performance">Общая статистика</TabsTrigger>
                    <TabsTrigger value="bySubject">По предметам</TabsTrigger>
                </TabsList>

                <TabsContent value="performance" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Card>
                            <CardHeader className="p-4 pb-0">
                                <CardTitle className="text-sm font-medium">Средний результат</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4">
                                <div className="text-2xl font-bold">
                                    <span className={getPerformanceColor(aggregateStats.averagePerformance)}>
                                        {aggregateStats.averagePerformance.toFixed(1)}%
                                    </span>
                                </div>
                                <Progress value={aggregateStats.averagePerformance}
                                          className="h-2 mt-2"
                                          style={{
                                              background: 'rgba(0,0,0,0.1)',
                                              ['--progress-background']: getPerformanceColorHex(aggregateStats.averagePerformance)
                                          }}
                                />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="p-4 pb-0">
                                <CardTitle className="text-sm font-medium">Всего тестов</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4">
                                <div className="text-2xl font-bold">
                                    {aggregateStats.totalTests}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="p-4 pb-0">
                                <CardTitle className="text-sm font-medium">Изученных предметов</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4">
                                <div className="text-2xl font-bold">
                                    {Object.keys(statistics).length}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Сравнение результатов по предметам</CardTitle>
                            <CardDescription>
                                Визуализация вашей успеваемости по всем предметам
                            </CardDescription>
                            <div className="flex mt-2 space-x-2">
                                <button
                                    onClick={() => setChartType('bar')}
                                    className={`px-3 py-1 text-sm rounded ${chartType === 'bar' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                                >
                                    Столбцы
                                </button>
                                <button
                                    onClick={() => setChartType('radar')}
                                    className={`px-3 py-1 text-sm rounded ${chartType === 'radar' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                                >
                                    Радар
                                </button>
                                <button
                                    onClick={() => setChartType('pie')}
                                    className={`px-3 py-1 text-sm rounded ${chartType === 'pie' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                                >
                                    Круговая
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {overviewChartData.length > 0 ? (
                                <div className="h-80 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        {chartType === 'bar' && (
                                            <BarChart
                                                data={overviewChartData}
                                                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                                                <YAxis domain={[0, 100]} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Legend />
                                                <Bar dataKey="Результат" fill="#8884d8" />
                                            </BarChart>
                                        )}
                                        {chartType === 'radar' && (
                                            <RadarChart outerRadius={90} width={500} height={250} data={overviewChartData}>
                                                <PolarGrid />
                                                <PolarAngleAxis dataKey="name" />
                                                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                                <Radar name="Результат" dataKey="Результат" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                                                <Legend />
                                                <Tooltip content={<CustomTooltip />} />
                                            </RadarChart>
                                        )}
                                        {chartType === 'pie' && (
                                            <PieChart width={400} height={300}>
                                                <Pie
                                                    data={overviewChartData}
                                                    dataKey="Результат"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={80}
                                                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                >
                                                    {overviewChartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<CustomTooltip />} />
                                                <Legend />
                                            </PieChart>
                                        )}
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    Нет данных о выполненных тестах
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Детальная информация</CardTitle>
                            <CardDescription>
                                Ваши индивидуальные показатели по каждому предмету
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {Object.keys(statistics).length > 0 ? (
                                    Object.entries(statistics).map(([subjectName, data]) => (
                                        <Card key={data.subjectId} className="overflow-hidden border-t-4" style={{ borderTopColor: getPerformanceColorHex(data.averagePercentage) }}>
                                            <CardHeader className="p-4 pb-2">
                                                <CardTitle className="text-base">{subjectName}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-4 pt-0">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span>Средний результат:</span>
                                                        <span className={getPerformanceColor(data.averagePercentage)}>
                                                            {data.averagePercentage ? data.averagePercentage.toFixed(1) : '0.0'}%
                                                        </span>
                                                    </div>
                                                    <Progress
                                                        value={data.averagePercentage || 0}
                                                        className="h-2"
                                                        style={{
                                                            background: 'rgba(0,0,0,0.1)',
                                                            ['--progress-background']: getPerformanceColorHex(data.averagePercentage || 0)
                                                        }}
                                                    />
                                                    <div className="flex justify-between text-sm">
                                                        <span>Выполнено тестов:</span>
                                                        <span>{data.completedTests || 0}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span>Класс:</span>
                                                        <span>{data.gradeName || 'Н/Д'}</span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : (
                                    <div className="col-span-3 text-center py-8">
                                        Нет данных о выполненных тестах
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="bySubject">
                    <Card>
                        <CardHeader>
                            <CardTitle>Статистика по предмету</CardTitle>
                            <CardDescription>
                                Выберите предмет для просмотра детальной статистики
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4">
                                <Select
                                    value={selectedSubject ? selectedSubject.toString() : ''}
                                    onValueChange={handleSubjectChange}
                                >
                                    <SelectTrigger className="w-full md:w-1/3">
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
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Card className="border-t-4" style={{ borderTopColor: getPerformanceColorHex(selectedSubjectData.averagePercentage || 0) }}>
                                            <CardHeader className="p-4 pb-0">
                                                <CardTitle className="text-sm font-medium">Средний результат</CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-4">
                                                <div className="text-2xl font-bold">
                                                    <span className={getPerformanceColor(selectedSubjectData.averagePercentage || 0)}>
                                                        {selectedSubjectData.averagePercentage ? selectedSubjectData.averagePercentage.toFixed(1) : '0.0'}%
                                                    </span>
                                                </div>
                                                <Progress
                                                    value={selectedSubjectData.averagePercentage || 0}
                                                    className="h-2 mt-2"
                                                    style={{
                                                        background: 'rgba(0,0,0,0.1)',
                                                        ['--progress-background']: getPerformanceColorHex(selectedSubjectData.averagePercentage || 0)
                                                    }}
                                                />
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardHeader className="p-4 pb-0">
                                                <CardTitle className="text-sm font-medium">Выполнено тестов</CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-4">
                                                <div className="text-2xl font-bold">
                                                    {selectedSubjectData.completedTests || 0}
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardHeader className="p-4 pb-0">
                                                <CardTitle className="text-sm font-medium">Класс</CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-4">
                                                <div className="text-2xl font-bold">
                                                    {selectedSubjectData.gradeName || 'Н/Д'}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {selectedSubjectData.testStats && selectedSubjectData.testStats.length > 0 ? (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Динамика успеваемости</CardTitle>
                                                <CardDescription>
                                                    Результаты по последним тестам
                                                </CardDescription>
                                                <div className="flex mt-2 space-x-2">
                                                    <button
                                                        onClick={() => setPerformanceView('chart')}
                                                        className={`px-3 py-1 text-sm rounded ${performanceView === 'chart' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                                                    >
                                                        График
                                                    </button>
                                                    <button
                                                        onClick={() => setPerformanceView('table')}
                                                        className={`px-3 py-1 text-sm rounded ${performanceView === 'table' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                                                    >
                                                        Таблица
                                                    </button>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                {performanceView === 'chart' ? (
                                                    <div className="h-80 w-full">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <AreaChart
                                                                data={subjectTestsData}
                                                                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                                            >
                                                                <CartesianGrid strokeDasharray="3 3" />
                                                                <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                                                                <YAxis domain={[0, 100]} />
                                                                <Tooltip content={<CustomTooltip />} />
                                                                <Legend />
                                                                <Area type="monotone" dataKey="Результат" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                                                                <Area type="monotone" dataKey="Баллы" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
                                                            </AreaChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                ) : (
                                                    <Table>
                                                        <TableCaption>Результаты тестов по предмету "{subjects.find(s => s.id === selectedSubject)?.name || ''}"</TableCaption>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Тест</TableHead>
                                                                <TableHead className="text-right">Баллы</TableHead>
                                                                <TableHead className="text-right">Результат</TableHead>
                                                                <TableHead className="text-right">Дата</TableHead>
                                                                <TableHead className="text-right">Попытка</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {selectedSubjectData.testStats.map((test, index) => (
                                                                <TableRow key={`${test.testId}-${index}`}>
                                                                    <TableCell className="font-medium">{test.testTitle}</TableCell>
                                                                    <TableCell className="text-right">{test.score || 0} / {test.maxScore || 0}</TableCell>
                                                                    <TableCell className="text-right">
                                                                        <Badge className={
                                                                            (test.percentage || 0) >= 90 ? "bg-green-500" :
                                                                                (test.percentage || 0) >= 75 ? "bg-emerald-500" :
                                                                                    (test.percentage || 0) >= 60 ? "bg-amber-500" :
                                                                                        "bg-red-500"
                                                                        }>
                                                                            {test.percentage ? test.percentage.toFixed(1) : '0.0'}%
                                                                        </Badge>
                                                                    </TableCell>
                                                                    <TableCell className="text-right">{formatDate(test.completedAt)}</TableCell>
                                                                    <TableCell className="text-right">{test.attemptNumber || 1}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                                            Нет данных о выполненных тестах по этому предмету
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    {subjects.length > 0 ?
                                        "Выберите предмет для просмотра статистики" :
                                        "Нет данных о выполненных тестах"
                                    }
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