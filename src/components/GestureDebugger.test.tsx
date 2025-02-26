import { render, screen } from '@testing-library/react';
import { GestureDebugger } from './GestureDebugger';

describe('GestureDebugger', () => {
  it('アイドル状態を表示できる', () => {
    render(
      <GestureDebugger
        gesture={{
          type: 'idle',
          touches: [],
        }}
      />
    );

    expect(screen.getByText('ジェスチャー状態:')).toBeInTheDocument();
    expect(screen.getByText('idle')).toBeInTheDocument();
    expect(screen.getByText('タッチ数: 0')).toBeInTheDocument();
  });
}); 