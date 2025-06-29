import React, { useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import Modal from '../shared/Modal';
import LoadingSpinner from '../shared/LoadingSpinner';
import { ChefHat, Mail, Key } from 'lucide-react';

interface AdminRegisterModalProps {
  onClose: () => void;
}

const AdminRegisterModal: React.FC<AdminRegisterModalProps> = ({ onClose }) => {
  const { signUp, authLoading, setAlert } = useAppContext();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setAlert({ message: 'Todos os campos são obrigatórios.', type: 'error' });
      return;
    }
    if (password !== confirmPassword) {
      setAlert({ message: 'As senhas não coincidem.', type: 'error' });
      return;
    }
    if (password.length < 6) {
      setAlert({ message: 'A senha deve ter pelo menos 6 caracteres.', type: 'error' });
      return;
    }

    // AppContext's signUp function will handle the actual Supabase call and profile creation.
    // It will also set alerts on success/failure.
    const user = await signUp(email, password, fullName);
    if (user) {
      setAlert({ message: 'Cadastro de administrador realizado! Faça login para continuar.', type: 'success'});
      onClose();
    }
  };

  return (
    <Modal title="Cadastrar Novo Administrador" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="adminFullName" className="block text-sm font-medium text-gray-700 sr-only">Nome Completo</label>
           <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ChefHat className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text" id="adminFullName" value={fullName} onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nome completo"
                    className="mt-1 block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    required autoComplete="name"
                />
           </div>
        </div>
        <div>
          <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700 sr-only">Email</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                </div>
                 <input
                    type="email" id="adminEmail" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email de acesso"
                    className="mt-1 block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    required autoComplete="email"
                />
            </div>
        </div>
        <div>
          <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700 sr-only">Senha</label>
           <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="password" id="adminPassword" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Senha (mín. 6 caracteres)"
                    className="mt-1 block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    required minLength={6} autoComplete="new-password"
                />
           </div>
        </div>
        <div>
          <label htmlFor="adminConfirmPassword" className="block text-sm font-medium text-gray-700 sr-only">Confirmar Senha</label>
           <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="password" id="adminConfirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirme sua senha"
                    className="mt-1 block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    required minLength={6} autoComplete="new-password"
                />
           </div>
        </div>
        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md shadow-sm"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={authLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md shadow-sm flex items-center disabled:opacity-70"
          >
            {authLoading && <LoadingSpinner size="w-4 h-4 mr-2" color="text-white" />}
            Cadastrar Administrador
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AdminRegisterModal;
