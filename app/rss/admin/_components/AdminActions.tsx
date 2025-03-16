import UpdateAllFeedsButton from './UpdateAllFeedsButton';

export default function AdminActions() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium mb-2">全フィードを更新</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          すべてのRSSフィードを手動で更新します。
        </p>
        <UpdateAllFeedsButton />
      </div>
    </div>
  );
}
