import Svg, { Circle, Path } from 'react-native-svg';

export default function RemovePlayerIcon({ size = 40 }: { size?: number }) {
  const strokeWidth = size * 0.13;
  const radius = size / 2 - strokeWidth / 2;
  const inset = size * 0.33;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="#FF4B3E"
      />
      <Path
        d={`M ${inset} ${inset} L ${size - inset} ${size - inset} M ${size - inset} ${inset} L ${inset} ${size - inset}`}
        stroke="#F4F1E8"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}
