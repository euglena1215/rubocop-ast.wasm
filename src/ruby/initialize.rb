puts "I'm working in RubyVM!"

def Dir.home = "/home/me"
Dir.glob('/bundle/*').each do |dir|
  $LOAD_PATH << "#{dir}/lib"
end

require 'rubocop-ast'

"rubocop-ast version is #{RuboCop::AST::Version::STRING}!"
