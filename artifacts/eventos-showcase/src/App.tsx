import { type ReactNode, useEffect, useRef, useState } from 'react';
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
  const [activeFilm, setActiveFilm] = useState<(typeof films)[number] | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

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
    if (!activeFilm) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 0);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveFilm(null);
        return;
      }
      if (event.key === 'Tab' && modalRef.current) {
        const focusable = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(
            'button, video[tabindex], video[controls]',
          ),
        ).filter((element) => !element.hasAttribute('disabled'));
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      returnFocusRef.current?.focus();
    };
  }, [activeFilm]);

  useEffect(() => {
    const previews = Array.from(
      document.querySelectorAll<HTMLVideoElement>('.film-preview'),
    );
    const stopPreviews = () => {
      previews.forEach((video) => {
        video.autoplay = false;
        video.pause();
      });
    };

    if (activeFilm) {
      stopPreviews();
      return;
    }

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    if (reduceMotion) {
      stopPreviews();
      return;
    }

    let animationFrame = 0;
    let previousScrollY = window.scrollY;

    const updatePlayback = () => {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY >= previousScrollY;
      previousScrollY = currentScrollY;
      const x = Math.min(window.innerWidth - 1, Math.round(window.innerWidth / 2));
      const y = Math.min(
        window.innerHeight - 1,
        Math.max(
          0,
          Math.round(window.innerHeight * (scrollingDown ? 0.82 : 0.18)),
        ),
      );
      const activeCard = document
        .elementFromPoint(x, y)
        ?.closest<HTMLElement>('.film-card');
      const activeVideo =
        activeCard?.querySelector<HTMLVideoElement>('.film-preview') ?? null;

      previews.forEach((video) => {
        const shouldPlay = video === activeVideo;
        video.muted = true;
        video.autoplay = shouldPlay;

        if (shouldPlay && video.paused) {
          void video.play().catch(() => {
            video.autoplay = false;
          });
        } else if (!shouldPlay && !video.paused) {
          video.pause();
        }
      });
    };

    const schedulePlaybackUpdate = () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = 0;
        updatePlayback();
      });
    };

    const observer = new IntersectionObserver(
      schedulePlaybackUpdate,
      { threshold: [0, 0.15, 0.35, 0.65] },
    );

    previews.forEach((video) => observer.observe(video));
    window.addEventListener('scroll', schedulePlaybackUpdate, {
      passive: true,
    });
    window.addEventListener('resize', schedulePlaybackUpdate);
    updatePlayback();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', schedulePlaybackUpdate);
      window.removeEventListener('resize', schedulePlaybackUpdate);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      stopPreviews();
    };
  }, [activeFilm]);

  const openFilm = (film: (typeof films)[number], trigger: HTMLElement) => {
    returnFocusRef.current = trigger;
    setActiveFilm(film);
  };

  return (
    <main className="site-shell">
      <section className="hero" aria-labelledby="hero-title">
        <nav className="hero-nav" aria-label="Navegação principal">
          <a className="brand-lockup" href="#inicio" aria-label="Estúdio 80, início">
            <span className="logo-placeholder" aria-hidden="true" />
            <span className="brand-name">Estúdio 80<small>Soluções em imagens</small></span>
          </a>
          <span className="nav-caption">Produção · Imagem · Memória</span>
          <a className="nav-cta" href={whatsAppHref} target="_blank" rel="noreferrer">
            Fale pelo WhatsApp <span aria-hidden="true">↗</span>
          </a>
        </nav>
        <div className="hero-copy" id="inicio">
          <p className="eyebrow">Estúdio 80 · Soluções em imagens</p>
          <h1 id="hero-title">A memória da sua instituição <em>merece durar.</em></h1>
          <p className="hero-deck">
            Produção audiovisual, fotografia institucional e soluções para organizar,
            digitalizar e preservar imagens e documentos.
          </p>
          <a className="hero-contact" href={whatsAppHref} target="_blank" rel="noreferrer">
            Falar com o Estúdio 80 <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div className="hero-bottom">
          <span className="hero-meta">Imagem ilustrativa<br />Produção · Memória</span>
          <a className="scroll-cue" href="#producoes">Role para conhecer <i aria-hidden="true">↓</i></a>
        </div>
      </section>

      <section className="story-intro" id="producoes" aria-labelledby="story-heading">
        <div className="story-copy">
          <p className="eyebrow">Imagem que registra · Acervo que preserva</p>
          <h2 id="story-heading">Imagens que comunicam.<br />Acervos que <em>preservam.</em></h2>
          <p className="story-description">
            O Estúdio 80 oferece soluções em imagens para projetos institucionais:
            da cobertura fotográfica e produção audiovisual à digitalização e
            organização de acervos.
          </p>
        </div>
        <div className="story-gallery" aria-label="Imagens de produção audiovisual">
          <figure className="story-gallery-item">
            <img src="/images/studio80-making-01.webp" alt="Equipe gravando uma entrevista em ambiente interno" loading="eager" decoding="async" />
          </figure>
          <figure className="story-gallery-item">
            <img src="/images/studio80-making-02.webp" alt="Equipe de filmagem trabalhando em uma locação externa" loading="eager" decoding="async" />
          </figure>
          <figure className="story-gallery-item">
            <img src="/images/studio80-making-03.webp" alt="Operador de câmera durante uma gravação ao ar livre" loading="eager" decoding="async" />
          </figure>
          <figure className="story-gallery-item">
            <img src="/images/studio80-making-04.webp" alt="Câmera e monitor em um set de gravação de entrevista" loading="eager" decoding="async" />
          </figure>
        </div>
      </section>

      <section className="film-stack" aria-label="Vídeos demonstrativos do Estúdio 80">
        <div className="media-note">
          <span className="eyebrow">Prévia audiovisual</span>
        </div>
        {films.map((film) => (
          <article className="film-card" key={film.id}>
            <video
              className="film-preview"
              src={film.previewVideo}
              poster={film.poster}
              data-testid={`film-preview-${film.id}`}
              muted
              loop
              playsInline
              preload="metadata"
              aria-hidden="true"
              tabIndex={-1}
            />
            <div className="card-content">
              <span className="card-index">{film.label}</span>
              <h3 className="card-title">{film.title}</h3>
              <div className="card-bottom">
                <p>{film.description}</p>
                <button
                  className="watch-button"
                  type="button"
                  onClick={(event) => openFilm(film, event.currentTarget)}
                  aria-label={`Ampliar filme: ${film.plainTitle}`}
                >
                  <span className="play-icon" aria-hidden="true">↗</span>
                  Ampliar vídeo
                </button>
              </div>
            </div>
          </article>
        ))}
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
          <span className="logo-placeholder" aria-hidden="true" />
          <span className="brand-name">Estúdio 80<small>Soluções em imagens</small></span>
        </a>
        <a className="footer-whatsapp" href={whatsAppHref} target="_blank" rel="noreferrer">(61) 99261-1547</a>
        <span className="footer-meta">Produção audiovisual · Memória institucional</span>
      </footer>

      {activeFilm && (
        <div
          className="video-modal"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setActiveFilm(null);
          }}
        >
          <div
            className="modal-frame"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-film-title"
            ref={modalRef}
          >
            <button
              className="modal-close"
              type="button"
              aria-label="Fechar filme"
              ref={closeButtonRef}
              onClick={() => setActiveFilm(null)}
            >
              ×
            </button>
            <video
              src={activeFilm.video}
              poster={activeFilm.poster}
              controls
              autoPlay
              playsInline
              preload="metadata"
              aria-label={`Filme ${activeFilm.plainTitle}`}
            />
            <div className="modal-title">
              <span id="modal-film-title">{activeFilm.plainTitle}</span>
              <span>Estúdio 80 · Vídeo demonstrativo</span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

const films = [
  {
    id: 'ceremony',
    label: 'Fotografia institucional',
    plainTitle: 'Fotografia institucional',
    title: <>A instituição<br />em <em>foco.</em></>,
    description: 'Cobertura fotográfica de eventos, cerimônias e atividades institucionais.',
    poster: '/images/event-ceremony-poster.jpg',
    previewVideo: '/videos/event-ceremony-preview.mp4',
    video: '/videos/event-ceremony-full.mp4',
    alt: 'Prévia ilustrativa de uma celebração em um palco iluminado',
  },
  {
    id: 'party',
    label: 'Produção audiovisual',
    plainTitle: 'Produção audiovisual',
    title: <>Histórias em<br /><em>movimento.</em></>,
    description: 'Captação e produção de vídeos institucionais, campanhas e projetos especiais.',
    poster: '/images/event-party-poster.jpg',
    previewVideo: '/videos/event-party-preview.mp4',
    video: '/videos/event-party-full.mp4',
    alt: 'Prévia ilustrativa de uma festa sob luzes coloridas',
  },
  {
    id: 'dinner',
    label: 'Memória institucional',
    plainTitle: 'Memória institucional',
    title: <>Acervos para<br /><em>preservar.</em></>,
    description: 'Digitalização, organização e cuidado com imagens e documentos institucionais.',
    poster: '/images/event-dinner-poster.jpg',
    previewVideo: '/videos/event-dinner-preview.mp4',
    video: '/videos/event-dinner-full.mp4',
    alt: 'Prévia ilustrativa de um jantar com mesa posta e luz de velas',
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
