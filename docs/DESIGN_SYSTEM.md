# Asanop design system

## Direction

Asanop uses a warm editorial direction for public storytelling and a calm, efficient product interface. The personality should feel capable, human, and composed—not playful to the point of distraction and not like a direct clone of another work-management product.

Reference study:

- Asana: capability-led storytelling and clear product demonstrations.
- Linear: calm hierarchy, predictable action placement, and restrained density.
- Atlassian Design System: semantic tokens, consistent component behavior, clear content, and accessible interaction patterns.
- Material Design 3: semantic color roles, state communication, responsive adaptation, and contrast discipline.

Only principles may be reused. Do not copy proprietary layouts, copywriting, illustrations, or component styling.

## Layout wireframes

Public homepage:

```text
Mobile                         Tablet/Desktop
┌ Brand   CTA  Menu ┐         ┌ Brand  anchors  Sign in  CTA ┐
├ beta label        ┤         ├ hero copy  │ product preview ┤
│ headline          │         ├ capability trust strip       ┤
│ copy + CTAs       │         ├ workflow steps               ┤
│ product preview   │         ├ 2-column capability cards    ┤
├ workflow cards    ┤         ├ small-team value panel       ┤
├ capabilities      ┤         ├ centered final CTA           ┤
├ team benefits     ┤         └ footer                       ┘
└ final CTA/footer  ┘
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
- The product follows a 60/30/10 color model: warm neutrals carry most surfaces, deep forest-charcoal anchors navigation and text, and semantic accents carry the remaining emphasis.
- Evergreen is reserved for primary actions, selection, and positive outcomes. Muted slate-blue means information or in-progress work, ochre means due soon or warning, and brick means destructive, blocked, or overdue.
- Sidebar selection uses a translucent evergreen tint and a leading indicator instead of a saturated full-width block. Status and priority badges use tinted backgrounds with matching text rather than unrelated solid colors.
- Marketing uses cream/off-white canvas, deep forest-charcoal ink, evergreen actions, and restrained terracotta/ochre/slate-blue accents.
- Product surfaces use higher density and clearer boundaries. Strong color is reserved for actions, status, attention, and editorial emphasis.
- Feature code must not introduce raw hex values for product UI. Add or reuse a semantic token so charts, badges, timelines, boards, and feedback states remain synchronized.
- Spacing follows a 4px base. Use existing spacing utilities aligned to that scale.
- Sora is the display face; Source Sans 3 is the body and interface face.
- Standard controls are 44px high. Compact controls may use 36px only when surrounded by an equivalent accessible target.
- Motion uses fast (140ms) and standard (220ms) durations. `prefers-reduced-motion` reduces all nonessential movement.
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
