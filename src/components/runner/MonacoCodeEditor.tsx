/**
 * MonacoCodeEditor
 *
 * Shared Monaco editor component used in both Slot (full builder) and
 * ShapeNode (flow canvas inline editor).
 *
 * Accepts an optional `extraDeclarations` string that will be injected as an
 * extra TypeScript/JavaScript lib so callers can provide type context.
 */
import { useEffect, useRef } from "react";
import MonacoEditor, { type Monaco } from "@monaco-editor/react";

// Minimal Array stub so T[] types resolve when noLib:true strips the default lib.
export const MINIMAL_ARRAY_LIB = `
interface Array<T> {
  readonly length: number;
  [n: number]: T;
  push(...items: T[]): number;
  pop(): T | undefined;
  shift(): T | undefined;
  unshift(...items: T[]): number;
  slice(start?: number, end?: number): T[];
  map<U>(callbackfn: (value: T, index: number, array: T[]) => U): U[];
  filter(predicate: (value: T, index: number, array: T[]) => unknown): T[];
  forEach(callbackfn: (value: T, index: number, array: T[]) => void): void;
  find(predicate: (value: T, index: number, array: T[]) => unknown): T | undefined;
  findIndex(predicate: (value: T, index: number, array: T[]) => unknown): number;
  some(predicate: (value: T, index: number, array: T[]) => unknown): boolean;
  every(predicate: (value: T, index: number, array: T[]) => unknown): boolean;
  reduce<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number) => U, initialValue: U): U;
  [Symbol.iterator](): Iterator<T>;
}
interface ArrayConstructor {
  new <T>(...items: T[]): T[];
  isArray(arg: unknown): arg is unknown[];
}
declare const Array: ArrayConstructor;
`.trim();

interface MonacoCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  /** Extra TypeScript declaration lines injected as an ambient lib. */
  extraDeclarations?: string;
  height?: string;
  /** When true, prevents ReactFlow from panning while the editor is focused. */
  nopan?: boolean;
}

export function MonacoCodeEditor({
  value,
  onChange,
  extraDeclarations,
  height = "160px",
  nopan = false,
}: MonacoCodeEditorProps) {
  const monacoRef = useRef<Monaco | null>(null);

  function syncExtraLibs(monaco: Monaco) {
    monaco.languages.typescript.javascriptDefaults.setExtraLibs([]);
    const lines = [MINIMAL_ARRAY_LIB];
    if (extraDeclarations) lines.push(extraDeclarations);
    monaco.languages.typescript.javascriptDefaults.addExtraLib(
      lines.join("\n"),
      "ts:filename/slot-types.d.ts",
    );
  }

  function handleEditorDidMount(_editor: unknown, monaco: Monaco) {
    monacoRef.current = monaco;
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      checkJs: true,
      noLib: true,
    });
    syncExtraLibs(monaco);
  }

  useEffect(() => {
    if (monacoRef.current) syncExtraLibs(monacoRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extraDeclarations]);

  return (
    <div
      className={`${nopan ? "nopan" : ""} flex flex-col`}
      style={{ height }}
      onMouseDown={(e) => nopan && e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      onKeyUp={(e) => e.stopPropagation()}
    >
      <MonacoEditor
        height="100%"
        defaultLanguage="javascript"
        onMount={handleEditorDidMount}
        value={value}
        onChange={(val) => onChange(val ?? "")}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 12,
          wordWrap: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          lineNumbers: "off",
          folding: false,
          glyphMargin: false,
          lineDecorationsWidth: 4,
          lineNumbersMinChars: 0,
        }}
      />
    </div>
  );
}
