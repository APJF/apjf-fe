import React from 'react';
import AppRouter from './router/AppRouter';

/**
 * App Component - Root component của ứng dụng
 * Sử dụng AppRouter để xử lý routing
 * Tailwind CSS được import qua index.css
 */
function App(): React.ReactElement {
  return (
    <div>
      <AppRouter />
    </div>
  );
}

export default App;
