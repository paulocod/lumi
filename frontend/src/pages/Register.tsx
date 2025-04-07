import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../hooks/useAuthHook";
import { AxiosError } from "axios";

const registerSchema = z
  .object({
    name: z.string().min(3, "O nome deve ter no mínimo 3 caracteres"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
    confirmPassword: z
      .string()
      .min(6, "A senha deve ter no mínimo 6 caracteres"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const { register: registerUser, error, isLoading } = useAuth();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser(data.name, data.email, data.password);
      setShowSuccessMessage(true);
      setNotification({
        type: "success",
        message: "Conta criada com sucesso! Redirecionando para o login...",
      });

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      console.error("Erro ao registrar:", error);
      setShowErrorMessage(true);

      const axiosError = error as AxiosError<{ message: string }>;
      let errorMessage = "Erro ao criar conta. Por favor, tente novamente.";

      if (axiosError.response?.status === 409) {
        errorMessage =
          "Este email já está cadastrado. Por favor, use outro email ou faça login.";
      } else if (axiosError.response?.status === 400) {
        errorMessage =
          "Dados inválidos. Por favor, verifique as informações e tente novamente.";
      } else if (axiosError.response?.status === 500) {
        errorMessage =
          "Erro interno do servidor. Por favor, tente novamente mais tarde.";
      }

      setNotification({
        type: "error",
        message: errorMessage,
      });

      reset();
    }
  };

  const handleTryAgain = () => {
    setShowErrorMessage(false);
    setNotification(null);
    reset();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lumi-green-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">
          <div>
            <h2 className="text-center text-4xl font-bold text-lumi-green-800">
              Lumi
            </h2>
            <p className="mt-3 text-center text-sm text-lumi-gray-600">
              Crie sua conta para começar
            </p>
          </div>

          {showSuccessMessage ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 p-3">
                  <svg
                    className="h-10 w-10 text-green-500"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-lumi-green-600 font-medium text-lg">
                Conta criada com sucesso!
              </p>
              <p className="text-sm text-lumi-gray-600">
                Redirecionando para o login...
              </p>
              <div className="flex justify-center mt-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-lumi-green-500"></div>
              </div>
            </div>
          ) : showErrorMessage ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-red-100 p-3">
                  <svg
                    className="h-10 w-10 text-red-500"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-red-600 font-medium text-lg">
                Erro ao criar conta
              </p>
              <p className="text-sm text-lumi-gray-600">
                {notification?.message || "Por favor, tente novamente."}
              </p>
              <button
                onClick={handleTryAgain}
                className="mt-4 px-4 py-2 bg-lumi-green-600 text-white rounded-md hover:bg-lumi-green-700 transition-colors duration-200"
              >
                Tentar novamente
              </button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {notification && (
                <div
                  className={`rounded-md p-4 ${
                    notification.type === "success"
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <div className="flex items-center">
                    {notification.type === "success" ? (
                      <svg
                        className="h-5 w-5 text-green-400 mr-2"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5 text-red-400 mr-2"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    <p
                      className={`text-sm font-medium ${
                        notification.type === "success"
                          ? "text-green-800"
                          : "text-red-800"
                      }`}
                    >
                      {notification.message}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-lumi-gray-700"
                  >
                    Nome
                  </label>
                  <input
                    id="name"
                    type="text"
                    {...register("name")}
                    className="mt-1 block w-full px-3 py-2 border border-lumi-gray-300 rounded-md shadow-sm placeholder-lumi-gray-400 focus:outline-none focus:ring-2 focus:ring-lumi-green-500 focus:border-lumi-green-500 text-sm"
                    placeholder="Seu nome completo"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-lumi-gray-700"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    {...register("email")}
                    className="mt-1 block w-full px-3 py-2 border border-lumi-gray-300 rounded-md shadow-sm placeholder-lumi-gray-400 focus:outline-none focus:ring-2 focus:ring-lumi-green-500 focus:border-lumi-green-500 text-sm"
                    placeholder="Seu email"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.email.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-lumi-gray-700"
                  >
                    Senha
                  </label>
                  <input
                    id="password"
                    type="password"
                    {...register("password")}
                    className="mt-1 block w-full px-3 py-2 border border-lumi-gray-300 rounded-md shadow-sm placeholder-lumi-gray-400 focus:outline-none focus:ring-2 focus:ring-lumi-green-500 focus:border-lumi-green-500 text-sm"
                    placeholder="Sua senha"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.password.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-lumi-gray-700"
                  >
                    Confirmar Senha
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    {...register("confirmPassword")}
                    className="mt-1 block w-full px-3 py-2 border border-lumi-gray-300 rounded-md shadow-sm placeholder-lumi-gray-400 focus:outline-none focus:ring-2 focus:ring-lumi-green-500 focus:border-lumi-green-500 text-sm"
                    placeholder="Confirme sua senha"
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        {error}
                      </h3>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-lumi-green-600 hover:bg-lumi-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lumi-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      <span>Registrando...</span>
                    </div>
                  ) : (
                    "Registrar"
                  )}
                </button>
              </div>

              <div className="text-center">
                <p className="text-sm text-lumi-gray-600">
                  Já tem uma conta?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="font-medium text-lumi-green-600 hover:text-lumi-green-500"
                  >
                    Faça login
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
