import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Package, AlertTriangle, DollarSign, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function Reports() {
  const [dashboardData, setDashboardData] = useState(null);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [dashboardRes, lowStockRes] = await Promise.all([
        axios.get(`${API_URL}/relatorios/dashboard`),
        axios.get(`${API_URL}/produtos/baixo-estoque`)
      ]);
      setDashboardData(dashboardRes.data);
      setLowStockProducts(lowStockRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await axios.get(`${API_URL}/relatorios/export`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'relatorio_estoque.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Relatório exportado com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar relatório');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="reports-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600 mt-1">Visualize estatísticas e exporte dados</p>
        </div>
        <Button
          onClick={handleExportCSV}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
          data-testid="export-csv-btn"
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-cyan-100">Total de Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold" data-testid="report-total-products">
                {dashboardData?.total_products || 0}
              </div>
              <Package className="h-10 w-10 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-100">Estoque Baixo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold" data-testid="report-low-stock">
                {dashboardData?.low_stock_count || 0}
              </div>
              <AlertTriangle className="h-10 w-10 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-emerald-100">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold" data-testid="report-total-value">
                R$ {dashboardData?.total_value?.toFixed(2) || '0.00'}
              </div>
              <DollarSign className="h-10 w-10 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-100">Movimentações (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold" data-testid="report-movements">
                {dashboardData?.movement_stats?.reduce((acc, m) => acc + m.count, 0) || 0}
              </div>
              <TrendingUp className="h-10 w-10 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Products */}
      <Card className="backdrop-blur-sm bg-white/90 shadow-lg border-cyan-100">
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
            Produtos com Estoque Baixo (Menos de 5 unidades)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lowStockProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="low-stock-table">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Nome</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Categoria</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Quantidade</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Preço</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Validade</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.map((product) => (
                    <tr key={product.id} className="border-b border-gray-100 hover:bg-orange-50/50">
                      <td className="py-3 px-4 font-medium">{product.nome}</td>
                      <td className="py-3 px-4 text-gray-600">{product.categoria}</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          {product.quantidade}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-700">R$ {product.preco.toFixed(2)}</td>
                      <td className="py-3 px-4 text-gray-500 text-sm">
                        {product.validade || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              Nenhum produto com estoque baixo
            </div>
          )}
        </CardContent>
      </Card>

      {/* Categories Breakdown */}
      <Card className="backdrop-blur-sm bg-white/90 shadow-lg border-cyan-100">
        <CardHeader>
          <CardTitle>Produtos por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          {dashboardData?.categories?.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.categories.map((category, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-cyan-50/50 rounded-lg">
                  <span className="font-medium text-gray-700">{category.categoria}</span>
                  <span className="px-3 py-1 bg-cyan-600 text-white rounded-full text-sm font-semibold">
                    {category.count} {category.count === 1 ? 'produto' : 'produtos'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              Nenhuma categoria disponível
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}