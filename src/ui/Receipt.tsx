import { Check, Copy, Share2 } from 'lucide-react';
import { useState } from 'react';
import { formatDateTime, formatMoney } from '../domain/formatters';
import type { Transaction } from '../domain/models';

export function Receipt({ transaction }: { transaction: Transaction }) {
  const [message, setMessage] = useState('');
  const { date, time } = formatDateTime(transaction.occurredAt);
  const text = `Pix NewGenBank\n${formatMoney(transaction.amount)}\n${transaction.recipient}\n${transaction.institution}\n${date} às ${time}\nID ${transaction.id}`;
  const copy = async () => { await navigator.clipboard.writeText(text); setMessage('Dados do comprovante copiados.'); };
  const share = async () => { if (navigator.share) { await navigator.share({ title: 'Comprovante Pix NewGenBank', text }); setMessage('Comprovante compartilhado.'); } else await copy(); };
  return <article className="receipt" aria-labelledby="receipt-title"><header className="receipt__header"><span><Check aria-hidden="true" /></span><div><p className="section-index">CONCLUÍDO</p><h1 id="receipt-title" tabIndex={-1}>Pix enviado.</h1></div></header><p className="receipt__amount">{formatMoney(transaction.amount)}</p><dl className="receipt__details"><div><dt>Destinatário</dt><dd>{transaction.recipient}</dd></div><div><dt>Chave Pix</dt><dd>{transaction.maskedKey}</dd></div><div><dt>Instituição</dt><dd>{transaction.institution}</dd></div><div><dt>Data</dt><dd>{date}</dd></div><div><dt>Horário</dt><dd>{time}</dd></div><div><dt>Identificador</dt><dd className="receipt__id">{transaction.id}</dd></div><div><dt>Origem</dt><dd>{transaction.origin}</dd></div></dl><div className="receipt__actions"><button type="button" onClick={copy}><Copy aria-hidden="true" /> Copiar dados</button><button type="button" onClick={share}><Share2 aria-hidden="true" /> Compartilhar</button></div><p className="sr-status" role="status" aria-live="polite">{message}</p></article>;
}
