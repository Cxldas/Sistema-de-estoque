import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Mail, Lock, User } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const { login, register, forgotPassword } = useAuth();
  const navigate = useNavigate();
  
  const [loginData, setLoginData] = useState({ email: '', senha: '' });
  const [registerData, setRegisterData] = useState({ nome: '', email: '', senha: '' });
  const [forgotEmail, setForgotEmail] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(loginData.email, loginData.senha);
      toast.success('Login realizado com sucesso!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await register(registerData.nome, registerData.email, registerData.senha);
      toast.success('Cadastro realizado! Faça login para continuar.');
      setRegisterData({ nome: '', email: '', senha: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await forgotPassword(forgotEmail);
      if (response.reset_token) {
        setResetToken(response.reset_token);
        toast.success(`Token de recuperação: ${response.reset_token}`);
      } else {
        toast.success(response.message);
      }
    } catch (error) {
      toast.error('Erro ao solicitar recuperação de senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-100 to-teal-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-lg mb-4">
            <Package className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-700 to-blue-700 bg-clip-text text-transparent">
            Sistema de Estoque
          </h1>
          <p className="text-gray-600 mt-2">Gerencie seu inventário com eficiência</p>
        </div>

        {!showForgot ? (
          <Card className="backdrop-blur-sm bg-white/90 shadow-xl border-cyan-100">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Bem-vindo</CardTitle>
              <CardDescription className="text-center">
                Acesse sua conta ou crie uma nova
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login" data-testid="login-tab">Login</TabsTrigger>
                  <TabsTrigger value="register" data-testid="register-tab">Cadastrar</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4" data-testid="login-form">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="seu@email.com"
                          className="pl-10"
                          value={loginData.email}
                          onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                          required
                          data-testid="login-email-input"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-senha">Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="login-senha"
                          type="password"
                          placeholder="••••••••"
                          className="pl-10"
                          value={loginData.senha}
                          onChange={(e) => setLoginData({ ...loginData, senha: e.target.value })}
                          required
                          data-testid="login-password-input"
                        />
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="link"
                      className="p-0 h-auto text-cyan-600 text-sm"
                      onClick={() => setShowForgot(true)}
                      data-testid="forgot-password-link"
                    >
                      Esqueceu sua senha?
                    </Button>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                      disabled={loading}
                      data-testid="login-submit-btn"
                    >
                      {loading ? 'Entrando...' : 'Entrar'}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4" data-testid="register-form">
                    <div className="space-y-2">
                      <Label htmlFor="register-nome">Nome Completo</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="register-nome"
                          type="text"
                          placeholder="Seu nome"
                          className="pl-10"
                          value={registerData.nome}
                          onChange={(e) => setRegisterData({ ...registerData, nome: e.target.value })}
                          required
                          data-testid="register-name-input"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="seu@email.com"
                          className="pl-10"
                          value={registerData.email}
                          onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                          required
                          data-testid="register-email-input"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-senha">Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="register-senha"
                          type="password"
                          placeholder="••••••••"
                          className="pl-10"
                          value={registerData.senha}
                          onChange={(e) => setRegisterData({ ...registerData, senha: e.target.value })}
                          required
                          data-testid="register-password-input"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                      disabled={loading}
                      data-testid="register-submit-btn"
                    >
                      {loading ? 'Cadastrando...' : 'Criar Conta'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <Card className="backdrop-blur-sm bg-white/90 shadow-xl border-cyan-100">
            <CardHeader>
              <CardTitle>Recuperar Senha</CardTitle>
              <CardDescription>
                Digite seu email para receber o token de recuperação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgotPassword} className="space-y-4" data-testid="forgot-password-form">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-10"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      data-testid="forgot-email-input"
                    />
                  </div>
                </div>

                {resetToken && (
                  <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
                    <p className="text-sm text-cyan-800">
                      <strong>Token:</strong> {resetToken}
                    </p>
                    <p className="text-xs text-cyan-600 mt-1">
                      Use este token para resetar sua senha
                    </p>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForgot(false);
                      setResetToken('');
                      setForgotEmail('');
                    }}
                    className="flex-1"
                    data-testid="back-to-login-btn"
                  >
                    Voltar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600"
                    disabled={loading}
                    data-testid="forgot-submit-btn"
                  >
                    {loading ? 'Enviando...' : 'Enviar'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}