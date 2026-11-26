// UI strings. The app is English-only; add another language object here to localize.
export const dict = {
  en: {
    project: "Launch Readiness",
    projects: "Projects",
    board: "Board",
    list: "List",
    tagline: "Coordinate launch work across teams with realtime cues, optimistic updates and offline safety.",

    // Statuses
    todo: "To Do",
    inprogress: "In Progress",
    review: "In Review",
    done: "Done",

    // Issue types
    story: "Story",
    task: "Task",
    bug: "Bug",

    // Priorities
    highest: "Highest",
    high: "High",
    medium: "Medium",
    low: "Low",

    // Fields
    key: "Key",
    summary: "Summary",
    type: "Type",
    status: "Status",
    priority: "Priority",
    assignee: "Assignee",
    reporter: "Reporter",
    points: "Story points",
    pointsShort: "Pts",
    release: "Release",
    team: "Team",
    labels: "Labels",
    labelsHint: "Comma-separated",
    description: "Description",
    acceptance: "Acceptance criteria",
    updated: "Updated",
    created: "Created",
    unassigned: "Unassigned",
    none: "None",
    assignToMe: "Assign to me",
    descriptionPlaceholder: "Add a description…",
    acceptancePlaceholder: "What has to be true for this to be done?",

    // Sprint header
    daysLeft: "{n} days left",
    dayLeft: "1 day left",
    sprintEnded: "Sprint ended",
    pointsDone: "{done} of {total} points done",
    sprintProgress: "Sprint progress",

    // Toolbar
    search: "Search this board",
    searchLabel: "Search",
    onlyMine: "Only my issues",
    filterBy: "Filter by {name}",
    allTypes: "All types",
    allLabels: "All labels",
    clearFilters: "Clear filters",
    groupBy: "Group by",
    groupNone: "None",
    groupAssignee: "Assignee",
    groupPriority: "Priority",
    groupRelease: "Release",
    view: "View",
    showing: "{n} of {total} issues",
    noRelease: "No release",

    // Board
    create: "Create",
    createIssue: "Create issue",
    createPlaceholder: "What needs to be done?",
    createHint: "Enter to create · Esc to cancel",
    wipLimit: "Max {n}",
    wipOver: "Over the WIP limit of {n}",
    emptyColumn: "No issues",
    noMatches: "No issues match your filters.",
    issues: "{n} issues",
    moveHint: "Drag cards between columns and swimlanes. With a card focused, press Alt+← / Alt+→ to move it.",
    commentsCount: "{n} comments",
    pending: "Pending sync",
    collapse: "Collapse {name}",
    expand: "Expand {name}",

    // Issue detail
    details: "Details",
    comments: "Comments",
    addComment: "Add a comment…",
    save: "Save",
    cancel: "Cancel",
    close: "Close",
    delete: "Delete",
    deleteIssue: "Delete issue",
    confirmDelete: "Delete {id} “{title}”? This can't be undone.",
    noComments: "No comments yet.",
    you: "you",

    // Create modal
    newIssue: "Create issue",
    newIssueSub: "New issues start in To Do.",

    // Presence / activity
    teamActivity: "Team activity",
    presence: "Who's here",
    activity: "Activity",
    online: "Online",
    offline: "Offline",
    typing: "typing…",
    teamOnline: "{n} of {total} online",
    refresh: "Refresh",
    loadMore: "Load more",
    noActivity: "No activity yet.",

    // Sync / status
    loading: "Loading…",
    loadFailed: "Couldn't load issues.",
    retry: "Retry",
    waitingForNetwork: "You're offline. Issues will load when the connection returns.",
    queued: "Queued offline actions: {n}",
    noQueue: "All changes synced",
    offlineHint: "You're offline. Edits, moves and deletes are saved locally and synced when you reconnect.",
    createOffline: "Creating issues needs a connection.",
    savedOffline: "Saved offline. Will sync when you reconnect.",
    syncRetry: "Sync failed. Retrying in {s}s.",
    synced: "Offline changes synced",

    // Toasts
    createdToast: "{id} created",
    deletedToast: "Issue deleted",
    createFailed: "Couldn't create the issue.",
    renameFailed: "The server rejected the new summary. It was rolled back.",
    updateFailed: "Couldn't save the change. It was rolled back.",
    commentFailed: "Couldn't post the comment.",
    deleteFailed: "Delete failed. The issue was restored.",

    // Settings / misc
    theme: "Theme",
    themeToggle: "Switch to {mode} theme",
    dirToggle: "Switch text direction",
    rtl: "Direction",
    resetDemo: "Reset demo data",
    confirmReset: "Reset all issues and activity to the demo data?",
    resetDone: "Demo data restored",
    failed: "Something went wrong in this panel.",
    tryAgain: "Try again",
    notFound: "Page not found.",
    backToBoard: "Back to board",
    dismiss: "Dismiss",
    shortcuts: "Shortcuts: C to create, / to search",
  },
};

/** Looks up a key (falling back to English, then the key itself) and fills {placeholders}. */
export function translate(lang, key, vars) {
  const template = dict[lang]?.[key] ?? dict.en[key] ?? key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (m, name) => (name in vars ? String(vars[name]) : m));
}
