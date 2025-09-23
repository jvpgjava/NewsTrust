import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const Contact = () => {
  const [contactData, setContactData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    name: false,
    email: false,
    message: false
  });
  const [emailDomainError, setEmailDomainError] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Lista de domínios de email confiáveis
  const trustedDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com',
    'icloud.com', 'me.com', 'mac.com', 'aol.com', 'protonmail.com',
    'tutanota.com', 'zoho.com', 'yandex.com', 'mail.com', 'gmx.com',
    'web.de', 't-online.de', 'orange.fr', 'free.fr', 'laposte.net',
    'terra.com.br', 'bol.com.br', 'uol.com.br', 'ig.com.br', 'globo.com',
    'r7.com', 'folha.com.br', 'estadao.com.br', 'g1.com.br', 'uol.com',
    'yahoo.com.br', 'hotmail.com.br', 'outlook.com.br', 'live.com.br'
  ];

  // Função para validar domínio do email
  const validateEmailDomain = (email) => {
    if (!email) return false;
    
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return false;
    
    return trustedDomains.includes(domain);
  };

  // Função para sugerir domínios similares
  const getSimilarDomains = (inputDomain) => {
    if (!inputDomain) return [];
    
    return trustedDomains.filter(domain => 
      domain.includes(inputDomain.toLowerCase()) || 
      inputDomain.toLowerCase().includes(domain)
    ).slice(0, 3);
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    
    // Validar campos obrigatórios
    const errors = {
      name: !contactData.name.trim(),
      email: !contactData.email.trim(),
      message: !contactData.message.trim()
    };
    
    // Validar domínio do email
    const isEmailDomainValid = validateEmailDomain(contactData.email);
    
    setValidationErrors(errors);
    setEmailDomainError(!isEmailDomainValid && contactData.email.trim() !== '');
    
    // Se houver erros, não enviar
    if (errors.name || errors.email || errors.message) {
      toast.error('Todos os campos são obrigatórios. Preencha todos os campos para continuar.');
      return;
    }
    
    if (!isEmailDomainValid) {
      toast.error('Por favor, use um domínio de email confiável (Gmail, Yahoo, Outlook, etc.).');
      return;
    }
    
    setIsSubmitting(true);

    try {
      await axios.post('http://localhost:3001/api/contact', contactData);
      setShowSuccessModal(true);
      setContactData({ name: '', email: '', message: '' });
      setValidationErrors({ name: false, email: false, message: false });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setContactData({ ...contactData, [field]: value });
    // Limpar erro quando usuário começar a digitar
    if (validationErrors[field]) {
      setValidationErrors({ ...validationErrors, [field]: false });
    }
    // Limpar erro de domínio do email quando o usuário digitar
    if (field === 'email' && emailDomainError) {
      setEmailDomainError(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 pt-8 sm:pt-12 px-4 sm:px-6 lg:px-8">
      {/* Contato */}
      <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-lg shadow max-w-4xl mx-auto">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">Entre em Contato</h2>
        <p className="text-gray-600 mb-6 leading-relaxed">
          Tem dúvidas sobre o sistema ou sugestões de melhoria? Entre em contato conosco!
        </p>
        <form onSubmit={handleContactSubmit} className="space-y-4 sm:space-y-6" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2 sm:mb-3">
                Nome
              </label>
              <input 
                type="text" 
                value={contactData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 text-sm sm:text-base ${
                  validationErrors.name 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="Seu nome"
              />
              {validationErrors.name && (
                <p className="text-red-500 text-sm mt-1 font-medium">Este campo é obrigatório</p>
              )}
            </div>
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2 sm:mb-3">
                Email
              </label>
              <input 
                type="email" 
                value={contactData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 text-sm sm:text-base ${
                  validationErrors.email || emailDomainError
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="seu@email.com"
              />
              {validationErrors.email && (
                <p className="text-red-500 text-sm mt-1 font-medium">Este campo é obrigatório</p>
              )}
              {emailDomainError && (
                <div className="mt-1">
                  <p className="text-red-500 text-sm font-medium">Use um domínio confiável. Sugestões:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {getSimilarDomains(contactData.email.split('@')[1] || '').map((domain, index) => (
                      <span 
                        key={index}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded cursor-pointer hover:bg-blue-200 transition-colors"
                        onClick={() => {
                          const emailPrefix = contactData.email.split('@')[0] || '';
                          setContactData({ ...contactData, email: `${emailPrefix}@${domain}` });
                          setEmailDomainError(false);
                        }}
                      >
                        {domain}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2 sm:mb-3">
              Mensagem
            </label>
            <textarea 
              rows={4}
              value={contactData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 resize-none text-sm sm:text-base ${
                validationErrors.message 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="Sua mensagem aqui..."
            />
            {validationErrors.message && (
              <p className="text-red-500 text-sm mt-1 font-medium">Este campo é obrigatório</p>
            )}
          </div>
          <div className="flex justify-start">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg hover:bg-blue-700 transition-all duration-300 font-medium text-sm sm:text-base shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Mensagem'}
            </button>
          </div>
        </form>
      </div>

      {/* Modal de Sucesso */}
      {showSuccessModal && isMounted && createPortal(
        <div 
          className="fixed bg-black bg-opacity-50 flex items-center justify-center p-4" 
          style={{ 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            width: '100vw', 
            height: '100vh',
            position: 'fixed',
            zIndex: 9999
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 sm:mx-6 transform transition-all duration-300 scale-100">
            {/* Conteúdo da Modal */}
            <div className="px-6 py-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  Obrigado pelo seu contato!
                </h4>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Recebemos sua mensagem e entraremos em contato em breve.
                  Sua opinião é muito importante para nós!
                </p>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-all duration-300 font-medium shadow-md hover:shadow-lg"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Contact;
