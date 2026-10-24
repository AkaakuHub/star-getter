function hudRect(x: number, y: number, width: number, height: number) {
  return {
    left: x / 10.8 + '%',
    top: y / 19.2 + '%',
    width: width / 10.8 + 'cqw',
    height: height / 10.8 + 'cqw',
  };
}

export const liveLayout = {
  score: hudRect(259, 0, 562, 223),
  pause: hudRect(32, 910, 100, 100),
  mental: hudRect(-15, 1216, 176, 264),
  ap: hudRect(919, 1216, 176, 264),
  hearts: hudRect(215, 1124, 384, 139),
  voltage: hudRect(600, 1075, 182, 190),
  analyzer: hudRect(148, 1232, 784, 256),
  special: hudRect(882, 945, 170, 238),
  cards: hudRect(44, 1526, 210, 48),
  deck: hudRect(826, 1526, 210, 48),
  description: hudRect(120, 1768, 840, 128),
  bloom: hudRect(148.5, 1084.5, 527, 73),
};
