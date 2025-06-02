'use client';

import { useCallback, useState } from 'react';
import { trpc } from '@/app/trpc-client';
import { toast } from 'react-hot-toast';

export function useOptimisticTodos() {
  const utils = trpc.useUtils();
  const [pendingOperations, setPendingOperations] = useState<Set<string>>(new Set());
  
  // 既存のミューテーション（エラーハンドリング付き）
  const updateOrderMutation = trpc.todo.updateOrder.useMutation({
    onError: (error) => {
      console.error('[useOptimisticTodos] updateOrder error:', {
        error,
        message: error.message,
        code: error.data?.code,
        stack: error.data?.stack,
        timestamp: new Date().toISOString()
      });
    }
  });
  const updateMutation = trpc.todo.update.useMutation({
    onError: (error) => {
      console.error('[useOptimisticTodos] update error:', {
        error,
        message: error.message,
        code: error.data?.code,
        stack: error.data?.stack,
        timestamp: new Date().toISOString()
      });
    }
  });
  const deleteMutation = trpc.todo.delete.useMutation({
    onError: (error) => {
      console.error('delete error:', error);
    }
  });
  const updateManyStatusMutation = trpc.todo.updateManyStatus.useMutation({
    onError: (error) => {
      console.error('updateManyStatus error:', error);
    }
  });

  const isOperationPending = useCallback((operationId: string) => {
    return pendingOperations.has(operationId);
  }, [pendingOperations]);

  const addPendingOperation = useCallback((operationId: string) => {
    setPendingOperations(prev => new Set(prev).add(operationId));
  }, []);

  const removePendingOperation = useCallback((operationId: string) => {
    setPendingOperations(prev => {
      const newSet = new Set(prev);
      newSet.delete(operationId);
      return newSet;
    });
  }, []);

  // シンプルな楽観的更新：タスクの順序とステータス
  const optimisticUpdateOrder = useCallback(
    async (todoId: string, newOrder: number, newStatus?: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
      const operationId = `order-${todoId}-${Date.now()}`;
      
      if (isOperationPending(operationId)) return;

      const currentData = utils.todo.getAll.getData();
      if (!currentData) return;

      addPendingOperation(operationId);

      // 楽観的更新：即座にUI反映
      utils.todo.getAll.setData(undefined, (old) => {
        if (!old?.todos) return old;
        
        return {
          todos: old.todos.map((todo) => {
            if (todo.id === todoId) {
              return {
                ...todo,
                order: newOrder,
                ...(newStatus && { status: newStatus, completed: newStatus === 'DONE' }),
              };
            }
            return todo;
          }),
        };
      });

      try {

        // ステータス変更がある場合は、orderとstatusを一度に更新
        if (newStatus) {
          await updateMutation.mutateAsync({
            id: todoId,
            data: { 
              order: newOrder,
              status: newStatus, 
              completed: newStatus === 'DONE' 
            },
          });
          
          // サーバーレスポンスは無視して楽観的更新を維持
          // 完全なデータの整合性はリロード時に保証される
        } else {
          // ステータス変更がない場合は、orderのみ更新
          await updateOrderMutation.mutateAsync({
            taskId: todoId,
            newOrder: newOrder,
          });
          
          // サーバーレスポンスは無視して楽観的更新を維持
        }
      } catch (error: any) {
        // エラー時のみロールバック
        utils.todo.getAll.setData(undefined, currentData);
        toast.error('更新に失敗しました');
        console.error('[useOptimisticTodos] Optimistic update failed:', {
          error,
          message: error?.message,
          code: error?.data?.code,
          todoId,
          newOrder,
          newStatus,
          timestamp: new Date().toISOString()
        });
      } finally {
        removePendingOperation(operationId);
      }
    },
    [utils, updateOrderMutation, updateMutation, isOperationPending, addPendingOperation, removePendingOperation]
  );

  // ステータス更新
  const optimisticUpdateStatus = useCallback(
    async (todoId: string, newStatus: 'TODO' | 'IN_PROGRESS' | 'DONE', newOrder?: number) => {
      const operationId = `status-${todoId}-${Date.now()}`;
      
      if (isOperationPending(operationId)) return;
      const currentData = utils.todo.getAll.getData();
      if (!currentData) return;

      addPendingOperation(operationId);

      utils.todo.getAll.setData(undefined, (old) => {
        if (!old?.todos) return old;
        
        return {
          todos: old.todos.map((todo) => {
            if (todo.id === todoId) {
              return {
                ...todo,
                status: newStatus,
                completed: newStatus === 'DONE',
                ...(newOrder !== undefined && { order: newOrder }),
              };
            }
            return todo;
          }),
        };
      });

      try {
        await updateMutation.mutateAsync({
          id: todoId,
          data: {
            status: newStatus,
            completed: newStatus === 'DONE',
            ...(newOrder !== undefined && { order: newOrder }),
          },
        });
        
        // サーバーレスポンスは無視して楽観的更新を維持
      } catch (error) {
        utils.todo.getAll.setData(undefined, currentData);
        toast.error('ステータス更新に失敗しました');
        console.error('Status update failed:', error);
      } finally {
        removePendingOperation(operationId);
      }
    },
    [utils, updateMutation, isOperationPending, addPendingOperation, removePendingOperation]
  );

  // 完了切り替え
  const optimisticToggleComplete = useCallback(
    async (todoId: string, completed: boolean) => {
      const operationId = `toggle-${todoId}-${Date.now()}`;
      
      if (isOperationPending(operationId)) return;
      const currentData = utils.todo.getAll.getData();
      if (!currentData) return;

      addPendingOperation(operationId);

      utils.todo.getAll.setData(undefined, (old) => {
        if (!old?.todos) return old;
        
        return {
          todos: old.todos.map((todo) => {
            if (todo.id === todoId) {
              return {
                ...todo,
                completed,
                status: completed ? 'DONE' : 'TODO',
              };
            }
            return todo;
          }),
        };
      });

      try {
        await updateMutation.mutateAsync({
          id: todoId,
          data: {
            completed,
            status: completed ? 'DONE' : 'TODO',
          },
        });
        
        // サーバーレスポンスは無視して楽観的更新を維持
      } catch (error) {
        utils.todo.getAll.setData(undefined, currentData);
        toast.error('完了状態の更新に失敗しました');
        console.error('Toggle complete failed:', error);
      } finally {
        removePendingOperation(operationId);
      }
    },
    [utils, updateMutation, isOperationPending, addPendingOperation, removePendingOperation]
  );

  // 削除
  const optimisticDelete = useCallback(
    async (todoId: string) => {
      const operationId = `delete-${todoId}-${Date.now()}`;
      
      if (isOperationPending(operationId)) return;
      const currentData = utils.todo.getAll.getData();
      if (!currentData) return;

      addPendingOperation(operationId);

      utils.todo.getAll.setData(undefined, (old) => {
        if (!old?.todos) return old;
        return {
          todos: old.todos.filter((todo) => todo.id !== todoId),
        };
      });

      try {
        await deleteMutation.mutateAsync({ id: todoId });
        toast.success('タスクを削除しました');
      } catch (error) {
        utils.todo.getAll.setData(undefined, currentData);
        toast.error('削除に失敗しました');
        console.error('Delete failed:', error);
      } finally {
        removePendingOperation(operationId);
      }
    },
    [utils, deleteMutation, isOperationPending, addPendingOperation, removePendingOperation]
  );

  // 一括ステータス更新
  const optimisticUpdateManyStatus = useCallback(
    async (todoIds: string[], newStatus: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
      const operationId = `bulk-${todoIds.join('-')}-${Date.now()}`;
      
      if (isOperationPending(operationId)) return;
      const currentData = utils.todo.getAll.getData();
      if (!currentData) return;

      addPendingOperation(operationId);

      utils.todo.getAll.setData(undefined, (old) => {
        if (!old?.todos) return old;
        
        return {
          todos: old.todos.map((todo) => {
            if (todoIds.includes(todo.id)) {
              return {
                ...todo,
                status: newStatus,
                completed: newStatus === 'DONE',
              };
            }
            return todo;
          }),
        };
      });

      try {
        const result = await updateManyStatusMutation.mutateAsync({
          ids: todoIds,
          completed: newStatus === 'DONE',
        });
        
        // 一括更新の場合は楽観的更新をそのまま維持
        // サーバーは成功/失敗のみ返すため
        toast.success(`${todoIds.length}件のタスクを更新しました`);
      } catch (error) {
        utils.todo.getAll.setData(undefined, currentData);
        toast.error('一括更新に失敗しました');
        console.error('Bulk update failed:', error);
      } finally {
        removePendingOperation(operationId);
      }
    },
    [utils, updateManyStatusMutation, isOperationPending, addPendingOperation, removePendingOperation]
  );

  return {
    optimisticUpdateOrder,
    optimisticUpdateStatus,
    optimisticToggleComplete,
    optimisticDelete,
    optimisticUpdateManyStatus,
    isOperationPending: (todoId: string) => pendingOperations.has(todoId),
  };
}