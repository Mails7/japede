
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { KeyIcon, StorefrontIcon } from '../components/icons';

const ResetPasswordPage: React.FC = () => {
  const { updateUserPassword, authLoading, passwordRecoverySession, setAlert, settings } = useAppContext();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    // If there's no recovery session, it means the user might have landed here directly
    // or the token is invalid/expired. AppContext's onAuthStateChange should handle this.
    // This page is primarily for when passwordRecoverySession IS active.
    if (!passwordRecoverySession && !authLoading) {
      // Optional: redirect or show message if no recovery session
      // setAlert({ message: "Sessão de recuperação de senha inválida ou expirada.", type: "error" });
      // Consider redirecting to login after a delay
      // setTimeout(() => window.location.href = '/', 3000);
    }
  }, [passwordRecoverySession, authLoading, setAlert]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setAlert({ message: 'Por favor, preencha ambos os campos de senha.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setAlert({ message: 'As senhas não coincidem.', type: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      setAlert({ message: 'A nova senha deve ter pelo menos 6 caracteres.', type: 'error' });
      return;
    }

    const success = await updateUserPassword(newPassword);
    if (success) {
      // Alert is handled by updateUserPassword. App.tsx will redirect on session clear.
      setNewPassword('');
      setConfirmPassword('');
    }
  };
  
  const storeLogoUrl = settings?.store?.logo_url || 'https://picsum.photos/seed/reset_logo/80/80';
  const storeName = settings?.store?.store_name || 'JáPede';

  if (authLoading && !passwordRecoverySession) { // Show loading if initial auth check is happening
     return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <LoadingSpinner size="w-12 h-12" color="text-primary"/>
        <p className="mt-3 text-gray-600">Verificando...</p>
      </div>
    );
  }

  if (!passwordRecoverySession) { // No active recovery session
    return (
      <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gray-100 text-center">
        <KeyIcon className="w-16 h-16 text-primary mb-4"/>
        <h1 className="text-2xl font-semibold text-gray-700 mb-2">Link Inválido ou Expirado</h1>
        <p className="text-gray-600 mb-4">
          O link de redefinição de senha pode ser inválido ou já foi utilizado.
        </p>
        <a href="/" className="text-primary hover:text-primary-dark font-medium">
          Voltar para o Login
        </a>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 space-y-6">
        <div className="text-center">
           <img 
              src={storeLogoUrl} 
              alt="Logo da Loja" 
              className="w-16 h-16 mx-auto mb-2 rounded-full border-2 border-primary-light object-cover"
            />
          <h1 className="text-2xl font-bold text-gray-800">Redefinir Senha</h1>
          <p className="text-gray-500">Crie uma nova senha para sua conta em {storeName}.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 sr-only">Nova Senha</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="password" id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Digite sua nova senha"
                    className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    required minLength={6} autoComplete="new-password"
                />
            </div>
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 sr-only">Confirmar Nova Senha</label>
             <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirme sua nova senha"
                    className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    required minLength={6} autoComplete="new-password"
                />
            </div>
          </div>
          <div>
            <button
              type="submit"
              disabled={authLoading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark disabled:opacity-70"
            >
              {authLoading ? <LoadingSpinner size="w-5 h-5" /> : 'Salvar Nova Senha'}
            </button>
          </div>
        </form>
      </div>
       <footer className="mt-8 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} JáPede. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default ResetPasswordPage;
