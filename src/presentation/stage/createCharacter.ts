import {
  BoxGeometry,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshLambertMaterial,
  SphereGeometry,
  TorusGeometry,
} from 'three';
import { performers } from '../../content/performers';
import type { PerformerId } from '../../domain/game/model';

export type Character = Readonly<{ root: Group; leftArm: Group; rightArm: Group }>;

export function createCharacter(id: PerformerId): Character {
  const root = new Group();
  const material = new MeshLambertMaterial({ color: performers[id].color, flatShading: true });
  const dark = new MeshLambertMaterial({ color: '#142137' });
  const white = new MeshLambertMaterial({ color: '#fff3d9' });
  const head = new Mesh(new IcosahedronGeometry(0.5, id === 'tetra' ? 0 : 1), material);
  head.position.y = 1.55;
  if (id === 'lumen') head.scale.set(0.9, 1.1, 0.85);
  root.add(head);
  const body = new Mesh(new IcosahedronGeometry(0.45, 1), material);
  body.scale.set(0.85, 1.1, 0.7);
  body.position.y = 0.8;
  root.add(body);
  const eyeGeometry = new SphereGeometry(0.055, 6, 4);
  for (const x of [-0.16, 0.16]) {
    const eye = new Mesh(eyeGeometry, dark);
    eye.position.set(x, 1.58, 0.43);
    root.add(eye);
    const foot = new Mesh(new BoxGeometry(0.2, 0.14, 0.35), white);
    foot.position.set(x, 0.26, 0.05);
    root.add(foot);
  }
  if (id === 'lumen') {
    const earGeometry = new BoxGeometry(0.14, 0.55, 0.16);
    for (const x of [-0.23, 0.23]) {
      const ear = new Mesh(earGeometry, material);
      ear.position.set(x, 2.12, 0);
      ear.rotation.z = x * -0.7;
      root.add(ear);
    }
  } else if (id === 'nova') {
    const ring = new Mesh(new TorusGeometry(0.57, 0.04, 5, 24), white);
    ring.rotation.x = Math.PI / 2.5;
    ring.position.y = 1.68;
    root.add(ring);
  } else {
    const antenna = new Mesh(new IcosahedronGeometry(0.12), white);
    antenna.position.y = 2.19;
    root.add(antenna);
  }
  const leftArm = createArm(-1, material);
  const rightArm = createArm(1, material);
  root.add(leftArm, rightArm);
  return { root, leftArm, rightArm };
}

function createArm(side: number, material: MeshLambertMaterial): Group {
  const arm = new Group();
  arm.position.set(side * 0.35, 1, 0);
  const mesh = new Mesh(new BoxGeometry(0.18, 0.45, 0.2), material);
  mesh.position.y = -0.2;
  arm.add(mesh);
  return arm;
}
