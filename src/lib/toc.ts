import { createSubscriber } from "svelte/reactivity";

/**
 * Configuration for a Toc instance
 */
export type TocConfig = {
	/**
	 * Whether the Toc instance should observe DOM changes within the configured root and update the TOC when headings or their contents change.
	 * @default true
	 */
	updateHeadings?: boolean;

	/**
	 * CSS selector used to identify heading elements within the document.
	 * A common use case may be to only observe headings starting at a specific level, such as "h2, h3, h4".
	 * @default "h1, h2, h3, h4, h5, h6"
	 */
	headingSelector?: string;

	/**
	 * CSS selector used to identify the root element within which the Toc instance should observe headings.
	 * @default "body"
	 */
	rootSelector?: string;

	/**
	 * Whether to look for scroll events to determine the active heading.
	 * - `true`: Observe scroll events on the window.
	 * - `false`: Do not observe scroll events.
	 * - `string`: Observe scroll events on the element matching the provided CSS selector.
	 * @default true
	 */
	observeScroll?: boolean | string;

	/**
	 * Number of pixels to offset from the top of the viewport when determining the active heading.
	 * @default 0
	 */
	scrollTopOffset?: number;

	/**
	 * Number of pixels to offset from the bottom of the viewport when determining the active heading.
	 * @default 0
	 */
	scrollBottomOffset?: number;

	/**
	 * Strategy used to determine which headings are considered active.
	 * - `"first"`: Only the topmost visible heading is considered active.
	 * - `"last"`: Only the bottommost visible heading is considered active.
	 * - `"all"`: All visible headings are considered active.
	 * @default "all"
	 */
	activeStrategy?: "first" | "last" | "all";

	/**
	 * Whether to automatically add an ID to each heading element.
	 * - `true`: Automatically add an ID to each heading element if it doesn't already have one.
	 * - `"force"`: Always add an ID to each heading element, even if it already has one.
	 * - `false`: Do not automatically add an ID to heading elements.
	 * @default false
	 */
	addIds?: boolean | "force";
};

/**
 * Represents a heading element within the document as discovered by the Toc instance.
 */
export type TocHeading = {
	/**
	 * The level of the element (e.g., 1 for `<h1>`, 2 for `<h2>`, etc.).
	 * If the element is not a HTML heading element (due to overriding `headingSelector` in the configuration), this value will be `undefined`.
	 */
	headingLevel?: number;

	/**
	 * The tag name of the element (e.g., "h1", "h2", etc.).
	 */
	tagName: string;

	/**
	 * The ID of the heading element, if it has one.
	 */
	id?: string;

	/**
	 * The text content of the heading element, trimmed of leading and trailing whitespace.
	 */
	textContent?: string;

	/**
	 * Whether the heading element is currently considered active based on the Toc instance's active strategy.
	 */
	active?: boolean;
};

export const DEFAULT_TOC_CONFIG: Required<TocConfig> = {
	updateHeadings: true,
	headingSelector: "h1, h2, h3, h4, h5, h6",
	rootSelector: "body",
	observeScroll: true,
	scrollTopOffset: 0,
	scrollBottomOffset: 0,
	activeStrategy: "all",
	addIds: false,
};

export class Toc {
	#config: Required<TocConfig>;
	#subscribe: () => void;

	constructor(config: TocConfig = {}) {
		this.#config = { ...DEFAULT_TOC_CONFIG, ...config };

		this.#subscribe = createSubscriber((update) => {
			const cleanups: (() => void)[] = [];

			/**
			 * Refresh the TOC whenever the DOM changes within the root element.
			 */
			if (this.#config.updateHeadings) {
				const root = this.#getRoot();

				if (root) {
					const observer = new MutationObserver(() => {
						update();
					});

					observer.observe(root, {
						childList: true,
						subtree: true,
						characterData: true,
						attributes: true,
					});

					cleanups.push(() => observer.disconnect());
				}
			}

			/**
			 * Refresh the active heading whenever scrolling changes
			 */
			if (this.#config.observeScroll) {
				const handleScroll = () => update();

				this.#getScrollElement()?.addEventListener("scroll", handleScroll, {
					passive: true,
				});

				const handleResize = () => update();

				window.addEventListener("resize", handleResize, {
					passive: true,
				});

				cleanups.push(() => {
					this.#getScrollElement()?.removeEventListener("scroll", handleScroll);
					window.removeEventListener("resize", handleResize);
				});
			}

			return () => {
				cleanups.forEach((cleanup) => cleanup());
			};
		});
	}

	/**
	 * The current table of content
	 */
	get current(): TocHeading[] {
		this.#subscribe();

		return this.#getHeadings();
	}

	#getRoot(): Element | null {
		if (typeof document === "undefined") return null;

		return document.querySelector(this.#config.rootSelector);
	}

	#getScrollElement(): Element | Window {
		if (typeof this.#config.observeScroll === "string") {
			return document.querySelector(this.#config.observeScroll) ?? window;
		}

		return window;
	}

	#getHeadingElements(): Element[] {
		const root = this.#getRoot();

		if (!root) return [];

		return Array.from(root.querySelectorAll(this.#config.headingSelector));
	}

	#getHeadings(): TocHeading[] {
		const elements = this.#getHeadingElements();

		if (this.#config.addIds) {
			this.#ensureIds(elements);
		}

		const activeElements = this.#getActiveElements(elements);

		return elements.map((element) => {
			const tagName = element.tagName.toLowerCase();
			const headingLevel = this.#getHeadingLevel(tagName);
			const textContent = element.textContent?.trim() ?? "";
			const id = element.id || undefined;

			return {
				headingLevel,
				tagName,
				id,
				textContent,
				active: activeElements.has(element),
			};
		});
	}

	#getHeadingLevel(tagName: string): number | undefined {
		const match = tagName.match(/^h([1-6])$/);

		return match ? Number(match[1]) : undefined;
	}

	#getActiveElements(elements: Element[]): Set<Element> {
		const active = new Set<Element>();

		if (!this.#config.observeScroll || elements.length === 0) return active;

		const visible = elements.filter((element, index) => this.#isSectionVisible(element, elements[index + 1]));

		if (visible.length === 0) return active;

		switch (this.#config.activeStrategy) {
			case "first":
				active.add(visible[0]);
				break;
			case "last":
				active.add(visible[visible.length - 1]);
				break;
			case "all":
			default:
				for (const element of visible) {
					active.add(element);
				}
				break;
		}

		return active;
	}

	#isSectionVisible(element: Element, nextElement?: Element): boolean {
		const topOffset = this.#config.scrollTopOffset;
		const bottomOffset = this.#config.scrollBottomOffset;

		const headingRect = element.getBoundingClientRect();
		const nextHeadingRect = nextElement?.getBoundingClientRect();

		const sectionTop = headingRect.top;
		const sectionBottom = nextHeadingRect?.top ?? document.documentElement.scrollHeight;

		const viewportTop = topOffset;
		const viewportBottom = window.innerHeight - bottomOffset;

		return sectionTop < viewportBottom && sectionBottom > viewportTop;
	}

	#ensureIds(elements: Element[]): void {
		const usedIds = new Set<string>();

		// Preserve existing IDs first so generated IDs do not conflict
		for (const element of elements) {
			if (element.id) {
				usedIds.add(element.id);
			}
		}

		for (const element of elements) {
			const force = this.#config.addIds === "force";

			if (element.id && !force) continue;

			const base = this.#slugify(element.textContent?.trim() || "heading");

			let id = base;
			let suffix = 2;

			while (usedIds.has(id)) {
				id = `${base}-${suffix++}`;
			}
			if (element.id) {
				usedIds.delete(element.id);
			}

			element.id = id;
			usedIds.add(id);
		}
	}

	#slugify(value: string): string {
		const slug = value
			// Normalize the string to decompose combined characters into their base characters and diacritics
			.normalize("NFKD")
			// Remove diacritical marks (accents)
			.replace(/[\u0300-\u036f]/g, "")
			// Make the string lowercase
			.toLowerCase()
			// Remove whitespace from the beginning and end
			.trim()
			// Replace anything that is not a letter or number with a hyphen
			.replace(/[^a-z0-9]+/g, "-")
			// Remove duplicate hyphens
			.replace(/-+/g, "-")
			// Remove leading and trailing hyphens
			.replace(/^-+/, "")
			.replace(/-+$/, "");

		return slug;
	}
}
