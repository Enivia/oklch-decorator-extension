// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { parseOKLCH, oklchToRGB, oklchToHex, oklchToHsl, oklchToHwb } from "./colorUtils";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  console.log("OKLCH 颜色装饰器扩展已激活！");

  const decorationType = vscode.window.createTextEditorDecorationType({
    before: {
      contentText: " ",
      margin: "0.1em 0.2em 0 0.2em",
      width: "0.8em",
      height: "0.8em",
      border: "1.5px solid rgba(255, 255, 255, 0.9)",
    },
  });

  let activeEditor = vscode.window.activeTextEditor;
  let timeout: NodeJS.Timeout | undefined = undefined;
  // 用于存储颜色块位置与其对应的 OKLCH 颜色值之间的映射关系
  let decorationMap = new Map<string, { color: string; range: vscode.Range }>();

  // 注册统一的颜色值替换命令
  let applyColorCommand = vscode.commands.registerCommand(
    "oklch-decorator.applyColor",
    async (colorValue: string) => {
      if (!activeEditor) {
        return;
      }

      const position = activeEditor.selection.active;
      const document = activeEditor.document;
      const text = document.getText();

      // 使用正则表达式查找光标位置的 OKLCH 颜色
      const oklchRegex = /oklch\(\s*[0-9.]+%?\s+[0-9.]+\s+[0-9.]+(?:\s*\/\s*[0-9.]+%?)?\s*\)/gi;
      let match;
      let targetMatch: { start: number; end: number } | null = null;

      while ((match = oklchRegex.exec(text))) {
        const startPos = document.positionAt(match.index);
        const endPos = document.positionAt(match.index + match[0].length);
        const range = new vscode.Range(startPos, endPos);

        if (
          range.contains(position) ||
          (position.line === startPos.line && Math.abs(position.character - startPos.character) < 5)
        ) {
          targetMatch = {
            start: match.index,
            end: match.index + match[0].length,
          };
          break;
        }
      }

      if (targetMatch) {
        // 创建编辑操作替换颜色
        const edit = new vscode.WorkspaceEdit();
        const range = new vscode.Range(
          document.positionAt(targetMatch.start),
          document.positionAt(targetMatch.end)
        );
        edit.replace(document.uri, range, colorValue);
        await vscode.workspace.applyEdit(edit);
      }
    }
  );

  context.subscriptions.push(applyColorCommand);

  // 创建颜色选择器内容
  function createColorPickerContent(
    match: string,
    startPos: vscode.Position
  ): vscode.MarkdownString {
    const color = parseOKLCH(match);
    if (!color) {
      return new vscode.MarkdownString("无法解析颜色");
    }

    const rgba = oklchToRGB(color);
    const hex = oklchToHex(color);
    const hsl = oklchToHsl(color);
    const hwb = oklchToHwb(color);

    const content = new vscode.MarkdownString();
    content.isTrusted = true;
    content.supportHtml = true;

    content.value += `**RGB**: [\`${rgba}\`](command:oklch-decorator.applyColor?${encodeURIComponent(
      JSON.stringify(rgba)
    )} "apply RGBA")\n\n`;
    content.value += `**HEX**: [\`${hex}\`](command:oklch-decorator.applyColor?${encodeURIComponent(
      JSON.stringify(hex)
    )} "apply HEX")\n\n`;
    content.value += `**HSL**: [\`${hsl}\`](command:oklch-decorator.applyColor?${encodeURIComponent(
      JSON.stringify(hsl)
    )} "apply HSL")\n\n`;
    content.value += `**HWB**: [\`${hwb}\`](command:oklch-decorator.applyColor?${encodeURIComponent(
      JSON.stringify(hwb)
    )} "apply HWB")\n\n`;

    // 设置活动编辑器的位置，以便命令可以知道要转换哪个颜色
    if (activeEditor) {
      activeEditor.selections = [new vscode.Selection(startPos, startPos)];
    }

    return content;
  }

  // 注册 hover 提供程序，用于显示颜色选择器和格式转换按钮
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(["css", "less", "scss", "sass"], {
      provideHover(document, position) {
        const text = document.getText();
        const oklchRegex = /oklch\(\s*[0-9.]+%?\s+[0-9.]+\s+[0-9.]+(?:\s*\/\s*[0-9.]+%?)?\s*\)/gi;
        let match;

        // 检查是否悬停在颜色值上
        while ((match = oklchRegex.exec(text))) {
          const startPos = document.positionAt(match.index);
          const endPos = document.positionAt(match.index + match[0].length);
          const range = new vscode.Range(startPos, endPos);

          if (range.contains(position)) {
            return new vscode.Hover(createColorPickerContent(match[0], startPos), range);
          }
        }

        // 检查是否悬停在装饰器上（通过查找位置映射）
        // 为了效率，我们先检查当前行
        const line = document.lineAt(position.line);
        const lineText = line.text;
        const lineStart = document.offsetAt(new vscode.Position(position.line, 0));

        // 查找当前行中的所有 OKLCH 颜色
        const lineRegex = new RegExp(oklchRegex.source, "gi");
        while ((match = lineRegex.exec(lineText))) {
          const fullOffset = lineStart + match.index;
          const startPos = document.positionAt(fullOffset);

          // 检查悬停位置是否在装饰器区域（颜色值左边的小方块位置）
          if (
            position.line === startPos.line &&
            position.character >= startPos.character - 3 &&
            position.character < startPos.character
          ) {
            return new vscode.Hover(
              createColorPickerContent(match[0], startPos),
              new vscode.Range(startPos, document.positionAt(fullOffset + match[0].length))
            );
          }
        }

        return null;
      },
    })
  );

  function updateDecorations() {
    if (!activeEditor) {
      console.log("无活动编辑器");
      return;
    }

    const text = activeEditor.document.getText();
    const decorations: vscode.DecorationOptions[] = [];
    // 清空旧的映射
    decorationMap.clear();

    // 使用新的正则表达式查找所有 OKLCH 颜色，支持百分比形式的 alpha 值
    const oklchRegex = /oklch\(\s*[0-9.]+%?\s+[0-9.]+\s+[0-9.]+(?:\s*\/\s*[0-9.]+%?)?\s*\)/gi;
    let match;

    while ((match = oklchRegex.exec(text))) {
      const colorStr = match[0];

      const startPos = activeEditor.document.positionAt(match.index);
      const endPos = activeEditor.document.positionAt(match.index + colorStr.length);
      const range = new vscode.Range(startPos, endPos);

      // 存储位置映射
      const decorationKey = `${activeEditor.document.uri.toString()}:${startPos.line}:${
        startPos.character - 1
      }`;
      decorationMap.set(decorationKey, { color: colorStr, range });

      const decoration: vscode.DecorationOptions = {
        range: range,
        renderOptions: {
          before: {
            backgroundColor: "",
            textDecoration: "none; cursor: pointer;",
          },
        },
        hoverMessage: "悬停查看颜色格式选项",
      };

      const color = parseOKLCH(colorStr);
      if (color) {
        const rgb = oklchToRGB(color);
        if (decoration.renderOptions?.before) {
          decoration.renderOptions.before.backgroundColor = rgb;
        }
        decorations.push(decoration);
      }
    }

    activeEditor.setDecorations(decorationType, decorations);
  }

  function triggerUpdateDecorations(throttle = false) {
    if (timeout) {
      clearTimeout(timeout);
      timeout = undefined;
    }
    if (throttle) {
      timeout = setTimeout(updateDecorations, 200);
    } else {
      updateDecorations();
    }
  }

  if (activeEditor) {
    console.log(`初始编辑器: ${activeEditor.document.uri.toString()}`);
    triggerUpdateDecorations();
  }

  vscode.window.onDidChangeActiveTextEditor(
    (editor) => {
      activeEditor = editor;
      if (editor) {
        console.log(`编辑器已切换: ${editor.document.uri.toString()}`);
        triggerUpdateDecorations();
      }
    },
    null,
    context.subscriptions
  );

  vscode.workspace.onDidChangeTextDocument(
    (event) => {
      if (activeEditor && event.document === activeEditor.document) {
        console.log(`文档已更改: ${event.document.uri.toString()}`);
        triggerUpdateDecorations(true);
      }
    },
    null,
    context.subscriptions
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
