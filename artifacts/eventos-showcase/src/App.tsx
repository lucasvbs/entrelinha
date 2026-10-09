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

    const updatePlayback = () => {
      const x = Math.min(window.innerWidth - 1, Math.round(window.innerWidth / 2));
      const y = Math.min(window.innerHeight - 1, Math.round(window.innerHeight / 2));
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
          <a className="wordmark" href="#inicio" aria-label="Entrelinha, início">
            <span className="mark" aria-hidden="true">e</span>
            entrelinha
          </a>
          <span className="nav-caption">Experiências que ficam</span>
          <a className="nav-cta" href="#filmes">Explore a experiência <span aria-hidden="true">↘</span></a>
        </nav>
        <div className="hero-copy" id="inicio">
          <p className="eyebrow">Eventos com presença · Brasil</p>
          <h1 id="hero-title">O dia<br />que <em>fica.</em></h1>
          <p className="hero-deck">Criamos encontros que parecem feitos para sempre — e têm a cara do agora.</p>
        </div>
        <div className="hero-bottom">
          <span className="hero-meta">Celebrações autorais<br />Do primeiro abraço ao último brinde</span>
          <a className="scroll-cue" href="#filmes">Role para conhecer <i aria-hidden="true">↓</i></a>
        </div>
      </section>

      <section className="story-intro" id="filmes" aria-labelledby="story-heading">
        <div>
          <p className="eyebrow">Uma história em três atos</p>
          <h2 id="story-heading">Não fazemos eventos.<br />Criamos <em>memória.</em></h2>
        </div>
        <p>
          Há um momento em que tudo se encaixa: a luz, as pessoas, a música.
          A Entrelinha desenha esse instante com cuidado — do primeiro abraço
          ao último brinde.
        </p>
      </section>

      <section className="film-stack" aria-label="Filmes de momentos Entrelinha">
        {films.map((film) => (
          <article className="film-card" key={film.id}>
            <video
              className="film-preview"
              src={film.video}
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
              <span className="card-index">{film.number} / 03&nbsp;&nbsp; · &nbsp;&nbsp;{film.label}</span>
              <h3 className="card-title">{film.title}</h3>
              <div className="card-bottom">
                <p>{film.description}</p>
                <button
                  className="watch-button"
                  type="button"
                  onClick={(event) => openFilm(film, event.currentTarget)}
                  aria-label={`Ver filme: ${film.plainTitle}`}
                >
                  <span className="play-icon" aria-hidden="true">▶</span>
                  Ver o filme
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="afterword" aria-labelledby="afterword-heading">
        <div className="afterword-copy">
          <p className="eyebrow">A sua história começa aqui</p>
          <h2 id="afterword-heading">Há coisas que merecem ser <em>sentidas.</em></h2>
        </div>
        <div className="afterword-note">
          <p>Um casamento, uma reunião de família ou um motivo que ainda não tem nome. Conte pra gente o que imagina. A gente começa pelo que importa.</p>
          <a className="contact-link" href="mailto:contato@example.com">Vamos conversar <span aria-hidden="true">↗</span></a>
        </div>
      </section>

      <footer className="site-footer">
        <a className="wordmark" href="#inicio"><span className="mark" aria-hidden="true">e</span>entrelinha</a>
        <span className="footer-credit">Feito de <em>bons encontros.</em></span>
        <span className="footer-meta">Brasil · Experiências que ficam</span>
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
              <span>Entrelinha · Filme {activeFilm.number}</span>
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
    number: '01',
    label: 'O começo',
    plainTitle: 'A cerimónia',
    title: <>O começo<br />de <em>tudo.</em></>,
    description: 'O primeiro aplauso, o abraço apertado, a certeza de que esse momento vai ficar.',
    poster: '/images/demo-ceremony.jpg',
    video: '/videos/demo-ceremony.mp4',
    alt: 'Celebração de formatura em um palco iluminado por luz dourada',
  },
  {
    id: 'party',
    number: '02',
    label: 'A entrega',
    plainTitle: 'A celebração',
    title: <>Até a noite<br /><em>dançar.</em></>,
    description: 'A música sobe, os sapatos ficam de lado. O melhor plano é não ter plano.',
    poster: '/images/demo-party.jpg',
    video: '/videos/demo-party.mp4',
    alt: 'Convidados dançam em uma festa de formatura sob luzes coloridas',
  },
  {
    id: 'dinner',
    number: '03',
    label: 'O brinde',
    plainTitle: 'À mesa',
    title: <>Ficar mais<br /><em>um pouco.</em></>,
    description: 'Uma mesa comprida, histórias sem pressa e aquele último copo que nunca é o último.',
    poster: '/images/demo-dinner.jpg',
    video: '/videos/demo-dinner.mp4',
    alt: 'Jantar de celebração com mesa posta e luz de velas',
  },
];

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
