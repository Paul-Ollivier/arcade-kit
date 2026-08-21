"""8-bit style SFX synth — pure stdlib, so the arcade's missing sounds are
GENERATED rather than sourced: no licensing, and the timbre matches the pixel
art by construction (square/triangle oscillators + an NES-style LFSR noise
channel, hard envelopes, quantised pitch)."""
import math, wave, struct, os

SR = 32000

def env(n, a, d, s, r, sustain=0.6):
    """Linear ADSR over n samples; a/d/r are fractions of n."""
    out = []
    na, nd, nr = int(n*a), int(n*d), int(n*r)
    ns = max(0, n - na - nd - nr)
    for i in range(na): out.append(i/max(1,na))
    for i in range(nd): out.append(1 - (1-sustain)*(i/max(1,nd)))
    for _ in range(ns): out.append(sustain)
    for i in range(nr): out.append(sustain*(1 - i/max(1,nr)))
    while len(out) < n: out.append(0.0)
    return out[:n]

def square(f, n, duty=0.5, sweep=1.0):
    """Square wave; `sweep` multiplies the frequency linearly over the sound."""
    out=[]; ph=0.0
    for i in range(n):
        fi = f * (1 + (sweep-1)*(i/n))
        ph += fi/SR
        out.append(1.0 if (ph % 1.0) < duty else -1.0)
    return out

def triangle(f, n, sweep=1.0, steps=16):
    """Quantised triangle — the NES triangle channel is 4-bit stepped."""
    out=[]; ph=0.0
    for i in range(n):
        fi = f * (1 + (sweep-1)*(i/n))
        ph += fi/SR
        t = ph % 1.0
        v = 4*t-1 if t < 0.5 else 3-4*t
        out.append(round(v*steps)/steps)
    return out

def noise(n, period=1, metallic=False):
    """NES-style 15-bit LFSR noise. `metallic` uses the short-mode tap."""
    out=[]; reg=0x7FFF; hold=0; val=1.0
    for i in range(n):
        if hold <= 0:
            bit = ((reg ^ (reg >> (6 if metallic else 1))) & 1)
            reg = (reg >> 1) | (bit << 14)
            val = 1.0 if (reg & 1) else -1.0
            hold = period
        hold -= 1
        out.append(val)
    return out

def mix(*layers):
    n = max(len(l) for l in layers)
    out=[0.0]*n
    for l in layers:
        for i,v in enumerate(l): out[i] += v
    return out

def apply(sig, e, gain=1.0):
    return [s*e[i]*gain for i,s in enumerate(sig)]

def lowpass(sig, a=0.35):
    out=[]; prev=0.0
    for s in sig:
        prev = prev + a*(s-prev); out.append(prev)
    return out

def norm(sig, peak=0.72):
    m = max(1e-9, max(abs(s) for s in sig))
    return [s/m*peak for s in sig]  # 0.72: laisse la marge que l'encodage mp3 depasse (inter-sample peaks)

def write(name, sig):
    sig = norm(sig)
    w = wave.open(name, "wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(b"".join(struct.pack("<h", int(max(-1,min(1,s))*32000)) for s in sig))
    w.close()
    return len(sig)/SR

def secs(s): return int(SR*s)

# ── the eight sounds ──────────────────────────────────────────────────────
out = {}

# 1. WHOOSH — a transition: bright noise sweeping down into a soft thud.
n = secs(0.42)
sig = mix(
    apply(lowpass(noise(n, period=1), 0.55), env(n, 0.08, 0.25, 0, 0.6, 0.5), 0.9),
    apply(triangle(420, n, sweep=0.22), env(n, 0.02, 0.3, 0, 0.6, 0.35), 0.5),
)
# progressive damping: the sweep is the filter opening then closing
sig = [s*(1 - 0.75*(i/n)**1.4) for i,s in enumerate(sig)]
out["d8-whoosh"] = ("whoosh de transition (lancement/sortie de jeu)", write("syn-d8-whoosh.wav", sig))

# 2. UI CLICK — one very short blip. Deliberately dry and quiet-sounding.
n = secs(0.045)
sig = mix(apply(square(1180, n, duty=0.25), env(n, 0.01, 0.3, 0, 0.65, 0.25), 0.8),
          apply(noise(n, period=2), env(n, 0.0, 0.2, 0, 0.5, 0.0), 0.25))
out["d8-ui-click"] = ("clic UI (fleches du cabinet, boutons)", write("syn-d8-ui-click.wav", sig))

# 3. MODAL OPEN — two rising steps, like a panel sliding up.
n = secs(0.16); h = n//2
sig = mix(apply(square(523, h, duty=0.5), env(h, 0.05, 0.3, 0, 0.5, 0.7), 0.6) + [0]*(n-h),
          [0]*h + apply(square(784, n-h, duty=0.5), env(n-h, 0.05, 0.3, 0, 0.55, 0.7), 0.6))
out["d8-modal-open"] = ("ouverture de modale", write("syn-d8-modal-open.wav", sig))

# 4. MODAL CLOSE — the same two steps, descending.
n = secs(0.15); h = n//2
sig = mix(apply(square(784, h, duty=0.5), env(h, 0.05, 0.3, 0, 0.5, 0.7), 0.6) + [0]*(n-h),
          [0]*h + apply(square(523, n-h, duty=0.5), env(n-h, 0.05, 0.35, 0, 0.55, 0.6), 0.55))
out["d8-modal-close"] = ("fermeture de modale / [X]", write("syn-d8-modal-close.wav", sig))

# 5. CHAT BLIP — soft, high, two quick notes. Must not startle: it fires often.
n = secs(0.11); h = int(n*0.45)
sig = mix(apply(triangle(1046, h), env(h, 0.08, 0.3, 0, 0.6, 0.6), 0.7) + [0]*(n-h),
          [0]*h + apply(triangle(1318, n-h), env(n-h, 0.08, 0.35, 0, 0.6, 0.55), 0.7))
out["d8-chat-blip"] = ("message de chat", write("syn-d8-chat-blip.wav", sig))

# 6. VAULT TICK — a tiny high click for a counter rolling up. Very short, so a
#    fast counter can fire it repeatedly without turning into a drone.
n = secs(0.03)
sig = apply(square(1760, n, duty=0.125), env(n, 0.0, 0.25, 0, 0.7, 0.2), 0.75)
out["d8-tick"] = ("tick du compteur VAULT / increment", write("syn-d8-tick.wav", sig))

# 7. LOSE — a descending minor figure with a detuned buzz under it. Sad, not
#    harsh: a loss should land, not punish.
n = secs(0.75)
notes = [(392, 0.0, 0.22), (349, 0.20, 0.22), (294, 0.40, 0.35)]
layers = []
for f, start, dur in notes:
    ns = secs(dur); off = secs(start)
    layers.append([0]*off + apply(square(f, ns, duty=0.5, sweep=0.97), env(ns, 0.02, 0.35, 0, 0.5, 0.55), 0.55) + [0]*max(0, n-off-ns))
layers.append(apply(triangle(98, n, sweep=0.85), env(n, 0.05, 0.4, 0, 0.5, 0.4), 0.45))
sig = mix(*[l[:n] + [0]*max(0, n-len(l)) for l in layers])
out["d8-lose"] = ("defaite / manche perdue", write("syn-d8-lose.wav", sig))

# 8. MATCH FOUND — a bright ascending three-note call: something is READY.
n = secs(0.42)
notes = [(523, 0.0, 0.11), (659, 0.10, 0.11), (988, 0.20, 0.22)]
layers = []
for f, start, dur in notes:
    ns = secs(dur); off = secs(start)
    layers.append([0]*off + apply(square(f, ns, duty=0.375), env(ns, 0.02, 0.3, 0, 0.5, 0.65), 0.6) + [0]*max(0, n-off-ns))
layers.append([0]*secs(0.20) + apply(triangle(1976, secs(0.22)), env(secs(0.22), 0.02, 0.4, 0, 0.5, 0.4), 0.35) + [0]*max(0, n-secs(0.42)))
sig = mix(*[l[:n] + [0]*max(0, n-len(l)) for l in layers])
out["d8-match-found"] = ("adversaire trouve / pret", write("syn-d8-match-found.wav", sig))

for k,(desc,d) in out.items(): print(f"{k:18s} {d*1000:6.0f} ms  {desc}")
