import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useQueryClient } from "@tanstack/react-query";
import {
  Fingerprint,
  Loader2,
  Lock,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

type AdminLoginProps = {
  /** True while the caller's admin role is still being resolved. */
  isCheckingAccess: boolean;
  /** True when the signed-in caller is an authorized administrator. */
  isAdmin: boolean;
};

/**
 * Gate for the private admin panel. Signed-out visitors see the sign-in card;
 * signed-in non-admins see an "acceso denegado" state. Only authorized
 * administrators ever reach the panel content.
 */
export function AdminLogin({ isCheckingAccess, isAdmin }: AdminLoginProps) {
  const { login, clear, isAuthenticated, isInitializing, isLoggingIn } =
    useInternetIdentity();
  const queryClient = useQueryClient();

  const handleSignOut = () => {
    clear();
    queryClient.clear();
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-16">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/40 bg-accent/10 text-accent shadow-glow">
          <Lock className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Panel administrativo
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Área restringida del taller L&amp;G TECH. El acceso está limitado a
          administradores autorizados.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-elevated">
        {!isAuthenticated ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-3">
              <Fingerprint
                className="mt-0.5 h-5 w-5 shrink-0 text-accent"
                aria-hidden="true"
              />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Inicia sesión con Internet Identity. La primera cuenta
                autenticada del taller queda registrada como administradora.
              </p>
            </div>
            <Button
              type="button"
              data-ocid="admin.login_button"
              onClick={() => login()}
              disabled={isInitializing || isLoggingIn}
              className="w-full rounded-lg gradient-primary font-semibold text-primary-foreground shadow-glow transition-smooth hover:opacity-90"
            >
              {isInitializing || isLoggingIn ? (
                <>
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  Conectando…
                </>
              ) : (
                <>
                  <Fingerprint className="h-4 w-4" aria-hidden="true" />
                  Iniciar sesión
                </>
              )}
            </Button>
          </div>
        ) : isCheckingAccess ? (
          <div
            data-ocid="admin.access_loading_state"
            className="flex items-center justify-center gap-3 py-6 text-sm text-muted-foreground"
          >
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Verificando permisos…
          </div>
        ) : isAdmin ? (
          <div
            data-ocid="admin.access_success_state"
            className="flex flex-col items-center gap-3 py-4 text-center"
          >
            <ShieldCheck className="h-8 w-8 text-success" aria-hidden="true" />
            <p className="text-sm font-semibold text-foreground">
              Acceso autorizado
            </p>
            <p className="text-xs text-muted-foreground">
              Cargando el panel administrativo…
            </p>
          </div>
        ) : (
          <div
            data-ocid="admin.access_denied_state"
            className="flex flex-col gap-4"
          >
            <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-3">
              <ShieldAlert
                className="mt-0.5 h-5 w-5 shrink-0 text-destructive"
                aria-hidden="true"
              />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Acceso denegado
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Tu cuenta no tiene permisos de administrador. Solicita
                  autorización al responsable del taller.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              data-ocid="admin.signout_button"
              onClick={handleSignOut}
              className="w-full rounded-lg border-border font-semibold"
            >
              Cerrar sesión
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
