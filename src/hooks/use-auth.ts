import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { useSessionStore } from "@/stores/session";
import { adaptApiUserToUser } from "@/adapters/auth.adapter";
import type { LoginPayload, RegisterPayload, ApiError } from "@/types/api";
import type { AxiosError } from "axios";

export function useLogin() {
  const { login } = useSessionStore();
  const router = useRouter();

  return useMutation<
    Awaited<ReturnType<typeof authService.login>>,
    AxiosError<ApiError>,
    LoginPayload
  >({
    mutationFn: authService.login,
    onSuccess: ({ data }) => {
      login(adaptApiUserToUser(data.user), data.token);
      router.replace("/dashboard");
    },
  });
}

export function useRegister() {
  const { login } = useSessionStore();
  const router = useRouter();

  return useMutation<
    Awaited<ReturnType<typeof authService.register>>,
    AxiosError<ApiError>,
    RegisterPayload
  >({
    mutationFn: authService.register,
    onSuccess: ({ data }) => {
      login(adaptApiUserToUser(data.user), data.token);
      router.replace("/dashboard");
    },
  });
}

export function useLogout() {
  const { logout } = useSessionStore();
  const router = useRouter();

  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      logout();
      router.replace("/login");
    },
    onError: () => {
      logout();
      router.replace("/login");
    },
  });
}
