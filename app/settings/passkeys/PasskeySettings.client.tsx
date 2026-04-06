'use client';

import { useState } from 'react';
import {
  performPasskeyRegistration,
  isPasskeySupported,
} from '@/app/lib/webauthn/passkey-client';
import { trpc } from '@/app/trpc-client';

export default function PasskeySettings() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [passkeyName, setPasskeyName] = useState('');
  const [editingPasskeyId, setEditingPasskeyId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const passkeysQuery = trpc.passkey.list.useQuery();
  const deleteMutation = trpc.passkey.delete.useMutation({
    onSuccess: () => {
      setError(null);
      passkeysQuery.refetch();
    },
    onError: (mutationError) => {
      setError(mutationError.message);
    },
  });
  const renameMutation = trpc.passkey.rename.useMutation({
    onSuccess: () => {
      setError(null);
      setEditingPasskeyId(null);
      setEditingName('');
      passkeysQuery.refetch();
    },
    onError: (mutationError) => {
      setError(mutationError.message);
    },
  });

  const handleAddPasskey = async () => {
    setError(null);
    setLoading(true);

    try {
      await performPasskeyRegistration({
        passkeyName: passkeyName.trim() || undefined,
      });
      setPasskeyName('');
      await passkeysQuery.refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : '登録に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (passkeyId: string) => {
    if (!confirm('このPassKeyを削除しますか？')) return;
    deleteMutation.mutate({ passkeyId });
  };

  const handleStartRename = (passkeyId: string, currentName: string | null) => {
    setError(null);
    setEditingPasskeyId(passkeyId);
    setEditingName(currentName ?? '');
  };

  const handleRename = (passkeyId: string) => {
    renameMutation.mutate({
      passkeyId,
      name: editingName.trim(),
    });
  };

  if (passkeysQuery.isLoading) {
    return <p className="text-gray-500">読み込み中...</p>;
  }

  const passkeys = passkeysQuery.data ?? [];
  const passkeySupported = isPasskeySupported();

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            登録済みPassKey
          </h3>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {!passkeySupported && (
          <p className="text-yellow-500 text-sm mb-4">
            お使いのブラウザはPassKeyに対応していません
          </p>
        )}

        {passkeySupported && (
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label
                htmlFor="passkey-name"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                PassKey名
              </label>
              <input
                id="passkey-name"
                type="text"
                value={passkeyName}
                onChange={(event) => setPasskeyName(event.target.value)}
                placeholder="例: Work MacBook"
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <button
              type="button"
              onClick={handleAddPasskey}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading ? '登録中...' : 'PassKeyを追加'}
            </button>
          </div>
        )}

        {passkeys.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            登録済みのPassKeyはありません
          </p>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {passkeys.map((passkey) => (
              <li key={passkey.id} className="py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {passkey.name ?? 'PassKey'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {passkey.credentialDeviceType === 'multiDevice'
                      ? '同期対応'
                      : 'デバイス固有'}
                    {passkey.credentialBackedUp && ' • バックアップ済'}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    登録日: {new Date(passkey.createdAt).toLocaleDateString('ja-JP')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleStartRename(passkey.id, passkey.name)}
                    disabled={renameMutation.isLoading}
                    className="text-blue-600 hover:text-blue-800 text-sm disabled:opacity-50"
                  >
                    名前を変更
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(passkey.id)}
                    disabled={deleteMutation.isLoading}
                    className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
                  >
                    削除
                  </button>
                </div>
                {editingPasskeyId === passkey.id && (
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex-1">
                      <label
                        htmlFor={`rename-passkey-${passkey.id}`}
                        className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        新しいPassKey名
                      </label>
                      <input
                        id={`rename-passkey-${passkey.id}`}
                        type="text"
                        value={editingName}
                        onChange={(event) => setEditingName(event.target.value)}
                        className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRename(passkey.id)}
                      disabled={renameMutation.isLoading || editingName.trim().length === 0}
                      className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      保存
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
