# OKLCH Color Decorator Extension

A VSCode extension that helps you work with OKLCH colors in your stylesheets. It provides visual color previews and easy conversion between OKLCH and other color formats.

## Features

- 🎨 Color Preview: Shows color previews next to OKLCH and other color values in your CSS, LESS, SCSS, and SASS files
- 🔄 Easy Conversion: Click on any color value to convert it to OKLCH or RGBA format
- 🎯 Hover Information: Hover over color values to see conversion options
- 📝 Supports Multiple Formats:
  - OKLCH
  - HEX
  - RGB/RGBA
  - HSL/HSLA
  - Modern CSS Color 4 syntax

## Usage

1. Open any CSS, LESS, SCSS, or SASS file
2. You'll see color previews next to all color values:
   - For OKLCH colors: preview appears on the left
   - For other color formats: preview appears on the right

3. To convert colors:
   - Click directly on a color value to convert it
   - Or hover over a color value and click the conversion link
   - OKLCH colors will be converted to RGBA
   - Other color formats will be converted to OKLCH

## Commands

- `Convert OKLCH to RGBA`: Converts an OKLCH color to RGBA format
- `Convert to OKLCH`: Converts any supported color format to OKLCH

## Examples

```css
/* OKLCH colors */
color: oklch(0.7 0.15 30);
color: oklch(0.7 0.15 30 / 0.5);

/* Other color formats that can be converted */
color: #ff0000;
color: rgb(255, 0, 0);
color: rgba(255, 0, 0, 0.5);
color: hsl(0, 100%, 50%);
color: hsla(0, 100%, 50%, 0.5);

/* Modern CSS Color 4 syntax */
color: rgb(255 0 0);
color: rgb(255 0 0 / 0.5);
color: hsl(0 100% 50%);
color: hsl(0 100% 50% / 0.5);
```

## Requirements

- Visual Studio Code version 1.60.0 or higher

## Extension Settings

This extension contributes the following settings:

* None at the moment

## Known Issues

- None at the moment

## Release Notes

### 1.0.0

Initial release:
- Color preview for OKLCH and other color formats
- Color conversion between OKLCH and other formats
- Hover information with conversion options

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

- [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

- Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
- Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
- Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

- [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
- [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
