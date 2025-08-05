class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationId: number | null = null;
  private lastTime: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get 2D context from canvas');
    }
    this.ctx = context;
    this.setupCanvas();
  }

  private setupCanvas(): void {
    // 设置Canvas样式
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
  }

  public start(): void {
    this.gameLoop(0);
  }

  public stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private gameLoop = (currentTime: number): void => {
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.render();

    this.animationId = requestAnimationFrame(this.gameLoop);
  };

  private update(deltaTime: number): void {
    // 游戏逻辑更新
    // 目前只是显示Hello World，暂时不需要更新逻辑
  }

  private render(): void {
    // 清空画布
    this.ctx.fillStyle = '#34495e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 绘制Hello World
    this.ctx.fillStyle = '#ecf0f1';
    this.ctx.font = '48px Arial';
    this.ctx.fillText(
      'Hello World!',
      this.canvas.width / 2,
      this.canvas.height / 2 - 50
    );

    // 绘制副标题
    this.ctx.fillStyle = '#bdc3c7';
    this.ctx.font = '24px Arial';
    this.ctx.fillText(
      'HTML5 Canvas Game with React & TypeScript',
      this.canvas.width / 2,
      this.canvas.height / 2 + 20
    );

    // 绘制一个简单的动画圆形
    const time = Date.now() * 0.002;
    const x = this.canvas.width / 2 + Math.cos(time) * 100;
    const y = this.canvas.height / 2 + 100 + Math.sin(time) * 20;
    
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.beginPath();
    this.ctx.arc(x, y, 15, 0, Math.PI * 2);
    this.ctx.fill();
  }
}

export default Game;