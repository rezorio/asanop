# Asanop design system

## Direction

Asanop uses the **Ascent** theme: an editorial journey metaphor for public storytelling and a calm, efficient product interface. The personality should feel capable, human, optimistic, and composed—not playful to the point of distraction and not like a direct clone of another product.

Reference study:

- TO TOP: immersive landscape, strong editorial scale, circular wayfinding actions, journey-based pacing, and restrained use of a high-energy accent.
- Asana: capability-led storytelling and clear product demonstrations.
- Linear: calm hierarchy, predictable action placement, and restrained density.
- Atlassian Design System: semantic tokens, consistent component behavior, clear content, and accessible interaction patterns.
- Material Design 3: semantic color roles, state communication, responsive adaptation, and contrast discipline.

Only principles may be reused. The Asanop composition, copy, generated landscape, route metaphor, shell, and interaction rules are original. Do not copy proprietary layouts, copywriting, illustrations, logos, or component styling.

## Layout wireframes

Public homepage:

```text
Mobile                         Tablet/Desktop
┌ brand            menu ┐     ┌ brand  anchors  sign in  CTA ┐
├ editorial hero        ┤     ├ editorial hero + round CTA   ┤
│ route CTA + proof     │     ├ product viewpoint            ┤
│ product viewpoint    │     ├ connected journey steps      ┤
├ journey steps        │     ├ 2-column capability cards    ┤
├ capability cards     │     ├ immersive team landscape     ┤
├ team landscape       │     └ round final CTA + footer     ┘
└ final CTA/footer     ┘
```

Authenticated shell:

```text
Mobile                         Desktop
┌ menu  Asanop  search ┐      ┌ sidebar │ page header/actions ┐
├ page header         ┤      │         ├ filters/tools        │
├ compact controls    ┤      │         ├ primary content     │
└ safe-area padding   ┘      └─────────┴─────────────────────┘
```

## Foundations

- Colors have primitive values and semantic roles. Feature code should prefer semantic roles such as canvas, surface, ink, muted, line, brand, danger, progress, and done.
- The product follows a 60/30/10 color model: warm cream carries dense surfaces, deep forest anchors navigation and text, and amber carries the most important wayfinding actions.
- Amber is the action beacon: use it for primary calls to action, the current route marker, and limited editorial emphasis. It is not a general status color.
- Evergreen communicates structure, selection, brand continuity, and positive outcomes. Muted mineral blue means information or in-progress work, ochre means due soon or warning, and brick means destructive, blocked, or overdue.
- Sidebar selection uses a translucent amber tint with a leading amber indicator instead of a saturated full-width block. Status and priority badges use tinted backgrounds with matching text rather than unrelated solid colors.
- Marketing uses forest landscapes, cream editorial sections, amber wayfinding, and restrained moss/mineral/clay supporting accents.
- Product surfaces use higher density and clearer boundaries. Strong color is reserved for actions, status, attention, and editorial emphasis.
- Feature code must not introduce raw hex values for product UI. Add or reuse a semantic token so charts, badges, timelines, boards, and feedback states remain synchronized.
- Spacing follows a 4px base. Use existing spacing utilities aligned to that scale.
- DM Serif Display is reserved for large marketing narratives. Sora is the product display face; Source Sans 3 is the body and interface face. Dense UI never uses the serif.
- Standard controls are 44px high. Compact controls may use 36px only when surrounded by an equivalent accessible target.
- Motion uses fast (140ms), standard (220ms), and editorial reveal (650ms) durations. Reusable `useScrollReveal` behavior is one-shot and progressive: content is immediately visible when IntersectionObserver is unavailable. `prefers-reduced-motion` removes all nonessential movement.
- Marketing content is capped at 1280px. Product content follows its view-specific density needs without causing page-level horizontal overflow.

## Component contracts

Shared components use `App` or domain-specific names and expose typed props and events. Prefer props for stable visual variants and slots for content composition.

Every interactive component must define its default, hover, active, focus-visible, disabled, loading, and error behavior where applicable. It must have an accessible name and work with the keyboard. Dialogs trap focus, close with Escape, and return focus to the trigger.

Use the development-only `/dev/components` route to review shared primitives. It is excluded from production routes.

Avoid new one-off button, field, badge, modal, drawer, page-header, empty-state, or alert styles. Extend the shared contract when a genuinely reusable variant is missing.

## Responsive rules

- Narrow: prioritize one task, one main action, and stacked content.
- Medium: allow compact two-column compositions where content remains readable.
- Wide: preserve information density and stable global navigation.
- Boards, calendars, timelines, and tables may use intentional internal scrolling; the document itself must not overflow horizontally.
- Replace dense toolbars with wrapped or disclosed controls. Do not merely scale desktop controls down.
- Verify at 360px, 768px, 1280px, and 1536px, plus content-driven intermediate widths.

## Accessibility and content

- Target WCAG 2.2 AA contrast and interaction behavior.
- Never use color as the only status indicator.
- Provide visible focus and meaningful labels for icon-only actions.
- Provide menu/select alternatives for drag-and-drop outcomes.
- Announce validation and server errors with alert semantics.
- Use plain, concise, action-oriented language. Avoid claims the current product cannot support.
- Do not publish fake testimonials, customer logos, performance metrics, or pricing promises.

## Visual QA checklist

- Heading hierarchy and landmarks are correct.
- Navigation and primary actions remain predictable across pages.
- Components use tokens and shared variants.
- Text wraps safely at 200% zoom.
- Keyboard focus is visible and overlay focus is contained/restored.
- Reduced-motion mode remains understandable.
- No unintended document-level horizontal overflow.
- Empty, loading, success, error, and disabled states are intentional.
- Homepage product demonstrations contain no personal or production data.
- Current Chrome, Edge, Firefox, and WebKit-sized rendering receive a final smoke pass.

## Asset direction and performance

- Landscape imagery supports the journey metaphor and must preserve a dark text-safe field plus a visually meaningful lower horizon.
- The current Asanop Ascent landscape is an original generated asset stored as optimized WebP. It contains no copied TO TOP assets, logos, or layout.
- Hero imagery must remain below 250 KB when practical and should not block navigation, headings, or calls to action.
- Reuse a single optimized asset across related immersive moments rather than shipping visually redundant variants.
- Decorative imagery is always hidden from assistive technology. Product previews are labeled as previews and never contain production data.

## Experience rules

- Forest establishes place, cream supports sustained reading, and amber answers “what should I do next?”
- The round CTA is a public/editorial motif. Dense product screens continue to use familiar rectangular controls and predictable toolbar placement.
- Scroll reveals may clarify sequence, but navigation and interactive controls must never wait for animation.
- Route and ascent language should remain subtle. Functional labels such as “Dashboard,” “Calendar,” and “Create task” stay literal.
- At mobile widths, artwork yields to legibility: the scrim strengthens, the navigation collapses, and content becomes a single task-focused column.
