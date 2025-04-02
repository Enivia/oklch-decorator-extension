// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { parseOKLCH, oklchToRGB } from "./colorUtils";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  console.log("OKLCH Decorator extension is now active!");

  const decorationType = vscode.window.createTextEditorDecorationType({
    before: {
      contentText: " ",
      margin: "0.1em 0.2em 0 0.2em",
      width: "0.8em",
      height: "0.8em",
    },
  });

  let activeEditor = vscode.window.activeTextEditor;
  let timeout: NodeJS.Timeout | undefined = undefined;

  // 注册颜色转换命令
  let disposable = vscode.commands.registerCommand("oklch-decorator.convertToRGBA", async () => {
    if (!activeEditor) {
      return;
    }

    const position = activeEditor.selection.active;
    const document = activeEditor.document;
    const text = document.getText();

    // 使用正则表达式查找光标位置的 OKLCH 颜色
    const oklchRegex = /oklch\(\s*[0-9.]+%?\s+[0-9.]+\s+[0-9.]+(?:\s*\/\s*[0-9.]+%?)?\s*\)/gi;
    let match;
    let targetMatch: { color: string; start: number; end: number } | null = null;

    while ((match = oklchRegex.exec(text))) {
      const startPos = document.positionAt(match.index);
      const endPos = document.positionAt(match.index + match[0].length);
      const range = new vscode.Range(startPos, endPos);

      if (range.contains(position)) {
        targetMatch = {
          color: match[0],
          start: match.index,
          end: match.index + match[0].length,
        };
        break;
      }
    }

    if (targetMatch) {
      const color = parseOKLCH(targetMatch.color);
      if (color) {
        const rgba = oklchToRGB(color);
        // 创建编辑操作替换颜色
        const edit = new vscode.WorkspaceEdit();
        const range = new vscode.Range(
          document.positionAt(targetMatch.start),
          document.positionAt(targetMatch.end)
        );
        edit.replace(document.uri, range, rgba);
        await vscode.workspace.applyEdit(edit);
      }
    }
  });

  context.subscriptions.push(disposable);

  // 注册点击事件处理
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(["css", "less", "scss", "sass"], {
      provideHover(document, position) {
        const text = document.getText();
        const oklchRegex = /oklch\(\s*[0-9.]+%?\s+[0-9.]+\s+[0-9.]+(?:\s*\/\s*[0-9.]+%?)?\s*\)/gi;
        let match;

        while ((match = oklchRegex.exec(text))) {
          const startPos = document.positionAt(match.index);
          const endPos = document.positionAt(match.index + match[0].length);
          const range = new vscode.Range(startPos, endPos);

          if (range.contains(position)) {
            const color = parseOKLCH(match[0]);
            if (color) {
              const rgba = oklchToRGB(color);
              const content = new vscode.MarkdownString();
              content.isTrusted = true;
              content.supportHtml = true;
              content.value = `Click to convert to: \`${rgba}\`\n\n[Convert to RGBA](command:oklch-decorator.convertToRGBA)`;
              return new vscode.Hover(content, range);
            }
          }
        }
        return null;
      },
    })
  );

  // 注册文档点击事件
  vscode.window.onDidChangeTextEditorSelection(
    (event) => {
      if (
        event.textEditor === activeEditor &&
        event.kind === vscode.TextEditorSelectionChangeKind.Mouse
      ) {
        vscode.commands.executeCommand("oklch-decorator.convertToRGBA");
      }
    },
    null,
    context.subscriptions
  );

  function updateDecorations() {
    if (!activeEditor) {
      console.log("No active editor");
      return;
    }

    console.log(`Updating decorations for: ${activeEditor.document.uri.toString()}`);
    const text = activeEditor.document.getText();
    const decorations: vscode.DecorationOptions[] = [];

    // 使用新的正则表达式查找所有 OKLCH 颜色，支持百分比形式的 alpha 值
    const oklchRegex = /oklch\(\s*[0-9.]+%?\s+[0-9.]+\s+[0-9.]+(?:\s*\/\s*[0-9.]+%?)?\s*\)/gi;
    let match;

    while ((match = oklchRegex.exec(text))) {
      const colorStr = match[0];
      console.log(`Found OKLCH color: ${colorStr}`);

      const startPos = activeEditor.document.positionAt(match.index);
      const endPos = activeEditor.document.positionAt(match.index + colorStr.length);
      const decoration: vscode.DecorationOptions = {
        range: new vscode.Range(startPos, endPos),
        renderOptions: {
          before: {
            backgroundColor: "",
            textDecoration: "none; cursor: pointer;",
          },
        },
        hoverMessage: "Click to convert to RGBA",
      };

      const color = parseOKLCH(colorStr);
      if (color) {
        console.log("Parsed color:", color);
        const rgb = oklchToRGB(color);
        console.log("Converted to RGB:", rgb);
        if (decoration.renderOptions?.before) {
          decoration.renderOptions.before.backgroundColor = rgb;
        }
        decorations.push(decoration);
      }
    }

    console.log(`Setting decorations: ${decorations.length}`);
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
    console.log(`Initial editor: ${activeEditor.document.uri.toString()}`);
    triggerUpdateDecorations();
  }

  vscode.window.onDidChangeActiveTextEditor(
    (editor) => {
      activeEditor = editor;
      if (editor) {
        console.log(`Editor changed to: ${editor.document.uri.toString()}`);
        triggerUpdateDecorations();
      }
    },
    null,
    context.subscriptions
  );

  vscode.workspace.onDidChangeTextDocument(
    (event) => {
      if (activeEditor && event.document === activeEditor.document) {
        console.log(`Document changed: ${event.document.uri.toString()}`);
        triggerUpdateDecorations(true);
      }
    },
    null,
    context.subscriptions
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
