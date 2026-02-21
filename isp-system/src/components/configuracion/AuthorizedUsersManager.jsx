import { useState } from 'react';
import { Mail, Plus, Trash2, Shield, AlertCircle } from 'lucide-react';
import useStore from '../../store/useStore';
import Card from '../ui/Card';
import Button from '../ui/Button';

export default function AuthorizedUsersManager() {
  const authorizedEmails = useStore(s => s.authorizedEmails);
  const addAuthorizedEmail = useStore(s => s.addAuthorizedEmail);
  const removeAuthorizedEmail = useStore(s => s.removeAuthorizedEmail);
  const [newEmail, setNewEmail] = useState('');

  const handleAdd = () => {
    if (!newEmail) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      alert('Por favor ingresa un correo válido');
      return;
    }

    if (addAuthorizedEmail(newEmail)) {
      setNewEmail('');
      alert('✅ Correo agregado exitosamente');
    } else {
      alert('⚠️ Este correo ya está en la lista');
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Shield className="w-5 h-5 text-green-500" />
        Usuarios Autorizados
      </h2>

      {/* Info */}
      <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex gap-3">
        <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-gray-700 dark:text-gray-300">
          <p className="font-medium mb-1">Control de Acceso</p>
          <p>Solo los correos en esta lista podrán acceder al sistema.</p>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            Si la lista está vacía, cualquier correo puede acceder (modo desarrollo).
          </p>
        </div>
      </div>

      {/* Agregar nuevo correo */}
      <div className="flex gap-2 mb-4">
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="correo@ejemplo.com"
          className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
        <Button onClick={handleAdd} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Agregar
        </Button>
      </div>

      {/* Lista de correos autorizados */}
      <div className="space-y-2">
        {authorizedEmails.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Mail className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No hay correos autorizados</p>
            <p className="text-xs mt-1">(Modo desarrollo: todos pueden acceder)</p>
          </div>
        ) : (
          authorizedEmails.map((email) => (
            <div
              key={email}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="font-mono text-sm">{email}</span>
              </div>
              <button
                onClick={() => {
                  if (confirm(`¿Eliminar ${email} de la lista de autorizados?`)) {
                    removeAuthorizedEmail(email);
                  }
                }}
                className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded transition-colors"
                title="Eliminar correo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Contador */}
      {authorizedEmails.length > 0 && (
        <div className="mt-4 text-xs text-gray-500 text-center">
          {authorizedEmails.length} usuario{authorizedEmails.length !== 1 ? 's' : ''} autorizado{authorizedEmails.length !== 1 ? 's' : ''}
        </div>
      )}
    </Card>
  );
}
