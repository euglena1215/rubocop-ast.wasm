import { CustomRubyVM } from "./CustomRubyVM";
import initializeRb from "./ruby/initialize.rb";

async function init() {
  console.log("Hey!");
  const res = await fetch("/rubocop-ast.wasm");

  if (!res.ok || res.body === null) {
    throw new Error("wasmファイルの取得に失敗しました");
  }

  const buffer = await res.arrayBuffer();
  const module = await WebAssembly.compile(buffer);
  const { vm } = await CustomRubyVM(module);

  const output = vm.eval(initializeRb);

  console.log(output.toString());
};

init();
