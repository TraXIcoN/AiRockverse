"use client";

import { useEffect, useRef } from "react";
import styles from "@/styles/WaveBackground.module.css";

class WaveAnimation {
  private ctx: CanvasRenderingContext2D;
  private width: number | undefined;
  private height: number | undefined;
  private waves: any[] = [];
  private hue: number = 11;
  private hueFw: boolean = true;
  private animationFrameId: number | undefined;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
    this.resize();
    this.init();
  }

  private resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  private init() {
    for (let i = 0; i < 3; i++) {
      this.waves.push({
        angle: Array(4)
          .fill(0)
          .map(() => Math.random() * Math.PI * 2),
        speed: Array(4)
          .fill(0)
          .map(
            () =>
              (Math.random() * 0.004 + 0.004) * (Math.random() > 0.5 ? 1 : -1)
          ),
        lines: [],
      });
    }
  }

  private updateColor() {
    this.hue += this.hueFw ? 0.01 : -0.01;

    if (this.hue > 14 && this.hueFw) {
      this.hue = 14;
      this.hueFw = false;
    } else if (this.hue < 11 && !this.hueFw) {
      this.hue = 11;
      this.hueFw = true;
    }

    const a = Math.floor(127 * Math.sin(0.3 * this.hue + 0) + 128);
    const b = Math.floor(127 * Math.sin(0.3 * this.hue + 2) + 128);
    const c = Math.floor(127 * Math.sin(0.3 * this.hue + 4) + 128);

    return `rgba(${a},${b},${c}, 0.1)`;
  }

  private drawWave(wave: any, color: string) {
    const ctx = this.ctx;
    if (this.width && this.height) {
      const radius =
        Math.sqrt(Math.pow(this.width, 2) + Math.pow(this.height, 2)) / 2;
      const centerX = this.width / 2;
      const centerY = this.height / 2;

      wave.lines.push({ angle: [...wave.angle], color });

      if (wave.lines.length > 200) {
        wave.lines.shift();
      }

      wave.lines.forEach((line: any) => {
        const angles = line.angle;
        ctx.strokeStyle = line.color;
        ctx.beginPath();

        const x1 = centerX - radius * Math.cos(angles[0] * 0.5);
        const y1 = centerY - radius * Math.sin(angles[0] * 0.5);
        const x2 = centerX + radius * Math.cos(angles[3] * 0.5);
        const y2 = centerY + radius * Math.sin(angles[3] * 0.5);

        const cpx1 = centerX - (radius / 3) * Math.cos(angles[1]);
        const cpy1 = centerY - (radius / 3) * Math.sin(angles[1]);
        const cpx2 = centerX + (radius / 3) * Math.cos(angles[2]);
        const cpy2 = centerY + (radius / 3) * Math.sin(angles[2]);

        ctx.moveTo(x1, y1);
        ctx.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, x2, y2);
        ctx.stroke();
      });

      for (let i = 0; i < 4; i++) {
        wave.angle[i] += wave.speed[i];
      }
    }
  }

  public animate = () => {
    this.ctx.clearRect(0, 0, this.width ?? 0, this.height ?? 0);

    // Draw background gradient
    if (this.height) {
      const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
      gradient.addColorStop(0, "#000");
      const backgroundColor = this.updateColor();
      gradient.addColorStop(1, backgroundColor);
      this.ctx.fillStyle = gradient;
    }
    if (this.width && this.height) {
      this.ctx.fillRect(0, 0, this.width, this.height);
    }

    // Draw waves
    if (this.width && this.height) {
      const waveColor = this.updateColor();
      this.waves.forEach((wave) => this.drawWave(wave, waveColor));
    }

    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  public destroy() {
    if (this.animationFrameId !== undefined) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}

const WaveBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const waveAnimation = new WaveAnimation(canvasRef.current);
    waveAnimation.animate();

    return () => waveAnimation.destroy();
  }, []);

  return (
    <div className={styles.container}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
};

export default WaveBackground;
