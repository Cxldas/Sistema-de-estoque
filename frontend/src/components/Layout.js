import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, Package, TrendingUp, FileText, Users, LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/produtos', label: 'Produtos', icon: Package },
    { path: '/movimentacoes', label: 'Movimentações', icon: TrendingUp },
    { path: '/relatorios', label: 'Relatórios', icon: FileText },
    ...(user?.tipo === 'admin' ? [{ path: '/usuarios', label: 'Usuários', icon: Users }] : [])
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-cyan-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                <Package className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-700 to-blue-700 bg-clip-text text-transparent">
                Sistema de Estoque
              </span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      isActive
                        ? 'bg-cyan-100 text-cyan-700'
                        : 'text-gray-600 hover:bg-cyan-50 hover:text-cyan-600'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <div className="text-sm">
                <div className="font-semibold text-gray-800" data-testid="user-name">{user?.nome}</div>
                <div className="text-gray-500 text-xs" data-testid="user-type">
                  {user?.tipo === 'admin' ? 'Administrador' : 'Funcionário'}
                </div>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                data-testid="logout-btn"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-cyan-50"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="mobile-menu-btn"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-2" data-testid="mobile-menu">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all ${
                      isActive
                        ? 'bg-cyan-100 text-cyan-700'
                        : 'text-gray-600 hover:bg-cyan-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="px-4 py-2 text-sm">
                  <div className="font-semibold text-gray-800">{user?.nome}</div>
                  <div className="text-gray-500 text-xs">
                    {user?.tipo === 'admin' ? 'Administrador' : 'Funcionário'}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sair</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}