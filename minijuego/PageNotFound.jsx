import { Link } from 'react-router-dom';

export default function PageNotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="max-w-md w-full border border-border bg-card p-8 text-center space-y-4">
        <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">404</p>
        <h1 className="text-3xl font-black italic">Pagina no encontrada</h1>
        <p className="text-sm text-muted-foreground">
          La ruta que has abierto no existe en este minijuego.
        </p>
        <Link
          to="/Game"
          className="inline-flex items-center justify-center border border-primary px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
        >
          Volver al juego
        </Link>
      </div>
    </div>
  );
}
