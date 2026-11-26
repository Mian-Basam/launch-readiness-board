import React from "react";
import { Input } from "../../../shared/ui/Input.jsx";
import { Button } from "../../../shared/ui/Button.jsx";
import { Overlay } from "../../../shared/ui/Overlay.jsx";
import { useI18n } from "../../../app/providers/hooks.js";
import { TYPES, PRIORITIES } from "../selectors/tasksSelectors.js";

function SelectField({ label, value, onChange, children }) {
  const id = React.useId();
  return (
    <div className="field">
      <label className="fieldLabel" htmlFor={id}>{label}</label>
      <select id={id} className="input select" value={value} onChange={(e) => onChange(e.target.value)}>
        {children}
      </select>
    </div>
  );
}

/** "Create issue" modal. */
export function TaskComposer({ onCreate, isCreating, isOnline, onClose, people, defaultRelease, facets }) {
  const { t } = useI18n();
  const descId = React.useId();
  const [draft, setDraft] = React.useState({
    type: "task",
    title: "",
    description: "",
    assigneeId: "",
    priority: "medium",
    points: "",
    release: defaultRelease ?? "",
    team: "",
    labels: "",
  });
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const canSubmit = isOnline && !isCreating && draft.title.trim();

  function onSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    onCreate(
      {
        type: draft.type,
        title: draft.title.trim(),
        description: draft.description.trim(),
        assigneeId: draft.assigneeId || null,
        priority: draft.priority,
        points: draft.points === "" ? null : Math.max(0, Number(draft.points)),
        release: draft.release.trim(),
        team: draft.team.trim(),
        labels: draft.labels.split(",").map((s) => s.trim()).filter(Boolean),
        status: "todo",
      },
      { onSuccess: onClose }
    );
  }

  return (
    <Overlay title={t("newIssue")} subtitle={t("newIssueSub")} onClose={onClose} closeLabel={t("close")}>
      <form onSubmit={onSubmit} className="composer">
        <div className="composerGrid">
          <SelectField label={t("type")} value={draft.type} onChange={(v) => set({ type: v })}>
            {TYPES.map((ty) => <option key={ty} value={ty}>{t(ty)}</option>)}
          </SelectField>
          <SelectField label={t("priority")} value={draft.priority} onChange={(v) => set({ priority: v })}>
            {PRIORITIES.map((p) => <option key={p} value={p}>{t(p)}</option>)}
          </SelectField>
          <div className="spanAll">
            <Input label={t("summary")} required value={draft.title} onChange={(e) => set({ title: e.target.value })} placeholder={t("createPlaceholder")} />
          </div>
          <div className="field spanAll">
            <label className="fieldLabel" htmlFor={descId}>{t("description")}</label>
            <textarea id={descId} className="input textarea" rows={3} value={draft.description} onChange={(e) => set({ description: e.target.value })} placeholder={t("descriptionPlaceholder")} />
          </div>
          <SelectField label={t("assignee")} value={draft.assigneeId} onChange={(v) => set({ assigneeId: v })}>
            <option value="">{t("unassigned")}</option>
            {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </SelectField>
          <Input label={t("points")} type="number" min="0" value={draft.points} onChange={(e) => set({ points: e.target.value })} />
          <Input label={t("release")} value={draft.release} onChange={(e) => set({ release: e.target.value })} list="release-options" />
          <Input label={t("team")} value={draft.team} onChange={(e) => set({ team: e.target.value })} list="team-options" />
          <div className="spanAll">
            <Input label={t("labels")} hint={t("labelsHint")} value={draft.labels} onChange={(e) => set({ labels: e.target.value })} placeholder="launch, docs" />
          </div>
        </div>
        <datalist id="release-options">{facets.releases.map((r) => <option key={r} value={r} />)}</datalist>
        <datalist id="team-options">{facets.teams.map((r) => <option key={r} value={r} />)}</datalist>

        {!isOnline ? <p className="hint">{t("createOffline")}</p> : null}

        <div className="modalFoot">
          <Button variant="subtle" onClick={onClose}>{t("cancel")}</Button>
          <Button type="submit" disabled={!canSubmit}>{isCreating ? "…" : t("create")}</Button>
        </div>
      </form>
    </Overlay>
  );
}
