import React from "react";
import { useI18n } from "../../../app/providers/hooks.js";
import { Overlay } from "../../../shared/ui/Overlay.jsx";
import { Button } from "../../../shared/ui/Button.jsx";
import { Icon } from "../../../shared/ui/Icon.jsx";
import { Avatar } from "../../../shared/ui/Avatar.jsx";
import { TypeIcon, PriorityIcon } from "./IssueIcons.jsx";
import { STATUSES, PRIORITIES, TYPES } from "../selectors/tasksSelectors.js";
import { relativeTime } from "../../../shared/lib/visual.js";

/** Single-line input that saves on blur or Enter and reverts on Escape. */
function BlurInput({ value, onSave, className = "input", parse = (v) => v, ...props }) {
  const [draft, setDraft] = React.useState(value ?? "");
  const commit = () => {
    const next = parse(draft);
    if (JSON.stringify(next) !== JSON.stringify(value ?? (typeof next === "string" ? "" : null))) onSave(next);
  };
  return (
    <input
      className={className}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape" && draft !== String(value ?? "")) {
          e.stopPropagation(); // first Escape reverts the edit; the next one closes the dialog
          setDraft(value ?? "");
        }
      }}
      {...props}
    />
  );
}

/** Multi-line field with explicit Save / Cancel once edited. */
function EditableText({ label, value, placeholder, onSave }) {
  const { t } = useI18n();
  const id = React.useId();
  const [draft, setDraft] = React.useState(value ?? "");
  const dirty = draft !== (value ?? "");
  return (
    <div className="editable">
      <label htmlFor={id} className="sectionLabel">{label}</label>
      <textarea
        id={id}
        className="input textarea"
        rows={3}
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && dirty) {
            e.stopPropagation();
            setDraft(value ?? "");
          }
        }}
      />
      {dirty ? (
        <div className="editableBar">
          <Button onClick={() => onSave(draft.trim())}>{t("save")}</Button>
          <Button variant="subtle" onClick={() => setDraft(value ?? "")}>{t("cancel")}</Button>
        </div>
      ) : null}
    </div>
  );
}

function Comments({ task, people, onComment, lang }) {
  const { t } = useI18n();
  const [text, setText] = React.useState("");
  const [now] = React.useState(() => Date.now());
  const me = people.find((p) => p.isMe);
  const comments = task.comments ?? [];

  function submit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    onComment(task.id, text.trim());
    setText("");
  }

  return (
    <section className="comments">
      <h3 className="sectionLabel">{t("comments")}</h3>
      <form className="commentForm" onSubmit={submit}>
        <Avatar person={me} size={30} />
        <div className="commentInput">
          <textarea
            className="input textarea"
            rows={2}
            value={text}
            aria-label={t("addComment")}
            placeholder={t("addComment")}
            onChange={(e) => setText(e.target.value)}
          />
          {text.trim() ? (
            <div className="editableBar">
              <Button type="submit">{t("save")}</Button>
              <Button variant="subtle" onClick={() => setText("")}>{t("cancel")}</Button>
            </div>
          ) : null}
        </div>
      </form>
      {comments.length === 0 ? (
        <p className="muted small">{t("noComments")}</p>
      ) : (
        <ol className="commentList">
          {[...comments].reverse().map((c) => {
            const author = people.find((p) => p.id === c.authorId);
            return (
              <li key={c.id} className="comment">
                <Avatar person={author} size={30} />
                <div>
                  <div className="commentHead">
                    <span className="commentAuthor">{author?.name ?? "—"}</span>
                    <time className="muted small" dateTime={new Date(c.ts).toISOString()}>
                      {relativeTime(c.ts, Math.max(now, c.ts), lang)}
                    </time>
                  </div>
                  <p className="commentText">{c.text}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function Field({ label, children }) {
  return (
    <div className="fieldRow">
      <div className="fieldRowLabel">{label}</div>
      <div className="fieldRowValue">{children}</div>
    </div>
  );
}

/** Issue detail modal: everything is editable in place. */
export function TaskDetails({ task, people, meId, onClose, onUpdate, onComment, onDelete }) {
  const { t, lang } = useI18n();
  const update = (patch) => onUpdate(task.id, patch);
  const reporter = people.find((p) => p.id === task.reporterId);
  const peopleWithMe = people.map((p) => ({ ...p, isMe: p.id === meId }));
  const [now] = React.useState(() => Date.now());

  function handleDelete() {
    if (window.confirm(t("confirmDelete", { id: task.id, title: task.title }))) {
      onDelete(task.id);
      onClose();
    }
  }

  const title = (
    <span className="breadcrumb">
      {task.release ? <span className="breadcrumbPart">{task.release}</span> : null}
      {task.release ? <span className="breadcrumbSep">/</span> : null}
      <TypeIcon type={task.type} />
      <span className="breadcrumbPart breadcrumbKey">{task.id}</span>
    </span>
  );

  return (
    <Overlay
      size="wide"
      focusFirstField={false}
      title={title}
      onClose={onClose}
      closeLabel={t("close")}
      headerExtra={
        <button type="button" className="iconBtn" onClick={handleDelete} aria-label={t("deleteIssue")} title={t("deleteIssue")}>
          <Icon name="trash" />
        </button>
      }
    >
      <div className="detailGrid">
        <div className="detailMain">
          <BlurInput
            key={`title:${task.title}`}
            className="titleInput"
            aria-label={t("summary")}
            value={task.title}
            parse={(v) => v.trim() || task.title}
            onSave={(v) => update({ title: v })}
          />
          {task.pending ? (
            <span className="pendingTag pendingTag--wide">
              <Icon name="clock" size={12} /> {t("pending")}
            </span>
          ) : null}
          <EditableText
            key={`desc:${task.description}`}
            label={t("description")}
            value={task.description}
            placeholder={t("descriptionPlaceholder")}
            onSave={(v) => update({ description: v })}
          />
          <EditableText
            key={`acc:${task.acceptance}`}
            label={t("acceptance")}
            value={task.acceptance}
            placeholder={t("acceptancePlaceholder")}
            onSave={(v) => update({ acceptance: v })}
          />
          <Comments task={task} people={peopleWithMe} onComment={onComment} lang={lang} />
        </div>

        <aside className="detailSide">
          <select
            className={`statusSelect statusSelect--${task.status}`}
            aria-label={t("status")}
            value={task.status}
            onChange={(e) => update({ status: e.target.value })}
          >
            {STATUSES.map((s) => <option key={s} value={s}>{t(s)}</option>)}
          </select>

          <div className="detailBox">
            <div className="detailBoxHead">{t("details")}</div>
            <Field label={t("assignee")}>
              <div className="fieldWithAvatar">
                <Avatar person={people.find((p) => p.id === task.assigneeId)} size={24} label={t("unassigned")} />
                <select
                  className="ghostSelect"
                  aria-label={t("assignee")}
                  value={task.assigneeId ?? ""}
                  onChange={(e) => update({ assigneeId: e.target.value || null })}
                >
                  <option value="">{t("unassigned")}</option>
                  {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              {task.assigneeId !== meId ? (
                <button type="button" className="linkBtn" onClick={() => update({ assigneeId: meId })}>
                  {t("assignToMe")}
                </button>
              ) : null}
            </Field>
            <Field label={t("reporter")}>
              <div className="fieldWithAvatar">
                <Avatar person={reporter} size={24} label={t("none")} />
                <span>{reporter?.name ?? t("none")}</span>
              </div>
            </Field>
            <Field label={t("priority")}>
              <div className="fieldWithAvatar">
                <PriorityIcon priority={task.priority} />
                <select className="ghostSelect" aria-label={t("priority")} value={task.priority} onChange={(e) => update({ priority: e.target.value })}>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{t(p)}</option>)}
                </select>
              </div>
            </Field>
            <Field label={t("type")}>
              <div className="fieldWithAvatar">
                <TypeIcon type={task.type} />
                <select className="ghostSelect" aria-label={t("type")} value={task.type} onChange={(e) => update({ type: e.target.value })}>
                  {TYPES.map((ty) => <option key={ty} value={ty}>{t(ty)}</option>)}
                </select>
              </div>
            </Field>
            <Field label={t("points")}>
              <BlurInput
                key={`pts:${task.points}`}
                className="ghostInput"
                type="number"
                min="0"
                aria-label={t("points")}
                placeholder={t("none")}
                value={task.points ?? ""}
                parse={(v) => (v === "" ? null : Math.max(0, Number(v)))}
                onSave={(v) => update({ points: v })}
              />
            </Field>
            <Field label={t("release")}>
              <BlurInput key={`rel:${task.release}`} className="ghostInput" aria-label={t("release")} placeholder={t("none")} value={task.release} parse={(v) => v.trim()} onSave={(v) => update({ release: v })} />
            </Field>
            <Field label={t("team")}>
              <BlurInput key={`team:${task.team}`} className="ghostInput" aria-label={t("team")} placeholder={t("none")} value={task.team} parse={(v) => v.trim()} onSave={(v) => update({ team: v })} />
            </Field>
            <Field label={t("labels")}>
              <BlurInput
                key={`lbl:${(task.labels || []).join(",")}`}
                className="ghostInput"
                aria-label={t("labels")}
                placeholder={t("none")}
                value={(task.labels || []).join(", ")}
                parse={(v) => v.split(",").map((s) => s.trim()).filter(Boolean)}
                onSave={(v) => update({ labels: v })}
              />
            </Field>
          </div>

          <div className="detailStamps">
            <div>{t("created")} {task.createdAt ? relativeTime(task.createdAt, now, lang) : "—"}</div>
            <div>{t("updated")} {task.updatedAt ? relativeTime(task.updatedAt, Math.max(now, task.updatedAt), lang) : "—"}</div>
          </div>
        </aside>
      </div>
    </Overlay>
  );
}
