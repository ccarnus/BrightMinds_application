import React, { useCallback } from 'react';
import CastVideoPlayer from '@shared/components/CastVideoPlayer';

const VirtualLabVideoScreen = ({ route, navigation }) => {
  const { selectedCastId, selectedVideoId } = route.params;

  const handleExit = useCallback(() => navigation.goBack(), [navigation]);

  return (
    <CastVideoPlayer castId={selectedCastId || selectedVideoId} navigation={navigation} onExit={handleExit} />
  );
};

export default VirtualLabVideoScreen;
