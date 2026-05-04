export default function HomePage() {
  return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">P</span>
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