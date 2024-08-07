/**
 * Animated confetti on canvas.
 *
 * @module
 */
import React from 'react';
import { createPortal } from 'react-dom';
import { random, sample } from 'lodash';

/** @enum */
enum Shape {
  CIRCLE,
  SQUARE,
}

/** @constant */
const DEFAULT_STATE = {
  running: false,
};

/**
 * How long to render the confetti (in ms).
 *
 * @constant
 */
const PARTICLE_DURATION = 5000;

/**
 * How many particles to render in the scene.
 *
 * @constant
 */
const PARTICLE_NUM = 120;

/**
 * The particle array.
 *
 * @constant
 */
const particles: Array<Particle> = [];

/**
 * The animation start time.
 *
 * @constant
 */
const startTime = performance.now();

/**
 * The animation frame id.
 *
 * @inner
 */
let frameId = 0;

/**
 * Attach dispatch to module scope which allows
 * state updates to be done from outside
 * the context of a React component.
 *
 * @inner
 */
let dispatch: React.Dispatch<React.SetStateAction<typeof DEFAULT_STATE>>;

/**
 * Representation of 2D vectors.
 *
 * @class
 */
class Vector2 {
  /** @constant */
  public x: number;

  /** @constant */
  public y: number;

  /**
   * @param x The x-axis.
   * @param y The y-axis.
   * @constructor
   */
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  /**
   * Shorthand for writing `Vector2(0, 0)`.
   *
   * @function
   */
  static zero() {
    return new Vector2(0, 0);
  }

  /**
   * Adds the `Vector2` values to the current instance's axes.
   *
   * @param that The `Vector2` values to add.
   * @function
   */
  public add(that: Vector2) {
    return new Vector2(this.x + that.x, this.y + that.y);
  }

  /**
   * Subtracts the `Vector2` values to the current instance's axes.
   *
   * @param that The `Vector2` values to subtract.
   * @function
   */
  public sub(that: Vector2) {
    return new Vector2(this.x - that.x, this.y - that.y);
  }

  /**
   * Multiplies the `Vector2` instance by the provided value.
   *
   * @param value The number to multiply.
   * @function
   */
  public scale(value: number) {
    return new Vector2(this.x * value, this.y * value);
  }

  /**
   * Returns the axes in an array.
   *
   * @function
   */
  public array(): [number, number] {
    return [this.x, this.y];
  }
}

/**
 * Representation of 2D points.
 *
 * @class
 */
class Point {
  /** @constant */
  public w: number;

  /** @constant */
  public h: number;

  /**
   * @param w The width.
   * @param h The height.
   * @constructor
   */
  constructor(w: number, h?: number) {
    this.w = w;
    this.h = h || w;
  }

  /**
   * Shorthand for writing `Point(0, 0)`.
   *
   * @function
   */
  static zero() {
    return new Point(0, 0);
  }

  /**
   * Divides the `Point` values to the current instance's dimensions.
   *
   * @param that The `Point` values to divide.
   * @function
   */
  public div(that: Point) {
    return new Vector2(this.w / that.w, this.h / that.h);
  }

  /**
   * Rotates the `Point` by the provided value.
   *
   * @param angle The angle to rotate.
   * @function
   */
  public rotate(angle: number) {
    const w = this.w - Math.abs((this.w / 0.5) * Math.sin(angle));
    const h = this.h + Math.abs(this.h * Math.sin(angle));
    return new Point(w, h);
  }

  /**
   * Returns the dimensions in an array.
   *
   * @function
   */
  public array(): [number, number] {
    return [this.w, this.h];
  }
}

/**
 * Representation of a single confetti particle.
 *
 * @class
 */
class Particle {
  /**
   * Slows movement of confetti.
   *
   * @constant
   */
  private friction = 0.99;

  /**
   * How fast confetti falls.
   *
   * @constant
   */
  private gravity = 0.05;

  /**
   * How fast confetti travels along the axes.
   *
   * @constant
   */
  private initialVelocity = new Vector2(4.0, 5.0);

  /**
   * The range of confetti sizes.
   *
   * @constant
   */
  private rangeDimensions = new Point(5, 15);

  /**
   * The range of radius sizes for confetti circles.
   *
   * @constant
   */
  private rangeRadius = new Point(5, 10);

  /**
   * The range for added spin to confetti.
   *
   * @constant
   */
  private rangeSpin = new Point(-0.2, 0.2);

  /**
   * Blows confetti along the x-axis.
   *
   * @constant
   */
  private wind = 0;

  /** @constant */
  public angle: number;

  /** @constant */
  public boundary: Point;

  /** @constant */
  public color: string;

  /** @constant */
  public dimensions: Point;

  /** @constant */
  public position: Vector2;

  /** @constant */
  public radius: number;

  /** @constant */
  public shape: Shape;

  /** @constant */
  public velocity: Vector2;

  /**
   * @param boundary    The bounding box dimensions.
   * @param angle       The angle of the particle.
   * @param color       The color of the particle.
   * @param dimensions  The dimensions of the particle.
   * @param position    The 2D position of the particle.
   * @param radius      The radius of the particle (if a circle).
   * @param shape       The shape of the particle.
   * @param velocity    The angular velocity of the particle.
   * @constructor
   */
  constructor(
    boundary: Point,
    angle?: number,
    color?: string,
    dimensions?: Point,
    position?: Vector2,
    radius?: number,
    shape?: Shape,
    velocity?: Vector2,
  ) {
    this.boundary = boundary;
    this.angle = angle || 0;
    this.color = color || sample(Particle.colors);
    this.dimensions = dimensions || Particle.randomDimensions(this.rangeDimensions);
    this.position = position || Particle.randomPosition(boundary);
    this.radius = radius || Particle.randomRadius(this.rangeRadius);
    this.shape = shape || random(0, 1);
    this.velocity = velocity || Particle.randomVelocity(this.initialVelocity);
  }

  /** @function */
  static get colors() {
    return ['#0091d5', '#6bb187', '#dbae59', '#ac3e31'];
  }

  /**
   * Generates a `Point` with randomized dimensions.
   *
   * @param dimensions The range to choose from.
   * @function
   */
  static randomDimensions(dimensions: Point) {
    return new Point(random(dimensions.w, dimensions.h));
  }

  /**
   * Generates a `Vector2` with a randomized position.
   *
   * @param boundary The bounding box.
   * @function
   */
  static randomPosition(boundary: Point) {
    return new Vector2(random(0, boundary.w), random(-boundary.h, 0));
  }

  /**
   * Generates a random radius size.
   *
   * @param radius The range to choose from.
   * @function
   */
  static randomRadius(radius: Point) {
    return random(radius.w, radius.h);
  }

  /**
   * Generates a `Vector2` with a randomized velocity.
   *
   * @param velocity The range to choose from.
   * @function
   */
  static randomVelocity(velocity: Vector2) {
    return new Vector2(random(-velocity.x, velocity.x), random(-velocity.y, 0));
  }

  /**
   * Checks whether the particle is within the boundary.
   *
   * @function
   */
  public get visible() {
    return (
      this.position.x > 0 && this.position.x < this.boundary.w && this.position.y < this.boundary.h
    );
  }

  /**
   * Recycles the particle by resetting its values.
   *
   * @function
   */
  public recycle() {
    this.angle = 0;
    this.color = sample(Particle.colors);
    this.dimensions = Particle.randomDimensions(this.rangeDimensions);
    this.position = Particle.randomPosition(this.boundary);
    this.radius = Particle.randomRadius(this.rangeRadius);
    this.shape = random(0, 1);
    this.velocity = Particle.randomVelocity(this.initialVelocity);
  }

  /**
   * Updates the particle in the 2D space.
   *
   * @param dt The delta time.
   * @function
   */
  public update(dt: number) {
    const spin = random(this.rangeSpin.w, this.rangeSpin.h);
    this.position = this.position.add(this.velocity);
    this.velocity = this.velocity.add(new Vector2(this.wind, this.gravity).scale(this.friction));
    this.angle = dt * Math.PI + spin;
    return new Particle(
      this.boundary,
      this.angle,
      this.color,
      this.dimensions,
      this.position,
      this.radius,
      this.shape,
      this.velocity,
    );
  }
}

/**
 * Animates a single frame.
 *
 * @param boundary          The boundary box.
 * @param running           Whether the animation is currently running.
 * @param ctx               The canvas context.
 * @function
 */
function animate(boundary: Point, running: boolean, ctx: CanvasRenderingContext2D) {
  const now = performance.now();
  const dt = (now - startTime) / 1000;

  for (let i = 0; i < PARTICLE_NUM; i++) {
    const particle = particles[i] || new Particle(boundary);

    // recycle particles that have gone off-screen
    // but only if we're in a running state
    if (running && !particle.visible) {
      particle.recycle();
    }

    particles[i] = particle.update(dt);
  }

  renderScene(ctx);
  frameId = requestAnimationFrame(() => animate(boundary, running, ctx));
}

/**
 * Renders the scene.
 *
 * @param ctx       The canvas context.
 * @function
 */
function renderScene(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  for (const particle of particles) {
    if (!particle) {
      continue;
    }

    ctx.save();
    ctx.translate(...particle.position.array());
    ctx.rotate(particle.angle);

    ctx.beginPath();
    ctx.fillStyle = particle.color;
    ctx.strokeStyle = particle.color;
    ctx.lineCap = 'round';
    ctx.lineWidth = 2;

    switch (particle.shape) {
      case Shape.CIRCLE:
        ctx.beginPath();
        ctx.arc(0, 0, particle.radius, 0, 2 * Math.PI);
        ctx.fill();
        break;
      case Shape.SQUARE:
        ctx.fillRect(
          ...particle.dimensions.rotate(particle.angle).div(new Point(-2, -2)).array(),
          ...particle.dimensions.rotate(particle.angle).array(),
        );
        break;
    }

    ctx.closePath();
    ctx.restore();
  }
}

/**
 * Starts the animation.
 *
 * It is important not to use any React hooks
 * within the body of this function.
 *
 * @function
 */
export function start() {
  // toggle on confetti
  dispatch({ running: true });

  // turn off after the duration elapses
  setTimeout(() => {
    dispatch({ running: false });
  }, PARTICLE_DURATION);
}

/**
 * Configures the state.
 *
 * @function
 */
function useStore() {
  const [state, setState] = React.useState<typeof DEFAULT_STATE>(DEFAULT_STATE);

  React.useEffect(() => {
    dispatch = setState;
  }, []);

  return { state };
}

/**
 * Confetti component.
 *
 * @function
 */
export function Confetti() {
  const { state } = useStore();
  const [boundary, setBoundary] = React.useState<Point>();
  const refCanvas = React.useRef<HTMLCanvasElement>();

  // canvas requires width and height
  // defined to fix blurry edges
  React.useEffect(() => {
    const { offsetWidth, offsetHeight } = refCanvas.current;
    setBoundary(new Point(offsetWidth, offsetHeight));
  }, []);

  // setup the engine loop
  React.useLayoutEffect(() => {
    if (!boundary) {
      return;
    }

    const ctx = refCanvas.current.getContext('2d');

    // cancel animation if we're no longer in a running state
    // but only after all particles have gone off-screen
    if (!state.running && particles.every((particle) => !particle.visible)) {
      cancelAnimationFrame(frameId);
      return;
    }

    frameId = requestAnimationFrame(() => animate(boundary, state.running, ctx));
    return () => cancelAnimationFrame(frameId);
  }, [boundary, state.running]);

  // render the canvas
  return createPortal(
    <canvas
      ref={refCanvas}
      width={boundary?.w || 0}
      height={boundary?.h || 0}
      className="pointer-events-none absolute left-0 top-0 z-50 h-screen w-screen"
    />,
    document.body,
  );
}
