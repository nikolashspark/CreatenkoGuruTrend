import React, { useState, useEffect } from 'react';

const RAILWAY_API_URL = import.meta.env.VITE_RAILWAY_API_URL || 'http://localhost:3000';

interface SystemPrompt {
  id: string;
  key: string;
  name: string;
  description: string | null;
  prompt: string;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const Config: React.FC = () => {
  const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<SystemPrompt>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${RAILWAY_API_URL}/api/system-prompts`);
      
      if (!response.ok) {
        throw new Error('Failed to load system prompts');
      }

      const data = await response.json();
      setPrompts(data.prompts || []);
      
    } catch (err: any) {
      console.error('Load prompts error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (prompt: SystemPrompt) => {
    setEditingId(prompt.id);
    setEditForm({
      name: prompt.name,
      description: prompt.description,
      prompt: prompt.prompt,
      is_active: prompt.is_active
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  const savePrompt = async (id: string) => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`${RAILWAY_API_URL}/api/system-prompts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm)
      });

      if (!response.ok) {
        throw new Error('Failed to update prompt');
      }

      const data = await response.json();
      
      // Оновити в списку
      setPrompts(prompts.map(p => p.id === id ? data.prompt : p));
      setEditingId(null);
      setEditForm({});
      
      alert('✅ Промпт успішно збережено!');
      
    } catch (err: any) {
      console.error('Save prompt error:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const groupedPrompts = prompts.reduce((acc, prompt) => {
    if (!acc[prompt.category]) {
      acc[prompt.category] = [];
    }
    acc[prompt.category].push(prompt);
    return acc;
  }, {} as Record<string, SystemPrompt[]>);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Завантаження...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ⚙️ Налаштування системних промптів
          </h1>
          <p className="text-gray-600">
            Редагуйте промпти які використовуються в системі для генерації та аналізу
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
            <p className="text-red-700">❌ {error}</p>
          </div>
        )}

        {/* Prompts by Category */}
        {Object.keys(groupedPrompts).length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500 text-lg">
              📭 Системні промпти не знайдено
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Виконайте SQL файл для створення таблиці та початкових промптів
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedPrompts).map(([category, categoryPrompts]) => (
              <div key={category} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4">
                  <h2 className="text-xl font-bold text-white capitalize">
                    {category.replace('_', ' ')}
                  </h2>
                </div>

                <div className="divide-y divide-gray-200">
                  {categoryPrompts.map((prompt) => (
                    <div key={prompt.id} className="p-6">
                      {editingId === prompt.id ? (
                        /* Edit Mode */
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Назва
                            </label>
                            <input
                              type="text"
                              value={editForm.name || ''}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Опис
                            </label>
                            <input
                              type="text"
                              value={editForm.description || ''}
                              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Промпт
                            </label>
                            <textarea
                              value={editForm.prompt || ''}
                              onChange={(e) => setEditForm({ ...editForm, prompt: e.target.value })}
                              rows={20}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                            />
                          </div>

                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={editForm.is_active !== undefined ? editForm.is_active : true}
                              onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                              className="mr-2"
                            />
                            <label className="text-sm text-gray-700">Активний</label>
                          </div>

                          <div className="flex gap-3">
                            <button
                              onClick={() => savePrompt(prompt.id)}
                              disabled={saving}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {saving ? '💾 Збереження...' : '✅ Зберегти'}
                            </button>
                            <button
                              onClick={cancelEditing}
                              disabled={saving}
                              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
                            >
                              ❌ Скасувати
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* View Mode */
                        <div>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                {prompt.name}
                                {!prompt.is_active && (
                                  <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                                    Неактивний
                                  </span>
                                )}
                              </h3>
                              {prompt.description && (
                                <p className="text-sm text-gray-600">{prompt.description}</p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">
                                Key: <code className="bg-gray-100 px-1 py-0.5 rounded">{prompt.key}</code>
                              </p>
                            </div>
                            <button
                              onClick={() => startEditing(prompt)}
                              className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                              ✏️ Редагувати
                            </button>
                          </div>

                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono max-h-64 overflow-y-auto">
                              {prompt.prompt}
                            </pre>
                          </div>

                          <div className="mt-2 text-xs text-gray-400">
                            Оновлено: {new Date(prompt.updated_at).toLocaleString('uk-UA')}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Config;
