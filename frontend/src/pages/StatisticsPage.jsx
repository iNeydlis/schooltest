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

const StatisticsPage = () => {
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statistics, setStatistics] = useState({});
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [selectedSubjectData, setSelectedSubjectData] = useState(null);

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

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-2xl font-bold mb-4">Моя статистика</h2>

            <Tabs defaultValue="performance" className="w-full mb-6">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="performance">Общая статистика</TabsTrigger>
                    <TabsTrigger value="bySubject">По предметам</TabsTrigger>
                </TabsList>

                <TabsContent value="performance" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Сводные показатели</CardTitle>
                            <CardDescription>
                                Ваша успеваемость по всем предметам
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {Object.keys(statistics).length > 0 ? (
                                    Object.entries(statistics).map(([subjectName, data]) => (
                                        <Card key={data.subjectId} className="overflow-hidden">
                                            <CardHeader className="p-4 pb-2">
                                                <CardTitle className="text-base">{subjectName}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-4 pt-0">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span>Средний результат:</span>
                                                        <span className={getPerformanceColor(data.averagePercentage)}>
                              {data.averagePercentage.toFixed(1)}%
                            </span>
                                                    </div>
                                                    <Progress value={data.averagePercentage} className="h-2" />
                                                    <div className="flex justify-between text-sm">
                                                        <span>Выполнено тестов:</span>
                                                        <span>{data.completedTests}</span>
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
                                    value={selectedSubject?.toString()}
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
                                        <Card>
                                            <CardHeader className="p-4 pb-0">
                                                <CardTitle className="text-sm font-medium">Средний результат</CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-4">
                                                <div className="text-2xl font-bold">
                          <span className={getPerformanceColor(selectedSubjectData.averagePercentage)}>
                            {selectedSubjectData.averagePercentage.toFixed(1)}%
                          </span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardHeader className="p-4 pb-0">
                                                <CardTitle className="text-sm font-medium">Выполнено тестов</CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-4">
                                                <div className="text-2xl font-bold">
                                                    {selectedSubjectData.completedTests}
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardHeader className="p-4 pb-0">
                                                <CardTitle className="text-sm font-medium">Класс</CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-4">
                                                <div className="text-2xl font-bold">
                                                    {selectedSubjectData.gradeName}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <Table>
                                        <TableCaption>Результаты тестов по предмету "{subjects.find(s => s.id === selectedSubject)?.name}"</TableCaption>
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
                                            {selectedSubjectData.testStats && selectedSubjectData.testStats.length > 0 ? (
                                                selectedSubjectData.testStats.map((test) => (
                                                    <TableRow key={test.testId}>
                                                        <TableCell className="font-medium">{test.testTitle}</TableCell>
                                                        <TableCell className="text-right">{test.score} / {test.maxScore}</TableCell>
                                                        <TableCell className="text-right">
                                                            <Badge className={
                                                                test.percentage >= 90 ? "bg-green-500" :
                                                                    test.percentage >= 75 ? "bg-emerald-500" :
                                                                        test.percentage >= 60 ? "bg-amber-500" :
                                                                            "bg-red-500"
                                                            }>
                                                                {test.percentage.toFixed(1)}%
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right">{formatDate(test.completedAt)}</TableCell>
                                                        <TableCell className="text-right">{test.attemptNumber}</TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-4">
                                                        Нет данных о выполненных тестах
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
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