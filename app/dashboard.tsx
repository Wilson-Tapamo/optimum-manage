import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import {
    FolderOpen, Users, DollarSign, TrendingUp, TrendingDown,
    Calendar, Clock, AlertCircle, CheckCircle, Plus,
    Filter, Download, Bell, Search, MoreHorizontal,
    Eye, Edit, Trash2, User, Briefcase, Activity
} from 'lucide-react';

// dictionnaire d’icônes pour les stats
const iconsMap = { FolderOpen, Users, DollarSign, TrendingUp };

const Dashboard = () => {
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [timeRange, setTimeRange] = useState('month');
    const [stats, setStats] = useState([]);
    const [projects, setProjects] = useState([]);
    const [consultants, setConsultants] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [pieData, setPieData] = useState([]);

    const [loading, setLoading] = useState(true);
    // 🔥 Appels API
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, projectsRes, consultantsRes, tasksRes, analyticsRes] = await Promise.all([
                    fetch('/api/stats'),
                    fetch('/api/projects'),
                    fetch('/api/consultants'),
                    fetch('/api/tasks'),
                    fetch('/api/analytics')
                ]);

                const statsData = await statsRes.json();
                const projectsData = await projectsRes.json();
                const consultantsData = await consultantsRes.json();
                const tasksData = await tasksRes.json();
                const analyticsData = await analyticsRes.json();

                setStats(statsData);
                setProjects(projectsData);
                setConsultants(consultantsData);
                setTasks(tasksData);
                setChartData(analyticsData);

                // calcul pieData à partir des projets
                const termines = projectsData.filter(p => p.status === "Terminé").length;
                const enCours = projectsData.filter(p => p.status === "En cours").length;
                const enAttente = projectsData.filter(p => p.status === "Planification").length;
                const total = projectsData.length || 1;
                setPieData([
                    { name: 'Terminé', value: Math.round((termines / total) * 100), color: '#10B981' },
                    { name: 'En cours', value: Math.round((enCours / total) * 100), color: '#3B82F6' },
                    { name: 'En attente', value: Math.round((enAttente / total) * 100), color: '#F59E0B' }
                ]);

            } catch (err) {
                console.error("Erreur API:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="p-6">Chargement...</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                            <p className="text-gray-600">Vue d'ensemble de votre activité</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <Filter className="w-5 h-5 text-gray-500" />
                                <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                                    <option>Tous les projets</option>
                                    <option>Projets actifs</option>
                                    <option>Projets terminés</option>
                                </select>
                            </div>
                            <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                                <Plus className="w-4 h-4" />
                                <span>Nouveau Projet</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="p-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {stats.map((stat, i) => {
                        const Icon = iconsMap[stat.icon] || FolderOpen;
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                        <p className={`text-sm ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                                            {stat.change} {stat.changeText}
                                        </p>
                                    </div>
                                    <div className={`p-3 rounded-lg ${stat.color}`}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Projects Overview */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-xl font-bold text-gray-900">Aperçu des Projets</h2>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    {projects.map((project) => (
                                        <motion.div
                                            key={project.id}
                                            whileHover={{ scale: 1.02 }}
                                            className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">{project.name}</h3>
                                                    <p className="text-sm text-gray-600">{project.description}</p>
                                                </div>
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${project.color}`}>
                                                    {project.status}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                                                <span>Échéance: {project.deadline}</span>
                                                <span>Budget: {project.budget}</span>
                                            </div>

                                            <div className="mb-3">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-sm font-medium text-gray-700">Progression</span>
                                                    <span className="text-sm font-medium text-gray-900">{project.progress}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <motion.div
                                                        className="bg-blue-600 h-2 rounded-full"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${project.progress}%` }}
                                                        transition={{ duration: 1, delay: 0.5 }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex -space-x-2">
                                                    {project.consultants.map((consultant, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium border-2 border-white"
                                                        >
                                                            {consultant}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                                    <span>{project.tasks} tâches</span>
                                                    <span>{project.activities} activités</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="space-y-6">
                        {/* Progress Chart */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-xl font-bold text-gray-900">Ma Progression</h2>
                                <p className="text-sm text-gray-600">Taux de complétion des tâches</p>
                            </div>
                            <div className="p-6">
                                <div className="w-48 h-48 mx-auto">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="space-y-2 mt-4">
                                    {pieData.map((entry, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <div
                                                    className="w-3 h-3 rounded-full mr-2"
                                                    style={{ backgroundColor: entry.color }}
                                                />
                                                <span className="text-sm text-gray-600">{entry.name}</span>
                                            </div>
                                            <span className="text-sm font-medium text-gray-900">{entry.value}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* My Tasks */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-gray-900">Mes Tâches</h2>
                                    <a href="/my-tasks" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                        Voir toutes
                                    </a>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="space-y-3">
                                    {tasks.map((task) => (
                                        <div key={task.id} className="p-3 border border-gray-200 rounded-lg">
                                            <div className="flex items-start justify-between mb-2">
                                                <h4 className="font-medium text-gray-900 text-sm">{task.title}</h4>
                                                <span className={`px-2 py-1 text-xs rounded-full ${task.priority === 'high' ? 'bg-red-100 text-red-800' :
                                                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-green-100 text-green-800'
                                                    }`}>
                                                    {task.priority}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-600 mb-2">{task.project}</p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-500">{task.dueTime}</span>
                                                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">
                                                    {task.consultant}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                    {/* Project Analytics */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">Analyse des Projets</h2>
                            <p className="text-sm text-gray-600">Évolution des projets et revenus</p>
                        </div>
                        <div className="p-6">
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip
                                            formatter={(value, name) => [
                                                name === 'projets' ? value : `${value}K FCFA`,
                                                name === 'projets' ? 'Projets' : name === 'revenus' ? 'Revenus' : 'Budget'
                                            ]}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="projets"
                                            stroke="#3B82F6"
                                            strokeWidth={2}
                                            dot={{ fill: '#3B82F6' }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="revenus"
                                            stroke="#10B981"
                                            strokeWidth={2}
                                            dot={{ fill: '#10B981' }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Team Performance */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">Performance Équipe</h2>
                            <p className="text-sm text-gray-600">Taux de complétion hebdomadaire</p>
                        </div>
                        <div className="p-6">
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip formatter={(value) => [`${value}K FCFA`, 'Budget']} />
                                        <Bar dataKey="budget" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Team Members Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 mt-8">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900">Membres de l'Équipe</h2>
                        <p className="text-sm text-gray-600">Aperçu des performances des consultants</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tâches</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TJM</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {consultants.map((consultant) => (
                                    <motion.tr
                                        key={consultant.id}
                                        whileHover={{ backgroundColor: '#F9FAFB' }}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-medium">
                                                    {consultant.avatar}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{consultant.name}</div>
                                                    <div className="text-sm text-gray-500">{consultant.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {consultant.role}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {consultant.tasks.completed}/{consultant.tasks.total}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {consultant.tjm}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`text-sm font-medium ${consultant.performance.startsWith('+') ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {consultant.performance} cette semaine
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center space-x-2">
                                                <button className="text-blue-600 hover:text-blue-800">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button className="text-gray-600 hover:text-gray-800">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button className="text-red-600 hover:text-red-800">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;