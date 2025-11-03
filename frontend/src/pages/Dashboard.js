import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, AlertTriangle, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { toast } from 'sonner';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`${API_URL}/relatorios/dashboard`);
      setDashboardData(response.data);
    } catch (error) {
      toast.error('Erro ao carregar dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  const categoryData = {
    labels: dashboardData?.categories?.map(c => c.categoria) || [],
    datasets: [
      {
        label: 'Produtos por Categoria',
        data: dashboardData?.categories?.map(c => c.count) || [],
        backgroundColor: [
          'rgba(6, 182, 212, 0.8)',
          'rgba(14, 165, 233, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(99, 102, 241, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  };

  const movementData = {
    labels: dashboardData?.movement_stats?.map(m => m.tipo === 'entrada' ? 'Entradas' : 'Saídas') || [],
    datasets: [
      {
        label: 'Movimentações (últimos 30 dias)',
        data: dashboardData?.movement_stats?.map(m => m.count) || [],
        backgroundColor: ['rgba(16, 185, 129, 0.8)', 'rgba(239, 68, 68, 0.8)'],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
    },
  };

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Visão geral do seu estoque</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white border-0 shadow-lg" data-testid="total-products-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-cyan-100">Total de Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold" data-testid="total-products-count">{dashboardData?.total_products || 0}</div>
              <Package className="h-10 w-10 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white border-0 shadow-lg" data-testid="low-stock-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-100">Estoque Baixo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold" data-testid="low-stock-count">{dashboardData?.low_stock_count || 0}</div>
              <AlertTriangle className="h-10 w-10 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-lg" data-testid="total-value-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-emerald-100">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold" data-testid="total-value-amount">
                R$ {dashboardData?.total_value?.toFixed(2) || '0.00'}
              </div>
              <DollarSign className="h-10 w-10 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-lg" data-testid="movements-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-100">Movimentações Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold" data-testid="movements-count">
                {dashboardData?.recent_movements?.length || 0}
              </div>
              <TrendingUp className="h-10 w-10 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="backdrop-blur-sm bg-white/90 shadow-lg border-cyan-100">
          <CardHeader>
            <CardTitle>Produtos por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {dashboardData?.categories?.length > 0 ? (
                <Doughnut data={categoryData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  Nenhum dado disponível
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm bg-white/90 shadow-lg border-cyan-100">
          <CardHeader>
            <CardTitle>Movimentações (últimos 30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {dashboardData?.movement_stats?.length > 0 ? (
                <Bar data={movementData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  Nenhum dado disponível
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Movements Table */}
      <Card className="backdrop-blur-sm bg-white/90 shadow-lg border-cyan-100">
        <CardHeader>
          <CardTitle>Movimentações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {dashboardData?.recent_movements?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="recent-movements-table">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Produto</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Tipo</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Quantidade</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Usuário</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.recent_movements.map((movement, idx) => (
                    <tr key={movement.id} className="border-b border-gray-100 hover:bg-cyan-50/50">
                      <td className="py-3 px-4">{movement.produto_nome}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            movement.tipo === 'entrada'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {movement.tipo === 'entrada' ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          )}
                          {movement.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                        </span>
                      </td>
                      <td className="py-3 px-4">{movement.quantidade}</td>
                      <td className="py-3 px-4 text-gray-600">{movement.usuario_nome}</td>
                      <td className="py-3 px-4 text-gray-500 text-sm">
                        {new Date(movement.data).toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              Nenhuma movimentação recente
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}