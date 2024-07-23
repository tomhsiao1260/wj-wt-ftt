import { OrbitControls } from "@react-three/drei";
import { useKeybind } from "../hook/useControl";

export default function Controls() {
  const { spacePress } = useKeybind();

  return (
    <OrbitControls
      makeDefault
      enableDamping={false}
      enabled={spacePress}
      enableZoom={spacePress}
    />
  );
}
