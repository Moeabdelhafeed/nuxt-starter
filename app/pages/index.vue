<template>
    <div
        class="flex min-h-svh flex-col items-center justify-center gap-8 bg-muted/40 p-6 text-center"
    >
        <div class="flex flex-col gap-3 items-center">
            <span
                v-if="isAuthed"
                class="mx-auto inline-flex w-fit items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300"
            >
                <LucideCheckCircle2 class="size-3" />
                {{ t('signed_in', 'Signed in', 'متصل') }} {{ useCookie('current_token_id') }}
            </span>
            <h1 class="text-4xl font-bold tracking-tight sm:text-5xl">
                {{
                    isAuthed && user?.data?.name
                        ? t('welcome_named', 'Welcome, :name', 'مرحبًا، :name', { name: user.data.name })
                        : t('welcome', 'Welcome', 'مرحبًا')
                }}
            </h1>
           
            <p
                v-if="isAuthed"
                class="max-w-md text-center text-muted-foreground"
            >{{ t('home_protected_note', 'You are logged in. This page is protected.', 'لقد سجلت الدخول. هذه الصفحة محمية.') }}</p>
            <p
                v-else
                class="max-w-md text-center text-muted-foreground"
            >{{ t('home_public_note', 'Welcome to the app.', 'مرحبًا بك في التطبيق.') }}</p>
        </div>
        <div class="flex flex-wrap items-center justify-center gap-3">
            <template v-if="isAuthed">
                <Button as-child>
                    <NuxtLink to="/profile">{{ t('profile', 'Profile', 'الملف الشخصي') }}</NuxtLink>
                </Button>
                <Button
                    variant="destructive"
                    :disabled="loggingOut"
                    @click="handleLogout"
                >{{ loggingOut ? t('logging_out', 'Logging out...', 'جارٍ تسجيل الخروج...') : t('logout', 'Logout', 'تسجيل الخروج') }}</Button>
            </template>
            <template v-else>
                <template v-if="appUsers">
                    <Button as-child>
                        <NuxtLink to="/login">{{ t('sign_in', 'Sign in', 'تسجيل الدخول') }}</NuxtLink>
                    </Button>
                    <Button v-if="!isOtpMode" variant="outline" as-child>
                        <NuxtLink to="/register">{{ t('register', 'Register', 'إنشاء حساب') }}</NuxtLink>
                    </Button>
                </template>
                <Button
                    v-if="!user && appGuests"
                    variant="secondary"
                    :disabled="creatingGuest"
                    @click="createGuestAccount"
                >{{ creatingGuest ? t('creating', 'Creating...', 'جارٍ الإنشاء...') : t('continue_as_guest', 'Continue as guest', 'المتابعة كزائر') }}</Button>
                <Button
                    v-if="isGuest"
                    variant="destructive"
                    :disabled="deletingGuest"
                    @click="deleteGuestDialogOpen = true"
                >{{ deletingGuest
                    ? t('deleting', 'Deleting...', 'جارٍ الحذف...')
                    : (appUsers
                        ? t('delete_guest_account', 'Delete guest account', 'حذف حساب الزائر')
                        : t('delete_account', 'Delete account', 'حذف الحساب')) }}</Button>
            </template>
        </div>

        <Teleport to="body">
            <div
                v-if="deleteGuestDialogOpen"
                class="fixed inset-0 z-50 flex items-center justify-center p-4"
                role="dialog"
                aria-modal="true"
            >
                <div
                    class="absolute inset-0 bg-black/50"
                    @click="deletingGuest || (deleteGuestDialogOpen = false)"
                />
                <div class="relative w-full max-w-md rounded-lg border bg-background p-6 shadow-lg">
                    <h2 class="text-lg font-semibold text-destructive">
                        {{ t('delete_guest_account', 'Delete guest account', 'حذف حساب الزائر') }}
                    </h2>
                    <p class="mt-2 text-sm text-muted-foreground">
                        {{ t('delete_guest_confirm', 'Delete this guest session? You can start over by continuing as guest again.', 'حذف جلسة الزائر؟ يمكنك البدء من جديد بالمتابعة كزائر مرة أخرى.') }}
                    </p>
                    <div class="mt-6 flex justify-end gap-2">
                        <Button variant="outline" :disabled="deletingGuest" @click="deleteGuestDialogOpen = false">
                            {{ t('cancel', 'Cancel', 'إلغاء') }}
                        </Button>
                        <Button variant="destructive" :disabled="deletingGuest" @click="deleteGuestAccount">
                            {{ deletingGuest ? t('deleting', 'Deleting...', 'جارٍ الحذف...') : t('delete', 'Delete', 'حذف') }}
                        </Button>
                    </div>
                </div>
            </div>
        </Teleport>

        <Card v-if="hasAuthSystem" class="w-full max-w-2xl text-left">
            <CardHeader>
                <CardTitle>{{ t('current_user', 'Current user', 'المستخدم الحالي') }}</CardTitle>
                <CardDescription>GET /api/user</CardDescription>
            </CardHeader>
            <CardContent class="flex flex-col gap-4">
                <div class="flex items-center gap-2">
                    <Button size="sm" :disabled="userProbe.loading" @click="fetchUser">
                        {{ userProbe.loading ? '...' : t('refetch', 'Refetch', 'إعادة الجلب') }}
                    </Button>
                    <span
                        v-if="userProbe.lastStatus !== null"
                        :class="[
                            'rounded px-2 py-0.5 text-xs',
                            userProbe.ok ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
                        ]"
                    >{{ userProbe.lastStatus }}</span>
                </div>
                <pre
                    v-if="userProbe.lastResponse !== null"
                    class="overflow-auto rounded bg-muted p-3 text-xs"
                >{{ JSON.stringify(userProbe.lastResponse, null, 2) }}</pre>
            </CardContent>
        </Card>

        <Card v-if="isAuthed" class="w-full max-w-2xl text-left">
            <CardHeader>
                <CardTitle>{{ t('broadcast_events', 'Broadcast events', 'أحداث البث') }}</CardTitle>
                <CardDescription>
                    {{ t('listening_on_channel', 'Listening on private channel :channel', 'الاستماع على القناة الخاصة :channel', { channel: channelName }) }}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p
                    v-if="!events.length"
                    class="text-sm text-muted-foreground"
                >{{ t('no_events_yet', 'No events yet.', 'لا توجد أحداث بعد.') }}</p>
                <ul v-else class="flex flex-col gap-2">
                    <li
                        v-for="(e, i) in events"
                        :key="i"
                        class="rounded-md border p-3 text-sm"
                    >
                        <div class="text-xs text-muted-foreground">{{ e.timestamp }}</div>
                        <div class="font-medium">{{ e.message }}</div>
                        <pre class="mt-2 overflow-auto rounded bg-muted p-2 text-xs">{{ JSON.stringify(e, null, 2) }}</pre>
                    </li>
                </ul>
            </CardContent>
        </Card>
    </div>
</template>

<script setup>
definePageMeta({
    middleware: ['require-user', 'verified'],
    name: 'home'
})

const { user, isAuthenticated, logout, refreshIdentity } = useSanctumAuth()
const { appUsers, appGuests, isOtpMode } = useAuthConfig()
const { t } = useLang()

const isAuthed = computed(() => isAuthenticated.value && !user.value?.data?.is_guest)
const isGuest = computed(() => !!user.value?.data?.is_guest)
// When both app_users and app_guests are off there is no user concept at all.
const hasAuthSystem = computed(() => appUsers.value || appGuests.value)

const echo = useEcho()
const events = ref([])
const channelName = computed(() => 'user.' + user.value?.data?.id)

function stopAllListeners() {
    echo.leaveAllChannels()
}

function subscribeToPrivateChannel() {
    if (!isAuthed.value) return
    if (!user.value?.data?.id) return
    echo
        .private(channelName.value)
        .listen('.test.broadcast', (e) => {
            events.value.unshift(e)
        })
        .error((e) => {
            console.error('Private channel error', e)
        })
}

onMounted(() => {
    subscribeToPrivateChannel()
})

onUnmounted(() => {
    stopAllListeners()
})

const api = useApi()

const userProbe = reactive({ loading: false, lastStatus: null, lastResponse: null, ok: false })

const fetchUser = async () => {
    userProbe.loading = true
    userProbe.lastResponse = null
    userProbe.lastStatus = null
    userProbe.ok = false
    try {
        const res = await api('/api/user', { method: 'GET' })
        userProbe.lastResponse = res
        userProbe.lastStatus = 'OK'
        userProbe.ok = true
    } catch (err) {
        userProbe.lastResponse = err?.data ?? { message: err?.message ?? String(err) }
        userProbe.lastStatus = err?.status ?? err?.statusCode ?? 'ERR'
        userProbe.ok = false
    } finally {
        userProbe.loading = false
    }
}

onMounted(() => { if (hasAuthSystem.value) fetchUser() })

const loggingOut = ref(false)
const deletingGuest = ref(false)
const creatingGuest = ref(false)
const deleteGuestDialogOpen = ref(false)

const createGuestAccount = async () => {
    creatingGuest.value = true
    try {
        await api('/api/guest', { method: 'POST' })
        await refreshIdentity()
        await fetchUser()
    } catch (err) {
        console.error('Create guest failed', err?.data ?? err)
    } finally {
        creatingGuest.value = false
    }
}

const deleteGuestAccount = async () => {
    deletingGuest.value = true
    try {
        await api('/api/delete-account', { method: 'DELETE' })
        user.value = null
        deleteGuestDialogOpen.value = false
        navigateTo({ name: 'login' })
    } catch (err) {
        console.error('Delete guest failed', err?.data ?? err)
    } finally {
        deletingGuest.value = false
    }
}

const handleLogout = async () => {
    loggingOut.value = true
    try {
        await logout()
        navigateTo({ name: 'login' })
    } finally {
        loggingOut.value = false
    }
}
</script>
