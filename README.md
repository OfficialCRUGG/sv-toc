<div align="center">

# sv-toc

![NPM Downloads](https://img.shields.io/npm/dm/sv-toc)
![GitHub License](https://img.shields.io/github/license/OfficialCRUGG/sv-toc)
![GitHub Repo stars](https://img.shields.io/github/stars/OfficialCRUGG/sv-toc?style=flat)
![NPM Version](https://img.shields.io/npm/v/sv-toc)

`sv-toc` is a simple Svelte library for reactive tables of contents, including scroll tracking, automatic heading detection and updates, and (if you want) ID generation for headings.

</div>

## Features

- Automatic heading detection
- Customizable heading selector (even non non-`<h*>` elements should work)
- Customizable selector for where to search for headings

### Optional Features

- DOM watching for heading changes
- Scroll tracking to mark headings as active
  - Customizable selector for a scroll container instead of `window`
  - Ability to specify top/bottom offsets
  - Three modes: `first` and `last` highlight only one heading as active at a time, while `all` highlights all sections that are currently in view
- ID generation for headings

## Installation

```sh
npm install sv-toc
yarn add sv-toc
pnpm add sv-toc
bun add sv-toc
```

## Usage

```svelte
<script lang="ts">
  import { Toc } from "sv-toc";

  const toc = new Toc({
    headingSelector: "h2, h3, h4, h5, h6",
  });
</script>

<!-- Now do whatever you want with toc.current -->
{#each toc.current as heading, index (index)}
  ...
{/each}
```

## Documentation

You can find the full documentation [here](https://sv-toc.crg.sh/docs).
