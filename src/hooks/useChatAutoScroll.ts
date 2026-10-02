import { useCallback, useLayoutEffect, useRef } from 'react';

/**
 * useChatAutoScroll
 * Chat box ko hamesha latest message (bottom) pe rakhta hai, bilkul WhatsApp ki tarah.
 *
 * @param trigger   Message count (ya koi bhi number jo naya msg aane pe badle)
 * @param resetKey  Thread ki id. Thread badalne pe dobara bottom pe jata hai
 * @param active    Chat box screen pe visible hai ya nahi (floating chat open/close ke liye)
 *
 * Usage:
 *   const { containerRef, onScroll, onMediaLoad } = useChatAutoScroll(msgs.length, convId);
 *   <div ref={containerRef} onScroll={onScroll} className="overflow-y-auto ...">
 *     <img onLoad={onMediaLoad} ... />
 *   </div>
 */
export function useChatAutoScroll(trigger: number, resetKey: string, active: boolean = true) {
  const containerRef = useRef<HTMLDivElement>(null);

  // User bottom ke paas hai ya nahi (agar upar purane msgs padh raha hai to usay disturb nahi karna)
  const stickRef = useRef(true);

  // Chat open hone ke baad itni der tak "instant" scroll karte rahenge (images load hone tak)
  const settleUntilRef = useRef(0);

  const scrollToBottom = useCallback((smooth: boolean) => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  // 1) Chat open hui ya thread badla -> turant bottom pe jao (animation ke bagair)
  useLayoutEffect(() => {
    if (!active) return;
    stickRef.current = true;
    settleUntilRef.current = Date.now() + 2000;
    scrollToBottom(false);
  }, [resetKey, active, scrollToBottom]);

  // 2) Naya message aaya ya history load hui
  useLayoutEffect(() => {
    if (!active) return;
    const isSettling = Date.now() < settleUntilRef.current;
    if (isSettling) {
      // Pehli load: instant jump (smooth scroll beech mein ruk jata hai)
      scrollToBottom(false);
    } else if (stickRef.current) {
      // Normal naya msg: sirf tab scroll jab user already bottom pe ho
      scrollToBottom(true);
    }
  }, [trigger, active, scrollToBottom]);

  // Container ke onScroll pe lagao: user ki position yaad rakhta hai
  const onScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  }, []);

  // Har <img> ke onLoad pe lagao: image load hone se height barhti hai, to dobara bottom pe le jao
  const onMediaLoad = useCallback(() => {
    if (stickRef.current || Date.now() < settleUntilRef.current) {
      scrollToBottom(false);
    }
  }, [scrollToBottom]);

  return { containerRef, onScroll, onMediaLoad, scrollToBottom };
}
