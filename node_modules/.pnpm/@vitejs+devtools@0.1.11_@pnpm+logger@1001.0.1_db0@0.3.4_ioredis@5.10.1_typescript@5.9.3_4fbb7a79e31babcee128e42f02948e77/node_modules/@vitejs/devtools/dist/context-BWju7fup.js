import { i as __exportAll, n as ansis_default, r as __commonJSMin, t as MARK_INFO } from "./constants-DfEeYo9W.js";
import { n as createStorage, t as getInternalContext } from "./context-internal-DZpoJjMz.js";
import { a as setPendingAuth, i as refreshTempAuthToken, r as getTempAuthToken, t as abortPendingAuth } from "./auth-state-DXCxEqSd.js";
import { t as isObject } from "./utils-HWI9S6d-.js";
import { createDebug } from "obug";
import { debounce } from "perfect-debounce";
import { toDataURL } from "mlly";
import { createEventEmitter } from "@vitejs/devtools-kit/utils/events";
import { DEFAULT_STATE_USER_SETTINGS } from "@vitejs/devtools-kit/constants";
import { join } from "pathe";
import { existsSync } from "node:fs";
import { createSharedState } from "@vitejs/devtools-kit/utils/shared-state";
import { RpcFunctionsCollectorBase } from "@vitejs/devtools-rpc";
import { nanoid } from "@vitejs/devtools-kit/utils/nanoid";
import process$1, { stdin, stdout } from "node:process";
import sirv from "sirv";
import { stripVTControlCharacters, styleText } from "node:util";
import "node:readline";
import ot from "node:readline";
import "node:tty";
import "node:path";
import { defineRpcFunction } from "@vitejs/devtools-kit";
//#region src/node/context-utils.ts
const ContextUtils = { createSimpleClientScript(fn) {
	return {
		importFrom: toDataURL(`const fn = ${fn.toString()}; export default fn`),
		importName: "default"
	};
} };
//#endregion
//#region src/node/host-commands.ts
var DevToolsCommandsHost = class {
	commands = /* @__PURE__ */ new Map();
	events = createEventEmitter();
	constructor(context) {
		this.context = context;
	}
	register(command) {
		if (this.commands.has(command.id)) throw new Error(`Command "${command.id}" is already registered`);
		this.commands.set(command.id, command);
		this.events.emit("command:registered", this.toSerializable(command));
		return {
			id: command.id,
			update: (patch) => {
				if ("id" in patch) throw new Error(`Cannot change the id of a command. Use register() to add new commands.`);
				const existing = this.commands.get(command.id);
				if (!existing) throw new Error(`Command "${command.id}" is not registered`);
				Object.assign(existing, patch);
				this.events.emit("command:registered", this.toSerializable(existing));
			},
			unregister: () => this.unregister(command.id)
		};
	}
	unregister(id) {
		const deleted = this.commands.delete(id);
		if (deleted) this.events.emit("command:unregistered", id);
		return deleted;
	}
	async execute(id, ...args) {
		const found = this.findCommand(id);
		if (!found) throw new Error(`Command "${id}" is not registered`);
		if (!found.handler) throw new Error(`Command "${id}" has no handler (group-only command)`);
		return found.handler(...args);
	}
	list() {
		return Array.from(this.commands.values()).map((cmd) => this.toSerializable(cmd));
	}
	findCommand(id) {
		const topLevel = this.commands.get(id);
		if (topLevel) return topLevel;
		for (const cmd of this.commands.values()) if (cmd.children) {
			const child = cmd.children.find((c) => c.id === id);
			if (child) return child;
		}
	}
	toSerializable(cmd) {
		const { handler: _, children, ...rest } = cmd;
		return {
			...rest,
			source: "server",
			...children ? { children: children.map((c) => this.toSerializable(c)) } : {}
		};
	}
};
//#endregion
//#region src/node/host-docks.ts
var DevToolsDockHost = class {
	views = /* @__PURE__ */ new Map();
	events = createEventEmitter();
	userSettings = void 0;
	constructor(context) {
		this.context = context;
	}
	async init() {
		this.userSettings = await this.context.rpc.sharedState.get("devtoolskit:internal:user-settings", { sharedState: createStorage({
			filepath: join(this.context.workspaceRoot, "node_modules/.vite/devtools/settings.json"),
			initialValue: DEFAULT_STATE_USER_SETTINGS()
		}) });
	}
	values({ includeBuiltin = true } = {}) {
		const context = this.context;
		const builtinDocksEntries = [
			{
				type: "~builtin",
				id: "~terminals",
				title: "Terminals",
				icon: "ph:terminal-duotone",
				category: "~builtin",
				get when() {
					return context.terminals.sessions.size === 0 ? "false" : void 0;
				}
			},
			{
				type: "~builtin",
				id: "~logs",
				title: "Logs & Notifications",
				icon: "ph:notification-duotone",
				category: "~builtin",
				get badge() {
					const size = context.logs.entries.size;
					return size > 0 ? String(size) : void 0;
				}
			},
			{
				type: "~builtin",
				id: "~settings",
				title: "Settings",
				category: "~builtin",
				icon: "ph:gear-duotone"
			}
		];
		return [...Array.from(this.views.values()), ...includeBuiltin ? builtinDocksEntries : []];
	}
	register(view, force) {
		if (this.views.has(view.id) && !force) throw new Error(`Dock with id "${view.id}" is already registered`);
		this.views.set(view.id, view);
		this.events.emit("dock:entry:updated", view);
		return { update: (patch) => {
			if (patch.id && patch.id !== view.id) throw new Error(`Cannot change the id of a dock. Use register() to add new docks.`);
			this.update(Object.assign(this.views.get(view.id), patch));
		} };
	}
	update(view) {
		if (!this.views.has(view.id)) throw new Error(`Dock with id "${view.id}" is not registered. Use register() to add new docks.`);
		this.views.set(view.id, view);
		this.events.emit("dock:entry:updated", view);
	}
};
//#endregion
//#region src/node/rpc-shared-state.ts
const debug$1 = createDebug("vite:devtools:rpc:state:changed");
function createRpcSharedStateServerHost(rpc) {
	const sharedState = /* @__PURE__ */ new Map();
	function registerSharedState(key, state) {
		const offs = [];
		offs.push(state.on("updated", (fullState, patches, syncId) => {
			if (patches) {
				debug$1("patch", {
					key,
					syncId
				});
				rpc.broadcast({
					method: "devtoolskit:internal:rpc:client-state:patch",
					args: [
						key,
						patches,
						syncId
					],
					filter: (client) => client.$meta.subscribedStates.has(key)
				});
			} else {
				debug$1("updated", {
					key,
					syncId
				});
				rpc.broadcast({
					method: "devtoolskit:internal:rpc:client-state:updated",
					args: [
						key,
						fullState,
						syncId
					],
					filter: (client) => client.$meta.subscribedStates.has(key)
				});
			}
		}));
		return () => {
			for (const off of offs) off();
		};
	}
	return {
		get: async (key, options) => {
			if (sharedState.has(key)) return sharedState.get(key);
			if (options?.initialValue === void 0 && options?.sharedState === void 0) throw new Error(`Shared state of "${key}" is not found, please provide an initial value for the first time`);
			debug$1("new-state", key);
			const state = options.sharedState ?? createSharedState({
				initialValue: options.initialValue,
				enablePatches: false
			});
			registerSharedState(key, state);
			sharedState.set(key, state);
			return state;
		},
		keys() {
			return Array.from(sharedState.keys());
		}
	};
}
//#endregion
//#region src/node/host-functions.ts
const debugBroadcast = createDebug("vite:devtools:rpc:broadcast");
var RpcFunctionsHost = class extends RpcFunctionsCollectorBase {
	/**
	* @internal
	*/
	_rpcGroup = void 0;
	_asyncStorage = void 0;
	constructor(context) {
		super(context);
		this.sharedState = createRpcSharedStateServerHost(this);
	}
	sharedState;
	async invokeLocal(method, ...args) {
		if (!this.definitions.has(method)) throw new Error(`RPC function "${String(method)}" is not registered`);
		const handler = await this.getHandler(method);
		return await Promise.resolve(handler(...args));
	}
	async broadcast(options) {
		if (!this._rpcGroup) return;
		debugBroadcast(JSON.stringify(options.method));
		await Promise.all(this._rpcGroup.clients.map((client) => {
			if (options.filter?.(client) === false) return void 0;
			return client.$callRaw({
				optional: true,
				event: true,
				...options
			});
		}));
	}
	getCurrentRpcSession() {
		if (!this._asyncStorage) throw new Error("RpcFunctionsHost] AsyncLocalStorage is not set, it likely to be an internal bug of Vite DevTools");
		return this._asyncStorage.getStore();
	}
};
//#endregion
//#region src/node/host-logs.ts
const MAX_ENTRIES = 1e3;
var DevToolsLogsHost = class {
	entries = /* @__PURE__ */ new Map();
	events = createEventEmitter();
	/** Tracks when each entry was last added or updated (monotonic) */
	lastModified = /* @__PURE__ */ new Map();
	/** Tracks recently removed entry IDs with their removal time */
	removals = [];
	_autoDeleteTimers = /* @__PURE__ */ new Map();
	_clock = 0;
	_tick() {
		return ++this._clock;
	}
	constructor(context) {
		this.context = context;
	}
	async add(input) {
		if (input.id && this.entries.has(input.id)) {
			await this.update(input.id, input);
			return this._createHandle(input.id);
		}
		const entry = {
			...input,
			id: input.id ?? nanoid(),
			timestamp: input.timestamp ?? Date.now(),
			from: input.from ?? "server"
		};
		if (this.entries.size >= MAX_ENTRIES) {
			const oldest = this.entries.keys().next().value;
			await this.remove(oldest);
		}
		this.entries.set(entry.id, entry);
		this.lastModified.set(entry.id, this._tick());
		this.events.emit("log:added", entry);
		if (entry.autoDelete) this._autoDeleteTimers.set(entry.id, setTimeout(() => {
			this.remove(entry.id);
		}, entry.autoDelete));
		return this._createHandle(entry.id);
	}
	async update(id, patch) {
		const existing = this.entries.get(id);
		if (!existing) return void 0;
		const updated = {
			...existing,
			...patch,
			id: existing.id,
			from: existing.from,
			timestamp: existing.timestamp
		};
		this.entries.set(id, updated);
		this.lastModified.set(id, this._tick());
		this.events.emit("log:updated", updated);
		if (patch.autoDelete !== void 0) {
			const timer = this._autoDeleteTimers.get(id);
			if (timer) {
				clearTimeout(timer);
				this._autoDeleteTimers.delete(id);
			}
			if (patch.autoDelete) this._autoDeleteTimers.set(id, setTimeout(() => {
				this.remove(id);
			}, patch.autoDelete));
		}
		return updated;
	}
	async remove(id) {
		const timer = this._autoDeleteTimers.get(id);
		if (timer) {
			clearTimeout(timer);
			this._autoDeleteTimers.delete(id);
		}
		this.entries.delete(id);
		this.lastModified.delete(id);
		this.removals.push({
			id,
			time: this._tick()
		});
		this.events.emit("log:removed", id);
	}
	async clear() {
		for (const timer of this._autoDeleteTimers.values()) clearTimeout(timer);
		this._autoDeleteTimers.clear();
		const tick = this._tick();
		for (const id of this.entries.keys()) this.removals.push({
			id,
			time: tick
		});
		this.entries.clear();
		this.lastModified.clear();
		this.events.emit("log:cleared");
	}
	_createHandle(id) {
		const host = this;
		return {
			get entry() {
				return host.entries.get(id);
			},
			get id() {
				return id;
			},
			update: (patch) => host.update(id, patch),
			dismiss: () => host.remove(id)
		};
	}
};
//#endregion
//#region src/node/host-terminals.ts
var DevToolsTerminalHost = class {
	sessions = /* @__PURE__ */ new Map();
	events = createEventEmitter();
	_boundStreams = /* @__PURE__ */ new Map();
	constructor(context) {
		this.context = context;
	}
	register(session) {
		if (this.sessions.has(session.id)) throw new Error(`Terminal session with id "${session.id}" already registered`);
		this.sessions.set(session.id, session);
		this.bindStream(session);
		this.events.emit("terminal:session:updated", session);
		return session;
	}
	update(patch) {
		if (!this.sessions.has(patch.id)) throw new Error(`Terminal session with id "${patch.id}" not registered`);
		const session = this.sessions.get(patch.id);
		Object.assign(session, patch);
		this.sessions.set(patch.id, session);
		this.bindStream(session);
		this.events.emit("terminal:session:updated", session);
	}
	remove(session) {
		this._boundStreams.get(session.id)?.dispose();
		this.sessions.delete(session.id);
		this.events.emit("terminal:session:updated", session);
		this._boundStreams.delete(session.id);
	}
	bindStream(session) {
		if (this._boundStreams.has(session.id) && this._boundStreams.get(session.id)?.stream === session.stream) return;
		this._boundStreams.get(session.id)?.dispose();
		this._boundStreams.delete(session.id);
		if (!session.stream) return;
		session.buffer ||= [];
		const events = this.events;
		const writer = new WritableStream({ write(chunk) {
			session.buffer.push(chunk);
			events.emit("terminal:session:stream-chunk", {
				id: session.id,
				chunks: [chunk],
				ts: Date.now()
			});
		} });
		session.stream.pipeTo(writer);
		this._boundStreams.set(session.id, {
			dispose: () => {
				writer.close();
			},
			stream: session.stream
		});
	}
	async startChildProcess(executeOptions, terminal) {
		if (this.sessions.has(terminal.id)) throw new Error(`Terminal session with id "${terminal.id}" already registered`);
		const { exec } = await import("tinyexec");
		let controller;
		const stream = new ReadableStream({ start(_controller) {
			controller = _controller;
		} });
		function createChildProcess() {
			const cp = exec(executeOptions.command, executeOptions.args || [], { nodeOptions: {
				env: {
					COLORS: "true",
					FORCE_COLOR: "true",
					...executeOptions.env || {}
				},
				cwd: executeOptions.cwd ?? process$1.cwd(),
				stdio: "pipe"
			} });
			(async () => {
				for await (const chunk of cp) controller?.enqueue(chunk);
			})();
			return cp;
		}
		let cp = createChildProcess();
		const restart = async () => {
			cp?.kill();
			cp = createChildProcess();
		};
		const terminate = async () => {
			cp?.kill();
			cp = void 0;
		};
		const session = {
			...terminal,
			status: "running",
			stream,
			type: "child-process",
			executeOptions,
			getChildProcess: () => cp?.process,
			terminate,
			restart
		};
		this.register(session);
		return Promise.resolve(session);
	}
};
//#endregion
//#region src/node/host-views.ts
var DevToolsViewHost = class {
	/**
	* @internal
	*/
	buildStaticDirs = [];
	constructor(context) {
		this.context = context;
	}
	hostStatic(baseUrl, distDir) {
		if (!existsSync(distDir)) throw new Error(`[Vite DevTools] distDir ${distDir} does not exist`);
		this.buildStaticDirs.push({
			baseUrl,
			distDir
		});
		if (this.context.viteConfig.command === "serve") {
			if (!this.context.viteServer) throw new Error("[Vite DevTools] viteServer is required in dev mode");
			this.context.viteServer.middlewares.use(baseUrl, sirv(distDir, {
				dev: true,
				single: true
			}));
		}
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@clack+core@1.1.0/node_modules/@clack/core/dist/index.mjs
var import_src = (/* @__PURE__ */ __commonJSMin(((exports, module) => {
	const ESC = "\x1B";
	const CSI = `${ESC}[`;
	const beep = "\x07";
	const cursor = {
		to(x, y) {
			if (!y) return `${CSI}${x + 1}G`;
			return `${CSI}${y + 1};${x + 1}H`;
		},
		move(x, y) {
			let ret = "";
			if (x < 0) ret += `${CSI}${-x}D`;
			else if (x > 0) ret += `${CSI}${x}C`;
			if (y < 0) ret += `${CSI}${-y}A`;
			else if (y > 0) ret += `${CSI}${y}B`;
			return ret;
		},
		up: (count = 1) => `${CSI}${count}A`,
		down: (count = 1) => `${CSI}${count}B`,
		forward: (count = 1) => `${CSI}${count}C`,
		backward: (count = 1) => `${CSI}${count}D`,
		nextLine: (count = 1) => `${CSI}E`.repeat(count),
		prevLine: (count = 1) => `${CSI}F`.repeat(count),
		left: `${CSI}G`,
		hide: `${CSI}?25l`,
		show: `${CSI}?25h`,
		save: `${ESC}7`,
		restore: `${ESC}8`
	};
	module.exports = {
		cursor,
		scroll: {
			up: (count = 1) => `${CSI}S`.repeat(count),
			down: (count = 1) => `${CSI}T`.repeat(count)
		},
		erase: {
			screen: `${CSI}2J`,
			up: (count = 1) => `${CSI}1J`.repeat(count),
			down: (count = 1) => `${CSI}J`.repeat(count),
			line: `${CSI}2K`,
			lineEnd: `${CSI}K`,
			lineStart: `${CSI}1K`,
			lines(count) {
				let clear = "";
				for (let i = 0; i < count; i++) clear += this.line + (i < count - 1 ? cursor.up() : "");
				if (count) clear += cursor.left;
				return clear;
			}
		},
		beep
	};
})))();
function x$1(t, e, s) {
	if (!s.some((u) => !u.disabled)) return t;
	const i = t + e, r = Math.max(s.length - 1, 0), n = i < 0 ? r : i > r ? 0 : i;
	return s[n].disabled ? x$1(n, e < 0 ? -1 : 1, s) : n;
}
const at = (t) => t === 161 || t === 164 || t === 167 || t === 168 || t === 170 || t === 173 || t === 174 || t >= 176 && t <= 180 || t >= 182 && t <= 186 || t >= 188 && t <= 191 || t === 198 || t === 208 || t === 215 || t === 216 || t >= 222 && t <= 225 || t === 230 || t >= 232 && t <= 234 || t === 236 || t === 237 || t === 240 || t === 242 || t === 243 || t >= 247 && t <= 250 || t === 252 || t === 254 || t === 257 || t === 273 || t === 275 || t === 283 || t === 294 || t === 295 || t === 299 || t >= 305 && t <= 307 || t === 312 || t >= 319 && t <= 322 || t === 324 || t >= 328 && t <= 331 || t === 333 || t === 338 || t === 339 || t === 358 || t === 359 || t === 363 || t === 462 || t === 464 || t === 466 || t === 468 || t === 470 || t === 472 || t === 474 || t === 476 || t === 593 || t === 609 || t === 708 || t === 711 || t >= 713 && t <= 715 || t === 717 || t === 720 || t >= 728 && t <= 731 || t === 733 || t === 735 || t >= 768 && t <= 879 || t >= 913 && t <= 929 || t >= 931 && t <= 937 || t >= 945 && t <= 961 || t >= 963 && t <= 969 || t === 1025 || t >= 1040 && t <= 1103 || t === 1105 || t === 8208 || t >= 8211 && t <= 8214 || t === 8216 || t === 8217 || t === 8220 || t === 8221 || t >= 8224 && t <= 8226 || t >= 8228 && t <= 8231 || t === 8240 || t === 8242 || t === 8243 || t === 8245 || t === 8251 || t === 8254 || t === 8308 || t === 8319 || t >= 8321 && t <= 8324 || t === 8364 || t === 8451 || t === 8453 || t === 8457 || t === 8467 || t === 8470 || t === 8481 || t === 8482 || t === 8486 || t === 8491 || t === 8531 || t === 8532 || t >= 8539 && t <= 8542 || t >= 8544 && t <= 8555 || t >= 8560 && t <= 8569 || t === 8585 || t >= 8592 && t <= 8601 || t === 8632 || t === 8633 || t === 8658 || t === 8660 || t === 8679 || t === 8704 || t === 8706 || t === 8707 || t === 8711 || t === 8712 || t === 8715 || t === 8719 || t === 8721 || t === 8725 || t === 8730 || t >= 8733 && t <= 8736 || t === 8739 || t === 8741 || t >= 8743 && t <= 8748 || t === 8750 || t >= 8756 && t <= 8759 || t === 8764 || t === 8765 || t === 8776 || t === 8780 || t === 8786 || t === 8800 || t === 8801 || t >= 8804 && t <= 8807 || t === 8810 || t === 8811 || t === 8814 || t === 8815 || t === 8834 || t === 8835 || t === 8838 || t === 8839 || t === 8853 || t === 8857 || t === 8869 || t === 8895 || t === 8978 || t >= 9312 && t <= 9449 || t >= 9451 && t <= 9547 || t >= 9552 && t <= 9587 || t >= 9600 && t <= 9615 || t >= 9618 && t <= 9621 || t === 9632 || t === 9633 || t >= 9635 && t <= 9641 || t === 9650 || t === 9651 || t === 9654 || t === 9655 || t === 9660 || t === 9661 || t === 9664 || t === 9665 || t >= 9670 && t <= 9672 || t === 9675 || t >= 9678 && t <= 9681 || t >= 9698 && t <= 9701 || t === 9711 || t === 9733 || t === 9734 || t === 9737 || t === 9742 || t === 9743 || t === 9756 || t === 9758 || t === 9792 || t === 9794 || t === 9824 || t === 9825 || t >= 9827 && t <= 9829 || t >= 9831 && t <= 9834 || t === 9836 || t === 9837 || t === 9839 || t === 9886 || t === 9887 || t === 9919 || t >= 9926 && t <= 9933 || t >= 9935 && t <= 9939 || t >= 9941 && t <= 9953 || t === 9955 || t === 9960 || t === 9961 || t >= 9963 && t <= 9969 || t === 9972 || t >= 9974 && t <= 9977 || t === 9979 || t === 9980 || t === 9982 || t === 9983 || t === 10045 || t >= 10102 && t <= 10111 || t >= 11094 && t <= 11097 || t >= 12872 && t <= 12879 || t >= 57344 && t <= 63743 || t >= 65024 && t <= 65039 || t === 65533 || t >= 127232 && t <= 127242 || t >= 127248 && t <= 127277 || t >= 127280 && t <= 127337 || t >= 127344 && t <= 127373 || t === 127375 || t === 127376 || t >= 127387 && t <= 127404 || t >= 917760 && t <= 917999 || t >= 983040 && t <= 1048573 || t >= 1048576 && t <= 1114109, lt = (t) => t === 12288 || t >= 65281 && t <= 65376 || t >= 65504 && t <= 65510, ht = (t) => t >= 4352 && t <= 4447 || t === 8986 || t === 8987 || t === 9001 || t === 9002 || t >= 9193 && t <= 9196 || t === 9200 || t === 9203 || t === 9725 || t === 9726 || t === 9748 || t === 9749 || t >= 9800 && t <= 9811 || t === 9855 || t === 9875 || t === 9889 || t === 9898 || t === 9899 || t === 9917 || t === 9918 || t === 9924 || t === 9925 || t === 9934 || t === 9940 || t === 9962 || t === 9970 || t === 9971 || t === 9973 || t === 9978 || t === 9981 || t === 9989 || t === 9994 || t === 9995 || t === 10024 || t === 10060 || t === 10062 || t >= 10067 && t <= 10069 || t === 10071 || t >= 10133 && t <= 10135 || t === 10160 || t === 10175 || t === 11035 || t === 11036 || t === 11088 || t === 11093 || t >= 11904 && t <= 11929 || t >= 11931 && t <= 12019 || t >= 12032 && t <= 12245 || t >= 12272 && t <= 12287 || t >= 12289 && t <= 12350 || t >= 12353 && t <= 12438 || t >= 12441 && t <= 12543 || t >= 12549 && t <= 12591 || t >= 12593 && t <= 12686 || t >= 12688 && t <= 12771 || t >= 12783 && t <= 12830 || t >= 12832 && t <= 12871 || t >= 12880 && t <= 19903 || t >= 19968 && t <= 42124 || t >= 42128 && t <= 42182 || t >= 43360 && t <= 43388 || t >= 44032 && t <= 55203 || t >= 63744 && t <= 64255 || t >= 65040 && t <= 65049 || t >= 65072 && t <= 65106 || t >= 65108 && t <= 65126 || t >= 65128 && t <= 65131 || t >= 94176 && t <= 94180 || t === 94192 || t === 94193 || t >= 94208 && t <= 100343 || t >= 100352 && t <= 101589 || t >= 101632 && t <= 101640 || t >= 110576 && t <= 110579 || t >= 110581 && t <= 110587 || t === 110589 || t === 110590 || t >= 110592 && t <= 110882 || t === 110898 || t >= 110928 && t <= 110930 || t === 110933 || t >= 110948 && t <= 110951 || t >= 110960 && t <= 111355 || t === 126980 || t === 127183 || t === 127374 || t >= 127377 && t <= 127386 || t >= 127488 && t <= 127490 || t >= 127504 && t <= 127547 || t >= 127552 && t <= 127560 || t === 127568 || t === 127569 || t >= 127584 && t <= 127589 || t >= 127744 && t <= 127776 || t >= 127789 && t <= 127797 || t >= 127799 && t <= 127868 || t >= 127870 && t <= 127891 || t >= 127904 && t <= 127946 || t >= 127951 && t <= 127955 || t >= 127968 && t <= 127984 || t === 127988 || t >= 127992 && t <= 128062 || t === 128064 || t >= 128066 && t <= 128252 || t >= 128255 && t <= 128317 || t >= 128331 && t <= 128334 || t >= 128336 && t <= 128359 || t === 128378 || t === 128405 || t === 128406 || t === 128420 || t >= 128507 && t <= 128591 || t >= 128640 && t <= 128709 || t === 128716 || t >= 128720 && t <= 128722 || t >= 128725 && t <= 128727 || t >= 128732 && t <= 128735 || t === 128747 || t === 128748 || t >= 128756 && t <= 128764 || t >= 128992 && t <= 129003 || t === 129008 || t >= 129292 && t <= 129338 || t >= 129340 && t <= 129349 || t >= 129351 && t <= 129535 || t >= 129648 && t <= 129660 || t >= 129664 && t <= 129672 || t >= 129680 && t <= 129725 || t >= 129727 && t <= 129733 || t >= 129742 && t <= 129755 || t >= 129760 && t <= 129768 || t >= 129776 && t <= 129784 || t >= 131072 && t <= 196605 || t >= 196608 && t <= 262141, O = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/y, y = /[\x00-\x08\x0A-\x1F\x7F-\x9F]{1,1000}/y, L = /\t{1,1000}/y, P = /[\u{1F1E6}-\u{1F1FF}]{2}|\u{1F3F4}[\u{E0061}-\u{E007A}]{2}[\u{E0030}-\u{E0039}\u{E0061}-\u{E007A}]{1,3}\u{E007F}|(?:\p{Emoji}\uFE0F\u20E3?|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation})(?:\u200D(?:\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation}|\p{Emoji}\uFE0F\u20E3?))*/uy, M = /(?:[\x20-\x7E\xA0-\xFF](?!\uFE0F)){1,1000}/y, ct = /\p{M}+/gu, ft$1 = {
	limit: Infinity,
	ellipsis: ""
}, X$1 = (t, e = {}, s = {}) => {
	const i = e.limit ?? Infinity, r = e.ellipsis ?? "", n = e?.ellipsisWidth ?? (r ? X$1(r, ft$1, s).width : 0), u = s.ansiWidth ?? 0, a = s.controlWidth ?? 0, l = s.tabWidth ?? 8, E = s.ambiguousWidth ?? 1, g = s.emojiWidth ?? 2, m = s.fullWidthWidth ?? 2, A = s.regularWidth ?? 1, V = s.wideWidth ?? 2;
	let h = 0, o = 0, p = t.length, v = 0, F = !1, d = p, b = Math.max(0, i - n), C = 0, w = 0, c = 0, f = 0;
	t: for (;;) {
		if (w > C || o >= p && o > h) {
			const ut = t.slice(C, w) || t.slice(h, o);
			v = 0;
			for (const Y of ut.replaceAll(ct, "")) {
				const $ = Y.codePointAt(0) || 0;
				if (lt($) ? f = m : ht($) ? f = V : E !== A && at($) ? f = E : f = A, c + f > b && (d = Math.min(d, Math.max(C, h) + v)), c + f > i) {
					F = !0;
					break t;
				}
				v += Y.length, c += f;
			}
			C = w = 0;
		}
		if (o >= p) break;
		if (M.lastIndex = o, M.test(t)) {
			if (v = M.lastIndex - o, f = v * A, c + f > b && (d = Math.min(d, o + Math.floor((b - c) / A))), c + f > i) {
				F = !0;
				break;
			}
			c += f, C = h, w = o, o = h = M.lastIndex;
			continue;
		}
		if (O.lastIndex = o, O.test(t)) {
			if (c + u > b && (d = Math.min(d, o)), c + u > i) {
				F = !0;
				break;
			}
			c += u, C = h, w = o, o = h = O.lastIndex;
			continue;
		}
		if (y.lastIndex = o, y.test(t)) {
			if (v = y.lastIndex - o, f = v * a, c + f > b && (d = Math.min(d, o + Math.floor((b - c) / a))), c + f > i) {
				F = !0;
				break;
			}
			c += f, C = h, w = o, o = h = y.lastIndex;
			continue;
		}
		if (L.lastIndex = o, L.test(t)) {
			if (v = L.lastIndex - o, f = v * l, c + f > b && (d = Math.min(d, o + Math.floor((b - c) / l))), c + f > i) {
				F = !0;
				break;
			}
			c += f, C = h, w = o, o = h = L.lastIndex;
			continue;
		}
		if (P.lastIndex = o, P.test(t)) {
			if (c + g > b && (d = Math.min(d, o)), c + g > i) {
				F = !0;
				break;
			}
			c += g, C = h, w = o, o = h = P.lastIndex;
			continue;
		}
		o += 1;
	}
	return {
		width: F ? b : c,
		index: F ? d : p,
		truncated: F,
		ellipsed: F && i >= n
	};
}, pt$1 = {
	limit: Infinity,
	ellipsis: "",
	ellipsisWidth: 0
}, S = (t, e = {}) => X$1(t, pt$1, e).width, T = "\x1B", Z = "", Ft$1 = 39, j = "\x07", Q$1 = "[", dt = "]", tt = "m", U$1 = `${dt}8;;`, et = new RegExp(`(?:\\${Q$1}(?<code>\\d+)m|\\${U$1}(?<uri>.*)${j})`, "y"), mt$1 = (t) => {
	if (t >= 30 && t <= 37 || t >= 90 && t <= 97) return 39;
	if (t >= 40 && t <= 47 || t >= 100 && t <= 107) return 49;
	if (t === 1 || t === 2) return 22;
	if (t === 3) return 23;
	if (t === 4) return 24;
	if (t === 7) return 27;
	if (t === 8) return 28;
	if (t === 9) return 29;
	if (t === 0) return 0;
}, st = (t) => `${T}${Q$1}${t}${tt}`, it = (t) => `${T}${U$1}${t}${j}`, gt$1 = (t) => t.map((e) => S(e)), G = (t, e, s) => {
	const i = e[Symbol.iterator]();
	let r = !1, n = !1, u = t.at(-1), a = u === void 0 ? 0 : S(u), l = i.next(), E = i.next(), g = 0;
	for (; !l.done;) {
		const m = l.value, A = S(m);
		a + A <= s ? t[t.length - 1] += m : (t.push(m), a = 0), (m === T || m === Z) && (r = !0, n = e.startsWith(U$1, g + 1)), r ? n ? m === j && (r = !1, n = !1) : m === tt && (r = !1) : (a += A, a === s && !E.done && (t.push(""), a = 0)), l = E, E = i.next(), g += m.length;
	}
	u = t.at(-1), !a && u !== void 0 && u.length > 0 && t.length > 1 && (t[t.length - 2] += t.pop());
}, vt$1 = (t) => {
	const e = t.split(" ");
	let s = e.length;
	for (; s > 0 && !(S(e[s - 1]) > 0);) s--;
	return s === e.length ? t : e.slice(0, s).join(" ") + e.slice(s).join("");
}, Et$1 = (t, e, s = {}) => {
	if (s.trim !== !1 && t.trim() === "") return "";
	let i = "", r, n;
	const u = t.split(" "), a = gt$1(u);
	let l = [""];
	for (const [h, o] of u.entries()) {
		s.trim !== !1 && (l[l.length - 1] = (l.at(-1) ?? "").trimStart());
		let p = S(l.at(-1) ?? "");
		if (h !== 0 && (p >= e && (s.wordWrap === !1 || s.trim === !1) && (l.push(""), p = 0), (p > 0 || s.trim === !1) && (l[l.length - 1] += " ", p++)), s.hard && a[h] > e) {
			const v = e - p, F = 1 + Math.floor((a[h] - v - 1) / e);
			Math.floor((a[h] - 1) / e) < F && l.push(""), G(l, o, e);
			continue;
		}
		if (p + a[h] > e && p > 0 && a[h] > 0) {
			if (s.wordWrap === !1 && p < e) {
				G(l, o, e);
				continue;
			}
			l.push("");
		}
		if (p + a[h] > e && s.wordWrap === !1) {
			G(l, o, e);
			continue;
		}
		l[l.length - 1] += o;
	}
	s.trim !== !1 && (l = l.map((h) => vt$1(h)));
	const E = l.join(`
`), g = E[Symbol.iterator]();
	let m = g.next(), A = g.next(), V = 0;
	for (; !m.done;) {
		const h = m.value, o = A.value;
		if (i += h, h === T || h === Z) {
			et.lastIndex = V + 1;
			const F = et.exec(E)?.groups;
			if (F?.code !== void 0) {
				const d = Number.parseFloat(F.code);
				r = d === Ft$1 ? void 0 : d;
			} else F?.uri !== void 0 && (n = F.uri.length === 0 ? void 0 : F.uri);
		}
		const p = r ? mt$1(r) : void 0;
		o === `
` ? (n && (i += it("")), r && p && (i += st(p))) : h === `
` && (r && p && (i += st(r)), n && (i += it(n))), V += h.length, m = A, A = g.next();
	}
	return i;
};
function K$1(t, e, s) {
	return String(t).normalize().replaceAll(`\r
`, `
`).split(`
`).map((i) => Et$1(i, e, s)).join(`
`);
}
const _ = {
	actions: new Set([
		"up",
		"down",
		"left",
		"right",
		"space",
		"enter",
		"cancel"
	]),
	aliases: new Map([
		["k", "up"],
		["j", "down"],
		["h", "left"],
		["l", "right"],
		["", "cancel"],
		["escape", "cancel"]
	]),
	messages: {
		cancel: "Canceled",
		error: "Something went wrong"
	},
	withGuide: !0
};
function H$1(t, e) {
	if (typeof t == "string") return _.aliases.get(t) === e;
	for (const s of t) if (s !== void 0 && H$1(s, e)) return !0;
	return !1;
}
function _t$1(t, e) {
	if (t === e) return;
	const s = t.split(`
`), i = e.split(`
`), r = Math.max(s.length, i.length), n = [];
	for (let u = 0; u < r; u++) s[u] !== i[u] && n.push(u);
	return {
		lines: n,
		numLinesBefore: s.length,
		numLinesAfter: i.length,
		numLines: r
	};
}
globalThis.process.platform.startsWith("win");
const z$1 = Symbol("clack:cancel");
function Ct$1(t) {
	return t === z$1;
}
function W$1(t, e) {
	const s = t;
	s.isTTY && s.setRawMode(e);
}
const rt = (t) => "columns" in t && typeof t.columns == "number" ? t.columns : 80, nt = (t) => "rows" in t && typeof t.rows == "number" ? t.rows : 20;
var B = class {
	input;
	output;
	_abortSignal;
	rl;
	opts;
	_render;
	_track = !1;
	_prevFrame = "";
	_subscribers = /* @__PURE__ */ new Map();
	_cursor = 0;
	state = "initial";
	error = "";
	value;
	userInput = "";
	constructor(e, s = !0) {
		const { input: i = stdin, output: r = stdout, render: n, signal: u, ...a } = e;
		this.opts = a, this.onKeypress = this.onKeypress.bind(this), this.close = this.close.bind(this), this.render = this.render.bind(this), this._render = n.bind(this), this._track = s, this._abortSignal = u, this.input = i, this.output = r;
	}
	unsubscribe() {
		this._subscribers.clear();
	}
	setSubscriber(e, s) {
		const i = this._subscribers.get(e) ?? [];
		i.push(s), this._subscribers.set(e, i);
	}
	on(e, s) {
		this.setSubscriber(e, { cb: s });
	}
	once(e, s) {
		this.setSubscriber(e, {
			cb: s,
			once: !0
		});
	}
	emit(e, ...s) {
		const i = this._subscribers.get(e) ?? [], r = [];
		for (const n of i) n.cb(...s), n.once && r.push(() => i.splice(i.indexOf(n), 1));
		for (const n of r) n();
	}
	prompt() {
		return new Promise((e) => {
			if (this._abortSignal) {
				if (this._abortSignal.aborted) return this.state = "cancel", this.close(), e(z$1);
				this._abortSignal.addEventListener("abort", () => {
					this.state = "cancel", this.close();
				}, { once: !0 });
			}
			this.rl = ot.createInterface({
				input: this.input,
				tabSize: 2,
				prompt: "",
				escapeCodeTimeout: 50,
				terminal: !0
			}), this.rl.prompt(), this.opts.initialUserInput !== void 0 && this._setUserInput(this.opts.initialUserInput, !0), this.input.on("keypress", this.onKeypress), W$1(this.input, !0), this.output.on("resize", this.render), this.render(), this.once("submit", () => {
				this.output.write(import_src.cursor.show), this.output.off("resize", this.render), W$1(this.input, !1), e(this.value);
			}), this.once("cancel", () => {
				this.output.write(import_src.cursor.show), this.output.off("resize", this.render), W$1(this.input, !1), e(z$1);
			});
		});
	}
	_isActionKey(e, s) {
		return e === "	";
	}
	_setValue(e) {
		this.value = e, this.emit("value", this.value);
	}
	_setUserInput(e, s) {
		this.userInput = e ?? "", this.emit("userInput", this.userInput), s && this._track && this.rl && (this.rl.write(this.userInput), this._cursor = this.rl.cursor);
	}
	_clearUserInput() {
		this.rl?.write(null, {
			ctrl: !0,
			name: "u"
		}), this._setUserInput("");
	}
	onKeypress(e, s) {
		if (this._track && s.name !== "return" && (s.name && this._isActionKey(e, s) && this.rl?.write(null, {
			ctrl: !0,
			name: "h"
		}), this._cursor = this.rl?.cursor ?? 0, this._setUserInput(this.rl?.line)), this.state === "error" && (this.state = "active"), s?.name && (!this._track && _.aliases.has(s.name) && this.emit("cursor", _.aliases.get(s.name)), _.actions.has(s.name) && this.emit("cursor", s.name)), e && (e.toLowerCase() === "y" || e.toLowerCase() === "n") && this.emit("confirm", e.toLowerCase() === "y"), this.emit("key", e?.toLowerCase(), s), s?.name === "return") {
			if (this.opts.validate) {
				const i = this.opts.validate(this.value);
				i && (this.error = i instanceof Error ? i.message : i, this.state = "error", this.rl?.write(this.userInput));
			}
			this.state !== "error" && (this.state = "submit");
		}
		H$1([
			e,
			s?.name,
			s?.sequence
		], "cancel") && (this.state = "cancel"), (this.state === "submit" || this.state === "cancel") && this.emit("finalize"), this.render(), (this.state === "submit" || this.state === "cancel") && this.close();
	}
	close() {
		this.input.unpipe(), this.input.removeListener("keypress", this.onKeypress), this.output.write(`
`), W$1(this.input, !1), this.rl?.close(), this.rl = void 0, this.emit(`${this.state}`, this.value), this.unsubscribe();
	}
	restoreCursor() {
		const e = K$1(this._prevFrame, process.stdout.columns, {
			hard: !0,
			trim: !1
		}).split(`
`).length - 1;
		this.output.write(import_src.cursor.move(-999, e * -1));
	}
	render() {
		const e = K$1(this._render(this) ?? "", process.stdout.columns, {
			hard: !0,
			trim: !1
		});
		if (e !== this._prevFrame) {
			if (this.state === "initial") this.output.write(import_src.cursor.hide);
			else {
				const s = _t$1(this._prevFrame, e), i = nt(this.output);
				if (this.restoreCursor(), s) {
					const r = Math.max(0, s.numLinesAfter - i), n = Math.max(0, s.numLinesBefore - i);
					let u = s.lines.find((a) => a >= r);
					if (u === void 0) {
						this._prevFrame = e;
						return;
					}
					if (s.lines.length === 1) {
						this.output.write(import_src.cursor.move(0, u - n)), this.output.write(import_src.erase.lines(1));
						const a = e.split(`
`);
						this.output.write(a[u]), this._prevFrame = e, this.output.write(import_src.cursor.move(0, a.length - u - 1));
						return;
					} else if (s.lines.length > 1) {
						if (r < n) u = r;
						else {
							const l = u - n;
							l > 0 && this.output.write(import_src.cursor.move(0, l));
						}
						this.output.write(import_src.erase.down());
						const a = e.split(`
`).slice(u);
						this.output.write(a.join(`
`)), this._prevFrame = e;
						return;
					}
				}
				this.output.write(import_src.erase.down());
			}
			this.output.write(e), this.state === "initial" && (this.state = "active"), this._prevFrame = e;
		}
	}
};
var kt$1 = class extends B {
	get cursor() {
		return this.value ? 0 : 1;
	}
	get _value() {
		return this.cursor === 0;
	}
	constructor(e) {
		super(e, !1), this.value = !!e.initialValue, this.on("userInput", () => {
			this.value = this._value;
		}), this.on("confirm", (s) => {
			this.output.write(import_src.cursor.move(0, -1)), this.value = s, this.state = "submit", this.close();
		}), this.on("cursor", () => {
			this.value = !this.value;
		});
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@clack+prompts@1.1.0/node_modules/@clack/prompts/dist/index.mjs
function pt() {
	return process$1.platform !== "win32" ? process$1.env.TERM !== "linux" : !!process$1.env.CI || !!process$1.env.WT_SESSION || !!process$1.env.TERMINUS_SUBLIME || process$1.env.ConEmuTask === "{cmd::Cmder}" || process$1.env.TERM_PROGRAM === "Terminus-Sublime" || process$1.env.TERM_PROGRAM === "vscode" || process$1.env.TERM === "xterm-256color" || process$1.env.TERM === "alacritty" || process$1.env.TERMINAL_EMULATOR === "JetBrains-JediTerm";
}
const ee = pt(), I = (e, r) => ee ? e : r, Re = I("◆", "*"), $e = I("■", "x"), de = I("▲", "x"), V = I("◇", "o");
I("┌", "T");
const h = I("│", "|"), x = I("└", "—");
I("┐", "T");
I("┘", "—");
const z = I("●", ">"), H = I("○", " ");
I("◻", "[•]");
I("◼", "[+]");
I("◻", "[ ]");
I("▪", "•");
const se = I("─", "-"), pe = I("╮", "+"), We = I("├", "+"), me = I("╯", "+"), ge = I("╰", "+");
I("╭", "+");
const fe = I("●", "•"), Fe = I("◆", "*"), ye = I("▲", "!"), Ee = I("■", "x"), W = (e) => {
	switch (e) {
		case "initial":
		case "active": return styleText("cyan", Re);
		case "cancel": return styleText("red", $e);
		case "error": return styleText("yellow", de);
		case "submit": return styleText("green", V);
	}
}, mt = (e) => e === 161 || e === 164 || e === 167 || e === 168 || e === 170 || e === 173 || e === 174 || e >= 176 && e <= 180 || e >= 182 && e <= 186 || e >= 188 && e <= 191 || e === 198 || e === 208 || e === 215 || e === 216 || e >= 222 && e <= 225 || e === 230 || e >= 232 && e <= 234 || e === 236 || e === 237 || e === 240 || e === 242 || e === 243 || e >= 247 && e <= 250 || e === 252 || e === 254 || e === 257 || e === 273 || e === 275 || e === 283 || e === 294 || e === 295 || e === 299 || e >= 305 && e <= 307 || e === 312 || e >= 319 && e <= 322 || e === 324 || e >= 328 && e <= 331 || e === 333 || e === 338 || e === 339 || e === 358 || e === 359 || e === 363 || e === 462 || e === 464 || e === 466 || e === 468 || e === 470 || e === 472 || e === 474 || e === 476 || e === 593 || e === 609 || e === 708 || e === 711 || e >= 713 && e <= 715 || e === 717 || e === 720 || e >= 728 && e <= 731 || e === 733 || e === 735 || e >= 768 && e <= 879 || e >= 913 && e <= 929 || e >= 931 && e <= 937 || e >= 945 && e <= 961 || e >= 963 && e <= 969 || e === 1025 || e >= 1040 && e <= 1103 || e === 1105 || e === 8208 || e >= 8211 && e <= 8214 || e === 8216 || e === 8217 || e === 8220 || e === 8221 || e >= 8224 && e <= 8226 || e >= 8228 && e <= 8231 || e === 8240 || e === 8242 || e === 8243 || e === 8245 || e === 8251 || e === 8254 || e === 8308 || e === 8319 || e >= 8321 && e <= 8324 || e === 8364 || e === 8451 || e === 8453 || e === 8457 || e === 8467 || e === 8470 || e === 8481 || e === 8482 || e === 8486 || e === 8491 || e === 8531 || e === 8532 || e >= 8539 && e <= 8542 || e >= 8544 && e <= 8555 || e >= 8560 && e <= 8569 || e === 8585 || e >= 8592 && e <= 8601 || e === 8632 || e === 8633 || e === 8658 || e === 8660 || e === 8679 || e === 8704 || e === 8706 || e === 8707 || e === 8711 || e === 8712 || e === 8715 || e === 8719 || e === 8721 || e === 8725 || e === 8730 || e >= 8733 && e <= 8736 || e === 8739 || e === 8741 || e >= 8743 && e <= 8748 || e === 8750 || e >= 8756 && e <= 8759 || e === 8764 || e === 8765 || e === 8776 || e === 8780 || e === 8786 || e === 8800 || e === 8801 || e >= 8804 && e <= 8807 || e === 8810 || e === 8811 || e === 8814 || e === 8815 || e === 8834 || e === 8835 || e === 8838 || e === 8839 || e === 8853 || e === 8857 || e === 8869 || e === 8895 || e === 8978 || e >= 9312 && e <= 9449 || e >= 9451 && e <= 9547 || e >= 9552 && e <= 9587 || e >= 9600 && e <= 9615 || e >= 9618 && e <= 9621 || e === 9632 || e === 9633 || e >= 9635 && e <= 9641 || e === 9650 || e === 9651 || e === 9654 || e === 9655 || e === 9660 || e === 9661 || e === 9664 || e === 9665 || e >= 9670 && e <= 9672 || e === 9675 || e >= 9678 && e <= 9681 || e >= 9698 && e <= 9701 || e === 9711 || e === 9733 || e === 9734 || e === 9737 || e === 9742 || e === 9743 || e === 9756 || e === 9758 || e === 9792 || e === 9794 || e === 9824 || e === 9825 || e >= 9827 && e <= 9829 || e >= 9831 && e <= 9834 || e === 9836 || e === 9837 || e === 9839 || e === 9886 || e === 9887 || e === 9919 || e >= 9926 && e <= 9933 || e >= 9935 && e <= 9939 || e >= 9941 && e <= 9953 || e === 9955 || e === 9960 || e === 9961 || e >= 9963 && e <= 9969 || e === 9972 || e >= 9974 && e <= 9977 || e === 9979 || e === 9980 || e === 9982 || e === 9983 || e === 10045 || e >= 10102 && e <= 10111 || e >= 11094 && e <= 11097 || e >= 12872 && e <= 12879 || e >= 57344 && e <= 63743 || e >= 65024 && e <= 65039 || e === 65533 || e >= 127232 && e <= 127242 || e >= 127248 && e <= 127277 || e >= 127280 && e <= 127337 || e >= 127344 && e <= 127373 || e === 127375 || e === 127376 || e >= 127387 && e <= 127404 || e >= 917760 && e <= 917999 || e >= 983040 && e <= 1048573 || e >= 1048576 && e <= 1114109, gt = (e) => e === 12288 || e >= 65281 && e <= 65376 || e >= 65504 && e <= 65510, ft = (e) => e >= 4352 && e <= 4447 || e === 8986 || e === 8987 || e === 9001 || e === 9002 || e >= 9193 && e <= 9196 || e === 9200 || e === 9203 || e === 9725 || e === 9726 || e === 9748 || e === 9749 || e >= 9800 && e <= 9811 || e === 9855 || e === 9875 || e === 9889 || e === 9898 || e === 9899 || e === 9917 || e === 9918 || e === 9924 || e === 9925 || e === 9934 || e === 9940 || e === 9962 || e === 9970 || e === 9971 || e === 9973 || e === 9978 || e === 9981 || e === 9989 || e === 9994 || e === 9995 || e === 10024 || e === 10060 || e === 10062 || e >= 10067 && e <= 10069 || e === 10071 || e >= 10133 && e <= 10135 || e === 10160 || e === 10175 || e === 11035 || e === 11036 || e === 11088 || e === 11093 || e >= 11904 && e <= 11929 || e >= 11931 && e <= 12019 || e >= 12032 && e <= 12245 || e >= 12272 && e <= 12287 || e >= 12289 && e <= 12350 || e >= 12353 && e <= 12438 || e >= 12441 && e <= 12543 || e >= 12549 && e <= 12591 || e >= 12593 && e <= 12686 || e >= 12688 && e <= 12771 || e >= 12783 && e <= 12830 || e >= 12832 && e <= 12871 || e >= 12880 && e <= 19903 || e >= 19968 && e <= 42124 || e >= 42128 && e <= 42182 || e >= 43360 && e <= 43388 || e >= 44032 && e <= 55203 || e >= 63744 && e <= 64255 || e >= 65040 && e <= 65049 || e >= 65072 && e <= 65106 || e >= 65108 && e <= 65126 || e >= 65128 && e <= 65131 || e >= 94176 && e <= 94180 || e === 94192 || e === 94193 || e >= 94208 && e <= 100343 || e >= 100352 && e <= 101589 || e >= 101632 && e <= 101640 || e >= 110576 && e <= 110579 || e >= 110581 && e <= 110587 || e === 110589 || e === 110590 || e >= 110592 && e <= 110882 || e === 110898 || e >= 110928 && e <= 110930 || e === 110933 || e >= 110948 && e <= 110951 || e >= 110960 && e <= 111355 || e === 126980 || e === 127183 || e === 127374 || e >= 127377 && e <= 127386 || e >= 127488 && e <= 127490 || e >= 127504 && e <= 127547 || e >= 127552 && e <= 127560 || e === 127568 || e === 127569 || e >= 127584 && e <= 127589 || e >= 127744 && e <= 127776 || e >= 127789 && e <= 127797 || e >= 127799 && e <= 127868 || e >= 127870 && e <= 127891 || e >= 127904 && e <= 127946 || e >= 127951 && e <= 127955 || e >= 127968 && e <= 127984 || e === 127988 || e >= 127992 && e <= 128062 || e === 128064 || e >= 128066 && e <= 128252 || e >= 128255 && e <= 128317 || e >= 128331 && e <= 128334 || e >= 128336 && e <= 128359 || e === 128378 || e === 128405 || e === 128406 || e === 128420 || e >= 128507 && e <= 128591 || e >= 128640 && e <= 128709 || e === 128716 || e >= 128720 && e <= 128722 || e >= 128725 && e <= 128727 || e >= 128732 && e <= 128735 || e === 128747 || e === 128748 || e >= 128756 && e <= 128764 || e >= 128992 && e <= 129003 || e === 129008 || e >= 129292 && e <= 129338 || e >= 129340 && e <= 129349 || e >= 129351 && e <= 129535 || e >= 129648 && e <= 129660 || e >= 129664 && e <= 129672 || e >= 129680 && e <= 129725 || e >= 129727 && e <= 129733 || e >= 129742 && e <= 129755 || e >= 129760 && e <= 129768 || e >= 129776 && e <= 129784 || e >= 131072 && e <= 196605 || e >= 196608 && e <= 262141, we = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/y, re = /[\x00-\x08\x0A-\x1F\x7F-\x9F]{1,1000}/y, ie = /\t{1,1000}/y, Ae = /[\u{1F1E6}-\u{1F1FF}]{2}|\u{1F3F4}[\u{E0061}-\u{E007A}]{2}[\u{E0030}-\u{E0039}\u{E0061}-\u{E007A}]{1,3}\u{E007F}|(?:\p{Emoji}\uFE0F\u20E3?|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation})(?:\u200D(?:\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation}|\p{Emoji}\uFE0F\u20E3?))*/uy, ne = /(?:[\x20-\x7E\xA0-\xFF](?!\uFE0F)){1,1000}/y, Ft = /\p{M}+/gu, yt = {
	limit: Infinity,
	ellipsis: ""
}, Le = (e, r = {}, s = {}) => {
	const i = r.limit ?? Infinity, a = r.ellipsis ?? "", o = r?.ellipsisWidth ?? (a ? Le(a, yt, s).width : 0), u = s.ansiWidth ?? 0, l = s.controlWidth ?? 0, n = s.tabWidth ?? 8, c = s.ambiguousWidth ?? 1, p = s.emojiWidth ?? 2, f = s.fullWidthWidth ?? 2, g = s.regularWidth ?? 1, E = s.wideWidth ?? 2;
	let $ = 0, m = 0, d = e.length, F = 0, y = !1, v = d, C = Math.max(0, i - o), A = 0, b = 0, w = 0, S = 0;
	e: for (;;) {
		if (b > A || m >= d && m > $) {
			const T = e.slice(A, b) || e.slice($, m);
			F = 0;
			for (const M of T.replaceAll(Ft, "")) {
				const O = M.codePointAt(0) || 0;
				if (gt(O) ? S = f : ft(O) ? S = E : c !== g && mt(O) ? S = c : S = g, w + S > C && (v = Math.min(v, Math.max(A, $) + F)), w + S > i) {
					y = !0;
					break e;
				}
				F += M.length, w += S;
			}
			A = b = 0;
		}
		if (m >= d) break;
		if (ne.lastIndex = m, ne.test(e)) {
			if (F = ne.lastIndex - m, S = F * g, w + S > C && (v = Math.min(v, m + Math.floor((C - w) / g))), w + S > i) {
				y = !0;
				break;
			}
			w += S, A = $, b = m, m = $ = ne.lastIndex;
			continue;
		}
		if (we.lastIndex = m, we.test(e)) {
			if (w + u > C && (v = Math.min(v, m)), w + u > i) {
				y = !0;
				break;
			}
			w += u, A = $, b = m, m = $ = we.lastIndex;
			continue;
		}
		if (re.lastIndex = m, re.test(e)) {
			if (F = re.lastIndex - m, S = F * l, w + S > C && (v = Math.min(v, m + Math.floor((C - w) / l))), w + S > i) {
				y = !0;
				break;
			}
			w += S, A = $, b = m, m = $ = re.lastIndex;
			continue;
		}
		if (ie.lastIndex = m, ie.test(e)) {
			if (F = ie.lastIndex - m, S = F * n, w + S > C && (v = Math.min(v, m + Math.floor((C - w) / n))), w + S > i) {
				y = !0;
				break;
			}
			w += S, A = $, b = m, m = $ = ie.lastIndex;
			continue;
		}
		if (Ae.lastIndex = m, Ae.test(e)) {
			if (w + p > C && (v = Math.min(v, m)), w + p > i) {
				y = !0;
				break;
			}
			w += p, A = $, b = m, m = $ = Ae.lastIndex;
			continue;
		}
		m += 1;
	}
	return {
		width: y ? C : w,
		index: y ? v : d,
		truncated: y,
		ellipsed: y && i >= o
	};
}, Et = {
	limit: Infinity,
	ellipsis: "",
	ellipsisWidth: 0
}, D = (e, r = {}) => Le(e, Et, r).width, ae = "\x1B", je = "", vt = 39, Ce = "\x07", ke = "[", wt = "]", Ve = "m", Se = `${wt}8;;`, He = new RegExp(`(?:\\${ke}(?<code>\\d+)m|\\${Se}(?<uri>.*)${Ce})`, "y"), At = (e) => {
	if (e >= 30 && e <= 37 || e >= 90 && e <= 97) return 39;
	if (e >= 40 && e <= 47 || e >= 100 && e <= 107) return 49;
	if (e === 1 || e === 2) return 22;
	if (e === 3) return 23;
	if (e === 4) return 24;
	if (e === 7) return 27;
	if (e === 8) return 28;
	if (e === 9) return 29;
	if (e === 0) return 0;
}, Ue = (e) => `${ae}${ke}${e}${Ve}`, Ke = (e) => `${ae}${Se}${e}${Ce}`, Ct = (e) => e.map((r) => D(r)), Ie = (e, r, s) => {
	const i = r[Symbol.iterator]();
	let a = !1, o = !1, u = e.at(-1), l = u === void 0 ? 0 : D(u), n = i.next(), c = i.next(), p = 0;
	for (; !n.done;) {
		const f = n.value, g = D(f);
		l + g <= s ? e[e.length - 1] += f : (e.push(f), l = 0), (f === ae || f === je) && (a = !0, o = r.startsWith(Se, p + 1)), a ? o ? f === Ce && (a = !1, o = !1) : f === Ve && (a = !1) : (l += g, l === s && !c.done && (e.push(""), l = 0)), n = c, c = i.next(), p += f.length;
	}
	u = e.at(-1), !l && u !== void 0 && u.length > 0 && e.length > 1 && (e[e.length - 2] += e.pop());
}, St = (e) => {
	const r = e.split(" ");
	let s = r.length;
	for (; s > 0 && !(D(r[s - 1]) > 0);) s--;
	return s === r.length ? e : r.slice(0, s).join(" ") + r.slice(s).join("");
}, It = (e, r, s = {}) => {
	if (s.trim !== !1 && e.trim() === "") return "";
	let i = "", a, o;
	const u = e.split(" "), l = Ct(u);
	let n = [""];
	for (const [$, m] of u.entries()) {
		s.trim !== !1 && (n[n.length - 1] = (n.at(-1) ?? "").trimStart());
		let d = D(n.at(-1) ?? "");
		if ($ !== 0 && (d >= r && (s.wordWrap === !1 || s.trim === !1) && (n.push(""), d = 0), (d > 0 || s.trim === !1) && (n[n.length - 1] += " ", d++)), s.hard && l[$] > r) {
			const F = r - d, y = 1 + Math.floor((l[$] - F - 1) / r);
			Math.floor((l[$] - 1) / r) < y && n.push(""), Ie(n, m, r);
			continue;
		}
		if (d + l[$] > r && d > 0 && l[$] > 0) {
			if (s.wordWrap === !1 && d < r) {
				Ie(n, m, r);
				continue;
			}
			n.push("");
		}
		if (d + l[$] > r && s.wordWrap === !1) {
			Ie(n, m, r);
			continue;
		}
		n[n.length - 1] += m;
	}
	s.trim !== !1 && (n = n.map(($) => St($)));
	const c = n.join(`
`), p = c[Symbol.iterator]();
	let f = p.next(), g = p.next(), E = 0;
	for (; !f.done;) {
		const $ = f.value, m = g.value;
		if (i += $, $ === ae || $ === je) {
			He.lastIndex = E + 1;
			const y = He.exec(c)?.groups;
			if (y?.code !== void 0) {
				const v = Number.parseFloat(y.code);
				a = v === vt ? void 0 : v;
			} else y?.uri !== void 0 && (o = y.uri.length === 0 ? void 0 : y.uri);
		}
		const d = a ? At(a) : void 0;
		m === `
` ? (o && (i += Ke("")), a && d && (i += Ue(d))) : $ === `
` && (a && d && (i += Ue(a)), o && (i += Ke(o))), E += $.length, f = g, g = p.next();
	}
	return i;
};
function J(e, r, s) {
	return String(e).normalize().replaceAll(`\r
`, `
`).split(`
`).map((i) => It(i, r, s)).join(`
`);
}
const Rt = (e) => {
	const r = e.active ?? "Yes", s = e.inactive ?? "No";
	return new kt$1({
		active: r,
		inactive: s,
		signal: e.signal,
		input: e.input,
		output: e.output,
		initialValue: e.initialValue ?? !0,
		render() {
			const i = e.withGuide ?? _.withGuide, a = `${i ? `${styleText("gray", h)}
` : ""}${W(this.state)}  ${e.message}
`, o = this.value ? r : s;
			switch (this.state) {
				case "submit": return `${a}${i ? `${styleText("gray", h)}  ` : ""}${styleText("dim", o)}`;
				case "cancel": return `${a}${i ? `${styleText("gray", h)}  ` : ""}${styleText(["strikethrough", "dim"], o)}${i ? `
${styleText("gray", h)}` : ""}`;
				default: {
					const u = i ? `${styleText("cyan", h)}  ` : "", l = i ? styleText("cyan", x) : "";
					return `${a}${u}${this.value ? `${styleText("green", z)} ${r}` : `${styleText("dim", H)} ${styleText("dim", r)}`}${e.vertical ? i ? `
${styleText("cyan", h)}  ` : `
` : ` ${styleText("dim", "/")} `}${this.value ? `${styleText("dim", H)} ${styleText("dim", s)}` : `${styleText("green", z)} ${s}`}
${l}
`;
				}
			}
		}
	}).prompt();
}, R = {
	message: (e = [], { symbol: r = styleText("gray", h), secondarySymbol: s = styleText("gray", h), output: i = process.stdout, spacing: a = 1, withGuide: o } = {}) => {
		const u = [], l = o ?? _.withGuide, n = l ? s : "", c = l ? `${r}  ` : "", p = l ? `${s}  ` : "";
		for (let g = 0; g < a; g++) u.push(n);
		const f = Array.isArray(e) ? e : e.split(`
`);
		if (f.length > 0) {
			const [g, ...E] = f;
			g.length > 0 ? u.push(`${c}${g}`) : u.push(l ? r : "");
			for (const $ of E) $.length > 0 ? u.push(`${p}${$}`) : u.push(l ? s : "");
		}
		i.write(`${u.join(`
`)}
`);
	},
	info: (e, r) => {
		R.message(e, {
			...r,
			symbol: styleText("blue", fe)
		});
	},
	success: (e, r) => {
		R.message(e, {
			...r,
			symbol: styleText("green", Fe)
		});
	},
	step: (e, r) => {
		R.message(e, {
			...r,
			symbol: styleText("green", V)
		});
	},
	warn: (e, r) => {
		R.message(e, {
			...r,
			symbol: styleText("yellow", ye)
		});
	},
	warning: (e, r) => {
		R.warn(e, r);
	},
	error: (e, r) => {
		R.message(e, {
			...r,
			symbol: styleText("red", Ee)
		});
	}
}, Gt = (e = "", r) => {
	const s = r?.output ?? process.stdout, i = r?.withGuide ?? _.withGuide ? `${styleText("gray", h)}
${styleText("gray", x)}  ` : "";
	s.write(`${i}${e}

`);
}, jt = (e) => styleText("dim", e), kt = (e, r, s) => {
	const i = {
		hard: !0,
		trim: !1
	}, a = J(e, r, i).split(`
`), o = a.reduce((n, c) => Math.max(D(c), n), 0);
	return J(e, r - (a.map(s).reduce((n, c) => Math.max(D(c), n), 0) - o), i);
}, Vt = (e = "", r = "", s) => {
	const i = s?.output ?? process$1.stdout, a = s?.withGuide ?? _.withGuide, o = s?.format ?? jt, u = [
		"",
		...kt(e, rt(i) - 6, o).split(`
`).map(o),
		""
	], l = D(r), n = Math.max(u.reduce((g, E) => {
		const $ = D(E);
		return $ > g ? $ : g;
	}, 0), l) + 2, c = u.map((g) => `${styleText("gray", h)}  ${g}${" ".repeat(n - D(g))}${styleText("gray", h)}`).join(`
`), p = a ? `${styleText("gray", h)}
` : "", f = a ? We : ge;
	i.write(`${p}${styleText("green", V)}  ${styleText("reset", r)} ${styleText("gray", se.repeat(Math.max(n - l - 1, 1)) + pe)}
${c}
${styleText("gray", f + se.repeat(n + 2) + me)}
`);
};
I("─", "-"), I("━", "="), I("█", "#");
const Qe = `${styleText("gray", h)}  `, K = {
	message: async (e, { symbol: r = styleText("gray", h) } = {}) => {
		process.stdout.write(`${styleText("gray", h)}
${r}  `);
		let s = 3;
		for await (let i of e) {
			i = i.replace(/\n/g, `
${Qe}`), i.includes(`
`) && (s = 3 + stripVTControlCharacters(i.slice(i.lastIndexOf(`
`))).length);
			const a = stripVTControlCharacters(i).length;
			s + a < process.stdout.columns ? (s += a, process.stdout.write(i)) : (process.stdout.write(`
${Qe}${i.trimStart()}`), s = 3 + stripVTControlCharacters(i.trimStart()).length);
		}
		process.stdout.write(`
`);
	},
	info: (e) => K.message(e, { symbol: styleText("blue", fe) }),
	success: (e) => K.message(e, { symbol: styleText("green", Fe) }),
	step: (e) => K.message(e, { symbol: styleText("green", V) }),
	warn: (e) => K.message(e, { symbol: styleText("yellow", ye) }),
	warning: (e) => K.warn(e),
	error: (e) => K.message(e, { symbol: styleText("red", Ee) })
};
//#endregion
//#region src/node/rpc/anonymous/auth.ts
const AUTH_TIMEOUT_MS = 6e4;
const anonymousAuth = defineRpcFunction({
	name: "vite:anonymous:auth",
	type: "action",
	setup: (context) => {
		const storage = getInternalContext(context).storage.auth;
		return { handler: async (query) => {
			const session = context.rpc.getCurrentRpcSession();
			if (!session) throw new Error("Failed to retrieve the current RPC session");
			if (session.meta.isTrusted || storage.value().trusted[query.authToken]) {
				session.meta.clientAuthToken = query.authToken;
				session.meta.isTrusted = true;
				return { isTrusted: true };
			}
			if (((context.viteConfig.devtools?.config)?.clientAuthTokens ?? []).includes(query.authToken)) {
				session.meta.clientAuthToken = query.authToken;
				session.meta.isTrusted = true;
				return { isTrusted: true };
			}
			if (query.authToken === getTempAuthToken()) {
				storage.mutate((state) => {
					state.trusted[query.authToken] = {
						authToken: query.authToken,
						ua: query.ua,
						origin: query.origin,
						timestamp: Date.now()
					};
				});
				session.meta.clientAuthToken = query.authToken;
				session.meta.isTrusted = true;
				refreshTempAuthToken();
				return { isTrusted: true };
			}
			abortPendingAuth();
			const tempId = getTempAuthToken();
			const authUrl = `${context.viteServer?.resolvedUrls?.local?.[0]?.replace(/\/$/, "") ?? `http://localhost:${context.viteConfig.server.port}`}/.devtools/auth?id=${encodeURIComponent(tempId)}`;
			const message = [
				`A browser is requesting permissions to connect to the Vite DevTools.`,
				"",
				`User Agent   : ${ansis_default.yellow(ansis_default.bold(query.ua || "Unknown"))}`,
				`Origin       : ${ansis_default.yellow(ansis_default.bold(query.origin || "Unknown"))}`,
				`Client Token : ${ansis_default.green(ansis_default.bold(query.authToken))}`,
				"",
				`Manual Auth URL   : ${ansis_default.cyan(ansis_default.underline(authUrl))}`,
				`Manual Auth Token : ${ansis_default.cyan(ansis_default.bold(tempId))}`,
				"",
				"This will allow the browser to interact with the server, make file changes and run commands.",
				ansis_default.red(ansis_default.bold("You should only trust your local development browsers."))
			];
			Vt(ansis_default.reset(message.join("\n")), ansis_default.bold(ansis_default.yellow(" Vite DevTools Permission Request ")));
			if (!process$1.stdout.isTTY) return { isTrusted: false };
			const abortController = new AbortController();
			return new Promise((resolve) => {
				const timeout = setTimeout(() => {
					abortController.abort();
					setPendingAuth(null);
					console.log(ansis_default.yellow`${MARK_INFO} Auth request timed out for ${ansis_default.bold(query.authToken)}`);
					resolve({ isTrusted: false });
				}, AUTH_TIMEOUT_MS);
				setPendingAuth({
					clientAuthToken: query.authToken,
					session,
					ua: query.ua,
					origin: query.origin,
					resolve,
					abortController,
					timeout
				});
				Rt({
					message: ansis_default.bold(`Do you trust this client (${ansis_default.green(ansis_default.bold(query.authToken))})?`),
					initialValue: false,
					signal: abortController.signal
				}).then((answer) => {
					clearTimeout(timeout);
					setPendingAuth(null);
					if (Ct$1(answer)) return;
					if (answer) {
						storage.mutate((state) => {
							state.trusted[query.authToken] = {
								authToken: query.authToken,
								ua: query.ua,
								origin: query.origin,
								timestamp: Date.now()
							};
						});
						session.meta.clientAuthToken = query.authToken;
						session.meta.isTrusted = true;
						Gt(ansis_default.green(ansis_default.bold(`You have granted permissions to ${ansis_default.bold(query.authToken)}`)));
						resolve({ isTrusted: true });
					} else {
						Gt(ansis_default.red(ansis_default.bold(`You have denied permissions to ${ansis_default.bold(query.authToken)}`)));
						resolve({ isTrusted: false });
					}
				}).catch(() => {
					clearTimeout(timeout);
					setPendingAuth(null);
				});
			});
		} };
	}
});
//#endregion
//#region src/node/rpc/internal/commands-execute.ts
const commandsExecute = defineRpcFunction({
	name: "devtoolskit:internal:commands:execute",
	type: "action",
	setup: (context) => {
		return { async handler(id, ...args) {
			return context.commands.execute(id, ...args);
		} };
	}
});
//#endregion
//#region src/node/rpc/internal/commands-list.ts
const commandsList = defineRpcFunction({
	name: "devtoolskit:internal:commands:list",
	type: "static",
	setup: (context) => {
		return { async handler() {
			return context.commands.list();
		} };
	}
});
//#endregion
//#region src/node/rpc/internal/docks-on-launch.ts
const docksOnLaunch = defineRpcFunction({
	name: "devtoolskit:internal:docks:on-launch",
	type: "action",
	setup: (context) => {
		const launchMap = /* @__PURE__ */ new Map();
		return { handler: async (entryId) => {
			if (launchMap.has(entryId)) return launchMap.get(entryId);
			const entry = context.docks.values().find((entry) => entry.id === entryId);
			if (!entry) throw new Error(`Dock entry with id "${entryId}" not found`);
			if (entry.type !== "launcher") throw new Error(`Dock entry with id "${entryId}" is not a launcher`);
			try {
				context.docks.update({
					...entry,
					launcher: {
						...entry.launcher,
						status: "loading"
					}
				});
				const promise = entry.launcher.onLaunch();
				launchMap.set(entryId, promise);
				const result = await promise;
				const newEntry = context.docks.values().find((entry) => entry.id === entryId) || entry;
				if (newEntry.type === "launcher") context.docks.update({
					...newEntry,
					launcher: {
						...newEntry.launcher,
						status: "success"
					}
				});
				return result;
			} catch (error) {
				console.error(`[VITE DEVTOOLS] Error launching dock entry "${entryId}"`, error);
				context.docks.update({
					...entry,
					launcher: {
						...entry.launcher,
						status: "error",
						error: error instanceof Error ? error.message : String(error)
					}
				});
			}
		} };
	}
});
//#endregion
//#region src/node/rpc/internal/logs-add.ts
const logsAdd = defineRpcFunction({
	name: "devtoolskit:internal:logs:add",
	type: "action",
	setup: (context) => {
		return { async handler(input) {
			return (await context.logs.add({
				...input,
				from: "browser"
			})).entry;
		} };
	}
});
//#endregion
//#region src/node/rpc/internal/logs-clear.ts
const logsClear = defineRpcFunction({
	name: "devtoolskit:internal:logs:clear",
	type: "action",
	setup: (context) => {
		return { async handler() {
			await context.logs.clear();
		} };
	}
});
//#endregion
//#region src/node/rpc/internal/logs-list.ts
const logsList = defineRpcFunction({
	name: "devtoolskit:internal:logs:list",
	type: "static",
	setup: (context) => {
		const host = context.logs;
		return { async handler(since) {
			const currentVersion = host._clock;
			if (since == null) return {
				entries: Array.from(host.entries.values()),
				removedIds: [],
				version: currentVersion
			};
			const entries = [];
			for (const [id, entry] of host.entries) {
				const mod = host.lastModified.get(id);
				if (mod != null && mod > since) entries.push(entry);
			}
			const removedIds = [];
			for (const r of host.removals) if (r.time > since) removedIds.push(r.id);
			const pruneThreshold = since;
			while (host.removals.length > 0 && host.removals[0].time <= pruneThreshold) host.removals.shift();
			return {
				entries,
				removedIds,
				version: currentVersion
			};
		} };
	}
});
//#endregion
//#region src/node/rpc/internal/logs-remove.ts
const logsRemove = defineRpcFunction({
	name: "devtoolskit:internal:logs:remove",
	type: "action",
	setup: (context) => {
		return { async handler(id) {
			await context.logs.remove(id);
		} };
	}
});
//#endregion
//#region src/node/rpc/internal/logs-update.ts
const logsUpdate = defineRpcFunction({
	name: "devtoolskit:internal:logs:update",
	type: "action",
	setup: (context) => {
		return { async handler(id, patch) {
			return await context.logs.update(id, patch) ?? null;
		} };
	}
});
//#endregion
//#region src/node/rpc/internal/rpc-server-list.ts
const rpcServerList = defineRpcFunction({
	name: "devtoolskit:internal:rpc:server:list",
	type: "static",
	setup: (context) => {
		return { async handler() {
			return Object.fromEntries(Array.from(context.rpc.definitions.entries()).map(([name, fn]) => [name, { type: fn.type }]));
		} };
	}
});
//#endregion
//#region src/node/rpc/internal/state/get.ts
const sharedStateGet = defineRpcFunction({
	name: "devtoolskit:internal:rpc:server-state:get",
	type: "query",
	dump: (context) => {
		return { inputs: context.rpc.sharedState.keys().map((key) => [key]) };
	},
	setup: (context) => {
		return { handler: async (key) => {
			if (!context.rpc.sharedState.keys().includes(key)) return void 0;
			return (await context.rpc.sharedState.get(key)).value();
		} };
	}
});
//#endregion
//#region src/node/rpc/internal/state/patch.ts
const sharedStatePatch = defineRpcFunction({
	name: "devtoolskit:internal:rpc:server-state:patch",
	type: "query",
	setup: (context) => {
		return { handler: async (key, patches, syncId) => {
			if (!context.rpc.sharedState.keys().includes(key)) return;
			(await context.rpc.sharedState.get(key)).patch(patches, syncId);
		} };
	}
});
//#endregion
//#region src/node/rpc/internal/state/set.ts
const sharedStateSet = defineRpcFunction({
	name: "devtoolskit:internal:rpc:server-state:set",
	type: "query",
	setup: (context) => {
		return { handler: async (key, value, syncId) => {
			(await context.rpc.sharedState.get(key, { initialValue: value })).mutate(() => value, syncId);
		} };
	}
});
//#endregion
//#region src/node/rpc/internal/state/subscribe.ts
const debug = createDebug("vite:devtools:rpc:state:subscribe");
const sharedStateSubscribe = defineRpcFunction({
	name: "devtoolskit:internal:rpc:server-state:subscribe",
	type: "event",
	setup: (context) => {
		return { handler: async (key) => {
			const session = context.rpc.getCurrentRpcSession();
			if (!session) return;
			debug("subscribe", {
				key,
				session: session.meta.id
			});
			session.meta.subscribedStates.add(key);
		} };
	}
});
//#endregion
//#region src/node/rpc/internal/terminals-list.ts
const terminalsList = defineRpcFunction({
	name: "devtoolskit:internal:terminals:list",
	type: "static",
	setup: (context) => {
		return { async handler() {
			return Array.from(context.terminals.sessions.values()).map((i) => {
				return {
					id: i.id,
					title: i.title,
					description: i.description,
					status: i.status
				};
			});
		} };
	}
});
//#endregion
//#region src/node/rpc/internal/terminals-read.ts
const terminalsRead = defineRpcFunction({
	name: "devtoolskit:internal:terminals:read",
	type: "query",
	setup: (context) => {
		return { async handler(id) {
			const session = context.terminals.sessions.get(id);
			if (!session) throw new Error(`Terminal session with id "${id}" not found`);
			return {
				buffer: session.buffer ?? [],
				ts: Date.now()
			};
		} };
	}
});
//#endregion
//#region src/node/rpc/index.ts
const builtinPublicRpcDeclarations = [defineRpcFunction({
	name: "vite:core:open-in-editor",
	type: "action",
	setup: () => {
		return { handler: async (path) => {
			await import("launch-editor").then((r) => r.default(path));
		} };
	}
}), defineRpcFunction({
	name: "vite:core:open-in-finder",
	type: "action",
	setup: () => {
		return { handler: async (path) => {
			await import("open").then((r) => r.default(path));
		} };
	}
})];
const builtinAnonymousRpcDeclarations = [anonymousAuth];
const builtinInternalRpcDeclarations = [
	commandsExecute,
	commandsList,
	docksOnLaunch,
	logsAdd,
	logsClear,
	logsList,
	logsRemove,
	logsUpdate,
	rpcServerList,
	sharedStateGet,
	sharedStatePatch,
	sharedStateSet,
	sharedStateSubscribe,
	terminalsList,
	terminalsRead
];
const builtinRpcDeclarations = [
	...builtinPublicRpcDeclarations,
	...builtinAnonymousRpcDeclarations,
	...builtinInternalRpcDeclarations
];
//#endregion
//#region src/node/context.ts
var context_exports = /* @__PURE__ */ __exportAll({ createDevToolsContext: () => createDevToolsContext });
const debugSetup = createDebug("vite:devtools:context:setup");
function shouldSkipSetupByCapabilities(plugin, mode) {
	const modeCapabilities = plugin.devtools?.capabilities?.[mode];
	if (modeCapabilities === false) return true;
	if (!isObject(modeCapabilities)) return false;
	return Object.values(modeCapabilities).includes(false);
}
async function createDevToolsContext(viteConfig, viteServer) {
	const cwd = viteConfig.root;
	const { searchForWorkspaceRoot } = await import("vite");
	const context = {
		cwd,
		workspaceRoot: searchForWorkspaceRoot(cwd) ?? cwd,
		viteConfig,
		viteServer,
		mode: viteConfig.command === "serve" ? "dev" : "build",
		rpc: void 0,
		docks: void 0,
		views: void 0,
		utils: ContextUtils,
		terminals: void 0,
		logs: void 0,
		commands: void 0,
		createJsonRenderer: void 0
	};
	const rpcHost = new RpcFunctionsHost(context);
	const docksHost = new DevToolsDockHost(context);
	const viewsHost = new DevToolsViewHost(context);
	const terminalsHost = new DevToolsTerminalHost(context);
	const logsHost = new DevToolsLogsHost(context);
	const commandsHost = new DevToolsCommandsHost(context);
	context.rpc = rpcHost;
	context.docks = docksHost;
	context.views = viewsHost;
	context.terminals = terminalsHost;
	context.logs = logsHost;
	context.commands = commandsHost;
	let jrCounter = 0;
	context.createJsonRenderer = (initialSpec) => {
		const stateKey = `devtoolskit:internal:json-render:${jrCounter++}`;
		const statePromise = rpcHost.sharedState.get(stateKey, { initialValue: initialSpec });
		return {
			_stateKey: stateKey,
			async updateSpec(spec) {
				(await statePromise).mutate(() => spec);
			},
			async updateState(newState) {
				(await statePromise).mutate((draft) => {
					draft.state = {
						...draft.state,
						...newState
					};
				});
			}
		};
	};
	for (const fn of builtinRpcDeclarations) rpcHost.register(fn);
	await docksHost.init();
	const docksSharedState = await rpcHost.sharedState.get("devtoolskit:internal:docks", { initialValue: [] });
	docksHost.events.on("dock:entry:updated", debounce(() => {
		docksSharedState.mutate(() => context.docks.values());
	}, context.mode === "build" ? 0 : 10));
	terminalsHost.events.on("terminal:session:updated", debounce(() => {
		rpcHost.broadcast({
			method: "devtoolskit:internal:terminals:updated",
			args: []
		});
		docksSharedState.mutate(() => context.docks.values());
	}, context.mode === "build" ? 0 : 10));
	terminalsHost.events.on("terminal:session:stream-chunk", (data) => {
		rpcHost.broadcast({
			method: "devtoolskit:internal:terminals:stream-chunk",
			args: [data]
		});
	});
	const debouncedLogsUpdate = debounce(() => {
		rpcHost.broadcast({
			method: "devtoolskit:internal:logs:updated",
			args: []
		});
		docksSharedState.mutate(() => context.docks.values());
	}, context.mode === "build" ? 0 : 10);
	logsHost.events.on("log:added", () => debouncedLogsUpdate());
	logsHost.events.on("log:updated", () => debouncedLogsUpdate());
	logsHost.events.on("log:removed", () => debouncedLogsUpdate());
	logsHost.events.on("log:cleared", () => debouncedLogsUpdate());
	const commandsSharedState = await rpcHost.sharedState.get("devtoolskit:internal:commands", { initialValue: [] });
	const debouncedCommandsSync = debounce(() => {
		commandsSharedState.mutate(() => commandsHost.list());
	}, context.mode === "build" ? 0 : 10);
	commandsHost.events.on("command:registered", () => debouncedCommandsSync());
	commandsHost.events.on("command:unregistered", () => debouncedCommandsSync());
	commandsHost.register({
		id: "vite:open-in-editor",
		title: "Open in Editor",
		icon: "ph:pencil-duotone",
		category: "editor",
		showInPalette: false,
		handler: (path) => rpcHost.invokeLocal("vite:core:open-in-editor", path)
	});
	commandsHost.register({
		id: "vite:open-in-finder",
		title: "Open in Finder",
		icon: "ph:folder-open-duotone",
		category: "editor",
		showInPalette: false,
		handler: (path) => rpcHost.invokeLocal("vite:core:open-in-finder", path)
	});
	const plugins = viteConfig.plugins.filter((plugin) => "devtools" in plugin);
	for (const plugin of plugins) {
		if (!plugin.devtools?.setup) continue;
		if (shouldSkipSetupByCapabilities(plugin, context.mode)) {
			debugSetup(`skipping plugin ${JSON.stringify(plugin.name)} due to disabled capabilities in ${context.mode} mode`);
			continue;
		}
		try {
			debugSetup(`setting up plugin ${JSON.stringify(plugin.name)}`);
			await plugin.devtools?.setup?.(context);
		} catch (error) {
			console.error(`[Vite DevTools] Error setting up plugin ${plugin.name}:`, error);
			throw error;
		}
	}
	return context;
}
//#endregion
export { createDevToolsContext as n, context_exports as t };
