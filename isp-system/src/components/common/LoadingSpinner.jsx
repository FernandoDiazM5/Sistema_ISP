export default function LoadingSpinner() {
  return (
    <div className="h-screen flex items-center justify-center bg-bg-primary">
      <div className="text-center">
        <div className="w-12 h-12 border-[3px] border-border border-t-accent-blue rounded-full animate-spin-slow mx-auto mb-4" />
        <p className="text-text-secondary text-sm">Cargando sistema...</p>
      </div>
    </div>
  );
}
