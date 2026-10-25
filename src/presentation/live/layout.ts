function hudRect(x: number, y: number, width: number, height: number) {
  return {
    left: x / 10.8 + '%',
    top: y / 19.2 + '%',
    width: width / 10.8 + 'cqw',
    height: height / 10.8 + 'cqw',
  };
}

export const liveLayout = {
  pause: hudRect(32, 850, 100, 100),
  automaticHeart: hudRect(32, 975, 100, 125),
  mental: hudRect(-15, 1216, 176, 264),
  ap: hudRect(919, 1216, 176, 264),
  hearts: hudRect(215, 1124, 384, 139),
  voltage: hudRect(600, 1075, 182, 190),
  analyzer: hudRect(148, 1232, 784, 256),
  special: hudRect(882, 945, 170, 238),
  cards: { ...hudRect(44, 1526, 210, 48), width: 'auto' },
  deck: { ...hudRect(826, 1526, 210, 48), left: 'auto', right: 44 / 10.8 + '%', width: 'auto' },
  description: hudRect(120, 1768, 840, 128),
  bloom: hudRect(148.5, 1084.5, 527, 73),
  bloomMaximum: hudRect(723, 1085, 210, 72),
  bloomLeft: hudRect(22.5, 1236.2, 126, 235),
  bloomRight: hudRect(956.5, 1236.2, 126, 235),
};
