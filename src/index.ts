import { RubyVM } from "ruby-head-wasm-wasi";
import { CustomRubyVM } from "./CustomRubyVM";
import initializeRb from "./ruby/initialize.rb";
import astCheckerRb from "./ruby/ast_checker.rb";
import { toJSLikeString } from "./util";

interface GlobalThis {
  // RubyVM
  rubyVM: RubyVM;
  isRubyVMLoaded: boolean;

  // form values
  sExpressionValue: string;
  testProgramValues: string[];
  testResults: boolean[];
}
declare var globalThis: GlobalThis;

const init = async () => {
  globalThis.isRubyVMLoaded = false;
  const res = await fetch("/rubocop-ast.wasm");

  if (!res.ok || res.body === null) {
    throw new Error("wasmファイルの取得に失敗しました");
  }

  const buffer = await res.arrayBuffer();
  const module = await WebAssembly.compile(buffer);
  const { vm } = await CustomRubyVM(module);

  const output = vm.eval(initializeRb);
  console.log(output.toString());
  vm.eval(astCheckerRb); // Define AstChecker

  globalThis.rubyVM = vm;
  globalThis.isRubyVMLoaded = true;

  // Application Global States
  globalThis.sExpressionValue = "";
  globalThis.testProgramValues = [];
  globalThis.testResults = [];
};

const setEventListener = () => {
  const sExpressionInput = document.querySelector<HTMLInputElement>("#s-expression");
  sExpressionInput?.addEventListener("input", (e) => {
    if (e.target) {
      const input = e.target as HTMLInputElement;
      globalThis.sExpressionValue = input.value;

      checkAST();
    }
  });

  const testProgramInput = document.querySelector<HTMLTextAreaElement>("#test-program");
  testProgramInput?.addEventListener("input", (e) => {
    if (e.target) {
      const textarea = e.target as HTMLTextAreaElement;
      globalThis.testProgramValues = textarea.value.split("\n");

      checkAST();
    }
  });
};

const checkAST = () => {
  if (!globalThis.isRubyVMLoaded || globalThis.sExpressionValue === "" || globalThis.testProgramValues.length === 0) {
    return;
  }

  // TODO:
  //  JS -> Ruby に値を受け渡すために JSON.stringigy を通して文字列に変換する必要がある。
  //  もっと良い方法ないか調べる。
  const result = globalThis.rubyVM.eval(`
    test_programs = ${JSON.stringify(globalThis.testProgramValues)}
    test_programs.map do |test_program|
      AstChecker.match?(${JSON.stringify(globalThis.sExpressionValue)}, test_program)
    end
  `);

  globalThis.testResults = JSON.parse(toJSLikeString(result.toString())).map(Boolean);
  updateResultDom();
};

const updateResultDom = () => {
  const resultDiv = document.querySelector<HTMLDivElement>("#result");

  while (resultDiv?.firstChild) {
    resultDiv.removeChild(resultDiv.firstChild);
  }

  const resultSize = globalThis.testProgramValues.length;
  [...Array(resultSize)].forEach((_, i) => {
    const rowElement = document.createElement("li");
    rowElement.innerText = `${globalThis.testResults[i] ? "✅" : "❌"}: ${globalThis.testProgramValues[i]}`;

    resultDiv?.appendChild(rowElement);
  });
}

init();
setEventListener();
