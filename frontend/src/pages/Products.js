import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Search, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    categoria: '',
    preco: '',
    quantidade: '',
    validade: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/produtos`);
      setProducts(response.data);
    } catch (error) {
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingProduct) {
        await axios.put(`${API_URL}/produtos/${editingProduct.id}`, {
          ...formData,
          preco: parseFloat(formData.preco),
          quantidade: parseInt(formData.quantidade)
        });
        toast.success('Produto atualizado com sucesso!');
      } else {
        await axios.post(`${API_URL}/produtos`, {
          ...formData,
          preco: parseFloat(formData.preco),
          quantidade: parseInt(formData.quantidade)
        });
        toast.success('Produto criado com sucesso!');
      }
      
      setIsDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao salvar produto');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja realmente excluir este produto?')) return;
    
    try {
      await axios.delete(`${API_URL}/produtos/${id}`);
      toast.success('Produto excluído com sucesso!');
      fetchProducts();
    } catch (error) {
      toast.error('Erro ao excluir produto');
    }
  };

  const openEditDialog = (product) => {
    setEditingProduct(product);
    setFormData({
      nome: product.nome,
      categoria: product.categoria,
      preco: product.preco.toString(),
      quantidade: product.quantidade.toString(),
      validade: product.validade || ''
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      categoria: '',
      preco: '',
      quantidade: '',
      validade: ''
    });
    setEditingProduct(null);
  };

  const filteredProducts = products.filter(product =>
    product.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="products-page">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-600 mt-1">Gerencie seu catálogo de produtos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
              data-testid="add-product-btn"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" data-testid="product-dialog">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                  data-testid="product-name-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria</Label>
                <Input
                  id="categoria"
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  required
                  data-testid="product-category-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preco">Preço (R$)</Label>
                  <Input
                    id="preco"
                    type="number"
                    step="0.01"
                    value={formData.preco}
                    onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                    required
                    data-testid="product-price-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantidade">Quantidade</Label>
                  <Input
                    id="quantidade"
                    type="number"
                    value={formData.quantidade}
                    onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })}
                    required
                    data-testid="product-quantity-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="validade">Validade (Opcional)</Label>
                <Input
                  id="validade"
                  type="date"
                  value={formData.validade}
                  onChange={(e) => setFormData({ ...formData, validade: e.target.value })}
                  data-testid="product-expiry-input"
                />
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
                  data-testid="product-cancel-btn"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600"
                  data-testid="product-save-btn"
                >
                  {editingProduct ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="backdrop-blur-sm bg-white/90 shadow-lg border-cyan-100">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar produtos por nome ou categoria..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="product-search-input"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className="backdrop-blur-sm bg-white/90 shadow-lg border-cyan-100 hover:shadow-xl transition-shadow"
              data-testid="product-card"
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg" data-testid="product-card-name">{product.nome}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">{product.categoria}</p>
                  </div>
                  {product.quantidade < 5 && (
                    <AlertTriangle className="h-5 w-5 text-orange-500" data-testid="low-stock-icon" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Preço:</span>
                  <span className="text-lg font-bold text-cyan-700" data-testid="product-card-price">
                    R$ {product.preco.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Quantidade:</span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-sm font-medium ${
                      product.quantidade < 5
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                    data-testid="product-card-quantity"
                  >
                    {product.quantidade}
                  </span>
                </div>
                {product.validade && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Validade:</span>
                    <span className="text-sm text-gray-700">{product.validade}</span>
                  </div>
                )}
                <div className="flex space-x-2 pt-3 border-t border-gray-200">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(product)}
                    className="flex-1 hover:bg-cyan-50 hover:border-cyan-300"
                    data-testid="product-edit-btn"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(product.id)}
                    className="flex-1 text-red-600 hover:bg-red-50 hover:border-red-300"
                    data-testid="product-delete-btn"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="backdrop-blur-sm bg-white/90 shadow-lg border-cyan-100">
          <CardContent className="py-12 text-center text-gray-400">
            {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
          </CardContent>
        </Card>
      )}
    </div>
  );
}