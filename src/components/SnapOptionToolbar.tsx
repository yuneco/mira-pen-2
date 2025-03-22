import type { FC } from 'react';

export type SnapOptionToolbarProps = {
  /** すべての図形にスナップするか */
  snapToAll: boolean;
  /** スナップ設定変更時のコールバック */
  onSnapToAllChange: (snapToAll: boolean) => void;
};

/**
 * スナップオプションを設定するツールバー
 */
export const SnapOptionToolbar: FC<SnapOptionToolbarProps> = ({ snapToAll, onSnapToAllChange }) => {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: '8px',
        padding: '8px 16px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
        zIndex: 100,
      }}
    >
      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={snapToAll}
          onChange={(e) => onSnapToAllChange(e.target.checked)}
        />
        すべてにスナップ
      </label>
    </div>
  );
};
