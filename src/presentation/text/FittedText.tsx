import { useLayoutEffect, useRef } from 'preact/hooks';

export function FittedText({ text }: Readonly<{ text: string }>) {
  const ref = useRef<HTMLParagraphElement>(null);
  useLayoutEffect(() => {
    const element = ref.current;
    const parent = element?.parentElement;
    if (!element || !parent) return;
    const fit = () => {
      let high = Number.parseFloat(getComputedStyle(parent).fontSize);
      let low = 1;
      element.style.fontSize = high + 'px';
      if (
        element.scrollHeight <= element.clientHeight &&
        element.scrollWidth <= element.clientWidth
      )
        return;
      for (let step = 0; step < 10; step++) {
        const middle = (low + high) / 2;
        element.style.fontSize = middle + 'px';
        if (
          element.scrollHeight > element.clientHeight ||
          element.scrollWidth > element.clientWidth
        )
          high = middle;
        else low = middle;
      }
      element.style.fontSize = low + 'px';
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(parent);
    return () => observer.disconnect();
  }, [text]);
  return (
    <p ref={ref} className="fitted-text">
      {text}
    </p>
  );
}
