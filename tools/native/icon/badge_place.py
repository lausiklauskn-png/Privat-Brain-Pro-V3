"""Gemeinsame Platzierung der V3-Schilder (Klaus 2026-10-24): so groß wie möglich, oben rechts, ganz im sicheren Kreis
(40 % Radius: runde, iOS- und Samsung-Symbole schneiden nichts ab) und ohne die dicke Kugel in der Mitte zu berühren."""
import math
S = 512
SAFE_C, SAFE_R = (S / 2, S / 2), S * 0.40
BUBBLE_C, BUBBLE_R = (272, 250), 70          # dicke Kugel (gemessen an icon-512.png); der Leuchtrand darf überdeckt werden

def _rect_ok(x0, y0, w, h, m):
    xs, ys = (x0 - m, x0 + w + m), (y0 - m, y0 + h + m)
    if any(math.hypot(x - SAFE_C[0], y - SAFE_C[1]) > SAFE_R for x in xs for y in ys): return False
    nx = min(max(BUBBLE_C[0], xs[0]), xs[1]); ny = min(max(BUBBLE_C[1], ys[0]), ys[1])
    return math.hypot(nx - BUBBLE_C[0], ny - BUBBLE_C[1]) >= BUBBLE_R

def place(aspect, margin):
    """aspect = Breite/Höhe. Gibt (x0, y0, w, h) für das größte passende Schild oben rechts zurück."""
    for h in range(200, 20, -1):
        w = round(h * aspect); best = None
        for y0 in range(int(SAFE_C[1] - SAFE_R), S // 2, 2):
            for x0 in range(S // 2, S - w, 2):
                if _rect_ok(x0, y0, w, h, margin):
                    score = x0 + w - y0                      # möglichst weit oben rechts
                    if best is None or score > best[0]: best = (score, x0, y0)
        if best: return best[1], best[2], w, h
    raise SystemExit('kein Platz')
