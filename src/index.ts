import { CustomRubyVM } from "./CustomRubyVM";

async function init() {
  console.log("Hey!");
  const res = await fetch("/rubocop-ast.wasm");

  if (!res.ok || res.body === null) {
    throw new Error("wasmファイルの取得に失敗しました");
  }

  const buffer = await res.arrayBuffer();
  const module = await WebAssembly.compile(buffer);
  const { vm } = await CustomRubyVM(module);

  const output = vm.eval(`
    puts "I'm working in RubyVM!"

    def Dir.home = "/home/me"
    Dir.glob('/bundle/*').each do |dir|
      $LOAD_PATH << "#{dir}/lib"
    end

    require 'rubocop-ast'

    "rubocop-ast version is #{RuboCop::AST::Version::STRING}!"
  `);

  console.log(output.toString());
};

init();
