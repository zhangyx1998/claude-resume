# claude-resume

Auto-resume a [Claude Code](https://claude.ai/code) session after your quota
resets. List your idle sessions, pick one, and `claude-resume` will keep your
machine awake and relaunch the session at a target time — optionally compacting
it and handing it a fresh prompt.

## Install

```sh
npm install -g @zhangyx1998/claude-resume
```

This installs the `claude-resume` command globally. It shells out to the
`claude` CLI, so make sure Claude Code is installed and on your `PATH`.

## Usage

List resumable (idle, interactive) sessions:

```sh
claude-resume
```

Schedule a resume at a target time (24-hour `HH:MM`):

```sh
claude-resume 15:45 --session abc-123 --prompt "Resume the refactor"
```

If the time has already passed today, it is interpreted as tomorrow. A one
minute buffer is added on top of the target time.

### Options

| Option                 | Description                                            |
| ---------------------- | ------------------------------------------------------ |
| `--session <id\|name>` | Session to resume (id may be a partial match).         |
| `--prompt "..."`       | Prompt to send on resume; omit to read from **stdin**. |
| `--compact`            | Run `/compact` on the session before resuming.         |
| `-h`, `--help`         | Show help.                                             |

When `--prompt` is omitted the tool reads the prompt from stdin, so you can
pipe or type it interactively (press `Ctrl+D` to finish).

## How it works

1. Reads sessions from `claude agents --json --all`.
2. Sleeps until the target time using `caffeinate` (falls back to `sleep`),
   keeping the machine awake.
3. Optionally compacts, then runs `claude --resume <session>` in the session's
   original working directory.

## Development

```sh
npm install
npm run build        # bundle into ./dist via Rollup
npm run build:debug  # unminified build for iterating
npm test             # smoke test (claude-resume --help)
```

The published package is the **contents of `dist/`** — Rollup bundles the CLI
into a single `dist/index.js` and emits a bare `dist/package.json`, so the
release is a self-contained folder with no runtime dependencies.

## License

[MIT](./LICENSE) © Yuxuan Zhang
