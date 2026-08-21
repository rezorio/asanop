<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  GanttChart,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Sparkles,
  Users,
  WandSparkles,
  Zap,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const mobileNavOpen = ref(false)
const primaryDestination = computed(() =>
  auth.isAuthenticated ? { name: 'dashboard' } : { name: 'register' },
)
const primaryLabel = computed(() => (auth.isAuthenticated ? 'Open Asanop' : 'Create free account'))

const workflows = [
  { number: '01', title: 'Capture every request', copy: 'Turn ideas and intake forms into clear, assigned work without chasing context.' },
  { number: '02', title: 'Shape the plan', copy: 'Organize projects in the view that fits the moment—list, board, calendar, or timeline.' },
  { number: '03', title: 'Keep work moving', copy: 'Use priorities, dependencies, comments, and lightweight rules to remove friction.' },
  { number: '04', title: 'See what needs attention', copy: 'Give everyone a shared view of progress, workload, deadlines, and blockers.' },
]

const capabilities = [
  { icon: LayoutDashboard, title: 'A useful daily overview', copy: 'See project health, overdue work, team workload, and recent activity in one calm dashboard.', tone: 'emerald' },
  { icon: ClipboardList, title: 'Projects that adapt to the work', copy: 'Switch between focused lists and visual boards while tasks keep their full context.', tone: 'coral' },
  { icon: CalendarDays, title: 'Plan time without losing detail', copy: 'Coordinate due dates on a calendar and map connected work across a timeline.', tone: 'gold' },
  { icon: WandSparkles, title: 'Intake and automation built in', copy: 'Collect structured requests and automate routine status, assignment, and comment actions.', tone: 'sky' },
]

onMounted(() => {
  document.title = 'Asanop — Small-team work, clearly organized'
  const description = 'Plan projects, coordinate tasks, collect requests, and keep a small team aligned with Asanop. Free during beta.'
  let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'description'
    document.head.appendChild(meta)
  }
  meta.content = description
})
</script>

<template>
  <div class="marketing-shell">
    <a class="skip-link" href="#main-content">Skip to content</a>
    <header class="marketing-nav">
      <RouterLink :to="{ name: 'home' }" class="brand-lockup" aria-label="Asanop home">
        <span class="brand-symbol" aria-hidden="true"><Check class="h-4 w-4" /></span>
        <span>Asanop</span>
      </RouterLink>
      <nav class="hidden items-center gap-7 md:flex" aria-label="Public navigation">
        <a href="#workflow">How it works</a>
        <a href="#capabilities">Capabilities</a>
        <a href="#teams">For small teams</a>
      </nav>
      <div class="flex items-center gap-2">
        <RouterLink v-if="!auth.isAuthenticated" :to="{ name: 'login' }" class="ui-button ui-button-quiet ui-button-sm">
          Sign in
        </RouterLink>
        <RouterLink :to="primaryDestination" class="ui-button ui-button-primary ui-button-sm">
          {{ auth.isAuthenticated ? 'Open app' : 'Get started' }}
          <ArrowRight class="h-4 w-4" aria-hidden="true" />
        </RouterLink>
        <button type="button" class="marketing-menu md:hidden" aria-label="Toggle navigation" :aria-expanded="mobileNavOpen" aria-controls="mobile-public-nav" @click="mobileNavOpen = !mobileNavOpen">
          <Menu class="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </header>
    <nav v-if="mobileNavOpen" id="mobile-public-nav" class="mobile-public-nav md:hidden" aria-label="Mobile public navigation">
      <a href="#workflow" @click="mobileNavOpen = false">How it works</a>
      <a href="#capabilities" @click="mobileNavOpen = false">Capabilities</a>
      <a href="#teams" @click="mobileNavOpen = false">For small teams</a>
    </nav>

    <main id="main-content">
      <section class="hero-section">
        <div class="editorial-orb editorial-orb-one" aria-hidden="true" />
        <div class="editorial-orb editorial-orb-two" aria-hidden="true" />
        <div class="hero-copy">
          <div class="beta-pill"><Sparkles class="h-3.5 w-3.5" /> Free during beta</div>
          <h1>Give your team a clear place to move work forward.</h1>
          <p>
            Asanop brings projects, tasks, requests, schedules, and lightweight automation together—without the overhead small teams do not need.
          </p>
          <div class="hero-actions">
            <RouterLink :to="primaryDestination" class="ui-button ui-button-primary ui-button-lg">
              {{ primaryLabel }} <ArrowRight class="h-4 w-4" aria-hidden="true" />
            </RouterLink>
            <a href="#capabilities" class="ui-button ui-button-secondary ui-button-lg">Explore capabilities</a>
          </div>
          <ul class="hero-proof" aria-label="Beta benefits">
            <li><CheckCircle2 /> Set up in minutes</li>
            <li><CheckCircle2 /> Invite your team</li>
            <li><CheckCircle2 /> No credit card</li>
          </ul>
        </div>

        <div class="product-window" aria-label="Asanop dashboard preview">
          <div class="window-bar"><span /><span /><span /><p>Team launch workspace</p></div>
          <div class="preview-app">
            <aside class="preview-sidebar">
              <div class="preview-brand">A</div>
              <span class="active"><LayoutDashboard /></span>
              <span><ClipboardList /></span>
              <span><CalendarDays /></span>
              <span><GanttChart /></span>
            </aside>
            <div class="preview-content">
              <div class="preview-heading"><div><small>Monday overview</small><strong>Good morning, Maya</strong></div><button>+ Add task</button></div>
              <div class="preview-metrics">
                <article><small>Open tasks</small><strong>24</strong><em>Across 4 projects</em></article>
                <article><small>Due this week</small><strong>8</strong><em>3 need attention</em></article>
                <article><small>Completed</small><strong>67%</strong><em>Up 12% this month</em></article>
              </div>
              <div class="preview-grid">
                <article class="preview-panel">
                  <div class="preview-panel-title"><strong>Project health</strong><span>View all</span></div>
                  <div v-for="(project, index) in ['Website launch', 'Client onboarding', 'Q3 campaign']" :key="project" class="preview-row">
                    <i :class="`dot-${index}`" /><span>{{ project }}</span><div><b :style="{ width: `${82 - index * 17}%` }" /></div><small>{{ 82 - index * 17 }}%</small>
                  </div>
                </article>
                <article class="preview-panel preview-attention">
                  <div class="preview-panel-title"><strong>Needs attention</strong><span>Today</span></div>
                  <div class="attention-item"><i class="coral" /><p><strong>Confirm launch copy</strong><small>Website launch · Today</small></p></div>
                  <div class="attention-item"><i class="gold" /><p><strong>Review client intake</strong><small>Onboarding · Tomorrow</small></p></div>
                  <div class="attention-item"><i class="sky" /><p><strong>Assign campaign assets</strong><small>Q3 campaign · Fri</small></p></div>
                </article>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="trust-strip" aria-label="Product capabilities">
        <span>Boards & lists</span><i /> <span>Calendars</span><i /> <span>Timelines</span><i /> <span>Forms</span><i /> <span>Automations</span>
      </section>

      <section id="workflow" class="marketing-section workflow-section">
        <div class="section-intro">
          <p class="marketing-eyebrow">One connected rhythm</p>
          <h2>From incoming request to finished work.</h2>
          <p>Keep the process visible without turning project management into a project of its own.</p>
        </div>
        <ol class="workflow-grid">
          <li v-for="item in workflows" :key="item.number">
            <span>{{ item.number }}</span><h3>{{ item.title }}</h3><p>{{ item.copy }}</p>
          </li>
        </ol>
      </section>

      <section id="capabilities" class="marketing-section capability-section">
        <div class="section-intro section-intro-wide">
          <div><p class="marketing-eyebrow">The full picture</p><h2>Enough structure to stay aligned. Enough flexibility to keep moving.</h2></div>
          <p>Every view works from the same source of truth, so your team spends less time translating between tools.</p>
        </div>
        <div class="capability-grid">
          <article v-for="capability in capabilities" :key="capability.title" class="capability-card" :class="`tone-${capability.tone}`">
            <div class="capability-icon"><component :is="capability.icon" /></div>
            <h3>{{ capability.title }}</h3><p>{{ capability.copy }}</p><ChevronRight class="capability-arrow" aria-hidden="true" />
          </article>
        </div>
      </section>

      <section id="teams" class="marketing-section team-section">
        <div class="team-card">
          <div>
            <p class="marketing-eyebrow">Made for small teams</p>
            <h2>Clarity without a dedicated operations department.</h2>
            <p>Asanop helps everyone understand what matters, who owns it, and what happens next.</p>
          </div>
          <ul>
            <li><Users /><span><strong>Shared accountability</strong>Roles, assignees, mentions, and notifications keep ownership visible.</span></li>
            <li><MessageSquare /><span><strong>Context where work happens</strong>Keep decisions, files, activity, and updates connected to tasks.</span></li>
            <li><Zap /><span><strong>Less routine coordination</strong>Use forms and rules to turn repeatable work into a dependable flow.</span></li>
          </ul>
        </div>
      </section>

      <section class="final-cta">
        <div class="final-mark" aria-hidden="true"><Check /></div>
        <p class="marketing-eyebrow">Free public beta</p>
        <h2>Bring the team together around the work that matters.</h2>
        <p>Create a workspace, invite your teammates, and start organizing real work today.</p>
        <RouterLink :to="primaryDestination" class="ui-button ui-button-primary ui-button-lg">
          {{ primaryLabel }} <ArrowRight class="h-4 w-4" aria-hidden="true" />
        </RouterLink>
      </section>
    </main>

    <footer class="marketing-footer">
      <div class="brand-lockup"><span class="brand-symbol"><Check class="h-4 w-4" /></span><span>Asanop</span></div>
      <p>Clear work. Calmer teams.</p>
      <div><RouterLink :to="{ name: 'login' }">Sign in</RouterLink><a href="#capabilities">Capabilities</a></div>
    </footer>
  </div>
</template>

<style scoped>
.marketing-shell{min-height:100vh;background:var(--color-marketing);color:var(--color-ink-strong);overflow:hidden}.marketing-nav{position:relative;z-index:20;display:flex;height:72px;align-items:center;justify-content:space-between;gap:24px;max-width:var(--content-max);margin:auto;padding:0 24px;border-bottom:1px solid color-mix(in srgb,var(--color-line) 70%,transparent)}.marketing-nav nav a,.marketing-footer a{color:var(--color-muted);font-size:.9rem;font-weight:600;transition:color .15s}.marketing-nav nav a:hover,.marketing-footer a:hover{color:var(--color-brand)}.brand-lockup{display:inline-flex;align-items:center;gap:10px;font-family:var(--font-display);font-size:1.25rem;font-weight:700;letter-spacing:-.03em}.brand-symbol{display:inline-flex;width:30px;height:30px;align-items:center;justify-content:center;border-radius:10px;background:var(--color-brand);color:white;transform:rotate(-4deg)}.marketing-menu{display:inline-flex;width:40px;height:40px;align-items:center;justify-content:center;color:var(--color-muted)}.hero-section{position:relative;max-width:var(--content-max);margin:auto;padding:88px 24px 72px;display:grid;grid-template-columns:minmax(0,.8fr) minmax(560px,1.2fr);gap:68px;align-items:center}.hero-copy{position:relative;z-index:2}.beta-pill{display:inline-flex;align-items:center;gap:7px;padding:7px 11px;border:1px solid var(--color-brand-soft);border-radius:999px;background:color-mix(in srgb,var(--color-brand-soft) 42%,white);color:var(--color-brand-hover);font-size:.78rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em}.hero-copy h1{max-width:690px;margin:22px 0;font-size:clamp(2.75rem,5.5vw,5.35rem);line-height:.99;letter-spacing:-.06em;text-wrap:balance}.hero-copy>p{max-width:620px;color:var(--color-muted);font-size:1.18rem;line-height:1.65}.hero-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:30px}.hero-proof{display:flex;flex-wrap:wrap;gap:18px;margin-top:22px;color:var(--color-muted);font-size:.86rem}.hero-proof li{display:flex;align-items:center;gap:6px}.hero-proof svg{width:15px;color:var(--color-brand)}.editorial-orb{position:absolute;border-radius:999px;filter:blur(2px);pointer-events:none}.editorial-orb-one{width:340px;height:340px;right:-160px;top:-100px;background:color-mix(in srgb,var(--color-accent-soft) 30%,transparent)}.editorial-orb-two{width:220px;height:220px;left:-150px;bottom:-80px;background:color-mix(in srgb,var(--color-brand-soft) 35%,transparent)}.product-window{position:relative;z-index:3;border:1px solid rgba(15,23,42,.14);border-radius:20px;background:#fff;box-shadow:var(--shadow-editorial);overflow:hidden;transform:rotate(1deg)}.window-bar{height:38px;display:flex;align-items:center;gap:6px;padding:0 13px;background:#f3f0e9;border-bottom:1px solid #ddd8cd}.window-bar>span{width:8px;height:8px;border-radius:50%;background:#c9c3b8}.window-bar p{margin:auto;color:#7a746a;font-size:10px}.preview-app{display:grid;grid-template-columns:46px 1fr;min-height:400px;background:#e9eef2}.preview-sidebar{display:flex;flex-direction:column;align-items:center;gap:13px;padding:14px 8px;background:#152137;color:#8e9aae}.preview-sidebar span,.preview-brand{display:flex;width:28px;height:28px;align-items:center;justify-content:center;border-radius:8px}.preview-sidebar span.active{background:#18845f;color:#fff}.preview-sidebar svg{width:13px}.preview-brand{margin-bottom:12px;background:#fff;color:#18845f;font-weight:800}.preview-content{padding:24px}.preview-heading{display:flex;justify-content:space-between;align-items:end}.preview-heading small{display:block;color:#687383;font-size:9px;text-transform:uppercase;letter-spacing:.08em}.preview-heading strong{display:block;margin-top:3px;font:600 20px var(--font-display);color:#152137}.preview-heading button{border-radius:7px;background:#0d8a5b;padding:8px 11px;color:#fff;font-size:9px;font-weight:700}.preview-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:19px}.preview-metrics article,.preview-panel{border:1px solid #d9dee3;border-radius:10px;background:#fff;box-shadow:0 2px 5px rgba(15,23,42,.04)}.preview-metrics article{padding:12px}.preview-metrics small,.preview-metrics em{display:block;color:#718096;font-size:8px;font-style:normal}.preview-metrics strong{display:block;margin:3px 0;font:600 20px var(--font-display);color:#152137}.preview-grid{display:grid;grid-template-columns:1.25fr .85fr;gap:9px;margin-top:9px}.preview-panel{padding:13px;min-width:0}.preview-panel-title{display:flex;justify-content:space-between;margin-bottom:12px;font-size:9px;color:#718096}.preview-panel-title strong{font-size:10px;color:#1e293b}.preview-row{display:grid;grid-template-columns:7px 1fr 54px 22px;gap:7px;align-items:center;padding:8px 0;border-top:1px solid #edf0f2;font-size:8px}.preview-row i{width:6px;height:6px;border-radius:50%;background:#0d8a5b}.preview-row i.dot-1{background:#ff6c4b}.preview-row i.dot-2{background:#d9950c}.preview-row>div{height:4px;border-radius:9px;background:#e5e9ed;overflow:hidden}.preview-row b{display:block;height:100%;border-radius:9px;background:#0d8a5b}.preview-row small{color:#718096}.attention-item{display:flex;gap:7px;padding:8px 0;border-top:1px solid #edf0f2}.attention-item>i{width:3px;border-radius:4px;background:#0d8a5b}.attention-item>i.coral{background:#ff6c4b}.attention-item>i.gold{background:#d9950c}.attention-item>i.sky{background:#0284c7}.attention-item strong,.attention-item small{display:block;font-size:8px}.attention-item small{margin-top:2px;color:#718096}.trust-strip{display:flex;align-items:center;justify-content:center;gap:24px;padding:18px 24px;border-block:1px solid var(--color-line);background:rgba(255,255,255,.45);color:var(--color-muted);font-size:.76rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase}.trust-strip i{width:4px;height:4px;border-radius:50%;background:var(--color-accent)}.marketing-section{max-width:var(--content-max);margin:auto;padding:112px 24px}.section-intro{max-width:680px}.marketing-eyebrow{margin-bottom:12px;color:var(--color-brand);font-size:.75rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase}.section-intro h2,.team-card h2,.final-cta h2{font-size:clamp(2.15rem,4vw,3.8rem);line-height:1.08;letter-spacing:-.045em;text-wrap:balance}.section-intro>p,.section-intro-wide>p,.team-card>div>p:not(.marketing-eyebrow),.final-cta>p:not(.marketing-eyebrow){margin-top:18px;color:var(--color-muted);font-size:1.05rem;line-height:1.65}.workflow-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;margin-top:55px;border:1px solid var(--color-line);border-radius:18px;background:var(--color-line);overflow:hidden}.workflow-grid li{min-height:250px;padding:28px;background:var(--color-surface)}.workflow-grid li>span{display:block;color:var(--color-accent);font:700 .72rem var(--font-display);letter-spacing:.08em}.workflow-grid h3{margin-top:68px;font-size:1.08rem}.workflow-grid p{margin-top:10px;color:var(--color-muted);font-size:.9rem;line-height:1.55}.capability-section{padding-top:80px}.section-intro-wide{max-width:none;display:grid;grid-template-columns:1.3fr .7fr;gap:80px;align-items:end}.capability-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-top:55px}.capability-card{position:relative;min-height:265px;padding:32px;border:1px solid var(--color-line);border-radius:18px;background:var(--color-surface);overflow:hidden;transition:transform .2s,box-shadow .2s}.capability-card:hover{transform:translateY(-3px);box-shadow:var(--shadow-card)}.capability-card:after{content:"";position:absolute;width:180px;height:180px;border-radius:50%;right:-70px;bottom:-90px;background:var(--card-tint)}.capability-icon{display:flex;width:44px;height:44px;align-items:center;justify-content:center;border-radius:13px;background:var(--card-tint);color:var(--card-color)}.capability-icon svg{width:20px}.capability-card h3{margin-top:65px;font-size:1.35rem}.capability-card p{max-width:470px;margin-top:9px;color:var(--color-muted);line-height:1.55}.capability-arrow{position:absolute;right:27px;top:29px;width:18px;color:var(--card-color)}.tone-emerald{--card-color:#08704d;--card-tint:#d5eee2}.tone-coral{--card-color:#bd422b;--card-tint:#f9d8cf}.tone-gold{--card-color:#9a6600;--card-tint:#f4e5ba}.tone-sky{--card-color:#036c9f;--card-tint:#d5eafa}.team-section{padding-top:80px}.team-card{display:grid;grid-template-columns:1fr 1fr;gap:80px;padding:64px;border-radius:24px;background:#152137;color:#fff;box-shadow:var(--shadow-editorial)}.team-card h2{color:#fff}.team-card>div>p:not(.marketing-eyebrow){color:#afbac8}.team-card ul{display:grid;gap:12px}.team-card li{display:grid;grid-template-columns:42px 1fr;gap:14px;padding:17px;border:1px solid rgba(255,255,255,.1);border-radius:14px;background:rgba(255,255,255,.04)}.team-card li>svg{width:20px;color:#6fd2ad}.team-card li span{color:#afbac8;font-size:.88rem;line-height:1.5}.team-card li strong{display:block;margin-bottom:3px;color:#fff;font-size:.95rem}.final-cta{max-width:900px;margin:40px auto 100px;padding:80px 24px;text-align:center}.final-cta h2{margin-inline:auto;max-width:850px}.final-cta>p:not(.marketing-eyebrow){max-width:590px;margin-inline:auto}.final-cta .ui-button{margin-top:28px}.final-mark{display:flex;width:62px;height:62px;align-items:center;justify-content:center;margin:0 auto 24px;border-radius:20px;background:var(--color-brand);color:#fff;transform:rotate(-5deg)}.marketing-footer{display:flex;max-width:var(--content-max);margin:auto;align-items:center;justify-content:space-between;gap:24px;padding:28px 24px;border-top:1px solid var(--color-line);color:var(--color-muted);font-size:.85rem}.marketing-footer>div:last-child{display:flex;gap:22px}@media(max-width:1024px){.hero-section{grid-template-columns:1fr;padding-top:68px}.hero-copy{text-align:center}.hero-copy>p{margin-inline:auto}.hero-actions,.hero-proof{justify-content:center}.product-window{max-width:760px;margin:auto;width:100%;transform:none}.workflow-grid{grid-template-columns:repeat(2,1fr)}.section-intro-wide{grid-template-columns:1fr;gap:0}.team-card{gap:40px;padding:45px}}@media(max-width:680px){.marketing-nav{height:64px;padding-inline:16px}.marketing-nav>.flex>.ui-button-quiet{display:none}.hero-section,.marketing-section{padding-inline:16px}.hero-section{padding-top:52px;gap:42px}.hero-copy h1{font-size:clamp(2.6rem,14vw,4rem)}.hero-copy>p{font-size:1rem}.hero-actions{display:grid}.hero-proof{gap:10px;font-size:.76rem}.product-window{margin-inline:0;width:150%;transform:scale(.67);transform-origin:top left;margin-bottom:-128px}.trust-strip{justify-content:flex-start;overflow:hidden;white-space:nowrap}.workflow-grid,.capability-grid,.team-card{grid-template-columns:1fr}.workflow-grid li{min-height:200px}.workflow-grid h3{margin-top:45px}.marketing-section{padding-block:78px}.team-card{padding:30px 22px}.marketing-footer{align-items:flex-start;flex-direction:column}.marketing-footer>p{display:none}}
</style>
<style scoped>
.mobile-public-nav {
  position: relative;
  z-index: 19;
  display: grid;
  gap: 0.25rem;
  margin: 0 1rem;
  padding: 0.75rem;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}
.mobile-public-nav a {
  padding: 0.75rem;
  border-radius: 0.5rem;
  color: var(--color-muted);
  font-weight: 600;
}
.mobile-public-nav a:hover { background: var(--color-marketing); color: var(--color-brand); }
@media (min-width: 768px) { .marketing-menu { display: none; } }
</style>
