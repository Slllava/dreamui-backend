<template>
  <private-view title="Resend Emails">
    <template #navigation>
      <v-list nav>
        <v-list-item clickable nav :active="activeTab === 'emails'" @click="activeTab = 'emails'">
          <v-list-item-icon>
            <v-icon name="mail" />
          </v-list-item-icon>
          <v-list-item-content>Emails</v-list-item-content>
        </v-list-item>

        <v-divider />

        <v-list-item clickable nav :active="activeTab === 'settings'" @click="activeTab = 'settings'">
          <v-list-item-icon>
            <v-icon name="settings" />
          </v-list-item-icon>
          <v-list-item-content>Settings</v-list-item-content>
        </v-list-item>
      </v-list>
    </template>

    <div class="dreamui-resend">
      <section v-if="activeTab === 'emails'" class="dreamui-resend__panel">
        <div class="dreamui-resend__toolbar">
          <div class="dreamui-resend__toolbar-main">
            <v-input
              v-model="searchQuery"
              :disabled="loading"
              placeholder="Search by subject, recipient, sender, or id"
            >
              <template #prepend>
                <v-icon name="search" />
              </template>
            </v-input>
          </div>

          <div class="dreamui-resend__toolbar-actions">
            <v-menu v-model="limitMenuActive" attached>
              <template #activator="{ active, toggle }">
                <v-input
                  class="dreamui-resend__limit"
                  :model-value="`Limit ${parsedLimit}`"
                  readonly
                  @click="toggle"
                >
                  <template #append>
                    <v-icon
                      clickable
                      name="expand_more"
                      class="dreamui-resend__open-indicator"
                      :class="{ open: active }"
                      @click="toggle"
                    />
                  </template>
                </v-input>
              </template>

              <div class="dreamui-resend__limit-popover">
                <button
                  v-for="option in limitOptions"
                  :key="option"
                  type="button"
                  class="dreamui-resend__limit-option"
                  :class="{ active: option === parsedLimit }"
                  @click="selectLimit(option)"
                >
                  {{ option }}
                </button>
              </div>
            </v-menu>

            <v-button secondary :disabled="loading" @click="refreshEmails">
              <v-icon name="refresh" left />
              Refresh
            </v-button>
          </div>
        </div>

        <v-notice v-if="emailError" type="warning">
          {{ emailError }}
        </v-notice>

        <v-notice v-else-if="status?.configured === false" type="warning">
          Resend is not configured yet. Open the Settings tab to see which environment variables to add.
        </v-notice>

        <div v-if="loading" class="dreamui-resend__state">
          <v-icon name="hourglass_top" />
          <span>Loading emails from Resend…</span>
        </div>

        <div v-else-if="filteredEmails.length === 0" class="dreamui-resend__state">
          <v-icon name="mail_outline" />
          <span>{{ emails.length === 0 ? 'No sent emails found.' : 'No emails match the current search.' }}</span>
        </div>

        <div v-else class="dreamui-resend__table-wrap">
          <table class="dreamui-resend__table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>To</th>
                <th>From</th>
                <th>Status</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="email in filteredEmails" :key="email.id">
                <td>
                  <div class="dreamui-resend__primary">{{ email.subject || '(No subject)' }}</div>
                  <div class="dreamui-resend__secondary">{{ email.id }}</div>
                </td>
                <td>{{ formatAddressList(email.to) }}</td>
                <td>{{ email.from }}</td>
                <td>
                  <span class="dreamui-resend__event" :data-event="email.last_event || 'unknown'">
                    {{ formatEvent(email.last_event) }}
                  </span>
                </td>
                <td>{{ formatDate(email.created_at) }}</td>
                <td class="dreamui-resend__actions-cell">
                  <v-button secondary small @click="openEmail(email.id)">
                    View
                  </v-button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="dreamui-resend__pagination">
          <v-button secondary :disabled="loading || currentPage <= 1 || emails.length === 0" @click="loadPreviousPage">
            Previous
          </v-button>
          <div class="dreamui-resend__pagination-label">
            <span>{{ pageLabel }}</span>
            <span v-if="emails.length > 0">{{ emails.length }} item{{ emails.length === 1 ? '' : 's' }}</span>
          </div>
          <v-button secondary :disabled="loading || !hasMore || emails.length === 0" @click="loadNextPage">
            Next
          </v-button>
        </div>
      </section>

      <section v-else class="dreamui-resend__panel dreamui-resend__settings">
        <div class="dreamui-resend__settings-grid">
          <div class="dreamui-resend__card">
            <div class="dreamui-resend__card-head">
              <h2>Connection</h2>
              <span class="dreamui-resend__pill" :class="{ success: status?.configured }">
                {{ status?.configured ? 'Configured' : 'Missing API key' }}
              </span>
            </div>

            <div class="dreamui-resend__meta-list">
              <div class="dreamui-resend__meta-row">
                <span>Endpoint</span>
                <code>/dreamui-resend</code>
              </div>
              <div class="dreamui-resend__meta-row">
                <span>Base URL</span>
                <code>{{ status?.baseUrl || 'https://api.resend.com' }}</code>
              </div>
              <div class="dreamui-resend__meta-row">
                <span>Default limit</span>
                <code>{{ status?.defaultLimit ?? 20 }}</code>
              </div>
            </div>
          </div>

          <div class="dreamui-resend__card">
            <div class="dreamui-resend__card-head">
              <h2>Required environment variables</h2>
            </div>

            <div class="dreamui-resend__meta-list">
              <div class="dreamui-resend__meta-row">
                <span>`RESEND_API_KEY`</span>
                <strong>{{ status?.env?.apiKey ? 'Present' : 'Missing' }}</strong>
              </div>
              <div class="dreamui-resend__meta-row">
                <span>`RESEND_BASE_URL`</span>
                <strong>{{ status?.env?.baseUrl ? 'Custom' : 'Default' }}</strong>
              </div>
              <div class="dreamui-resend__meta-row">
                <span>`RESEND_DEFAULT_LIMIT`</span>
                <strong>{{ status?.env?.defaultLimit ? 'Custom' : 'Default' }}</strong>
              </div>
            </div>
          </div>
        </div>

        <v-notice type="info">
          Add these values to your Directus server environment, restart the server, and then come back here to refresh status.
        </v-notice>

        <v-notice v-if="statusError" type="warning">
          {{ statusError }}
        </v-notice>

        <div class="dreamui-resend__code-card">
          <pre>RESEND_API_KEY=re_xxxxxxxxx
RESEND_BASE_URL=https://api.resend.com
RESEND_DEFAULT_LIMIT=20</pre>
        </div>

        <div class="dreamui-resend__settings-actions">
          <v-button secondary :disabled="statusLoading" @click="loadStatus">
            <v-icon name="refresh" left />
            Refresh status
          </v-button>

          <a
            class="dreamui-resend__docs-link"
            :href="status?.docsUrl || 'https://resend.com/docs/api-reference/emails/list-emails'"
            target="_blank"
            rel="noreferrer"
          >
            Resend API docs
          </a>
        </div>
      </section>

      <v-dialog v-model="isDetailOpen" @esc="closeDetail">
        <template #title>
          Email Details
        </template>

        <template #default>
          <div class="dreamui-resend__dialog">
            <div v-if="detailLoading" class="dreamui-resend__state">
              <v-icon name="hourglass_top" />
              <span>Loading email details…</span>
            </div>

            <v-notice v-else-if="detailError" type="warning">
              {{ detailError }}
            </v-notice>

            <template v-else-if="selectedEmail">
              <div class="dreamui-resend__detail-grid">
                <div class="dreamui-resend__detail-card">
                  <div class="dreamui-resend__meta-row">
                    <span>Subject</span>
                    <strong>{{ selectedEmail.subject || '(No subject)' }}</strong>
                  </div>
                  <div class="dreamui-resend__meta-row">
                    <span>To</span>
                    <strong>{{ formatAddressList(selectedEmail.to) }}</strong>
                  </div>
                  <div class="dreamui-resend__meta-row">
                    <span>From</span>
                    <strong>{{ selectedEmail.from }}</strong>
                  </div>
                  <div class="dreamui-resend__meta-row">
                    <span>Status</span>
                    <strong>{{ formatEvent(selectedEmail.last_event) }}</strong>
                  </div>
                  <div class="dreamui-resend__meta-row">
                    <span>Created</span>
                    <strong>{{ formatDate(selectedEmail.created_at) }}</strong>
                  </div>
                </div>

                <div class="dreamui-resend__detail-card">
                  <div class="dreamui-resend__meta-row" v-if="selectedEmail.reply_to?.length">
                    <span>Reply-To</span>
                    <strong>{{ formatAddressList(selectedEmail.reply_to) }}</strong>
                  </div>
                  <div class="dreamui-resend__meta-row" v-if="selectedEmail.cc?.length">
                    <span>CC</span>
                    <strong>{{ formatAddressList(selectedEmail.cc) }}</strong>
                  </div>
                  <div class="dreamui-resend__meta-row" v-if="selectedEmail.bcc?.length">
                    <span>BCC</span>
                    <strong>{{ formatAddressList(selectedEmail.bcc) }}</strong>
                  </div>
                  <div class="dreamui-resend__meta-row" v-if="selectedEmail.tags?.length">
                    <span>Tags</span>
                    <strong>{{ selectedEmail.tags.map((tag) => `${tag.name}: ${tag.value}`).join(', ') }}</strong>
                  </div>
                </div>
              </div>

              <div v-if="selectedEmail.text" class="dreamui-resend__body-card">
                <h3>Text</h3>
                <pre>{{ selectedEmail.text }}</pre>
              </div>

              <div v-if="selectedEmail.html" class="dreamui-resend__body-card">
                <h3>HTML</h3>
                <pre>{{ selectedEmail.html }}</pre>
              </div>
            </template>
          </div>
        </template>

        <template #actions>
          <v-button secondary @click="closeDetail">Close</v-button>
        </template>
      </v-dialog>
    </div>
  </private-view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useApi } from '@directus/extensions-sdk';

type TabValue = 'emails' | 'settings';

type ResendEmailListItem = {
  id: string;
  to: string[];
  from: string;
  created_at: string;
  subject: string | null;
  bcc: string[] | null;
  cc: string[] | null;
  reply_to: string[] | null;
  last_event: string | null;
  scheduled_at: string | null;
};

type ResendEmailDetail = ResendEmailListItem & {
  object: 'email';
  html: string | null;
  text: string | null;
  tags?: Array<{ name: string; value: string }>;
};

type StatusResponse = {
  configured: boolean;
  baseUrl: string;
  defaultLimit: number;
  docsUrl: string;
  env: {
    apiKey: boolean;
    baseUrl: boolean;
    defaultLimit: boolean;
  };
};

type ListResponse = {
  object: 'list';
  has_more: boolean;
  data: ResendEmailListItem[];
  query: {
    limit: number;
    after: string | null;
    before: string | null;
  };
};

const api = useApi();

const activeTab = ref<TabValue>('emails');
const searchQuery = ref('');
const limitInput = ref('20');
const limitMenuActive = ref(false);

const status = ref<StatusResponse | null>(null);
const statusLoading = ref(false);
const statusError = ref('');

const emails = ref<ResendEmailListItem[]>([]);
const loading = ref(false);
const emailError = ref('');
const hasMore = ref(false);
const afterCursor = ref<string | null>(null);
const currentPage = ref(1);

const isDetailOpen = ref(false);
const detailLoading = ref(false);
const detailError = ref('');
const selectedEmail = ref<ResendEmailDetail | null>(null);
const limitOptions = [10, 20, 50, 100];

const parsedLimit = computed(() => {
  const value = Number(limitInput.value);

  if (Number.isNaN(value)) return 20;

  return Math.max(1, Math.min(100, Math.floor(value)));
});

const filteredEmails = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();

  if (!query) return emails.value;

  return emails.value.filter((email) => {
    const haystack = [
      email.id,
      email.subject ?? '',
      email.from,
      ...(email.to ?? []),
      ...(email.cc ?? []),
      ...(email.bcc ?? []),
      ...(email.reply_to ?? []),
      email.last_event ?? '',
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(query);
  });
});

const pageLabel = computed(() => `Page ${currentPage.value}`);

function formatAddressList(list: string[] | null | undefined): string {
  if (!list || list.length === 0) return '—';
  return list.join(', ');
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';

  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatEvent(value: string | null | undefined): string {
  if (!value) return 'Unknown';

  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

async function loadStatus() {
  statusLoading.value = true;
  statusError.value = '';

  try {
    const response = await api.get('/dreamui-resend/status');
    status.value = response.data as StatusResponse;

    if (!limitInput.value || Number(limitInput.value) <= 0) {
      limitInput.value = String(status.value.defaultLimit || 20);
    }
  } catch (error: any) {
    status.value = null;
    statusError.value = error?.response?.data?.message || error?.message || 'Failed to load Resend status.';
  } finally {
    statusLoading.value = false;
  }
}

async function loadEmails(cursor: string | null = null, direction: 'after' | 'before' | null = null) {
  loading.value = true;
  emailError.value = '';

  try {
    const params: Record<string, string | number> = {
      limit: parsedLimit.value,
    };

    if (direction === 'after' && cursor) params.after = cursor;
    if (direction === 'before' && cursor) params.before = cursor;

    const response = await api.get('/dreamui-resend/emails', { params });
    const payload = response.data as ListResponse;

    emails.value = payload.data;
    hasMore.value = payload.has_more;
    afterCursor.value = payload.data.length > 0 ? payload.data[payload.data.length - 1]?.id ?? null : null;
  } catch (error: any) {
    emails.value = [];
    hasMore.value = false;
    afterCursor.value = null;
    emailError.value = error?.response?.data?.message || error?.message || 'Failed to load sent emails.';
  } finally {
    loading.value = false;
  }
}

async function refreshEmails() {
  afterCursor.value = null;
  currentPage.value = 1;
  await loadEmails();
}

function selectLimit(value: number) {
  limitInput.value = String(value);
  limitMenuActive.value = false;
}

async function loadNextPage() {
  if (!afterCursor.value) return;

  currentPage.value += 1;
  await loadEmails(afterCursor.value, 'after');
}

async function loadPreviousPage() {
  const firstVisibleId = emails.value[0]?.id ?? null;

  if (currentPage.value <= 1 || !firstVisibleId) {
    currentPage.value = 1;
    await loadEmails();
    return;
  }

  currentPage.value = Math.max(1, currentPage.value - 1);
  await loadEmails(firstVisibleId, 'before');
}

async function openEmail(id: string) {
  isDetailOpen.value = true;
  detailLoading.value = true;
  detailError.value = '';
  selectedEmail.value = null;

  try {
    const response = await api.get(`/dreamui-resend/emails/${id}`);
    selectedEmail.value = response.data as ResendEmailDetail;
  } catch (error: any) {
    detailError.value = error?.response?.data?.message || error?.message || 'Failed to load email details.';
  } finally {
    detailLoading.value = false;
  }
}

function closeDetail() {
  isDetailOpen.value = false;
}

watch(parsedLimit, () => {
  if (activeTab.value === 'emails') refreshEmails();
});

onMounted(async () => {
  await loadStatus();

  if (status.value?.configured) {
    await refreshEmails();
  }
});
</script>

<style scoped>
.dreamui-resend {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
}

.dreamui-resend__panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dreamui-resend__toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
}

.dreamui-resend__toolbar-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.dreamui-resend__limit {
  width: 140px;
}

.dreamui-resend__open-indicator {
  transition: transform var(--fast) var(--transition);
}

.dreamui-resend__open-indicator.open {
  transform: rotate(180deg);
}

.dreamui-resend__limit-popover {
  min-width: 140px;
  padding: 8px;
  border: 1px solid var(--theme--form--field--input--border-color);
  border-radius: var(--theme--border-radius);
  background: var(--theme--background);
  box-shadow: var(--theme--box-shadow);
}

.dreamui-resend__limit-option {
  display: block;
  width: 100%;
  padding: 10px 12px;
  border: 0;
  border-radius: calc(var(--theme--border-radius) - 4px);
  background: transparent;
  color: var(--theme--foreground);
  text-align: left;
  cursor: pointer;
}

.dreamui-resend__limit-option:hover,
.dreamui-resend__limit-option.active {
  background: var(--theme--background-subdued);
}

.dreamui-resend__state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 220px;
  border: 1px solid var(--theme--form--field--input--border-color);
  border-radius: var(--theme--border-radius);
  color: var(--theme--foreground-subdued);
  background: var(--theme--background-subdued);
}

.dreamui-resend__table-wrap {
  overflow: auto;
  border: 1px solid var(--theme--form--field--input--border-color);
  border-radius: var(--theme--border-radius);
  background: var(--theme--background);
}

.dreamui-resend__table {
  width: 100%;
  border-collapse: collapse;
}

.dreamui-resend__table th,
.dreamui-resend__table td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--theme--form--field--input--border-color);
  text-align: left;
  vertical-align: top;
}

.dreamui-resend__table th {
  position: sticky;
  top: 0;
  background: var(--theme--background-subdued);
  color: var(--theme--foreground-subdued);
  font-size: 12px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.dreamui-resend__table tbody tr:hover {
  background: var(--theme--background-highlight);
}

.dreamui-resend__primary {
  color: var(--theme--foreground);
  font-weight: 600;
}

.dreamui-resend__secondary {
  margin-top: 4px;
  color: var(--theme--foreground-subdued);
  font-size: 12px;
}

.dreamui-resend__event {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--theme--background-subdued);
  color: var(--theme--foreground);
  font-size: 12px;
  font-weight: 600;
}

.dreamui-resend__event[data-event='delivered'],
.dreamui-resend__event[data-event='opened'] {
  background: var(--theme--success-background);
  color: var(--theme--success);
}

.dreamui-resend__event[data-event='bounced'],
.dreamui-resend__event[data-event='complained'] {
  background: var(--theme--danger-background);
  color: var(--theme--danger);
}

.dreamui-resend__event[data-event='queued'],
.dreamui-resend__event[data-event='scheduled'] {
  background: var(--theme--warning-background);
  color: var(--theme--warning);
}

.dreamui-resend__actions-cell {
  width: 1%;
  white-space: nowrap;
}

.dreamui-resend__pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.dreamui-resend__pagination-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  color: var(--theme--foreground-subdued);
  font-size: 12px;
}

.dreamui-resend__settings-grid,
.dreamui-resend__detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.dreamui-resend__card,
.dreamui-resend__detail-card,
.dreamui-resend__code-card,
.dreamui-resend__body-card {
  border: 1px solid var(--theme--form--field--input--border-color);
  border-radius: var(--theme--border-radius);
  background: var(--theme--background);
  padding: 20px;
}

.dreamui-resend__card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.dreamui-resend__card-head h2,
.dreamui-resend__body-card h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
}

.dreamui-resend__pill {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--theme--warning-background);
  color: var(--theme--warning);
  font-size: 12px;
  font-weight: 700;
}

.dreamui-resend__pill.success {
  background: var(--theme--success-background);
  color: var(--theme--success);
}

.dreamui-resend__meta-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dreamui-resend__meta-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.dreamui-resend__meta-row span {
  color: var(--theme--foreground-subdued);
}

.dreamui-resend__meta-row strong,
.dreamui-resend__meta-row code {
  color: var(--theme--foreground);
}

.dreamui-resend__code-card pre,
.dreamui-resend__body-card pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: var(--theme--fonts--mono--font-family);
  font-size: 13px;
  line-height: 1.6;
}

.dreamui-resend__settings-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.dreamui-resend__docs-link {
  color: var(--theme--primary);
  text-decoration: none;
  font-weight: 600;
}

.dreamui-resend__dialog {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: min(80vw, 960px);
}

@media (max-width: 960px) {
  .dreamui-resend {
    padding: 16px;
  }

  .dreamui-resend__toolbar,
  .dreamui-resend__settings-grid,
  .dreamui-resend__detail-grid {
    grid-template-columns: 1fr;
  }

  .dreamui-resend__toolbar-actions,
  .dreamui-resend__settings-actions,
  .dreamui-resend__pagination {
    flex-direction: column;
    align-items: stretch;
  }

  .dreamui-resend__limit {
    width: 100%;
  }

  .dreamui-resend__dialog {
    min-width: auto;
  }
}
</style>
