import { useAtomValue } from 'jotai';
import { pointerStateAtom } from '../state/pointerState';

export const PointerDebugger = () => {
  const pointerState = useAtomValue(pointerStateAtom);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        right: 0,
        padding: '8px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        fontFamily: 'monospace',
        fontSize: '12px',
        zIndex: 1000,
        maxWidth: '300px',
        borderRadius: '8px 0 0 0',
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
        ポインター状態: <span style={{ color: '#00ffcc' }}>{pointerState.phase}</span>
      </div>

      <div style={{ marginTop: '4px' }}>
        <div>ビュー座標:</div>
        <div style={{ paddingLeft: '8px' }}>
          ({Math.round(pointerState.viewPoint.x)}, {Math.round(pointerState.viewPoint.y)})
        </div>
      </div>

      <div style={{ marginTop: '4px' }}>
        <div>キャンバス座標:</div>
        <div style={{ paddingLeft: '8px' }}>
          ({Math.round(pointerState.canvasPoint.x)}, {Math.round(pointerState.canvasPoint.y)})
        </div>
      </div>

      {pointerState.phase === 'down' && (
        <div style={{ marginTop: '4px', color: '#ffcc00' }}>押下中</div>
      )}

      {pointerState.phase === 'drag' && (
        <div style={{ marginTop: '4px', color: '#ffcc00' }}>ドラッグ中</div>
      )}
    </div>
  );
};
