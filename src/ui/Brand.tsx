import { Link } from 'react-router-dom';

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="brand" to="/" aria-label="NewGenBank — página inicial">
      <span className="brand__mark" aria-hidden="true"><span>N</span><span>G</span></span>
      {!compact && <span className="brand__wordmark">NEWGENBANK</span>}
    </Link>
  );
}
