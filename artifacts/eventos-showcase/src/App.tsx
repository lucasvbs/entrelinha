import { type ReactNode, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function Home() {
  useEffect(() => {
    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !('IntersectionObserver' in window)
    ) {
      return;
    }

    const revealElements = Array.from(
      document.querySelectorAll<HTMLElement>('[data-reveal]'),
    );
    if (!revealElements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );

    revealElements.forEach((element) => observer.observe(element));
    document.documentElement.classList.add('reveal-ready');

    return () => {
      observer.disconnect();
      document.documentElement.classList.remove('reveal-ready');
    };
  }, []);

  useEffect(() => {
    const section = document.querySelector<HTMLElement>('.photo-story');
    const images = Array.from(
      document.querySelectorAll<HTMLImageElement>('.photo-story-image'),
    );
    if (!section || images.length < 2) return;

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (reduceMotion) return;

    let animationFrame = 0;
    const clamp = (value: number, min: number, max: number) =>
      Math.min(max, Math.max(min, value));
    const smoothstep = (start: number, end: number, value: number) => {
      const t = clamp((value - start) / (end - start), 0, 1);
      return t * t * (3 - 2 * t);
    };

    const updateStory = () => {
      const rect = section.getBoundingClientRect();
      const scrollDistance = Math.max(1, rect.height - window.innerHeight);
      const progress = clamp(-rect.top / scrollDistance, 0, 1);
      const position = progress * (images.length - 1);

      images.forEach((image, index) => {
        const enter = index === 0
          ? 1
          : smoothstep(index - 0.28, index - 0.02, position);
        const leave = index === images.length - 1
          ? 1
          : 1 - smoothstep(index + 0.72, index + 0.98, position);
        const opacity = Math.min(enter, leave);
        const depth = clamp((position - index + 1) / 2, 0, 1);
        const scale = 1.06 + depth * 0.07;
        const verticalShift = 3 - depth * 6;

        image.style.opacity = String(opacity);
        image.style.transform = `translate3d(0, ${verticalShift}%, 0) scale(${scale})`;
        image.setAttribute('aria-hidden', opacity < 0.15 ? 'true' : 'false');
      });
    };

    const scheduleUpdate = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = 0;
        updateStory();
      });
    };

    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    updateStory();

    return () => {
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <main className="site-shell">
      <section className="hero" aria-labelledby="hero-title">
        <nav className="hero-nav" aria-label="Navegação principal">
          <a className="brand-lockup" href="#inicio" aria-label="Estúdio 80, início">
            <img className="brand-logo" src="/images/logo-estudio-80-branco.png" alt="" />
          </a>
          <span className="nav-caption">Produção · Imagem · Memória</span>
          <a className="nav-cta" href={whatsAppHref} target="_blank" rel="noreferrer">
            Fale pelo WhatsApp <span aria-hidden="true">↗</span>
          </a>
        </nav>
        <div className="hero-copy" id="inicio">
          <h1 id="hero-title">
            <span>CONTAR UMA</span>
            <span>HISTÓRIA <em>QUE FIQUE</em></span>
            <span><em>NA MEMÓRIA,</em></span>
            <span>SOMOS OS MELHORES NISSO.</span>
          </h1>
        </div>
        <div className="hero-bottom">
          <span className="hero-meta">Produções audiovisuais — Eventos — Digitalização.</span>
          <a className="scroll-cue" href="#producoes">Role para conhecer <i aria-hidden="true">↓</i></a>
        </div>
      </section>

      <section className="story-intro" id="producoes" aria-labelledby="story-heading">
        <div className="story-copy">
          <h2 id="story-heading">Histórias contadas<br />através da <em>fotografia.</em></h2>
        </div>
      </section>

      <section className="photo-story" id="fotografias" aria-label="Sequência fotográfica institucional">
        <div className="photo-story-stage">
          {photoStoryImages.map((photo, index) => (
            <img
              className="photo-story-image"
              src={photo.src}
              alt={photo.alt}
              loading={index === 0 ? 'eager' : 'lazy'}
              decoding="async"
              style={{ opacity: index === 0 ? 1 : 0 }}
              aria-hidden={index !== 0}
              key={photo.src}
            />
          ))}
        </div>
      </section>

      <section className="services-section" id="solucoes" aria-labelledby="services-heading">
        <div className="section-heading" data-reveal="left">
          <p className="eyebrow">Soluções em imagens</p>
          <h2 id="services-heading">Da produção à <em>preservação.</em></h2>
          <p>Frentes de trabalho que ajudam instituições a registrar atividades, comunicar projetos e cuidar da própria história.</p>
        </div>
        <div className="service-grid">
          <article className="service-card" data-reveal="up">
            <span className="service-index">Produções</span>
            <h3>Registrar e comunicar.</h3>
            <p>Fotografia institucional e corporativa, cobertura de eventos, produção e captação de vídeos, edição e tratamento de imagens.</p>
            <ul>
              <li>Eventos, cerimônias e atividades institucionais</li>
              <li>Vídeos institucionais, campanhas e projetos especiais</li>
              <li>Edição e tratamento audiovisual</li>
            </ul>
          </article>
          <article className="service-card" data-reveal="up">
            <span className="service-index">Memória</span>
            <h3>Organizar e preservar.</h3>
            <p>Soluções para transformar materiais físicos e digitais em acervos organizados, pesquisáveis e acessíveis.</p>
            <ul>
              <li>Digitalização de documentos, fotografias, negativos e slides</li>
              <li>Organização, catalogação e indexação de acervos</li>
              <li>OCR, tratamento e recuperação digital de imagens</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="benefits-section" aria-labelledby="benefits-heading">
        <div className="benefits-intro" data-reveal="left">
          <p className="eyebrow">O que fica</p>
          <h2 id="benefits-heading">Registros que se tornam <em>acesso.</em></h2>
        </div>
        <div className="benefit-list">
          <p data-reveal="right"><span>01</span> Eventos e atividades registrados em fotografia e vídeo.</p>
          <p data-reveal="right"><span>02</span> Imagens e documentos reunidos em acervos digitais organizados.</p>
          <p data-reveal="right"><span>03</span> Documentos pesquisáveis com reconhecimento de texto por OCR.</p>
          <p data-reveal="right"><span>04</span> Memória institucional valorizada e mais acessível.</p>
        </div>
      </section>

      <section className="faq-section" aria-labelledby="faq-heading">
        <div className="faq-heading" data-reveal="left">
          <p className="eyebrow">Perguntas frequentes</p>
          <h2 id="faq-heading">Sobre as <em>soluções.</em></h2>
        </div>
        <div className="faq-list">
          <article data-reveal="right">
            <h3>Quais serviços o Estúdio 80 oferece?</h3>
            <p>Produção fotográfica e audiovisual, digitalização, organização e preservação de acervos de imagens e documentos.</p>
          </article>
          <article data-reveal="right">
            <h3>Que materiais podem ser digitalizados?</h3>
            <p>Documentos, fotografias, negativos, slides e outros materiais.</p>
          </article>
          <article data-reveal="right">
            <h3>É possível pesquisar o texto de documentos digitalizados?</h3>
            <p>Sim. O Estúdio 80 oferece reconhecimento de texto por OCR para tornar documentos pesquisáveis.</p>
          </article>
          <article data-reveal="right">
            <h3>Como conversar sobre um projeto?</h3>
            <p>Entre em contato pelo WhatsApp e conte o que sua instituição precisa produzir, registrar ou preservar.</p>
          </article>
          <article data-reveal="right">
            <h3>Como adicionar o Estúdio 80 à tela inicial do celular?</h3>
            <p>No iPhone, abra este site no Safari, toque em Compartilhar e escolha “Adicionar à Tela de Início”. No Android, abra no Chrome e escolha “Instalar app” ou “Adicionar à tela inicial” no menu. O atalho abre o site em uma janela própria; é necessária conexão com a internet.</p>
          </article>
        </div>
      </section>

      <section className="afterword" aria-labelledby="afterword-heading">
        <div className="afterword-copy" data-reveal="left">
          <p className="eyebrow">A história da sua instituição</p>
          <h2 id="afterword-heading">Vamos preservar o que <em>importa?</em></h2>
        </div>
        <div className="afterword-note" data-reveal="right">
          <p>Conte ao Estúdio 80 o que sua instituição precisa produzir, registrar ou preservar. A conversa começa pelo seu projeto.</p>
          <a className="contact-link" href={whatsAppHref} target="_blank" rel="noreferrer">
            Conversar pelo WhatsApp <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>

      <footer className="site-footer">
        <a className="brand-lockup footer-brand" href="#inicio" aria-label="Estúdio 80, início">
          <img className="brand-logo" src="/images/logo-estudio-80-branco.png" alt="" />
        </a>
        <a className="footer-whatsapp" href={whatsAppHref} target="_blank" rel="noreferrer">(61) 99261-1547</a>
        <span className="footer-meta">Produção audiovisual · Memória institucional</span>
      </footer>

    </main>
  );
}

const photoStoryImages = [
  {
    src: '/images/scroll-photo-01.jpg',
    alt: 'Palestrante se dirigindo ao público em um palco iluminado',
  },
  {
    src: '/images/scroll-photo-02.jpg',
    alt: 'Entrevista coletiva com representantes e profissionais de imprensa',
  },
  {
    src: '/images/scroll-photo-03.jpg',
    alt: 'Autoridades reunidas em uma mesa durante uma sessão institucional',
  },
];

const whatsAppHref =
  'https://wa.me/5561992611547?text=Ol%C3%A1%2C%20quero%20conversar%20sobre%20um%20projeto%20para%20o%20Est%C3%BAdio%2080.';

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
