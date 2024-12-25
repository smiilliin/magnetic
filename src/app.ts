import { Application, Container, FillGradient, Graphics, Point } from "pixi.js";
import { SimplexNoise } from "ts-perlin-simplex";

const app = new Application();

class Vector2 {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  add(v: Vector2) {
    return new Vector2(this.x + v.x, this.y + v.y);
  }
  sub(v: Vector2) {
    return new Vector2(this.x - v.x, this.y - v.y);
  }
  mul(s: number) {
    return new Vector2(this.x * s, this.y * s);
  }
  div(s: number) {
    return new Vector2(this.x / s, this.y / s);
  }
  dot(v: Vector2) {
    return this.x * v.x + this.y * v.y;
  }
  norm() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  clone() {
    return new Vector2(this.x, this.y);
  }
}
class VectorSprite extends Container {
  body: Graphics;
  constructor() {
    super();
    this.body = new Graphics();
    this.draw(0.5);
    this.addChild(this.body);
  }
  draw(alpha: number) {
    return this.body
      .clear()
      .moveTo(50, 0)
      .lineTo(0, 0)
      .moveTo(50, 0)
      .lineTo(40, 10)
      .moveTo(50, 0)
      .lineTo(40, -10)
      .stroke({ color: [alpha, alpha, alpha], width: 3 });
  }
  view(v: Vector2) {
    const theta = Math.atan2(v.y, v.x);
    this.rotation = theta;
  }
  toVector() {
    return new Vector2(this.x, this.y);
  }
}

const simplex = new SimplexNoise();

class Magnetic extends Container {
  power: number;
  direction: Vector2;
  body: Graphics;
  startVector: Vector2;

  constructor(power: number) {
    super();
    const gradFill = new FillGradient(-10, 0, 10, 0);
    gradFill.addColorStop(0, 0x0000ff);
    gradFill.addColorStop(0.5, 0x111111);
    gradFill.addColorStop(1, 0xff0000);

    this.body = new Graphics().circle(0, 0, 15).fill(gradFill);
    this.addChild(this.body);
    this.power = power;
    this.direction = new Vector2(0, -1);
    this.startVector = new Vector2(Math.random() * 100, Math.random() * 100);
  }
  tick(t: number) {
    const timeVector = new Vector2(t / 15, t / 15);
    const noiseVector = this.startVector.add(timeVector);
    const x =
      simplex.noise3d(noiseVector.x, noiseVector.y, 0) *
        app.screen.width *
        0.6 +
      app.screen.width / 2;
    const y =
      simplex.noise3d(noiseVector.x, noiseVector.y, 100) *
        app.screen.height *
        0.6 +
      app.screen.height / 2;

    this.move(new Vector2(x, y));
  }
  move(vector: Vector2) {
    let direction = vector.sub(new Vector2(this.x, this.y));

    const norm = direction.norm();
    if (norm != 0) {
      direction = direction.div(direction.norm());
      let newAngle = Math.atan2(direction.y, direction.x);
      const oldAngle = Math.atan2(this.direction.y, this.direction.x);
      newAngle = oldAngle + (newAngle - oldAngle) / 100;

      this.direction = new Vector2(Math.cos(newAngle), Math.sin(newAngle));
      this.rotation = newAngle;
    }

    this.x = vector.x;
    this.y = vector.y;
  }
  magnetic(v: Vector2) {
    const r = v.sub(new Vector2(this.x, this.y));
    if (r.norm() == 0) {
      return new Vector2(0, 0);
    }

    const ur = r.div(r.norm());
    const m = this.direction.mul(this.power);
    return ur
      .mul(3 * m.dot(ur))
      .sub(m)
      .div(Math.pow(r.norm(), 3));
  }
}

app.init({ background: "#000000", resizeTo: document.body }).then(() => {
  document.body.appendChild(app.canvas);

  const view = new Container();

  app.stage.addChild(view);

  const width_n = 30;
  const height_n = 30;
  const xs = Array(width_n)
    .fill(0)
    .map(
      (_, i) =>
        app.screen.width * 0.05 + i * ((app.screen.width * 0.9) / width_n)
    );
  const ys = Array(height_n)
    .fill(0)
    .map(
      (_, i) =>
        app.screen.height * 0.05 + i * ((app.screen.height * 0.9) / height_n)
    );

  const vs: VectorSprite[] = [];
  const ms: Magnetic[] = [];

  for (let y = 0; y < height_n; y++) {
    for (let x = 0; x < width_n; x++) {
      const v = new VectorSprite();
      v.x = xs[x];
      v.y = ys[y];

      view.addChild(v);
      vs.push(v);
    }
  }
  for (let i = 0; i < 2; i++) {
    const magnetic = new Magnetic(1.0);
    view.addChild(magnetic);
    ms.push(magnetic);
  }

  app.stage.hitArea = app.screen;
  app.stage.eventMode = "static";

  let startTime = Date.now();
  app.ticker.add(() => {
    const t = (Date.now() - startTime) / 1000;

    ms.forEach((m) => {
      m.tick(t);
    });

    vs.forEach((v) => {
      const vector = new Vector2(v.x, v.y);

      let m = new Vector2(0, -0.000000001);
      ms.forEach((magnetic) => {
        m = m.add(magnetic.magnetic(vector));
      });
      const brightness = m.norm() * 10000000;

      v.view(m);
      v.draw(Math.min(brightness, 1.0));
    });
  });
});
