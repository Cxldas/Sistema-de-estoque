import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Shield, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    tipo: 'funcionario'
  });

  useEffect(() => {
    if (currentUser?.tipo === 'admin') {
      fetchUsers();
    }
  }, [currentUser]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/usuarios`);
      setUsers(response.data);
    } catch (error) {
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post(`${API_URL}/usuarios`, formData);
      toast.success('Usuário criado com sucesso!');
      setIsDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao criar usuário');
    }
  };

  const handleDelete = async (userId) => {
    if (userId === currentUser.id) {
      toast.error('Você não pode excluir sua própria conta');
      return;
    }
    
    if (!window.confirm('Deseja realmente excluir este usuário?')) return;
    
    try {
      await axios.delete(`${API_URL}/usuarios/${userId}`);
      toast.success('Usuário excluído com sucesso!');
      fetchUsers();
    } catch (error) {
      toast.error('Erro ao excluir usuário');
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      senha: '',
      tipo: 'funcionario'
    });
  };

  // Redirect if not admin
  if (currentUser?.tipo !== 'admin') {
    return <Navigate to="/" />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="users-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usuários</h1>
          <p className="text-gray-600 mt-1">Gerencie usuários do sistema</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
              data-testid="add-user-btn"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" data-testid="user-dialog">
            <DialogHeader>
              <DialogTitle>Novo Usuário</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                  data-testid="user-name-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  data-testid="user-email-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <Input
                  id="senha"
                  type="password"
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  required
                  data-testid="user-password-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                >
                  <SelectTrigger data-testid="user-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="funcionario">Funcionário</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                  className="flex-1"
                  data-testid="user-cancel-btn"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600"
                  data-testid="user-save-btn"
                >
                  Criar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users Grid */}
      {users.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <Card
              key={user.id}
              className="backdrop-blur-sm bg-white/90 shadow-lg border-cyan-100 hover:shadow-xl transition-shadow"
              data-testid="user-card"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        user.tipo === 'admin'
                          ? 'bg-gradient-to-br from-purple-500 to-indigo-600'
                          : 'bg-gradient-to-br from-cyan-500 to-blue-600'
                      }`}
                    >
                      {user.tipo === 'admin' ? (
                        <Shield className="h-6 w-6 text-white" />
                      ) : (
                        <UserIcon className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg" data-testid="user-card-name">{user.nome}</CardTitle>
                      <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tipo:</span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      user.tipo === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-cyan-100 text-cyan-800'
                    }`}
                    data-testid="user-card-type"
                  >
                    {user.tipo === 'admin' ? 'Administrador' : 'Funcionário'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Criado em:</span>
                  <span className="text-sm text-gray-700">
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                {user.id !== currentUser.id && (
                  <div className="pt-3 border-t border-gray-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(user.id)}
                      className="w-full text-red-600 hover:bg-red-50 hover:border-red-300"
                      data-testid="user-delete-btn"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="backdrop-blur-sm bg-white/90 shadow-lg border-cyan-100">
          <CardContent className="py-12 text-center text-gray-400">
            Nenhum usuário cadastrado
          </CardContent>
        </Card>
      )}
    </div>
  );
}