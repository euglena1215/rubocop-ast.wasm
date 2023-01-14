import { DefaultRubyVM } from "./DefaultRubyVM";

async function init() {
  console.log("Hey!");
  const res = await fetch("/rubocop-ast.wasm");

  if (!res.ok || res.body === null) {
    throw new Error("wasmファイルの取得に失敗しました");
  }

  const buffer = await res.arrayBuffer();
  const module = await WebAssembly.compile(buffer);
  const { vm } = await DefaultRubyVM(module);

  const output = vm.eval(`
    "I'm working in RubyVM!"
    # require 'rubocop'
    # "rubocop version is #{RuboCop::Version.version}!"
  `);

  console.log(output.toString());
};

init();
