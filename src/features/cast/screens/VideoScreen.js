import React, { useCallback } from 'react';
import CastVideoPlayer from '@shared/components/CastVideoPlayer';

const VideoScreen = ({ route, navigation }) => {
  const { selectedCastId, selectedVideoId } = route.params;

  const handleExit = useCallback(
    ({ watched, castId }) => {
      if (watched) {
        navigation.popTo('BottomNav', { screen: 'Cast', params: { finishedVideoId: castId } });
      } else {
        navigation.goBack();
      }
    },
    [navigation]
  );

  return (
    <CastVideoPlayer castId={selectedCastId || selectedVideoId} navigation={navigation} onExit={handleExit} />
  );
};

export default VideoScreen;
