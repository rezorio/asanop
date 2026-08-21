import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: { public: true },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guest: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { guest: true },
    },
    {
      path: '/invite/:token',
      name: 'invite',
      component: () => import('@/views/InviteView.vue'),
    },
    {
      path: '/f/:token',
      name: 'public-form',
      component: () => import('@/views/PublicFormView.vue'),
    },
    {
      path: '/app',
      component: () => import('@/layouts/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: { name: 'dashboard' },
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/DashboardView.vue'),
        },
        {
          path: 'my-tasks',
          name: 'my-tasks',
          component: () => import('@/views/MyTasksView.vue'),
        },
        {
          path: 'search',
          redirect: { name: 'dashboard' },
        },
        {
          path: 'calendar',
          name: 'calendar',
          component: () => import('@/views/CalendarView.vue'),
        },
        {
          path: 'timeline',
          name: 'timeline',
          component: () => import('@/views/TimelineView.vue'),
        },
        {
          path: 'forms',
          name: 'forms',
          component: () => import('@/views/FormsView.vue'),
        },
        {
          path: 'forms/:formId',
          name: 'form-builder',
          component: () => import('@/views/FormBuilderView.vue'),
        },
        {
          path: 'automations',
          name: 'automations',
          component: () => import('@/views/AutomationsView.vue'),
        },
        {
          path: 'projects/:projectId',
          name: 'project',
          component: () => import('@/views/ProjectBoardView.vue'),
        },
        {
          path: 'members',
          name: 'members',
          component: () => import('@/views/MembersView.vue'),
        },
      ],
    },
    ...[
      'dashboard',
      'my-tasks',
      'calendar',
      'timeline',
      'forms',
      'automations',
      'members',
    ].map((path) => ({
      path: `/${path}`,
      redirect: `/${path === 'dashboard' ? 'app/dashboard' : `app/${path}`}`,
    })),
    {
      path: '/forms/:formId',
      redirect: (to) => `/app/forms/${String(to.params.formId)}`,
    },
    {
      path: '/projects/:projectId',
      redirect: (to) => `/app/projects/${String(to.params.projectId)}`,
    },
    ...(import.meta.env.DEV
      ? [
          {
            path: '/dev/components',
            name: 'component-gallery',
            component: () => import('@/views/ComponentGalleryView.vue'),
          },
        ]
      : []),
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.guest && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }
  if (auth.isAuthenticated && auth.workspaces.length === 0) {
    try {
      await auth.loadWorkspaces()
    } catch {
      auth.logout()
      if (to.meta.requiresAuth) return { name: 'login' }
      return true
    }
  }
  return true
})

export default router
