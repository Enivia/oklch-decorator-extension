# OKLCH Color Decorator

A Visual Studio Code extension that provides visual previews and conversion tools for OKLCH colors in your stylesheets.

## Features

- **OKLCH Color Preview**: Shows a color preview square next to OKLCH color values in your stylesheets
- **Quick Conversion**: Click on any OKLCH color to convert it to RGBA format
- **Hover Information**: Hover over OKLCH colors to see preview and conversion options
- **Supported OKLCH Format**:

  ```css
  /* Basic OKLCH color */
  color: oklch(0.7 0.15 30);

  /* OKLCH with alpha channel */
  color: oklch(0.7 0.15 30 / 0.5);
  color: oklch(70% 0.15 30 / 50%);
  ```

## Usage

1. Open any CSS, LESS, SCSS, or SASS file
2. The extension will automatically show color previews next to OKLCH color values
3. To convert an OKLCH color to RGBA:
   - Click directly on the OKLCH color value
   - Or hover over the color and click the "Convert to RGBA" link
   - The OKLCH color will be replaced with its RGBA equivalent

## Release Notes

### 0.0.1

Initial release:

- OKLCH color preview functionality
- Click-to-convert to RGBA format
- Hover information with conversion options

## Contributing

Found a bug or want to contribute? Feel free to open an issue or submit a pull request on my [GitHub repository](https://github.com/enivia/oklch-decorator-extension).

## License

This extension is licensed under the [MIT License](LICENSE).
