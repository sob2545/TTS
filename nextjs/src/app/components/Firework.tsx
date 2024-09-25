import React, { useCallback, useEffect } from "react";
import ReactCanvasConfetti from "./ReactCanvasConfetti";

const Firework = () => {
  const refAnimationInstance = React.useRef<any>(null);

  const getInstance = useCallback((instance: any) => {
    refAnimationInstance.current = instance;
  }, []);

  const makeShot = useCallback((originX: number, angle: number) => {
    refAnimationInstance.current &&
      refAnimationInstance.current({
        particleCount: 100,
        angle: angle,
        spread: 55,
        startVelocity: 55,
        origin: { x: originX, y: 0.5 },
        decay: 0.9,
        scalar: 1.2,
        colors: ["#FFC700", "#FF0000", "#2E3192", "#41BBC7"],
      });
  }, []);

  const fire = useCallback(() => {
    makeShot(0, 60); // 왼쪽에서 오른쪽 위로
    makeShot(1, 120); // 오른쪽에서 왼쪽 위로
    makeShot(0, 300); // 왼쪽에서 오른쪽 아래로
    makeShot(1, 240); // 오른쪽에서 왼쪽 아래로
  }, [makeShot]);

  useEffect(() => {
    fire();
  }, [fire]);

  return (
    <ReactCanvasConfetti
      refConfetti={getInstance}
      className="firework-canvas"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 9999,
      }}
    />
  );
};

export default Firework;
