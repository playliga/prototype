/**
 * Audio API hook.
 *
 * @module
 */
import React from 'react';
import { Constants, Util } from '@liga/shared';
import { AppStateContext } from '@liga/frontend/redux';

/**
 * Audio API.
 *
 * @param src The audio source.
 * @function
 */
export function useAudio(src: string) {
  // load audio file
  const audioRef = React.useRef<HTMLAudioElement>();

  if (!audioRef.current) {
    audioRef.current = new Audio('resources://audio/' + src);
  }

  // load settings
  const { state } = React.useContext(AppStateContext);
  const settings = React.useMemo(
    () => (state.profile ? Util.loadSettings(state.profile.settings) : Constants.Settings),
    [state.profile],
  );

  // apply volume setting
  React.useEffect(() => {
    if (!audioRef.current) {
      return;
    }

    audioRef.current.volume = settings.general.volume;
  }, [audioRef, settings]);

  // playback audio
  const play = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  };

  return play;
}
