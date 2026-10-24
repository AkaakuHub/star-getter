import {
  AmbientLight,
  BoxGeometry,
  CylinderGeometry,
  DirectionalLight,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  TorusGeometry,
  WebGLRenderer,
  type Material,
} from 'three';
import type { GameState, PerformerId } from '../../domain/game/model';
import { sectionAt } from '../../domain/game/projection';
import { createCharacter, type Character } from './createCharacter';

export class StageRenderer {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(38, 1, 0.1, 60);
  private readonly characters: Readonly<{
    id: PerformerId;
    character: Character;
    offset: number;
  }>[];
  private readonly ring: Mesh<TorusGeometry, MeshBasicMaterial>;
  private readonly reducedMotion: boolean;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: 'low-power',
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.camera.position.set(0, 3.4, 9.7);
    this.camera.lookAt(0, 1, 0);
    this.scene.add(new AmbientLight('#e5eafa', 2));
    const keyLight = new DirectionalLight('#fff2dc', 2.5);
    keyLight.position.set(-3, 5, 4);
    this.scene.add(keyLight);
    this.scene.add(createPlatform());
    this.ring = new Mesh(
      new TorusGeometry(3.2, 0.035, 4, 64),
      new MeshBasicMaterial({ color: '#7ccac5' }),
    );
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.y = 0.05;
    this.scene.add(this.ring);
    this.characters = (['nova', 'lumen', 'tetra'] as const).map((id, index) => {
      const character = createCharacter(id);
      character.root.position.x = (index - 1) * 2;
      this.scene.add(character.root);
      return { id, character, offset: index * 1.2 };
    });
    this.scene.add(createAudience());
    this.resize();
  }

  resize(): void {
    const canvas = this.renderer.domElement;
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.position.z = width / height < 1.2 ? 12.5 : 9.7;
    this.camera.updateProjectionMatrix();
  }

  render(state: GameState): void {
    const seconds = state.tick / 60;
    const phase = ((seconds * state.track.bpm) / 60) * Math.PI;
    for (const { character, id, offset } of this.characters) {
      const active = state.lastPerformer === id && state.tick - state.lastActionTick < 45;
      const dance = this.reducedMotion ? 0 : Math.sin(phase + offset);
      character.root.position.y = Math.abs(dance) * (active ? 0.2 : 0.07);
      character.root.rotation.z = dance * 0.04;
      character.leftArm.rotation.z = -0.3 - Math.abs(dance) * (active ? 1.8 : 0.4);
      character.rightArm.rotation.z = 0.3 + Math.abs(dance) * (active ? 1.8 : 0.4);
    }
    this.ring.material.color.set(sectionAt(state).climax ? '#f1c86b' : '#7ccac5');
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    const geometries = new Set<Mesh['geometry']>();
    const materials = new Set<Material>();
    this.scene.traverse((object) => {
      if (object instanceof InstancedMesh) object.dispose();
      if (object instanceof Mesh) {
        geometries.add(object.geometry);
        const list = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of list) materials.add(material);
      }
    });
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
    this.renderer.dispose();
  }
}

function createPlatform(): Group {
  const group = new Group();
  const platform = new Mesh(
    new CylinderGeometry(3.6, 3.8, 0.3, 40),
    new MeshLambertMaterial({ color: '#26394e', flatShading: true }),
  );
  platform.position.y = -0.15;
  group.add(platform);
  const postMaterial = new MeshBasicMaterial({ color: '#587d8e' });
  const postGeometry = new BoxGeometry(0.06, 3, 0.06);
  for (const x of [-3.3, -2.2, 2.2, 3.3]) {
    const post = new Mesh(postGeometry, postMaterial);
    post.position.set(x, 1.3, -2);
    group.add(post);
  }
  return group;
}

function createAudience(): InstancedMesh {
  const mesh = new InstancedMesh(
    new SphereGeometry(0.12, 5, 4),
    new MeshBasicMaterial({ color: '#789899' }),
    32,
  );
  const matrix = new Matrix4();
  for (let index = 0; index < 32; index++) {
    matrix.makeTranslation(((index % 16) - 7.5) * 0.52, -0.1, 3.5 + Math.floor(index / 16) * 0.6);
    mesh.setMatrixAt(index, matrix);
  }
  return mesh;
}
