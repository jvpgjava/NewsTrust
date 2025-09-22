import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Shield, Brain, Network, Database, Search, CheckCircle, Users, Globe, Target, TrendingUp, X } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const About = () => {
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
      toast.error('Por favor, preencha todos os campos obrigatórios.');
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
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Sobre o Sistema</h1>
        <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
          Conheça mais sobre o NewsTrust, nossa plataforma de verificação de notícias
        </p>
      </div>

      {/* Missão */}
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow">
        <div className="flex items-start">
          <div className="flex-shrink-0 -mt-1">
            <img 
              src="/iconeNewsTrust.png" 
              alt="NewsTrust" 
              className="w-8 h-8 sm:w-10 sm:h-10"
            />
          </div>
          <div className="ml-4">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">Nossa Missão</h2>
            <p className="text-gray-600 leading-relaxed">
              O NewsTrust foi desenvolvido para combater a desinformação e fake news, 
              oferecendo uma ferramenta confiável de verificação de notícias. Nossa missão 
              é promover a transparência e a veracidade na informação, ajudando usuários 
              a tomar decisões baseadas em fatos verificados.
            </p>
          </div>
        </div>
      </div>

      {/* Como Funciona */}
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow">
        <div className="flex items-start">
          <div className="flex-shrink-0 -mt-1">
            <img 
              src="/iconComoFunciona.png" 
              alt="Como Funciona" 
              className="w-8 h-8 sm:w-10 sm:h-10"
            />
          </div>
          <div className="ml-4">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">Como Funciona</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              O NewsTrust utiliza uma abordagem multi-camada para garantir a máxima precisão na verificação de notícias. 
              Nossa tecnologia combina inteligência artificial avançada com análise de rede de confiança para fornecer 
              resultados confiáveis e transparentes.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start">
                  <Search className="h-5 w-5 text-blue-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1 leading-tight">Análise de Conteúdo com IA</h3>
                    <p className="text-sm text-gray-600">Processamento de linguagem natural para identificar padrões suspeitos, inconsistências e verificações cruzadas com fontes confiáveis.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Network className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1 leading-tight">Verificação de Fontes</h3>
                    <p className="text-sm text-gray-600">Análise da reputação e histórico de confiabilidade das fontes, incluindo verificação de domínio e credibilidade editorial.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Database className="h-5 w-5 text-purple-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1 leading-tight">Base de Dados Confiável</h3>
                    <p className="text-sm text-gray-600">Repositório atualizado de fontes verificadas, fatos checados e padrões de desinformação conhecidos.</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-emerald-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1 leading-tight">Pontuação de Credibilidade</h3>
                    <p className="text-sm text-gray-600">Algoritmo proprietário que calcula uma pontuação de 0-100% baseada em múltiplos fatores de verificação.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Users className="h-5 w-5 text-orange-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1 leading-tight">Rede de Confiança</h3>
                    <p className="text-sm text-gray-600">Mapeamento de conexões entre fontes e análise de padrões de compartilhamento para identificar redes de desinformação.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Globe className="h-5 w-5 text-cyan-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1 leading-tight">Busca na Web</h3>
                    <p className="text-sm text-gray-600">Verificação cruzada com múltiplas fontes online para confirmar fatos e identificar contradições.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Nossa Visão */}
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow">
        <div className="flex items-start">
          <div className="flex-shrink-0 -mt-1">
            <img 
              src="/iconNossaVisao.png" 
              alt="Nossa Visão" 
              className="w-8 h-8 sm:w-10 sm:h-10"
            />
          </div>
          <div className="ml-4">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">Nossa Visão</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Enxergamos um futuro onde a informação confiável seja acessível a todos, onde a desinformação 
              não tenha espaço para se propagar, e onde cada cidadão possa tomar decisões informadas baseadas 
              em fatos verificados. O NewsTrust aspira a ser a referência global em verificação de notícias, 
              promovendo uma sociedade mais informada e democrática.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Acreditamos que a tecnologia deve servir como uma ponte entre a complexidade da informação 
              digital e a necessidade humana de compreensão. Nossa visão inclui o desenvolvimento de ferramentas 
              que não apenas detectem fake news, mas que também eduquem os usuários sobre como identificar 
              informações confiáveis, criando uma cultura de verificação e pensamento crítico que se estenda 
              além da nossa plataforma.
            </p>
          </div>
        </div>
      </div>

      {/* Nossos Valores */}
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow">
        <div className="flex items-start">
          <div className="flex-shrink-0 -mt-1">
            <img 
              src="/iconNossosValores.png" 
              alt="Nossos Valores" 
              className="w-8 h-8 sm:w-10 sm:h-10"
            />
          </div>
          <div className="ml-4">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">Nossos Valores</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Nossos valores fundamentais guiam cada decisão que tomamos e cada linha de código que escrevemos. 
              Eles representam nosso compromisso inabalável com a excelência, a integridade e o serviço à sociedade.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-8">
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900 mb-3 leading-tight text-lg">Transparência</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Todos os nossos processos de verificação são transparentes e auditáveis, permitindo que os usuários 
                    entendam como chegamos às nossas conclusões. Publicamos metodologias, critérios de avaliação e 
                    mantemos logs detalhados de todas as análises realizadas.
                  </p>
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900 mb-3 leading-tight text-lg">Precisão</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Comprometemo-nos com a máxima precisão em nossas análises, utilizando as mais avançadas tecnologias 
                    e metodologias de verificação. Nossos algoritmos são constantemente refinados e testados para 
                    garantir resultados confiáveis e consistentes.
                  </p>
                </div>
              </div>
              <div className="space-y-8">
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900 mb-3 leading-tight text-lg">Neutralidade</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Mantemos total neutralidade política e ideológica, focando exclusivamente na veracidade factual 
                    das informações. Nossos sistemas são projetados para detectar a verdade objetiva, independentemente 
                    de agendas ou vieses políticos.
                  </p>
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900 mb-3 leading-tight text-lg">Acessibilidade</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Acreditamos que a verificação de notícias deve ser acessível a todos, independentemente de recursos 
                    ou conhecimento técnico. Nossa interface é intuitiva, nossos resultados são claros e nossa 
                    tecnologia funciona em qualquer dispositivo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Contato */}
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">Entre em Contato</h2>
        <p className="text-gray-600 mb-6 leading-relaxed">
          Tem dúvidas sobre o sistema ou sugestões de melhoria? Entre em contato conosco!
        </p>
        <form onSubmit={handleContactSubmit} className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2 sm:mb-3">
                Nome <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                required
                value={contactData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 text-sm sm:text-base ${
                  validationErrors.name 
                    ? 'border-red-500 focus:ring-red-500 bg-red-50' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="Seu nome"
              />
              {validationErrors.name && (
                <p className="text-red-500 text-xs mt-1">Este campo é obrigatório</p>
              )}
            </div>
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2 sm:mb-3">
                Email <span className="text-red-500">*</span>
              </label>
              <input 
                type="email" 
                required
                value={contactData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 text-sm sm:text-base ${
                  validationErrors.email || emailDomainError
                    ? 'border-red-500 focus:ring-red-500 bg-red-50' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="seu@email.com"
              />
              {validationErrors.email && (
                <p className="text-red-500 text-xs mt-1">Este campo é obrigatório</p>
              )}
              {emailDomainError && (
                <div className="mt-1">
                  <p className="text-red-500 text-xs">Use um domínio confiável. Sugestões:</p>
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
              Mensagem <span className="text-red-500">*</span>
            </label>
            <textarea 
              rows={4}
              required
              value={contactData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 resize-y text-sm sm:text-base ${
                validationErrors.message 
                  ? 'border-red-500 focus:ring-red-500 bg-red-50' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="Sua mensagem aqui..."
            />
            {validationErrors.message && (
              <p className="text-red-500 text-xs mt-1">Este campo é obrigatório</p>
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
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
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

export default About;
