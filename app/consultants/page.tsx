"use client";

import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreVertical, Users, TrendingUp, Star, Mail, Phone, Calendar, DollarSign, BarChart3, Eye, GitCompare, Award, Clock, CheckCircle, Target, Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const ConsultantsPage = () => {
  const [consultants, setConsultants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [availableFilter, setAvailableFilter] = useState('');
  const [sortBy, setSortBy] = useState('reliability');
  const [selectedConsultant, setSelectedConsultant] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState([]);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonData, setComparisonData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Données de démonstration
  const mockConsultants = [
    {
      id: '1',
      user: {
        firstName: 'Marie',
        lastName: 'Dubois',
        email: 'marie.dubois@email.com',
        phone: '+33 6 12 34 56 78',
        avatar: null
      },
      tjm: 600,
      specialization: 'Développement Frontend',
      skills: ['React', 'Vue.js', 'TypeScript', 'CSS'],
      experience: 5,
      reliability: 95,
      isAvailable: true,
      stats: {
        totalTasks: 45,
        completedTasks: 42,
        completionRate: 93,
        avgReliability: 95,
        totalEarnings: 85000
      }
    },
    {
      id: '2',
      user: {
        firstName: 'Jean',
        lastName: 'Martin',
        email: 'jean.martin@email.com',
        phone: '+33 6 98 76 54 32',
        avatar: null
      },
      tjm: 700,
      specialization: 'Architecture Cloud',
      skills: ['AWS', 'Docker', 'Kubernetes', 'Python'],
      experience: 8,
      reliability: 88,
      isAvailable: false,
      stats: {
        totalTasks: 38,
        completedTasks: 35,
        completionRate: 92,
        avgReliability: 88,
        totalEarnings: 125000
      }
    },
    {
      id: '3',
      user: {
        firstName: 'Sophie',
        lastName: 'Bernard',
        email: 'sophie.bernard@email.com',
        phone: '+33 6 45 67 89 01',
        avatar: null
      },
      tjm: 550,
      specialization: 'UX/UI Design',
      skills: ['Figma', 'Adobe XD', 'Sketch', 'Prototyping'],
      experience: 4,
      reliability: 92,
      isAvailable: true,
      stats: {
        totalTasks: 52,
        completedTasks: 48,
        completionRate: 92,
        avgReliability: 92,
        totalEarnings: 72000
      }
    }
  ];

  const allSkills = [...new Set(mockConsultants.flatMap(c => c.skills))];

  useEffect(() => {
    fetchConsultants();
  }, [searchTerm, selectedSkill, availableFilter, sortBy, currentPage]);

  const fetchConsultants = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        ...(searchTerm && { search: searchTerm }),
        ...(selectedSkill && { skill: selectedSkill }),
        ...(availableFilter && { available: availableFilter }),
        sortBy,
        sortOrder: 'desc'
      });

      const response = await fetch(`/api/consultants?${params}`);
      const data = await response.json();
      
      setConsultants(data.consultants);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error('Erreur lors du chargement des consultants:', error);
      // Données de démonstration en cas d'erreur
      setConsultants(mockConsultants);
    }
    setLoading(false);
  };

  const fetchConsultantDetails = async (id) => {
    try {
      const response = await fetch(`/api/consultants/${id}`);
      const consultant = await response.json();
      
      const statsResponse = await fetch(`/api/consultants/${id}/stats`);
      const stats = await statsResponse.json();
      
      setSelectedConsultant({ ...consultant, stats });
    } catch (error) {
      console.error('Erreur lors du chargement des détails:', error);
    }
  };

  const handleCompareConsultants = async () => {
    if (selectedForComparison.length === 2) {
      try {
        const response = await fetch(`/api/consultants/compare?ids=${selectedForComparison.join(',')}`);
        const data = await response.json();
        setComparisonData(data);
        setShowComparison(true);
      } catch (error) {
        console.error('Erreur lors de la comparaison:', error);
      }
    }
  };

  const toggleCompareSelection = (consultantId) => {
    if (selectedForComparison.includes(consultantId)) {
      setSelectedForComparison(prev => prev.filter(id => id !== consultantId));
    } else if (selectedForComparison.length < 2) {
      setSelectedForComparison(prev => [...prev, consultantId]);
    }
  };

  const StatCard = ({ icon: Icon, title, value, color = "blue", subtitle }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-lg ${color === 'blue' ? 'bg-blue-50' : color === 'green' ? 'bg-green-50' : color === 'purple' ? 'bg-purple-50' : 'bg-orange-50'}`}>
            <Icon className={`h-6 w-6 ${color === 'blue' ? 'text-blue-600' : color === 'green' ? 'text-green-600' : color === 'purple' ? 'text-purple-600' : 'text-orange-600'}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
        </div>
      </div>
    </div>
  );

  const ConsultantCard = ({ consultant }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
              {consultant.user.firstName[0]}{consultant.user.lastName[0]}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {consultant.user.firstName} {consultant.user.lastName}
              </h3>
              <p className="text-sm text-gray-600">{consultant.specialization}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {compareMode && (
              <button
                onClick={() => toggleCompareSelection(consultant.id)}
                className={`p-2 rounded-lg border transition-colors ${
                  selectedForComparison.includes(consultant.id)
                    ? 'bg-blue-50 border-blue-200 text-blue-600'
                    : 'border-gray-200 text-gray-400 hover:text-gray-600'
                }`}
              >
                <CheckCircle className="h-4 w-4" />
              </button>
            )}
            <button className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">TJM</span>
            <span className="font-semibold text-gray-900">{consultant.tjm} FCFA</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Fiabilité</span>
            <div className="flex items-center space-x-2">
              <div className="w-20 h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-2 bg-green-500 rounded-full"
                  style={{ width: `${consultant.reliability}%` }}
                />
              </div>
              <span className="font-semibold text-gray-900">{consultant.reliability}%</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Statut</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              consultant.isAvailable 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {consultant.isAvailable ? 'Disponible' : 'Occupé'}
            </span>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            {consultant.skills.slice(0, 3).map((skill, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium"
              >
                {skill}
              </span>
            ))}
            {consultant.skills.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                +{consultant.skills.length - 3}
              </span>
            )}
          </div>
        </div>

        <div className="mt-6 flex space-x-3">
          <button
            onClick={() => fetchConsultantDetails(consultant.id)}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Voir profil
          </button>
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <Mail className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const ConsultantModal = ({ consultant, onClose }) => {
    if (!consultant) return null;

    const performanceData = [
      { month: 'Jan', tasks: 4, reliability: 95 },
      { month: 'Fév', tasks: 6, reliability: 92 },
      { month: 'Mar', tasks: 5, reliability: 98 },
      { month: 'Avr', tasks: 7, reliability: 94 },
      { month: 'Mai', tasks: 8, reliability: 96 },
      { month: 'Jun', tasks: 6, reliability: 93 }
    ];

    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="p-6 bg-white">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xl">
                  {consultant.user.firstName[0]}{consultant.user.lastName[0]}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {consultant.user.firstName} {consultant.user.lastName}
                  </h2>
                  <p className="text-gray-600">{consultant.specialization}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-2xl"
              >
                ×
              </button>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Informations personnelles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Informations personnelles</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-900">{consultant.user.email}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-900">{consultant.user.phone}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-900">{consultant.experience} ans d'expérience</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-900">{consultant.tjm} FCFA / jour</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Statistiques</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{consultant.stats?.totalTasks || 0}</div>
                    <div className="text-sm text-blue-600">Tâches totales</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{consultant.stats?.completionRate || 0}%</div>
                    <div className="text-sm text-green-600">Taux de réussite</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{consultant.reliability}%</div>
                    <div className="text-sm text-purple-600">Fiabilité</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{consultant.stats?.totalEarnings?.toLocaleString() || 0} FCFA</div>
                    <div className="text-sm text-orange-600">Revenus totaux</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Compétences */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Compétences</h3>
              <div className="flex flex-wrap gap-3">
                {consultant.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Graphique de performance */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance des 6 derniers mois</h3>
              <div className="h-64 bg-gray-50 rounded-lg p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="tasks" fill="#3B82F6" name="Tâches" />
                    <Line yAxisId="right" type="monotone" dataKey="reliability" stroke="#10B981" strokeWidth={2} name="Fiabilité %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ComparisonModal = ({ data, onClose }) => {
    if (!data) return null;

    const consultant1 = data.consultants[0];
    const consultant2 = data.consultants[1];

    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Comparaison des consultants</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-2xl"
              >
                ×
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 gap-8">
              {/* Consultant 1 */}
              <div className="space-y-6">
                <div className="text-center">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-2xl mx-auto mb-4">
                    {consultant1.consultant.user.firstName[0]}{consultant1.consultant.user.lastName[0]}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {consultant1.consultant.user.firstName} {consultant1.consultant.user.lastName}
                  </h3>
                  <p className="text-gray-600">{consultant1.consultant.specialization}</p>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Statistiques clés</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tâches totales</span>
                        <span className="font-semibold">{consultant1.stats.totalTasks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Taux de réussite</span>
                        <span className="font-semibold">{consultant1.stats.completionRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fiabilité</span>
                        <span className="font-semibold">{consultant1.stats.reliability}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">TJM</span>
                        <span className="font-semibold">{consultant1.consultant.tjm} FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Revenus totaux</span>
                        <span className="font-semibold">{consultant1.stats.totalEarnings.toLocaleString()} FCFA</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Compétences</h4>
                    <div className="flex flex-wrap gap-2">
                      {consultant1.consultant.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Consultant 2 */}
              <div className="space-y-6">
                <div className="text-center">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center text-white font-semibold text-2xl mx-auto mb-4">
                    {consultant2.consultant.user.firstName[0]}{consultant2.consultant.user.lastName[0]}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {consultant2.consultant.user.firstName} {consultant2.consultant.user.lastName}
                  </h3>
                  <p className="text-gray-600">{consultant2.consultant.specialization}</p>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Statistiques clés</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tâches totales</span>
                        <span className="font-semibold">{consultant2.stats.totalTasks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Taux de réussite</span>
                        <span className="font-semibold">{consultant2.stats.completionRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fiabilité</span>
                        <span className="font-semibold">{consultant2.stats.reliability}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">TJM</span>
                        <span className="font-semibold">{consultant2.consultant.tjm} FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Revenus totaux</span>
                        <span className="font-semibold">{consultant2.stats.totalEarnings.toLocaleString()} FCFA</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Compétences</h4>
                    <div className="flex flex-wrap gap-2">
                      {consultant2.consultant.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className=" px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Consultants</h1>
              <p className="text-gray-600 mt-1">Gérez votre équipe de consultants</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  setCompareMode(!compareMode);
                  setSelectedForComparison([]);
                }}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  compareMode
                    ? 'bg-blue-50 border-blue-200 text-blue-600'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <GitCompare className="h-4 w-4 mr-2 inline" />
                Mode comparaison
              </button>
              {compareMode && selectedForComparison.length === 2 && (
                <button
                  onClick={handleCompareConsultants}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Comparer
                </button>
              )}
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="h-4 w-4 mr-2 inline" />
                Nouveau consultant
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Users}
            title="Total consultants"
            value={consultants.length}
            color="blue"
          />
          <StatCard
            icon={CheckCircle}
            title="Disponibles"
            value={consultants.filter(c => c.isAvailable).length}
            color="green"
          />
          <StatCard
            icon={TrendingUp}
            title="Fiabilité moyenne"
            value={`${Math.round(consultants.reduce((acc, c) => acc + c.reliability, 0) / consultants.length || 0)}%`}
            color="purple"
          />
          <StatCard
            icon={DollarSign}
            title="TJM moyen"
            value={`${Math.round(consultants.reduce((acc, c) => acc + c.tjm, 0) / consultants.length || 0)} FCFA`}
            color="orange"
          />
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un consultant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Toutes les compétences</option>
              {allSkills.map(skill => (
                <option key={skill} value={skill}>{skill}</option>
              ))}
            </select>

            <select
              value={availableFilter}
              onChange={(e) => setAvailableFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tous les statuts</option>
              <option value="true">Disponibles</option>
              <option value="false">Occupés</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="reliability">Trier par fiabilité</option>
              <option value="experience">Trier par expérience</option>
              <option value="tjm">Trier par TJM</option>
              <option value="name">Trier par nom</option>
            </select>
          </div>
        </div>

        {/* Liste des consultants */}
        <div className="space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="animate-pulse">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="h-12 w-12 bg-gray-300 rounded-full"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-300 rounded w-32"></div>
                        <div className="h-3 bg-gray-300 rounded w-24"></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-3 bg-gray-300 rounded"></div>
                      <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                      <div className="h-8 bg-gray-300 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : consultants.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun consultant trouvé</h3>
              <p className="text-gray-600">Essayez de modifier vos critères de recherche.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {consultants.map((consultant) => (
                <ConsultantCard key={consultant.id} consultant={consultant} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 pt-8">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 rounded-lg ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de détails du consultant */}
      {selectedConsultant && (
        <ConsultantModal
          consultant={selectedConsultant}
          onClose={() => setSelectedConsultant(null)}
        />
      )}

      {/* Modal de comparaison */}
      {showComparison && comparisonData && (
        <ComparisonModal
          data={comparisonData}
          onClose={() => {
            setShowComparison(false);
            setComparisonData(null);
            setSelectedForComparison([]);
            setCompareMode(false);
          }}
        />
      )}
    </div>
  );
};

export default ConsultantsPage;