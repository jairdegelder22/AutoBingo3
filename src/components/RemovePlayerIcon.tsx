import React from 'react';
import { Image } from 'react-native';

const REMOVE_PLAYER_IMAGE = require('../../assets/images/ui/remove-player.png');

export default function RemovePlayerIcon({ size = 40 }: { size?: number }) {
  return (
    <Image
      source={REMOVE_PLAYER_IMAGE}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}
