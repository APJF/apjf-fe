import React, { useState, useEffect } from 'react';

interface TokenDebugInfoProps {
  show?: boolean;
}

export const TokenDebugInfo: React.FC<TokenDebugInfoProps> = ({ show = false }) => {
  const [tokenInfo, setTokenInfo] = useState<{
    hasAccessToken: boolean;
    hasRefreshToken: boolean;
    accessTokenLength: number;
    refreshTokenLength: number;
  }>({
    hasAccessToken: false,
    hasRefreshToken: false,
    accessTokenLength: 0,
    refreshTokenLength: 0,
  });

  const updateTokenInfo = () => {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    
    setTokenInfo({
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      accessTokenLength: accessToken?.length || 0,
      refreshTokenLength: refreshToken?.length || 0,
    });
  };

  useEffect(() => {
    if (!show) return;
    
    updateTokenInfo();
    const interval = setInterval(updateTokenInfo, 1000);
    return () => clearInterval(interval);
  }, [show]);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-lg text-xs font-mono z-50">
      <div className="font-bold mb-2">🔐 Token Debug Info</div>
      <div className={`${tokenInfo.hasAccessToken ? 'text-green-400' : 'text-red-400'}`}>
        Access: {tokenInfo.hasAccessToken ? `✓ (${tokenInfo.accessTokenLength})` : '✗'}
      </div>
      <div className={`${tokenInfo.hasRefreshToken ? 'text-green-400' : 'text-red-400'}`}>
        Refresh: {tokenInfo.hasRefreshToken ? `✓ (${tokenInfo.refreshTokenLength})` : '✗'}
      </div>
      <button 
        onClick={updateTokenInfo}
        className="mt-2 bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
      >
        Refresh
      </button>
    </div>
  );
};
