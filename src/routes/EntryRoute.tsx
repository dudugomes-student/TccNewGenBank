import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFinancialStore } from '../state/financialStore';
import { Brand } from '../ui/Brand';
import { NewGenCard } from '../ui/NewGenCard';
import { ThemeControl } from '../ui/ThemeControl';

export function EntryRoute() {
  const card = useFinancialStore((state) => state.cards[0]);
  return (
    <div className="entry-page route-stage">
      <header className="public-header">
        <Brand />
        <ThemeControl />
      </header>
      <main className="entry-main">
        <section className="entry-statement" aria-labelledby="entry-title">
          <p className="kicker">MONEY IN MOTION / 01</p>
          <h1 id="entry-title" tabIndex={-1} data-route-title>
            SEU DINHEIRO.<br /><em>SUAS ESCOLHAS.</em>
          </h1>
          <p className="entry-statement__copy">Uma conta que mostra o movimento — e deixa cada decisão nas suas mãos.</p>
          <Link className="primary-link" to="/entrar">ENTRAR <ArrowRight aria-hidden="true" /></Link>
        </section>
        <div className="entry-instrument" aria-label="Seu cartão NewGen">
          <p className="entry-instrument__annotation"><span>01</span> Seu instrumento financeiro</p>
          <NewGenCard card={card} spatial visualScale={1.55} renderOverscan={2.5} />
          <div className="entry-instrument__baseline" aria-hidden="true"><span>CAPITAL</span><span>MOTION</span><span>INSTRUMENT</span></div>
        </div>
      </main>
      <footer className="public-footer"><span>NEWGENBANK © 2026</span><span>SEU DINHEIRO. SUAS ESCOLHAS.</span></footer>
    </div>
  );
}
