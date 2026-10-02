import { Check, Copy, Share2 } from 'lucide-react';
import { useState } from 'react';
import { formatDateTime, formatMoney } from '../domain/formatters';
import type { Transaction } from '../domain/models';

interface ReceiptProps {
  transaction: Transaction;
  headingLevel?: 'h1' | 'h2';
}

export function Receipt({ transaction, headingLevel = 'h1' }: ReceiptProps) {
  const [message, setMessage] = useState('');
  const Heading = headingLevel;
  const { date, time } = formatDateTime(transaction.occurredAt);
  const isPayment = transaction.type === 'payment';
  const isIncoming = transaction.direction === 'in';
  const title = isPayment ? 'Pagamento concluído.' : isIncoming ? 'Recebimento confirmado.' : 'Pix enviado.';
  const receiptName = isPayment ? 'Pagamento NewGenBank' : isIncoming ? 'Recebimento NewGenBank' : 'Pix NewGenBank';
  const text = [receiptName, formatMoney(transaction.amount), transaction.recipient, transaction.institution, `${date} às ${time}`, `ID ${transaction.operationId ?? transaction.id}`].filter(Boolean).join('\n');
  const copy = async () => { await navigator.clipboard.writeText(text); setMessage('Dados do comprovante copiados.'); };
  const share = async () => { if (navigator.share) { await navigator.share({ title: `Comprovante · ${receiptName}`, text }); setMessage('Comprovante compartilhado.'); } else await copy(); };
  return <article className="receipt" aria-labelledby="receipt-title"><header className="receipt__header"><span><Check aria-hidden="true" /></span><div><p className="section-index">CONCLUÍDO</p><Heading id="receipt-title" tabIndex={-1}>{title}</Heading></div></header><p className="receipt__amount">{formatMoney(transaction.amount)}</p><dl className="receipt__details">
    {transaction.recipient && <div><dt>{isPayment ? 'Beneficiário' : isIncoming ? 'Conta recebedora' : 'Destinatário'}</dt><dd>{transaction.recipient}</dd></div>}
    {transaction.maskedKey && <div><dt>Chave Pix</dt><dd>{transaction.maskedKey}</dd></div>}
    {transaction.institution && <div><dt>Instituição</dt><dd>{transaction.institution}</dd></div>}
    {transaction.reference && <div><dt>Referência</dt><dd className="receipt__id">{transaction.reference}</dd></div>}
    {transaction.dueDate && <div><dt>Vencimento</dt><dd>{formatDateTime(transaction.dueDate).date}</dd></div>}
    <div><dt>Categoria</dt><dd>{transaction.category}</dd></div><div><dt>Data</dt><dd>{date}</dd></div><div><dt>Horário</dt><dd>{time}</dd></div><div><dt>Identificador</dt><dd className="receipt__id">{transaction.operationId ?? transaction.id}</dd></div>{transaction.origin && <div><dt>Origem</dt><dd>{transaction.origin}</dd></div>}
  </dl><div className="receipt__actions"><button type="button" onClick={copy}><Copy aria-hidden="true" /> Copiar dados</button><button type="button" onClick={share}><Share2 aria-hidden="true" /> Compartilhar</button></div><p className="sr-status" role="status" aria-live="polite">{message}</p></article>;
}
