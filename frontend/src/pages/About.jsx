import React from 'react';
import { Shield, Brain, Network, Database, Search, CheckCircle, Users, Globe, Target, TrendingUp } from 'lucide-react';

const About = () => {

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

      {/* Desenvolvido e Pensado Por */}
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow">
        <div className="flex items-start">
          <div className="flex-shrink-0 -mt-1">
            <img 
              src="/iconeDesenvolvidoPor.png" 
              alt="Desenvolvido Por" 
              className="w-8 h-8 sm:w-10 sm:h-10"
            />
          </div>
          <div className="ml-4">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6">Desenvolvido e Pensado Por</h2>
            
            <div className="space-y-6 max-w-3xl">
              <div className="flex items-center gap-4">
                <span className="text-gray-700">João Vitor Prestes Grando</span>
                <a 
                  href="https://www.linkedin.com/in/jvprestessg" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Sobre
                </a>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-700">Évilyn Flores Francisco</span>
                <a 
                  href="https://www.linkedin.com/in/evilyn-flores" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Sobre
                </a>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-700">Guilherme Lima Sarmento</span>
                <a 
                  href="https://www.linkedin.com/in/guilherme-sarmento-972665394" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Sobre
                </a>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-700">Vinicius Martinez da Silva</span>
                <a 
                  href="https://www.linkedin.com/in/vinícius-martinez-76857334a" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Sobre
                </a>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-700">Rafael Ramos da Luz</span>
                <a 
                  href="https://www.linkedin.com/in/rafael-ramos-da-luz-69772b164" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Sobre
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Orientado Por */}
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow">
        <div className="flex items-start">
          <div className="flex-shrink-0 -mt-1">
            <img 
              src="/iconeOrientadoPor.png" 
              alt="Orientado Por" 
              className="w-8 h-8 sm:w-10 sm:h-10"
            />
          </div>
          <div className="ml-4">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6">Orientado Por</h2>
            <div className="flex items-center gap-4 max-w-3xl mt-8">
              <span className="text-gray-700">Arthur Marques de Oliveira</span>
              <a 
                href="https://www.linkedin.com/in/arthur-marques-de-oliveira-a09072110" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Sobre
              </a>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default About;
