class AstChecker
  class << self
    def match?(pattern, source_code)
      node_pattern = RuboCop::AST::NodePattern.new(pattern)
      node = RuboCop::AST::ProcessedSource.new(source_code, RUBY_VERSION.to_f).ast
      node_pattern.match(node)
    rescue RuboCop::AST::NodePattern::Invalid
      nil
    end

    def convert_ast(source_code)
      node = RuboCop::AST::ProcessedSource.new(source_code, RUBY_VERSION.to_f).ast
      node.to_s
    end
  end
end
