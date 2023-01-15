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
  checker: {
    sExpressionValue: string;
    testProgramValues: string[];
    testResults: boolean[];
  }
  converter: {
    testProgramValue: string;
    convertedSExpression: string;
  }
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
  globalThis.checker = {
    sExpressionValue: "",
    testProgramValues: [],
    testResults: [],
  };
  globalThis.converter = {
    testProgramValue: "",
    convertedSExpression: "",
  };
};

const setEventListener = () => {
  const checkerSExpressionInput = document.querySelector<HTMLInputElement>("#checker-s-expression");
  checkerSExpressionInput?.addEventListener("input", (e) => {
    if (e.target) {
      const input = e.target as HTMLInputElement;
      globalThis.checker.sExpressionValue = input.value;

      checkAST();
    }
  });

  const checkerTestProgramInput = document.querySelector<HTMLTextAreaElement>("#checker-test-program");
  checkerTestProgramInput?.addEventListener("input", (e) => {
    if (e.target) {
      const textarea = e.target as HTMLTextAreaElement;
      globalThis.checker.testProgramValues = textarea.value.split("\n");

      checkAST();
    }
  });

  const converterTestProgramInput = document.querySelector<HTMLInputElement>("#converter-test-program");
  converterTestProgramInput?.addEventListener("input", (e) => {
    if (e.target) {
      const input = e.target as HTMLInputElement;
      globalThis.converter.testProgramValue = input.value;

      convertAST();
    }
  });
};

const checkAST = () => {
  if (!globalThis.isRubyVMLoaded || globalThis.checker.sExpressionValue === "" || globalThis.checker.testProgramValues.length === 0) {
    return;
  }

  // TODO:
  //  JS -> Ruby に値を受け渡すために JSON.stringigy を通して文字列に変換する必要がある。
  //  もっと良い方法ないか調べる。
  const result = globalThis.rubyVM.eval(`
    test_programs = ${JSON.stringify(globalThis.checker.testProgramValues)}
    test_programs.map do |test_program|
      AstChecker.match?(${JSON.stringify(globalThis.checker.sExpressionValue)}, test_program)
    end
  `);

  globalThis.checker.testResults = JSON.parse(toJSLikeString(result.toString())).map(Boolean);
  updateMatchResultDom();
};

const convertAST = () => {
  if (!globalThis.isRubyVMLoaded) {
    return;
  }

  const result = globalThis.rubyVM.eval(`
    AstChecker.convert_ast(${JSON.stringify(globalThis.converter.testProgramValue)})
  `);

  globalThis.converter.convertedSExpression = result.toString();
  updateConvertResultDom();
};



const updateMatchResultDom = () => {
  const resultDiv = document.querySelector("#result");

  while (resultDiv?.firstChild) {
    resultDiv.removeChild(resultDiv.firstChild);
  }

  const resultSize = globalThis.checker.testProgramValues.length;
  [...Array(resultSize)].forEach((_, i) => {
    const rowElement = document.createElement("li");
    rowElement.innerText = `${globalThis.checker.testResults[i] ? "✅" : "❌"}: ${globalThis.checker.testProgramValues[i]}`;

    resultDiv?.appendChild(rowElement);
  });
};

const updateConvertResultDom = () => {
  const resultDiv = document.querySelector<HTMLParagraphElement>("#converted-test-program-content");
  if (resultDiv) {
    resultDiv.innerText = globalThis.converter.convertedSExpression;
  }
}

init();
setEventListener();
