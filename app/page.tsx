import React from "react";

export default function HomePage() {
  return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="mb-8">
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2 w-80 m-auto">
                <a href="/"><img src="/raz_logo.png" alt="logo" /></a>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Портал адаптации</h1>
            <p className="text-gray-500">Система обучения новых сотрудников</p>
          </div>

          <div className="space-y-4">
            <a
                href="/register"
                className="inline-block bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 transition"
            >
              Зарегистрироваться
            </a>

            <div className="text-sm text-gray-400">
              Уже есть аккаунт? <a href="/login" className="text-blue-600 hover:underline">Войти</a>
            </div>
          </div>
        </div>
      </div>
  );
}