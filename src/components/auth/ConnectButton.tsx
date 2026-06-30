/** Link that kicks off the server-side OAuth login flow. */
export function ConnectButton({
  className = "",
  children = "Connect Spotify",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <a
      href="/api/auth/login"
      className={`inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.02] active:scale-100 ${className}`}
    >
      {children}
    </a>
  );
}
