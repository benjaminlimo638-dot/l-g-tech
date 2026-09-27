# Design Brief

## Direction

Circuit Noir — a repair-lab instrument panel: deep navy-black field, electric blue structure, cyan signal light.

## Tone

Industrial/utilitarian high-tech executed with precision — the calm confidence of a calibrated diagnostic tool, never neon-arcade.

## Differentiation

The 6-step repair progress line treated as a live circuit trace — connected nodes that light up in sequence from electric blue to cyan as a device moves from Recibido to Entregado.

## Color Palette

| Token      | OKLCH         | Role                                        |
| ---------- | ------------- | ------------------------------------------- |
| background | 0.145 0.045 265 | Deep navy-black base (#050A18 family)     |
| foreground | 0.95 0.012 240  | Silver-white metallic text                |
| card       | 0.19 0.045 265  | Raised surface / panels                   |
| primary    | 0.55 0.245 262  | Electric blue — actions, brand, links     |
| accent     | 0.78 0.145 215  | Neon cyan — active state, focus, signal   |
| muted      | 0.24 0.045 265  | Inactive fills, secondary panels          |
| border     | 0.3 0.045 262   | Hairline structure                        |
| success    | 0.72 0.17 158   | Listo para entregar / Entregado           |
| warning    | 0.8 0.15 82     | En reparación (hold / attention)          |
| danger     | 0.58 0.21 22    | Errors, cancelación                       |

Progress line: `--stage-1..6` ramp from electric blue (0.55 0.245 262) through cyan (0.78 0.145 215) to green (0.72 0.17 158).

## Typography

- Display: Space Grotesk — headings, brand wordmark, numeric codes (technical, geometric, matches logo lettering)
- Body: Plus Jakarta Sans — paragraphs, labels, forms, admin tables
- Mono: JetBrains Mono — repair codes (LG-XXXXXX), IMEI, prices, timestamps
- Scale: hero `text-4xl md:text-6xl font-bold tracking-tight`, h2 `text-2xl md:text-3xl font-bold`, label `text-xs font-semibold tracking-widest uppercase text-muted-foreground`, body `text-base`

## Elevation & Depth

Depth comes from layered navy surfaces (background → card → popover) plus hairline borders; shadows are dark and soft (`shadow-elevated`), with a single cyan `shadow-glow` reserved for the active progress node and primary CTA focus.

## Structural Zones

| Zone    | Background                       | Border              | Notes                                             |
| ------- | -------------------------------- | ------------------- | ------------------------------------------------- |
| Header  | `bg-card/80 backdrop-blur`       | `border-b`          | Sticky; logo mark left, WhatsApp action right     |
| Content | `bg-background`                  | —                   | Alternating `bg-muted/30` sections; `bg-grid` hero |
| Footer  | `bg-muted/40`                    | `border-t`          | Contact data, hours, brand mark                   |
| Admin   | `bg-sidebar` rail + `bg-background` | `border-r`       | Dense tables, compact spacing, mono numerics      |

## Spacing & Rhythm

Mobile-first: `px-4` gutters, `space-y-6` between blocks, `gap-3` in card grids; admin panel tightens to `px-3`/`gap-2` for information density while public screens stay airy at `py-10`.

## Component Patterns

- Buttons: `rounded-lg`, primary = electric blue gradient with white text; secondary = `bg-secondary` outline; ghost for tertiary; hover lifts with `shadow-glow` on primary only
- Cards: `rounded-xl bg-card border border-border shadow-elevated`; repair cards get a 3px left rail colored by current stage
- Badges: pill `rounded-full text-xs font-semibold`; status badges use success/warning/danger at 15% tint with full-strength text
- Progress line: horizontal 6-node circuit trace, completed nodes filled cyan with glow, current node `animate-pulse-ring`, future nodes `bg-muted`

## Motion

- Entrance: `animate-fade-up` staggered 60ms per card on list mount; hero content fades up once
- Hover: 200ms color/shadow transitions via `transition-smooth`; cards lift `-translate-y-0.5`
- Decorative: `pulse-ring` on the active progress node, `scan-line` shimmer across the hero logo frame, `shimmer` on skeleton loaders

## Constraints

- Dark theme only — the brand is a dark instrument panel; no light mode
- Cyan (`accent`) is a signal, not a surface: never use it for large fills or body text
- All user-facing copy in Spanish; repair codes and IMEI always render in `font-mono`
- Minimum 4.5:1 body contrast; muted text never below 0.62 L on background
- Mobile-first: every public flow must be usable at 375px width
- DNI photo never rendered outside the authorized admin panel

## Signature Detail

The repair status progress line as a glowing circuit trace with sequential node activation — it turns a generic stepper into the brand's diagnostic signature.
