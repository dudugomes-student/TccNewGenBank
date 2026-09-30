import type { PixRecipient } from '../domain/models';

export const demoPixRecipients: PixRecipient[] = [
  { id: 'recipient-gabriel', name: 'Gabriel Martins', key: 'gabriel@demo.ngb', keyType: 'email', maskedKey: 'ga•••••@demo.ngb', institution: 'Banco Horizonte · 321', taxIdSuffix: '•••.482.***-09', available: true },
  { id: 'recipient-marina', name: 'Marina Alves', key: '52998224725', keyType: 'cpf', maskedKey: '***.982.247-**', institution: 'Cooperativa Aurora · 085', taxIdSuffix: '***.982.247-**', available: true },
  { id: 'recipient-caio', name: 'Caio Nascimento', key: '11988884422', keyType: 'phone', maskedKey: '(11) 9••••-4422', institution: 'Banco Atlântico · 461', taxIdSuffix: '•••.116.***-42', available: true },
  { id: 'recipient-ana', name: 'Ana Clara Lima', key: '6f6a6302-9165-4a61-89fe-793a98da1044', keyType: 'random', maskedKey: '6f6a••••-••••-••••-••••-••••98da1044', institution: 'Carteira Lume · 597', taxIdSuffix: '•••.708.***-18', available: true },
  { id: 'recipient-unavailable', name: 'Rafael Costa', key: 'indisponivel@demo.ngb', keyType: 'email', maskedKey: 'in•••••••••@demo.ngb', institution: 'Banco Temporário · 404', taxIdSuffix: '•••.930.***-61', available: false },
];

export const pixRecipientExamples = {
  email: 'gabriel@demo.ngb',
  cpf: '529.982.247-25',
  phone: '(11) 98888-4422',
  random: '6f6a6302-9165-4a61-89fe-793a98da1044',
};
